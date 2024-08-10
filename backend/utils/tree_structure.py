# backend/utils/tree_structure.py

import os
import json

def get_tree_structure(path, max_depth=4):
    excluded_dirs = {'node_modules', 'venv', '__pycache__', '.git'}

    def traverse(current_path, current_depth=0):
        if current_depth > max_depth:
            return None

        item_name = os.path.basename(current_path)
        if item_name in excluded_dirs:
            return None

        node = {"name": item_name, "type": "file"}

        if os.path.isdir(current_path):
            node["type"] = "directory"
            node["children"] = []
            try:
                for child in sorted(os.listdir(current_path)):
                    child_path = os.path.join(current_path, child)
                    child_node = traverse(child_path, current_depth + 1)
                    if child_node:
                        node["children"].append(child_node)
            except Exception as e:
                print(f"Error accessing directory {current_path}: {str(e)}")

        return node

    tree = traverse(path)
    return json.dumps(tree)