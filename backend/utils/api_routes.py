import os
import json
import subprocess
import ast
from fastapi import HTTPException, Query
from utils.tree_structure import get_tree_structure
from utils import prompt_manager
import logging
import tiktoken

logger = logging.getLogger(__name__)

BASE_PATH = "/Users/sachindhar/Documents/GitHub"

def count_tokens_for_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()
        encoding = tiktoken.encoding_for_model("gpt-3.5-turbo")
        return len(encoding.encode(content))
    except Exception as e:
        logger.error(f"Error counting tokens for {file_path}: {str(e)}")
        return 0

def update_token_counts(node, base_path):
    full_path = os.path.join(base_path, node['path'])
    if node['type'] == 'file':
        node['token_count'] = count_tokens_for_file(full_path)
    else:
        for child in node.get('children', []):
            update_token_counts(child, base_path)
        node['token_count'] = sum(child['token_count'] for child in node.get('children', []))

async def get_tree(repository: str):
    logger.info(f"Fetching tree for repository: {repository}")
    if not repository:
        raise HTTPException(status_code=400, detail="Repository name is required")
    base_path = os.path.join(BASE_PATH, repository)
    logger.info(f"Base path: {base_path}")
    if not os.path.exists(base_path):
        raise HTTPException(status_code=404, detail=f"Repository '{repository}' not found")
    tree = json.loads(get_tree_structure(base_path))
    update_token_counts(tree, base_path)
    logger.info(f"Tree structure: {json.dumps(tree, indent=2)}")
    return {"tree": json.dumps(tree)}

async def get_directories():
    try:
        return {"directories": [d for d in os.listdir(BASE_PATH) if os.path.isdir(os.path.join(BASE_PATH, d))]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_file_content(repository: str, path: str):
    file_path = os.path.join(BASE_PATH, repository, path)
    logger.info(f"Attempting to read file: {file_path}")
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail=f"File not found: {path}")
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()
        token_count = len(tiktoken.encoding_for_model("gpt-3.5-turbo").encode(content))
        logger.info(f"Successfully read file: {file_path}")
        return {"content": content, "token_count": token_count}
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def get_file_lines(repository: str, file_path: str):
    full_path = os.path.join(BASE_PATH, repository, file_path)
    try:
        with open(full_path, 'r', encoding='utf-8', errors='ignore') as file:
            return {"line_count": sum(1 for _ in file)}
    except Exception as e:
        return {"error": str(e)}

async def get_prompts():
    return prompt_manager.load_prompts()

async def create_prompt(prompt):
    return prompt_manager.add_prompt(prompt.category, prompt.content)

async def update_prompt(category: str, prompt_id: int, prompt):
    updated_prompt = prompt_manager.update_prompt(category, prompt_id, prompt.content)
    if updated_prompt:
        return updated_prompt
    raise HTTPException(status_code=404, detail="Prompt not found")

async def delete_prompt(category: str, prompt_id: int):
    prompt_manager.delete_prompt(category, prompt_id)
    return {"status": "success"}

async def set_default_prompt(category: str, prompt_id: int):
    success = prompt_manager.set_default_prompt(category, prompt_id)
    if success:
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Prompt not found")

async def file_modification(request):
    try:
        logger.info(f"Starting file modification for repository: {request.repository}")
        base_path = os.path.join(BASE_PATH, request.repository)
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

async def environment_management(request):
    try:
        logger.info(f"Starting environment management for repository: {request.repository}")
        base_path = os.path.join(BASE_PATH, request.repository)
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

async def light_verification(request):
    try:
        logger.info(f"Starting light verification for repository: {request.repository}")
        base_path = os.path.join(BASE_PATH, request.repository)
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