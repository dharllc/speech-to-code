from fastapi import HTTPException
import openai
from anthropic import Anthropic
import google.generativeai as genai
import os
import tiktoken
from dotenv import load_dotenv
from model_config import MODELS

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
google_api_key = os.getenv("GOOGLE_API_KEY")

anthropic_client = Anthropic(api_key=anthropic_api_key)
genai.configure(api_key=google_api_key)

def get_encoding(model: str):
    try:
        return tiktoken.encoding_for_model(model)
    except KeyError:
        return tiktoken.get_encoding("cl100k_base")

def count_tokens(text: str, model: str) -> int:
    encoding = get_encoding(model)
    return len(encoding.encode(text))

async def openai_completion(model: str, messages: list, max_tokens: int, temperature: float):
    response = openai.ChatCompletion.create(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature
    )
    return response.choices[0].message['content']

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

    # If there's no user message after the last assistant message, add a default one
    if formatted_messages and formatted_messages[-1]['role'] == 'assistant':
        default_user_message = "Please continue with the next step based on the previous context."
        formatted_messages.append({"role": "user", "content": default_user_message})

    # If there's remaining system content, add it to the first user message or create a new one
    if system_content:
        if formatted_messages and formatted_messages[0]['role'] == 'user':
            formatted_messages[0]['content'] = f"{system_content}{formatted_messages[0]['content']}"
        else:
            formatted_messages.insert(0, {"role": "user", "content": system_content})

    # Ensure the message list starts with a user message
    if not formatted_messages or formatted_messages[0]['role'] != 'user':
        formatted_messages.insert(0, {"role": "user", "content": "Please assist me with the following."})

    # Ensure alternating user/assistant messages
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

async def handle_llm_interaction(request: dict):
    model = request.get('model', 'gpt-3.5-turbo')
    messages = request.get('messages', [])
    max_tokens = request.get('max_tokens', 2000)
    temperature = request.get('temperature', 0.7)

    combined_prompt = " ".join([msg['content'] for msg in messages])
    input_tokens = count_tokens(combined_prompt, model)

    try:
        if model in MODELS['OpenAI']:
            output_text = await openai_completion(model, messages, max_tokens, temperature)
        elif model in MODELS['Anthropic']:
            output_text = await anthropic_completion(model, messages, max_tokens, temperature)
        elif model in MODELS['Google']:
            output_text = await google_completion(model, messages, max_tokens, temperature)
        else:
            raise ValueError(f"Unsupported model: {model}")

        output_tokens = count_tokens(output_text, model)

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
    return {provider: list(models.keys()) for provider, models in MODELS.items()}