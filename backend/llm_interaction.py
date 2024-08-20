from fastapi import HTTPException
import openai
import anthropic
import google.generativeai as genai
import os
import tiktoken
from dotenv import load_dotenv
from model_config import MODELS

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
google_api_key = os.getenv("GOOGLE_API_KEY")

anthropic_client = anthropic.Anthropic(api_key=anthropic_api_key)
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
    system_prompt = next((msg['content'] for msg in messages if msg['role'] == 'system'), '')
    human_messages = [msg['content'] for msg in messages if msg['role'] == 'user']
    assistant_messages = [msg['content'] for msg in messages if msg['role'] == 'assistant']
    
    conversation = []
    for h, a in zip(human_messages, assistant_messages + [None]):
        conversation.extend([f"Human: {h}", f"Assistant: {a}" if a else ""])
    
    prompt = f"{system_prompt}\n\n{''.join(conversation)}Human: {human_messages[-1]}\nAssistant:"
    
    response = anthropic_client.completions.create(
        model=model,
        prompt=prompt,
        max_tokens_to_sample=max_tokens,
        temperature=temperature
    )
    return response.completion

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