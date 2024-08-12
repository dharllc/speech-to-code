from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from utils.tree_structure import get_tree_structure
from utils import prompt_manager
import os, json, tiktoken
from pydantic import BaseModel
import openai

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Set your OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

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

@app.post("/llm_completion")
async def llm_completion(request: CompletionRequest):
    try:
        full_prompt = f"{request.prompt}\n\nUser Input: {request.user_input}"
        response = openai.Completion.create(
            model=request.model,
            prompt=full_prompt,
            max_tokens=1000,
            n=1,
            stop=None,
            temperature=0.7,
        )
        return {"completion": response.choices[0].text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)