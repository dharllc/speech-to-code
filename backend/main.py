from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from utils.tree_structure import get_tree_structure
from utils import prompt_manager
import os, json, tiktoken, asyncio, shutil, subprocess, ast
from pydantic import BaseModel
from openai import AsyncOpenAI
import logging
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

MODEL_COSTS = {
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
}

class TokenRequest(BaseModel):
    text: str
    model: str = "gpt-3.5-turbo"

class CompletionRequest(BaseModel):
    prompt: str
    user_input: str
    model: str = "gpt-4o-mini"

class Prompt(BaseModel):
    category: str
    content: str

class IntentUnderstandingRequest(BaseModel):
    prompt: str
    user_input: str
    repository: str

class CodePlanningRequest(BaseModel):
    prompt: str
    intent_data: dict
    repository: str

class CodeGenerationRequest(BaseModel):
    prompt: str
    planning_data: dict
    repository: str

class QualityAssessmentRequest(BaseModel):
    prompt: str
    generated_code: dict
    repository: str

class FileModificationRequest(BaseModel):
    modification_plan: dict
    repository: str

class EnvironmentManagementRequest(BaseModel):
    modification_results: dict
    repository: str

class LightVerificationRequest(BaseModel):
    environment_results: dict
    repository: str

@app.post("/count_tokens")
async def count_tokens(request: TokenRequest):
    try:
        encoding = tiktoken.encoding_for_model(request.model)
        return {"count": len(encoding.encode(request.text))}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Welcome to Speech-to-Code!"}

def count_tokens_for_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        return len(encoding.encode(content))
    except Exception as e:
        print(f"Error counting tokens for {file_path}: {str(e)}")
        return 0

def update_token_counts(node, base_path):
    full_path = os.path.join(base_path, node['path'])
    if node['type'] == 'file':
        node['token_count'] = count_tokens_for_file(full_path)
    else:
        for child in node.get('children', []):
            update_token_counts(child, base_path)
        node['token_count'] = sum(child['token_count'] for child in node.get('children', []))

@app.get("/tree")
async def get_tree(background_tasks: BackgroundTasks, repository: str = Query(..., description="The name of the repository")):
    print(f"Fetching tree for repository: {repository}")
    if not repository:
        raise HTTPException(status_code=400, detail="Repository name is required")
    base_path = f"/Users/sachindhar/Documents/GitHub/{repository}"
    print(f"Base path: {base_path}")
    if not os.path.exists(base_path):
        raise HTTPException(status_code=404, detail=f"Repository '{repository}' not found")
    tree = json.loads(get_tree_structure(base_path))
    update_token_counts(tree, base_path)
    print(f"Tree structure: {json.dumps(tree, indent=2)}")
    return {"tree": json.dumps(tree)}

@app.get("/directories")
async def get_directories():
    base_path = "/Users/sachindhar/Documents/GitHub"
    try:
        return {"directories": [d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d))]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/file_content")
async def get_file_content(repository: str = Query(...), path: str = Query(...)):
    file_path = os.path.join(f"/Users/sachindhar/Documents/GitHub/{repository}", path)
    print(f"Attempting to read file: {file_path}")
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()
        token_count = len(tiktoken.encoding_for_model("gpt-3.5-turbo").encode(content))
        print(f"Successfully read file: {file_path}")
        return {"content": content, "token_count": token_count}
    except Exception as e:
        print(f"Error reading file {file_path}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/file_lines")
async def get_file_lines(repository: str, file_path: str):
    full_path = os.path.join("/Users/sachindhar/Documents/GitHub", repository, file_path)
    try:
        with open(full_path, 'r', encoding='utf-8', errors='ignore') as file:
            return {"line_count": sum(1 for _ in file)}
    except Exception as e:
        return {"error": str(e)}

@app.get("/prompts")
async def get_prompts():
    return prompt_manager.load_prompts()

@app.post("/prompts")
async def create_prompt(prompt: Prompt):
    return prompt_manager.add_prompt(prompt.category, prompt.content)

@app.put("/prompts/{category}/{prompt_id}")
async def update_prompt(category: str, prompt_id: int, prompt: Prompt):
    updated_prompt = prompt_manager.update_prompt(category, prompt_id, prompt.content)
    if updated_prompt:
        return updated_prompt
    raise HTTPException(status_code=404, detail="Prompt not found")

@app.delete("/prompts/{category}/{prompt_id}")
async def delete_prompt(category: str, prompt_id: int):
    prompt_manager.delete_prompt(category, prompt_id)
    return {"status": "success"}

@app.post("/prompts/{category}/{prompt_id}/set_default")
async def set_default_prompt(category: str, prompt_id: int):
    success = prompt_manager.set_default_prompt(category, prompt_id)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Prompt not found")

def calculate_cost(input_tokens, output_tokens, model):
    if model not in MODEL_COSTS:
        return 0
    input_cost = (input_tokens / 1000000) * MODEL_COSTS[model]["input"]
    output_cost = (output_tokens / 1000000) * MODEL_COSTS[model]["output"]
    return input_cost + output_cost

@app.post("/llm_completion")
async def llm_completion(request: CompletionRequest):
    try:
        logger.info(f"Generating response using model: {request.model}")
        logger.info(f"Prompt: {request.prompt}")
        logger.info(f"User Input: {request.user_input}")

        response = await openai_client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": request.prompt},
                {"role": "user", "content": request.user_input}
            ]
        )

        content = response.choices[0].message.content
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
        cost = calculate_cost(input_tokens, output_tokens, request.model)

        logger.info(f"Response: {content}")
        logger.info(f"Input tokens: {input_tokens}, Output tokens: {output_tokens}, Cost: ${cost:.6f}")

        return {
            "completion": content,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": cost
        }
    except Exception as e:
        logger.error(f"Error generating AI response: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/intent_understanding")
async def intent_understanding(request: IntentUnderstandingRequest):
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": request.prompt},
                {"role": "user", "content": f"Repository: {request.repository}\nUser Input: {request.user_input}"}
            ]
        )
        return {"understanding": response.choices[0].message.content}
    except Exception as e:
        logger.error(f"Error in intent understanding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/code_planning")
async def code_planning(request: CodePlanningRequest):
    logger.info(f"Received code planning request: {request}")
    logger.info(f"Prompt: {request.prompt}")
    logger.info(f"Intent Data: {request.intent_data}")
    logger.info(f"Repository: {request.repository}")

    try:
        logger.info(f"Received code planning request: {request}")
        logger.info(f"Prompt: {request.prompt}")
        logger.info(f"Intent Data: {request.intent_data}")
        logger.info(f"Repository: {request.repository}")
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": request.prompt},
                {"role": "user", "content": f"Repository: {request.repository}\nIntent Data: {request.intent_data}"}
            ]
        )
        plan = response.choices[0].message.content
        logger.info(f"Generated code plan: {plan}")
        return {"plan": plan}
    except Exception as e:
        logger.error(f"Error in code planning: {str(e)}")
        logger.error(f"Request data: {request}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/code_generation")
async def code_generation(request: CodeGenerationRequest):
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": request.prompt},
                {"role": "user", "content": f"Repository: {request.repository}\nPlanning Data: {json.dumps(request.planning_data)}"}
            ]
        )
        return {"generated_code": response.choices[0].message.content}
    except Exception as e:
        logger.error(f"Error in code generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quality_assessment")
async def quality_assessment(request: QualityAssessmentRequest):
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": request.prompt},
                {"role": "user", "content": f"Repository: {request.repository}\nGenerated Code: {json.dumps(request.generated_code)}"}
            ]
        )
        assessment = response.choices[0].message.content
        # Parse the assessment to extract score and details
        # This is a simplified version; you might need to adjust based on the actual format of the assessment
        lines = assessment.split('\n')
        score = int(lines[0].split(':')[1].strip())
        details = lines[1:]
        return {"score": score, "details": details, "full_assessment": assessment}
    except Exception as e:
        logger.error(f"Error in quality assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/file_modification")
async def file_modification(request: FileModificationRequest):
    try:
        logger.info(f"Starting file modification for repository: {request.repository}")
        base_path = os.path.join("/Users/sachindhar/Documents/GitHub", request.repository)
        logger.info(f"Base path for modifications: {base_path}")
        
        modifications = []
        
        for file_change in request.modification_plan['file_changes']:
            file_path = os.path.join(base_path, file_change['file_path'])
            logger.info(f"Processing file: {file_path}")
            
            if file_change['action'] == 'create':
                with open(file_path, 'w') as f:
                    f.write(file_change['content'])
                modifications.append(f"Created: {file_change['file_path']}")
                logger.info(f"Created file: {file_path}")
            
            elif file_change['action'] == 'modify':
                with open(file_path, 'r') as f:
                    content = f.read()
                
                for change in file_change['changes']:
                    content = content.replace(change['old'], change['new'])
                
                with open(file_path, 'w') as f:
                    f.write(content)
                modifications.append(f"Modified: {file_change['file_path']}")
                logger.info(f"Modified file: {file_path}")
            
            elif file_change['action'] == 'delete':
                os.remove(file_path)
                modifications.append(f"Deleted: {file_change['file_path']}")
                logger.info(f"Deleted file: {file_path}")
        
        logger.info("File modification completed successfully")
        return {"status": "File modifications completed", "modifications": modifications}
    except Exception as e:
        logger.error(f"Error in file modification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/environment_management")
async def environment_management(request: EnvironmentManagementRequest):
    try:
        logger.info(f"Starting environment management for repository: {request.repository}")
        base_path = os.path.join("/Users/sachindhar/Documents/GitHub", request.repository)
        logger.info(f"Base path for environment management: {base_path}")
        
        results = []
        
        if 'new_dependencies' in request.modification_results:
            logger.info("Installing new dependencies")
            for dep in request.modification_results['new_dependencies']:
                try:
                    subprocess.run(['pip', 'install', dep], check=True)
                    results.append(f"Installed: {dep}")
                    logger.info(f"Installed dependency: {dep}")
                except subprocess.CalledProcessError as e:
                    results.append(f"Failed to install: {dep}. Error: {str(e)}")
                    logger.error(f"Failed to install dependency: {dep}. Error: {str(e)}")
        
        if 'env_variables' in request.modification_results:
            logger.info("Updating environment variables")
            env_file_path = os.path.join(base_path, '.env')
            with open(env_file_path, 'a') as f:
                for key, value in request.modification_results['env_variables'].items():
                    f.write(f"\n{key}={value}")
                    results.append(f"Added environment variable: {key}")
                    logger.info(f"Added environment variable: {key}")
        
        if 'restart_services' in request.modification_results:
            logger.info("Restarting services")
            for service in request.modification_results['restart_services']:
                try:
                    subprocess.run(['docker-compose', 'restart', service], cwd=base_path, check=True)
                    results.append(f"Restarted service: {service}")
                    logger.info(f"Restarted service: {service}")
                except subprocess.CalledProcessError as e:
                    results.append(f"Failed to restart service: {service}. Error: {str(e)}")
                    logger.error(f"Failed to restart service: {service}. Error: {str(e)}")
        
        logger.info("Environment management completed successfully")
        return {"status": "Environment updated", "results": results}
    except Exception as e:
        logger.error(f"Error in environment management: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/light_verification")
async def light_verification(request: LightVerificationRequest):
    try:
        logger.info(f"Starting light verification for repository: {request.repository}")
        base_path = os.path.join("/Users/sachindhar/Documents/GitHub", request.repository)
        logger.info(f"Base path for verification: {base_path}")
        
        verification_results = []
        
        for file_path in request.environment_results.get('modified_files', []):
            full_path = os.path.join(base_path, file_path)
            logger.info(f"Verifying file: {full_path}")
            
            with open(full_path, 'r') as f:
                content = f.read()
            
            # Syntax check
            try:
                ast.parse(content)
                verification_results.append(f"Syntax check passed: {file_path}")
                logger.info(f"Syntax check passed: {file_path}")
            except SyntaxError as e:
                verification_results.append(f"Syntax error in {file_path}: {str(e)}")
                logger.error(f"Syntax error in {file_path}: {str(e)}")
            
            # Import check
            imports = [line for line in content.split('\n') if line.startswith('import') or line.startswith('from')]
            if imports:
                verification_results.append(f"Imports found in {file_path}: {len(imports)}")
                logger.info(f"Imports found in {file_path}: {len(imports)}")
            else:
                verification_results.append(f"No imports found in {file_path}")
                logger.info(f"No imports found in {file_path}")
            
            # Basic functionality check
            if 'def ' in content or 'class ' in content:
                verification_results.append(f"Functions or classes found in {file_path}")
                logger.info(f"Functions or classes found in {file_path}")
            else:
                verification_results.append(f"No functions or classes found in {file_path}")
                logger.info(f"No functions or classes found in {file_path}")
        
        # Overall verification result
        if any("error" in result.lower() for result in verification_results):
            status = "Verification failed"
        else:
            status = "Verification passed"
        
        logger.info(f"Light verification completed. Status: {status}")
        return {"status": status, "verification_results": verification_results}
    except Exception as e:
        logger.error(f"Error in light verification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)