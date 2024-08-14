import os
import json
import logging
from datetime import datetime
from openai import AsyncOpenAI
from dotenv import load_dotenv
from utils.logger import log_interaction

load_dotenv()

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

MODEL_COSTS = {
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
}

def calculate_cost(input_tokens, output_tokens, model):
    if model not in MODEL_COSTS:
        return 0
    input_cost = (input_tokens / 1000000) * MODEL_COSTS[model]["input"]
    output_cost = (output_tokens / 1000000) * MODEL_COSTS[model]["output"]
    return input_cost + output_cost

async def llm_completion(prompt, user_input, model="gpt-4o-mini", job_id=None):
    try:
        logger.info(f"Generating response using model: {model}")
        logger.info(f"Prompt: {prompt}")
        logger.info(f"User Input: {user_input}")

        response = await openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_input}
            ]
        )

        content = response.choices[0].message.content
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
        cost = calculate_cost(input_tokens, output_tokens, model)

        logger.info(f"Response: {content}")
        logger.info(f"Input tokens: {input_tokens}, Output tokens: {output_tokens}, Cost: ${cost:.6f}")

        log_data = {
            "timestamp": datetime.now().isoformat(),
            "stage": "llm_completion",
            "model": model,
            "prompt": prompt,
            "user_input": user_input,
            "response": content,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": cost
        }
        job_id, _ = log_interaction(log_data, job_id)

        return {
            "completion": content,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": cost,
            "job_id": job_id
        }
    except Exception as e:
        logger.error(f"Error generating AI response: {str(e)}")
        raise

async def intent_understanding(prompt, user_input, repository, job_id=None):
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Repository: {repository}\nUser Input: {user_input}"}
            ]
        )
        content = response.choices[0].message.content
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
        cost = calculate_cost(input_tokens, output_tokens, "gpt-4o-mini")

        log_data = {
            "timestamp": datetime.now().isoformat(),
            "stage": "intent_understanding",
            "model": "gpt-4o-mini",
            "prompt": prompt,
            "user_input": user_input,
            "repository": repository,
            "response": content,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": cost
        }
        job_id, _ = log_interaction(log_data, job_id)

        return {"understanding": content, "job_id": job_id}
    except Exception as e:
        logger.error(f"Error in intent understanding: {str(e)}")
        raise

async def code_planning(prompt, intent_data, repository, job_id=None):
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Repository: {repository}\nIntent Data: {intent_data}"}
            ]
        )
        plan = response.choices[0].message.content
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
        cost = calculate_cost(input_tokens, output_tokens, "gpt-4o-mini")

        logger.info(f"Generated code plan: {plan}")

        log_data = {
            "timestamp": datetime.now().isoformat(),
            "stage": "code_planning",
            "model": "gpt-4o-mini",
            "prompt": prompt,
            "intent_data": intent_data,
            "repository": repository,
            "response": plan,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": cost
        }
        job_id, _ = log_interaction(log_data, job_id)

        return {"plan": plan, "job_id": job_id}
    except Exception as e:
        logger.error(f"Error in code planning: {str(e)}")
        raise

async def code_generation(prompt, planning_data, repository, job_id=None):
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Repository: {repository}\nPlanning Data: {json.dumps(planning_data)}"}
            ]
        )
        generated_code = response.choices[0].message.content
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
        cost = calculate_cost(input_tokens, output_tokens, "gpt-4o-mini")

        log_data = {
            "timestamp": datetime.now().isoformat(),
            "stage": "code_generation",
            "model": "gpt-4o-mini",
            "prompt": prompt,
            "planning_data": planning_data,
            "repository": repository,
            "response": generated_code,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": cost
        }
        job_id, _ = log_interaction(log_data, job_id)

        return {"generated_code": generated_code, "job_id": job_id}
    except Exception as e:
        logger.error(f"Error in code generation: {str(e)}")
        raise

async def quality_assessment(prompt, generated_code, repository, job_id=None):
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Repository: {repository}\nGenerated Code: {json.dumps(generated_code)}"}
            ]
        )
        assessment = response.choices[0].message.content
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
        cost = calculate_cost(input_tokens, output_tokens, "gpt-4o-mini")

        lines = assessment.split('\n')
        score = int(lines[0].split(':')[1].strip())
        details = lines[1:]

        log_data = {
            "timestamp": datetime.now().isoformat(),
            "stage": "quality_assessment",
            "model": "gpt-4o-mini",
            "prompt": prompt,
            "generated_code": generated_code,
            "repository": repository,
            "response": assessment,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": cost
        }
        job_id, _ = log_interaction(log_data, job_id)

        return {"score": score, "details": details, "full_assessment": assessment, "job_id": job_id}
    except Exception as e:
        logger.error(f"Error in quality assessment: {str(e)}")
        raise