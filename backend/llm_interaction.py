# Filename: backend/llm_interaction.py
from fastapi import HTTPException
from openai import OpenAI
from anthropic import Anthropic
import google.generativeai as genai
import os
import tiktoken
from dotenv import load_dotenv
from model_config import MODELS

load_dotenv()

# Initialize clients
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def get_encoding(model: str):
    try:
        return tiktoken.encoding_for_model(model)
    except KeyError:
        return tiktoken.get_encoding("cl100k_base")

def count_tokens(text: str, model: str) -> int:
    encoding = get_encoding(model)
    return len(encoding.encode(text))

async def openai_completion(model: str, messages: list, max_tokens: int, temperature: float):
    try:
        # Format messages for chat completion
        formatted_messages = []
        for msg in messages:
            if msg["role"] != "system":  # Add non-system messages directly
                formatted_messages.append(msg)
            elif msg["role"] == "system" and msg["content"].strip():  # Add non-empty system messages
                formatted_messages.insert(0, msg)  # System message should be first
        
        if model in ["o4-mini", "o3"]:
            # Use max_completion_tokens for o4-mini and o3, without temperature
            response = client.chat.completions.create(
                model=model,
                messages=formatted_messages,
                max_completion_tokens=max_tokens
            )
        elif model == "o1-pro":
            # Extract system message if present
            instructions = None
            input_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    instructions = msg["content"]
                else:
                    input_messages.append(msg)
            
            # Format remaining messages as conversation
            input_text = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in input_messages])
            
            response = client.responses.create(
                model=model,
                input=input_text,
                instructions=instructions,
                max_output_tokens=max_tokens,
                temperature=temperature,
                text={
                    "format": {
                        "type": "text"
                    }
                }
            )
            return {
                "content": response.output[0].content[0].text,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                }
            }
        else:
            # Default chat completion for other models (gpt-4, etc)
            response = client.chat.completions.create(
                model=model,
                messages=formatted_messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
        
        # Extract the response text and usage from the chat completion format
        return {
            "content": response.choices[0].message.content,
            "usage": {
                "input_tokens": response.usage.prompt_tokens,
                "output_tokens": response.usage.completion_tokens
            }
        }
    except Exception as e:
        print(f"Error in OpenAI completion: {str(e)}")
        raise

async def anthropic_completion(model: str, messages: list, max_tokens: int, temperature: float):
    formatted_messages = []
    system_content = ""
    last_user_message = ""

    for msg in messages:
        role = msg['role']
        content = msg['content'].strip()

        if not content:
            continue

        if role == 'system':
            system_content += f"{content}\n\n"
        elif role == 'user':
            last_user_message = content
            if system_content:
                content = f"{system_content}{content}"
                system_content = ""
            formatted_messages.append({"role": "user", "content": content})
        elif role == 'assistant':
            formatted_messages.append({"role": "assistant", "content": content})

    if formatted_messages and formatted_messages[-1]['role'] == 'assistant':
        default_user_message = "Please continue with the next step based on the previous context."
        formatted_messages.append({"role": "user", "content": default_user_message})

    if system_content:
        if formatted_messages and formatted_messages[0]['role'] == 'user':
            formatted_messages[0]['content'] = f"{system_content}{formatted_messages[0]['content']}"
        else:
            formatted_messages.insert(0, {"role": "user", "content": system_content})

    if not formatted_messages or formatted_messages[0]['role'] != 'user':
        formatted_messages.insert(0, {"role": "user", "content": "Please assist me with the following."})

    final_messages = []
    for msg in formatted_messages:
        if not final_messages or msg['role'] != final_messages[-1]['role']:
            final_messages.append(msg)
        else:
            final_messages[-1]['content'] += f"\n\n{msg['content']}"

    if not final_messages:
        raise ValueError("No valid messages to send to the model.")

    response = anthropic_client.messages.create(
        model=model,
        messages=final_messages,
        max_tokens=max_tokens,
        temperature=temperature
    )
    return response.content[0].text

async def google_completion(model: str, messages: list, max_tokens: int, temperature: float):
    model = genai.GenerativeModel(model_name=model)
    prompt = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in messages])
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            max_output_tokens=max_tokens,
            temperature=temperature
        )
    )
    return response.text

async def xai_completion(model: str, messages: list, max_tokens: int, temperature: float):
    # Create a new OpenAI client for XAI
    xai_client = OpenAI(
        api_key=os.getenv("XAI_API_KEY"),
        base_url="https://api.x.ai/v1"
    )
    
    # Format messages for chat completion
    formatted_messages = []
    for msg in messages:
        if msg["role"] != "system":  # Add non-system messages directly
            formatted_messages.append(msg)
        elif msg["role"] == "system" and msg["content"].strip():  # Add non-empty system messages
            formatted_messages.insert(0, msg)  # System message should be first
    
    try:
        response = xai_client.chat.completions.create(
            model=model,
            messages=formatted_messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        return {
            "content": response.choices[0].message.content,
            "usage": {
                "input_tokens": response.usage.prompt_tokens,
                "output_tokens": response.usage.completion_tokens
            }
        }
    except Exception as e:
        print(f"Error in XAI completion: {str(e)}")
        raise

async def handle_llm_interaction(request: dict):
    model = request.get('model', 'gpt-3.5-turbo')
    messages = request.get('messages', [])
    temperature = request.get('temperature', 0.7)

    for provider, models in MODELS.items():
        if model in models:
            max_tokens = models[model]['output_tokens']
            break
    else:
        raise ValueError(f"Unsupported model: {model}")

    try:
        if model in MODELS['OpenAI']:
            response = await openai_completion(model, messages, max_tokens, temperature)
            output_text = response["content"]
            input_tokens = response["usage"]["input_tokens"]
            output_tokens = response["usage"]["output_tokens"]
        elif model in MODELS['Anthropic']:
            output_text = await anthropic_completion(model, messages, max_tokens, temperature)
            # Calculate tokens for non-OpenAI responses
            combined_prompt = " ".join([msg['content'] for msg in messages])
            input_tokens = count_tokens(combined_prompt, model)
            output_tokens = count_tokens(output_text, model)
        elif model in MODELS['Google']:
            output_text = await google_completion(model, messages, max_tokens, temperature)
            # Calculate tokens for non-OpenAI responses
            combined_prompt = " ".join([msg['content'] for msg in messages])
            input_tokens = count_tokens(combined_prompt, model)
            output_tokens = count_tokens(output_text, model)
        elif model in MODELS['XAI']:
            response = await xai_completion(model, messages, max_tokens, temperature)
            output_text = response["content"]
            input_tokens = response["usage"]["input_tokens"]
            output_tokens = response["usage"]["output_tokens"]
        else:
            raise ValueError(f"Unsupported model: {model}")

        provider = next(provider for provider, models in MODELS.items() if model in models)
        input_cost = (input_tokens / 1_000_000) * MODELS[provider][model]['input']
        output_cost = (output_tokens / 1_000_000) * MODELS[provider][model]['output']
        total_cost = input_cost + output_cost

        return {
            "response": output_text,
            "tokenCounts": {
                "input": input_tokens,
                "output": output_tokens
            },
            "cost": total_cost
        }

    except Exception as e:
        print(f"Error in LLM interaction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_available_models():
    return MODELS