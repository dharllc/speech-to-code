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

async def openai_completion(model: str, system_prompt: str, user_prompt: str, max_tokens: int, temperature: float):
    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_tokens=max_tokens,
        temperature=temperature
    )
    return response.choices[0].message['content']

async def anthropic_completion(model: str, system_prompt: str, user_prompt: str, max_tokens: int, temperature: float):
    response = anthropic_client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system_prompt,
        messages=[
            {"role": "user", "content": user_prompt}
        ]
    )
    return response.content[0].text

async def google_completion(model: str, system_prompt: str, user_prompt: str, max_tokens: int, temperature: float):
    model = genai.GenerativeModel(model_name=model)
    response = model.generate_content(
        f"{system_prompt}\n\n{user_prompt}",
        generation_config=genai.GenerationConfig(
            max_output_tokens=max_tokens,
            temperature=temperature
        )
    )
    return response.text

async def handle_llm_interaction(request: dict):
    model = request.get('model', 'gpt-3.5-turbo')
    system_prompt = request.get('system_prompt', '')
    user_prompt = request.get('user_prompt', '')
    max_tokens = request.get('max_tokens', 2000)
    temperature = request.get('temperature', 0.7)

    combined_prompt = f"{system_prompt}\n\n{user_prompt}"
    input_tokens = count_tokens(combined_prompt, model)

    try:
        if model in MODELS['OpenAI']:
            output_text = await openai_completion(model, system_prompt, user_prompt, max_tokens, temperature)
        elif model in MODELS['Anthropic']:
            output_text = await anthropic_completion(model, system_prompt, user_prompt, max_tokens, temperature)
        elif model in MODELS['Google']:
            output_text = await google_completion(model, system_prompt, user_prompt, max_tokens, temperature)
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