import subprocess
import os
from typing import Optional, Dict
import re

def validate_repository_name(repo_name: str) -> bool:
    """
    Simple validation for repository names in a local development environment.
    Prevents basic directory traversal while keeping it straightforward.
    """
    if not repo_name or not isinstance(repo_name, str):
        return False
    
    # Prevent directory traversal and keep names reasonable
    if '..' in repo_name or '/' in repo_name or '\\' in repo_name:
        return False
    
    # Allow reasonable repository name characters
    pattern = r'^[a-zA-Z0-9._-]+$'
    return bool(re.match(pattern, repo_name)) and len(repo_name) <= 100

def get_git_info(repo_path: str) -> Dict[str, Optional[str]]:
    """
    Get git information for a repository.
    
    Args:
        repo_path: Path to the repository directory
        
    Returns:
        Dict containing:
        - branch: Current branch name or None
        - commit_hash: Short commit hash or None
        - error: Error message if any operation failed
    """
    try:
        # Check if directory exists
        if not os.path.exists(repo_path) or not os.path.isdir(repo_path):
            return {
                "branch": None,
                "commit_hash": None,
                "error": "Repository directory not found"
            }
            
        # Check if it's a git repository
        git_dir = os.path.join(repo_path, '.git')
        if not os.path.exists(git_dir):
            return {
                "branch": None,
                "commit_hash": None,
                "error": "Not a git repository"
            }
        
        # Get current branch name
        branch_result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=repo_path,
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
                    cwd=repo_path,
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if commit_result.returncode == 0:
                    return {
                        "branch": "(detached HEAD)",
                        "commit_hash": commit_result.stdout.strip(),
                        "error": None
                    }
            
            return {
                "branch": None,
                "commit_hash": None,
                "error": "Failed to get branch information"
            }
        
        branch = branch_result.stdout.strip()
        
        # Get current commit hash (short version)
        commit_result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=repo_path,
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