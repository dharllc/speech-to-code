import subprocess
import os
from typing import Optional, Dict
import re

def validate_repository_name(repo_name: str) -> bool:
    """
    Validate repository name to prevent path traversal attacks.
    Only allow alphanumeric characters, hyphens, underscores, and dots.
    """
    pattern = r'^[a-zA-Z0-9._-]+$'
    return bool(re.match(pattern, repo_name))

def get_git_info(repo_path: str) -> Dict[str, Optional[str]]:
    """
    Get git information for a repository.
    Returns dict with branch, commit_hash, and any errors.
    
    Args:
        repo_path: Absolute path to the repository
        
    Returns:
        Dict containing:
        - branch: Current branch name or None
        - commit_hash: Short commit hash or None
        - error: Error message if any operation failed
    """
    try:
        # Verify the path exists
        if not os.path.exists(repo_path):
            return {
                "branch": None,
                "commit_hash": None,
                "error": "Repository path does not exist"
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