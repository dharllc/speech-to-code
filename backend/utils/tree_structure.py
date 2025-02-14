import os
import json

def should_skip_token_count(file_path):
    # List of specific files to skip
    skip_files = {'package-lock.json', 'yarn.lock', '.ds_store', 'thumbs.db',
                 'desktop.ini', '.gitignore', '.dockerignore'}
    
    # List of extensions to skip
    skip_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.webp', '.svg', '.mp4', '.webm',
                      '.mov', '.wav', '.mp3', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.tar',
                      '.gz', '.7z', '.rar', '.exe', '.dll', '.so', '.dylib', '.class', '.o', '.obj', '.map',
                      '.log', '.lock', '.pid', '.pyc', '.pyo'}
    
    filename = os.path.basename(file_path.lower())
    _, ext = os.path.splitext(filename)
    
    return filename in skip_files or ext in skip_extensions

def get_tree_structure(path, max_depth=10):
    excluded_dirs = {'node_modules', 'venv', '__pycache__', '.git', '.next'}

    def traverse(current_path, current_depth=0):
        if current_depth > max_depth:
            return None

        item_name = os.path.basename(current_path)
        if item_name in excluded_dirs:
            return None

        # Check if we should skip token counting before creating the node
        skip_token_count = should_skip_token_count(current_path)
        node = {
            "name": item_name,
            "type": "file",
            "item_count": 1,
            "token_count": 0,
            "path": os.path.relpath(current_path, path),
            "skip_token_count": skip_token_count
        }

        if os.path.isdir(current_path):
            node["type"] = "directory"
            node["children"] = []
            node["item_count"] = 0
            try:
                for child in sorted(os.listdir(current_path)):
                    child_path = os.path.join(current_path, child)
                    child_node = traverse(child_path, current_depth + 1)
                    if child_node:
                        node["children"].append(child_node)
                        node["item_count"] += child_node["item_count"]
            except Exception as e:
                print(f"Error accessing directory {current_path}: {str(e)}")

        return node

    tree = traverse(path)
    return json.dumps(tree)