# uvicorn main:app --reload --port 8085 --log-level debug
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from utils.tree_structure import get_tree_structure, should_skip_token_count
import os, json, tiktoken, logging
from dotenv import load_dotenv, set_key
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid
from llm_interaction import handle_llm_interaction, get_available_models
from utils.context_map import generate_context_map,save_context_map,load_context_map
import os.path as osp

# After imports, before root_dir setup
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)

log_file = os.path.join(log_dir, f'llm_logs_{datetime.now().strftime("%Y%m%d")}.log')

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, mode='a'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

try:
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(root_dir, 'config.json'), 'r') as f:
        config = json.load(f)
        BACKEND_PORT = config['backend']['port']
        FRONTEND_PORT = config['frontend']['port']
    logger.info(f"Loaded config: BACKEND_PORT={BACKEND_PORT}, FRONTEND_PORT={FRONTEND_PORT}")
except Exception as e:
    logger.error(f"Failed to load config.json: {str(e)}")
    raise RuntimeError(f"Failed to load config.json: {str(e)}")

load_dotenv()

REPO_PATH = os.getenv("REPO_PATH")
if REPO_PATH is None:
    logger.error("REPO_PATH environment variable is not set")
    raise ValueError("REPO_PATH environment variable is not set")
logger.info(f"Using REPO_PATH: {REPO_PATH}")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"http://localhost:{FRONTEND_PORT}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SYSTEM_PROMPTS_FILE = os.path.join(SCRIPT_DIR, "system_prompts.json")
CONTEXT_MAPS_DIR = osp.join(SCRIPT_DIR,"context_maps")

if not os.path.exists(SYSTEM_PROMPTS_FILE):
    with open(SYSTEM_PROMPTS_FILE, 'w') as f:
        json.dump([], f)
    logger.info(f"Created empty system_prompts.json file at {SYSTEM_PROMPTS_FILE}")

class TokenRequest(BaseModel):
    text: str
    model: str = "gpt-3.5-turbo"

class SystemPrompt(BaseModel):
    id: str
    name: str
    step: str
    content: str
    is_default: bool
    timestamp: str
    token_count: int

class SystemPromptCreate(BaseModel):
    name: str
    step: str
    content: str
    is_default: bool

def load_system_prompts():
    try:
        with open(SYSTEM_PROMPTS_FILE, 'r') as f:
            content = f.read().strip()
            if content:
                return json.loads(content)
            else:
                return []
    except json.JSONDecodeError:
        logger.error(f"Error decoding JSON from {SYSTEM_PROMPTS_FILE}. Resetting to empty list.")
        return []
    except FileNotFoundError:
        logger.error(f"{SYSTEM_PROMPTS_FILE} not found. Creating new file.")
        save_system_prompts([])
        return []

def save_system_prompts(prompts):
    with open(SYSTEM_PROMPTS_FILE, 'w') as f:
        json.dump(prompts, f, indent=2)

@app.post("/count_tokens")
async def count_tokens(request: TokenRequest):
    try:
        encoding = tiktoken.encoding_for_model(request.model)
        return {"count": len(encoding.encode(request.text))}
    except Exception as e:
        logger.error(f"Error counting tokens: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Welcome to Speech-to-Code!"}

def count_tokens_for_file(file_path):
    if should_skip_token_count(file_path):
        logger.debug(f"Skipping token count for binary/media file: {file_path}")
        return 0
        
    try:
        with open(file_path, 'rb') as f:
            sample = f.read(1024)
            try:
                sample.decode('utf-8')
            except UnicodeDecodeError:
                logger.debug(f"File appears to be binary, skipping: {file_path}")
                return 0
        
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()
            if not content.strip():
                return 0
            encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
            return len(encoding.encode(content))
    except Exception as e:
        logger.error(f"Error counting tokens for {file_path}: {str(e)}")
        return 0

def update_token_counts(node, base_path):
    full_path = os.path.join(base_path, node['path'])
    
    if node['type'] == 'file' and should_skip_token_count(full_path):
        node['token_count'] = 0
        node['skip_token_count'] = True
        logger.debug(f"Skipping file: {full_path}")
        return
        
    if node['type'] == 'file':
        node['token_count'] = count_tokens_for_file(full_path)
        node['skip_token_count'] = False
    else:
        total_tokens = 0
        for child in node.get('children', []):
            update_token_counts(child, base_path)
            if not child.get('skip_token_count', False):
                total_tokens += child.get('token_count', 0)
        node['token_count'] = total_tokens

@app.get("/tree")
async def get_tree(background_tasks: BackgroundTasks, repository: str = Query(..., description="The name of the repository")):
    logger.info(f"Fetching tree for repository: {repository}")
    if not repository:
        raise HTTPException(status_code=400, detail="Repository name is required")
    base_path = os.path.join(REPO_PATH, repository)
    logger.debug(f"Base path: {base_path}")
    if not os.path.exists(base_path):
        raise HTTPException(status_code=404, detail=f"Repository '{repository}' not found")
    tree = json.loads(get_tree_structure(base_path))
    update_token_counts(tree, base_path)
    logger.debug(f"Tree structure: {json.dumps(tree, indent=2)}")
    return {"tree": json.dumps(tree)}

@app.get("/directories")
async def get_directories():
    try:
        directories = [d for d in os.listdir(REPO_PATH) if os.path.isdir(os.path.join(REPO_PATH, d))]
        logger.debug(f"REPO_PATH: {REPO_PATH}")
        logger.debug(f"Found directories: {directories}")
        return {"directories": directories}
    except Exception as e:
        logger.error(f"Error in get_directories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/file_content")
async def get_file_content(repository: str = Query(...), path: str = Query(...)):
    file_path = os.path.join(REPO_PATH, repository, path)
    logger.debug(f"Attempting to read file: {file_path}")
    
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    
    if should_skip_token_count(file_path):
        logger.debug(f"Binary/media file, returning without counting tokens: {file_path}")
        return {"content": "", "token_count": 0, "is_binary": True}
    
    try:
        with open(file_path, 'rb') as f:
            sample = f.read(1024)
            try:
                sample.decode('utf-8')
            except UnicodeDecodeError:
                logger.debug(f"File appears to be binary, skipping: {file_path}")
                return {"content": "", "token_count": 0, "is_binary": True}
        
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()
            if not content.strip():
                return {"content": "", "token_count": 0}
                
            token_count = len(tiktoken.encoding_for_model("gpt-3.5-turbo").encode(content))
            logger.debug(f"Successfully read file: {file_path}")
            return {"content": content, "token_count": token_count}
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/file_lines")
async def get_file_lines(repository: str, file_path: str):
    full_path = os.path.join(REPO_PATH, repository, file_path)
    try:
        with open(full_path, 'r', encoding='utf-8', errors='ignore') as file:
            return {"line_count": sum(1 for _ in file)}
    except Exception as e:
        logger.error(f"Error getting file lines: {str(e)}")
        return {"error": str(e)}

@app.get("/system_prompts", response_model=List[SystemPrompt])
async def get_system_prompts():
    prompts = load_system_prompts()
    def safe_sort_key(x):
        try:
            return int(x['step'].split()[-1])
        except (ValueError, IndexError):
            return float('inf')
    return sorted(prompts, key=safe_sort_key)

@app.post("/system_prompts", response_model=SystemPrompt)
async def create_system_prompt(prompt: SystemPromptCreate):
    try:
        prompts = load_system_prompts()
        
        if not prompt.step.startswith("Step "):
            prompt.step = f"Step {prompt.step}"
        
        try:
            step_number = int(prompt.step.split()[-1])
        except ValueError:
            raise HTTPException(status_code=400, detail="Step must be a number or 'Step X' where X is a number")
        
        if any(p['step'] == prompt.step for p in prompts):
            raise HTTPException(status_code=400, detail=f"Prompt for {prompt.step} already exists")
        
        new_prompt = SystemPrompt(
            id=str(uuid.uuid4()),
            name=prompt.name,
            step=prompt.step,
            content=prompt.content,
            is_default=prompt.is_default,
            timestamp=datetime.now().isoformat(),
            token_count=len(tiktoken.encoding_for_model("gpt-3.5-turbo").encode(prompt.content))
        )
        prompts.append(new_prompt.dict())
        prompts.sort(key=lambda x: int(x['step'].split()[-1]))
        save_system_prompts(prompts)
        return new_prompt
    except Exception as e:
        logger.error(f"Error creating system prompt: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save prompt: {str(e)}")

@app.delete("/system_prompts/{prompt_id}")
async def delete_system_prompt(prompt_id: str):
    prompts = load_system_prompts()
    prompts = [p for p in prompts if p['id'] != prompt_id]
    save_system_prompts(prompts)
    return {"message": "Prompt deleted successfully"}
    
@app.put("/system_prompts/{prompt_id}", response_model=SystemPrompt)
async def update_system_prompt(prompt_id: str, prompt: SystemPromptCreate):
    prompts = load_system_prompts()
    updated_prompt = None
    for i, p in enumerate(prompts):
        if p['id'] == prompt_id:
            if any(other_p['name'] == prompt.name and other_p['id'] != prompt_id for other_p in prompts):
                raise HTTPException(status_code=400, detail="Prompt name must be unique")
            
            if prompt.is_default:
                for other_p in prompts:
                    if other_p['step'] == p['step'] and other_p['id'] != prompt_id:
                        other_p['is_default'] = False
            
            updated_prompt = SystemPrompt(
                id=prompt_id,
                name=prompt.name,
                step=p['step'],
                content=prompt.content,
                is_default=prompt.is_default,
                timestamp=datetime.now().isoformat(),
                token_count=len(tiktoken.encoding_for_model("gpt-3.5-turbo").encode(prompt.content))
            )
            prompts[i] = updated_prompt.dict()
            break
    
    if updated_prompt:
        save_system_prompts(prompts)
        return updated_prompt
    raise HTTPException(status_code=404, detail="Prompt not found")

@app.post("/llm_interaction") 
async def llm_interaction(request: dict):
    request_id = str(uuid.uuid4())[:8]
    logger.info(f"[{request_id}] Received LLM interaction request")
    logger.debug(f"[{request_id}] Request details: {json.dumps(request, indent=2)}")
    
    try:
        response = await handle_llm_interaction(request)
        logger.info(f"[{request_id}] LLM interaction successful")
        logger.debug(f"[{request_id}] Response: {json.dumps(response, indent=2)}")
        return response
    except Exception as e:
        logger.error(f"[{request_id}] LLM interaction failed: {str(e)}")
        raise

@app.get("/available_models")
async def available_models():
    return await get_available_models()

class EnvVarUpdate(BaseModel):
    key: str
    value: str

@app.get("/env_vars")
async def get_env_vars():
    return {
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY", ""),
        "GOOGLE_API_KEY": os.getenv("GOOGLE_API_KEY", ""),
        "ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY", ""),
        "REPO_PATH": os.getenv("REPO_PATH", "")
    }

@app.post("/env_vars")
async def update_env_var(env_var: dict):
   key, value = next(iter(env_var.items()))
   env_file = os.path.join(os.path.dirname(__file__), ".env")
   set_key(env_file, key, value)
   os.environ[key] = value
   return {"message": f"{key} updated successfully"}

@app.post("/repository-context/{repository}/initialize")
async def initialize_context_map(repository:str):
   repo_path=osp.join(REPO_PATH,repository)
   if not osp.exists(repo_path):
       raise HTTPException(status_code=404,detail=f"Repository '{repository}' not found")
   try:
       context_map=generate_context_map(repo_path,repository)
       save_context_map(context_map,CONTEXT_MAPS_DIR)
       return{"message":"Context map initialized successfully","repositoryId":repository}
   except Exception as e:
       raise HTTPException(status_code=500,detail=f"Failed to initialize context map: {str(e)}")

@app.post("/repository-context/{repository}/refresh")
async def refresh_context_map(repository:str):
   repo_path=osp.join(REPO_PATH,repository)
   if not osp.exists(repo_path):
       raise HTTPException(status_code=404,detail=f"Repository '{repository}' not found")
   try:
       context_map=generate_context_map(repo_path,repository)
       save_context_map(context_map,CONTEXT_MAPS_DIR)
       return{"message":"Context map refreshed successfully","repositoryId":repository}
   except Exception as e:
       raise HTTPException(status_code=500,detail=f"Failed to refresh context map: {str(e)}")

@app.get("/repository-context/{repository}")
async def get_context_map(repository:str):
   context_map=load_context_map(repository,CONTEXT_MAPS_DIR)
   if not context_map:
       raise HTTPException(status_code=404,detail=f"Context map for repository '{repository}' not found")
   return context_map

class AnalyzePromptRequest(BaseModel):
   repository: str
   prompt: str

@app.post("/analyze-prompt")
async def analyze_prompt(request: AnalyzePromptRequest):
   request_id = str(uuid.uuid4())[:8]
   logger.info(f"[{request_id}] Analyzing prompt for repository: {request.repository}")
   logger.debug(f"[{request_id}] Prompt: {request.prompt}")

   context_map = load_context_map(request.repository, CONTEXT_MAPS_DIR)
   if not context_map:
       logger.error(f"[{request_id}] Context map not found for repository: {request.repository}")
       raise HTTPException(status_code=404, detail=f"Context map for repository '{request.repository}' not found")

   files_json = json.dumps({k: v['summary'] for k, v in context_map['files'].items()}, indent=2)
   logger.debug(f"[{request_id}] Files with summaries: {files_json}")

   messages = [{
       "role": "system",
       "content": """You are an expert at analyzing code repository structures and context maps to identify relevant files for code changes. Given a user's description and a repository's file listings with summaries, suggest files that are most relevant to the described task.

Your response must be a valid JSON object with this exact structure:
{
 "high_confidence": [
   {"file": "path/to/file", "reason": "brief explanation"},
   ...
 ],
 "medium_confidence": [
   {"file": "path/to/file", "reason": "brief explanation"},
   ...
 ],
 "low_confidence": [
   {"file": "path/to/file", "reason": "brief explanation"},
   ...
 ]
}

Guidelines:
- Only suggest files that exist in the provided file listing
- Do NOT invent any file paths or directories that do not appear in the provided file listing.
- Put files you're very certain about in high_confidence
- Put files you think might be relevant in medium_confidence
- Put files that could potentially be useful for context in low_confidence
- Each category can be empty but must exist in the JSON
- Keep reason explanations brief and specific, use keywords instead of full sentences 
- Focus on code files over documentation/configuration files unless explicitly relevant
- It is preferable to over-suggest files than to under-suggest them
- Suggesting a high number of files is acceptable if you are confident they are all relevant
"""
   }, {
       "role": "user",
       "content": f"""Repository files with summaries:\n{files_json}\n\nUser prompt:\n{request.prompt}\n\nProvide file suggestions in the specified JSON format."""
   }]

   try:
       logger.info(f"[{request_id}] Sending prompt to LLM for analysis")
       response = await handle_llm_interaction({
           "model": "gpt-4o-mini",
           "messages": messages,
           "temperature": 0.1
       })
       logger.debug(f"[{request_id}] Raw LLM response: {json.dumps(response, indent=2)}")

       try:
           suggestions = json.loads(response["response"])
           logger.debug(f"[{request_id}] Parsed suggestions: {json.dumps(suggestions, indent=2)}")
       except json.JSONDecodeError as e:
           logger.error(f"[{request_id}] Failed to parse LLM response as JSON: {str(e)}")
           logger.debug(f"[{request_id}] Invalid JSON was: {response['response']}")
           raise HTTPException(status_code=500, detail="Invalid JSON response from LLM")

       required_keys = {"high_confidence", "medium_confidence", "low_confidence"}
       if not all(key in suggestions for key in required_keys):
           logger.error(f"[{request_id}] Missing required keys in suggestions: {suggestions.keys()}")
           raise ValueError("Invalid response structure")

       all_files = context_map['files'].keys()
       for confidence in required_keys:
           for item in suggestions[confidence]:
               if item["file"] not in all_files:
                   logger.warning(f"[{request_id}] Removing non-existent file from {confidence}: {item['file']}")
                   suggestions[confidence].remove(item)

       result = {
           "suggestions": suggestions,
           "tokenCounts": response["tokenCounts"],
           "cost": response["cost"]
       }
       logger.info(f"[{request_id}] Analysis completed successfully")
       return result

   except Exception as e:
       logger.error(f"[{request_id}] Error during prompt analysis: {str(e)}")
       raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
   import uvicorn
   logger.info(f"Starting server on port {BACKEND_PORT}")
   uvicorn.run(app, host="0.0.0.0", port=BACKEND_PORT, log_level="debug", log_config=None)