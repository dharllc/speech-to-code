from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from utils.screenshot import capture_screenshot
from utils.tree_structure import get_tree_structure
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Speech-to-Code!"}

@app.get("/screenshot")
async def get_screenshot(path: str = 'localhost'):
    screenshot = capture_screenshot(path)
    if screenshot:
        return {"screenshot": screenshot}
    else:
        raise HTTPException(status_code=500, detail="Failed to capture screenshot")

@app.get("/tree")
async def get_tree(repository: str = Query(..., description="The name of the repository")):
    if not repository:
        raise HTTPException(status_code=400, detail="Repository name is required")
    repository = os.path.basename(repository)  # Extract just the repository name if full path is provided
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