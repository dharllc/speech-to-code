from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from utils.tree_structure import get_tree_structure
import os
import tiktoken
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TokenRequest(BaseModel):
    text: str
    model: str = "gpt-3.5-turbo"

@app.post("/count_tokens")
async def count_tokens(request: TokenRequest):
    try:
        encoding = tiktoken.encoding_for_model(request.model)
        token_count = len(encoding.encode(request.text))
        return {"count": token_count}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Welcome to Speech-to-Code!"}

@app.get("/tree")
async def get_tree(repository: str = Query(..., description="The name of the repository")):
    if not repository:
        raise HTTPException(status_code=400, detail="Repository name is required")
    repository = os.path.basename(repository)
    base_path = f"/Users/sachindhar/Documents/GitHub/{repository}"
    if not os.path.exists(base_path):
        raise HTTPException(status_code=404, detail=f"Repository '{repository}' not found")
    tree = get_tree_structure(base_path)
    return {"tree": tree}

@app.get("/directories")
async def get_directories():
    base_path = "/Users/sachindhar/Documents/GitHub"
    try:
        directories = [d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d))]
        return {"directories": directories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)