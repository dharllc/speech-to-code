# source venv/bin/activate
# uvicorn main:app --reload --log-level debug

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from utils.tree_structure import get_tree_structure
import os, json, tiktoken
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid
from llm_interaction import handle_llm_interaction, get_available_models

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the directory of the current script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Define the path to system_prompts.json
SYSTEM_PROMPTS_FILE = os.path.join(SCRIPT_DIR, "system_prompts.json")

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
            return float('inf')  # Put invalid steps at the end
    return sorted(prompts, key=safe_sort_key)

@app.post("/system_prompts", response_model=SystemPrompt)
async def create_system_prompt(prompt: SystemPromptCreate):
    try:
        prompts = load_system_prompts()
        
        # Ensure step is in the format "Step X" where X is a number
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
                step=p['step'],  # Keep the original step
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)