from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import logging
import tiktoken
from utils.llm_services import (
    llm_completion,
    intent_understanding,
    code_planning,
    code_generation,
    quality_assessment
)
from utils.api_routes import (
    get_tree,
    get_directories,
    get_file_content,
    get_file_lines,
    get_prompts,
    create_prompt,
    update_prompt,
    delete_prompt,
    set_default_prompt,
    file_modification,
    environment_management,
    light_verification
)

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

@app.get("/")
async def root():
    return {"message": "Welcome to Speech-to-Code!"}

@app.get("/tree")
async def tree_route(repository: str = Query(..., description="The name of the repository")):
    return await get_tree(repository)

@app.get("/directories")
async def directories_route():
    return await get_directories()

@app.get("/file_content")
async def file_content_route(repository: str = Query(...), path: str = Query(...)):
    return await get_file_content(repository, path)

@app.get("/file_lines")
async def file_lines_route(repository: str, file_path: str):
    return await get_file_lines(repository, file_path)

@app.get("/prompts")
async def prompts_route():
    return await get_prompts()

@app.post("/prompts")
async def create_prompt_route(prompt: Prompt):
    return await create_prompt(prompt)

@app.put("/prompts/{category}/{prompt_id}")
async def update_prompt_route(category: str, prompt_id: int, prompt: Prompt):
    return await update_prompt(category, prompt_id, prompt)

@app.delete("/prompts/{category}/{prompt_id}")
async def delete_prompt_route(category: str, prompt_id: int):
    return await delete_prompt(category, prompt_id)

@app.post("/prompts/{category}/{prompt_id}/set_default")
async def set_default_prompt_route(category: str, prompt_id: int):
    return await set_default_prompt(category, prompt_id)

@app.post("/llm_completion")
async def llm_completion_route(request: CompletionRequest):
    try:
        result = await llm_completion(request.prompt, request.user_input, request.model, request.job_id)
        return result
    except Exception as e:
        logger.error(f"Error in LLM completion: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/intent_understanding")
async def intent_understanding_route(request: IntentUnderstandingRequest):
    try:
        result = await intent_understanding(request.prompt, request.user_input, request.repository, request.job_id)
        return result
    except Exception as e:
        logger.error(f"Error in intent understanding: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/code_planning")
async def code_planning_route(request: CodePlanningRequest):
    try:
        result = await code_planning(request.prompt, request.intent_data, request.repository, request.job_id)
        return result
    except Exception as e:
        logger.error(f"Error in code planning: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/code_generation")
async def code_generation_route(request: CodeGenerationRequest):
    try:
        result = await code_generation(request.prompt, request.planning_data, request.repository, request.job_id)
        return result
    except Exception as e:
        logger.error(f"Error in code generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quality_assessment")
async def quality_assessment_route(request: QualityAssessmentRequest):
    try:
        result = await quality_assessment(request.prompt, request.generated_code, request.repository, request.job_id)
        return result
    except Exception as e:
        logger.error(f"Error in quality assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/file_modification")
async def file_modification_route(request: FileModificationRequest):
    return await file_modification(request)

@app.post("/environment_management")
async def environment_management_route(request: EnvironmentManagementRequest):
    return await environment_management(request)

@app.post("/light_verification")
async def light_verification_route(request: LightVerificationRequest):
    return await light_verification(request)

@app.post("/count_tokens")
async def count_tokens(request: TokenRequest):
    try:
        encoding = tiktoken.encoding_for_model(request.model)
        return {"count": len(encoding.encode(request.text))}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)