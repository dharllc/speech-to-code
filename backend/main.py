from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from utils.tree_structure import get_tree_structure
import os, json, tiktoken
from dotenv import load_dotenv, set_key
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid
from llm_interaction import handle_llm_interaction, get_available_models
from utils.context_map import generate_context_map,save_context_map,load_context_map
import os.path as osp

# Load config first
try:
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(root_dir, 'config.json'), 'r') as f:
        config = json.load(f)
        BACKEND_PORT = config['backend']['port']
        FRONTEND_PORT = config['frontend']['port']
except Exception as e:
    raise RuntimeError(f"Failed to load config.json: {str(e)}")

# Load environment variables
load_dotenv()

REPO_PATH = os.getenv("REPO_PATH")
if REPO_PATH is None:
    raise ValueError("REPO_PATH environment variable is not set")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[f"http://localhost:{FRONTEND_PORT}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the directory of the current script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Define the path to system_prompts.json
SYSTEM_PROMPTS_FILE = os.path.join(SCRIPT_DIR, "system_prompts.json")
# Define the path to context maps
CONTEXT_MAPS_DIR = osp.join(SCRIPT_DIR,"context_maps")

# Ensure the system_prompts.json file exists
if not os.path.exists(SYSTEM_PROMPTS_FILE):
    with open(SYSTEM_PROMPTS_FILE, 'w') as f:
        json.dump([], f)

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
    with open(SYSTEM_PROMPTS_FILE, 'r') as f:
        return json.load(f)

def save_system_prompts(prompts):
    with open(SYSTEM_PROMPTS_FILE, 'w') as f:
        json.dump(prompts, f, indent=2)

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
    base_path = os.path.join(REPO_PATH, repository)
    print(f"Base path: {base_path}")
    if not os.path.exists(base_path):
        raise HTTPException(status_code=404, detail=f"Repository '{repository}' not found")
    tree = json.loads(get_tree_structure(base_path))
    update_token_counts(tree, base_path)
    print(f"Tree structure: {json.dumps(tree, indent=2)}")
    return {"tree": json.dumps(tree)}

@app.get("/directories")
async def get_directories():
    try:
        return {"directories": [d for d in os.listdir(REPO_PATH) if os.path.isdir(os.path.join(REPO_PATH, d))]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/file_content")
async def get_file_content(repository: str = Query(...), path: str = Query(...)):
    file_path = os.path.join(REPO_PATH, repository, path)
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
    full_path = os.path.join(REPO_PATH, repository, file_path)
    try:
        with open(full_path, 'r', encoding='utf-8', errors='ignore') as file:
            return {"line_count": sum(1 for _ in file)}
    except Exception as e:
        return {"error": str(e)}

def load_system_prompts():
    try:
        with open(SYSTEM_PROMPTS_FILE, 'r') as f:
            content = f.read().strip()
            if content:
                return json.loads(content)
            else:
                return []
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {SYSTEM_PROMPTS_FILE}. Resetting to empty list.")
        return []
    except FileNotFoundError:
        print(f"{SYSTEM_PROMPTS_FILE} not found. Creating new file.")
        save_system_prompts([])
        return []

def save_system_prompts(prompts):
    with open(SYSTEM_PROMPTS_FILE, 'w') as f:
        json.dump(prompts, f, indent=2)

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
        print(f"Error creating system prompt: {str(e)}")
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
    return await handle_llm_interaction(request)

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
    context_map = load_context_map(request.repository, CONTEXT_MAPS_DIR)
    if not context_map:
        raise HTTPException(status_code=404, detail=f"Context map for repository '{request.repository}' not found")

    files_json = json.dumps({k: v['summary'] for k, v in context_map['files'].items()}, indent=2)
    
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
- Put files you're very certain about in high_confidence
- Put files you think might be relevant in medium_confidence
- Put files that could potentially be useful for context in low_confidence
- Each category can be empty but must exist in the JSON
- Keep reason explanations brief and specific
- Focus on code files over documentation/configuration files unless explicitly relevant
- It is preferable to over-suggest files than to under-suggest them
"""
    }, {
        "role": "user",
        "content": f"""Repository files with summaries:
{files_json}

User prompt:
{request.prompt}

Provide file suggestions in the specified JSON format."""
    }]

    try:
        response = await handle_llm_interaction({
            # "model": "claude-3-5-sonnet-20241022",
            "model": "claude-3-haiku-20240307",
            "messages": messages,
            "temperature": 0.1
        })
        
        suggestions = json.loads(response["response"])
        
        # Validate response structure
        required_keys = {"high_confidence", "medium_confidence", "low_confidence"}
        if not all(key in suggestions for key in required_keys):
            raise ValueError("Invalid response structure")
            
        # Validate all files exist in context map
        all_files = context_map['files'].keys()
        for confidence in required_keys:
            for item in suggestions[confidence]:
                if item["file"] not in all_files:
                    suggestions[confidence].remove(item)
        
        return {
            "suggestions": suggestions,
            "tokenCounts": response["tokenCounts"],
            "cost": response["cost"]
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON response from LLM")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=BACKEND_PORT)