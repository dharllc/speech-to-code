import subprocess
import os
from typing import Optional, Dict
import re

def validate_repository_name(repo_name: str) -> bool:
    """
    Validate repository name to prevent path traversal attacks.
    Only allow alphanumeric characters, hyphens, underscores, and dots.
    """
    if not repo_name or not isinstance(repo_name, str):
        return False
    
    # Check for path traversal attempts
    if '..' in repo_name or '/' in repo_name or '\\' in repo_name:
        return False
    
    # Only allow safe characters
    pattern = r'^[a-zA-Z0-9._-]+$'
    return bool(re.match(pattern, repo_name)) and len(repo_name) <= 100

def validate_secure_path(base_path: str, user_input: str) -> Optional[str]:
    """
    Securely validate and construct a path within the base directory.
    Returns the resolved path if safe, None if potentially dangerous.
    """
    try:
        # Normalize the base path
        base_path = os.path.realpath(base_path)
        
        # Construct the requested path
        requested_path = os.path.join(base_path, user_input)
        
        # Resolve any symlinks and relative paths
        resolved_path = os.path.realpath(requested_path)
        
        # Ensure the resolved path is within the base directory
        if not resolved_path.startswith(base_path + os.sep) and resolved_path != base_path:
            return None
            
        return resolved_path
    except (OSError, ValueError):
        return None

def get_git_info(repo_path: str) -> Dict[str, Optional[str]]:
    """
    Get git information for a repository.
    Returns dict with branch, commit_hash, and any errors.
    
    Args:
        repo_path: Validated absolute path to the repository
        
    Returns:
        Dict containing:
        - branch: Current branch name or None
        - commit_hash: Short commit hash or None
        - error: Error message if any operation failed
    """
    try:
        # Validate the path is safe (should already be validated by caller)
        resolved_path = os.path.realpath(repo_path)
        
        # Verify the path exists
        if not os.path.exists(resolved_path):
            return {
                "branch": None,
                "commit_hash": None,
                "error": "Repository not found"
            }
            
        # Check if it's a git repository
        git_dir = os.path.join(resolved_path, '.git')
        if not os.path.exists(git_dir):
            return {
                "branch": None,
                "commit_hash": None,
                "error": "Not a git repository"
            }
        
        # Get current branch name
        branch_result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=resolved_path,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if branch_result.returncode != 0:
            # Handle detached HEAD state
            if "HEAD" in branch_result.stderr or branch_result.stdout.strip() == "HEAD":
                # Try to get commit hash for detached HEAD
                commit_result = subprocess.run(
                    ["git", "rev-parse", "--short", "HEAD"],
                    cwd=resolved_path,
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if commit_result.returncode == 0:
                    return {
                        "branch": f"(detached HEAD)",
                        "commit_hash": commit_result.stdout.strip(),
                        "error": None
                    }
            
            return {
                "branch": None,
                "commit_hash": None,
                "error": f"Failed to get branch: {branch_result.stderr.strip()}"
            }
        
        branch = branch_result.stdout.strip()
        
        # Get current commit hash (short version)
        commit_result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=resolved_path,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        commit_hash = None
        if commit_result.returncode == 0:
            commit_hash = commit_result.stdout.strip()
        
        return {
            "branch": branch,
            "commit_hash": commit_hash,
            "error": None
        }
        
    except subprocess.TimeoutExpired:
        return {
            "branch": None,
            "commit_hash": None,
            "error": "Git command timed out"
        }
    except FileNotFoundError:
        return {
            "branch": None,
            "commit_hash": None,
            "error": "Git is not installed or not in PATH"
        }
    except Exception as e:
        return {
            "branch": None,
            "commit_hash": None,
            "error": f"Unexpected error: {str(e)}"
        }