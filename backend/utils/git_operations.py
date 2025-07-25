import subprocess
import os
from typing import Optional, Dict
import re

def get_allowed_repositories(base_path: str) -> set:
    """
    Get a set of allowed repository names from the filesystem.
    This creates a whitelist of safe repository names.
    """
    try:
        if not os.path.exists(base_path):
            return set()
        
        allowed_repos = set()
        for item in os.listdir(base_path):
            item_path = os.path.join(base_path, item)
            if os.path.isdir(item_path):
                # Only include directories with safe names
                if re.match(r'^[a-zA-Z0-9._-]+$', item) and len(item) <= 100:
                    allowed_repos.add(item)
        
        return allowed_repos
    except (OSError, PermissionError):
        return set()

def validate_repository_name(repo_name: str, base_path: str) -> Optional[str]:
    """
    Validate repository name against whitelist of allowed repositories.
    Returns the validated name if safe, None otherwise.
    """
    if not repo_name or not isinstance(repo_name, str):
        return None
    
    # Check for basic safety
    if '..' in repo_name or '/' in repo_name or '\\' in repo_name:
        return None
    
    # Only allow safe characters
    if not re.match(r'^[a-zA-Z0-9._-]+$', repo_name) or len(repo_name) > 100:
        return None
    
    # Check against whitelist of existing repositories
    allowed_repos = get_allowed_repositories(base_path)
    if repo_name in allowed_repos:
        return repo_name
    
    return None

def get_safe_repository_path(base_path: str, repo_name: str) -> Optional[str]:
    """
    Get a safe repository path after validating the repository name.
    Only returns paths for whitelisted repositories.
    """
    # Validate repository name against whitelist
    validated_name = validate_repository_name(repo_name, base_path)
    if validated_name is None:
        return None
    
    # Construct path using only the validated name (not user input)
    safe_path = os.path.join(base_path, validated_name)
    
    # Additional safety check - ensure path exists and is a directory
    try:
        if os.path.exists(safe_path) and os.path.isdir(safe_path):
            return os.path.realpath(safe_path)
    except (OSError, ValueError):
        pass
    
    return None

def get_git_info(safe_repo_path: str) -> Dict[str, Optional[str]]:
    """
    Get git information for a repository using a pre-validated safe path.
    
    Args:
        safe_repo_path: Already validated and sanitized repository path
        
    Returns:
        Dict containing:
        - branch: Current branch name or None
        - commit_hash: Short commit hash or None
        - error: Error message if any operation failed
    """
    try:
        # Path is already validated by caller - check if it's a git repository
        git_dir = safe_repo_path + "/.git"
        if not os.path.isdir(git_dir):
            return {
                "branch": None,
                "commit_hash": None,
                "error": "Not a git repository"
            }
        
        # Get current branch name
        branch_result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=safe_repo_path,
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
                    cwd=safe_repo_path,
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
            cwd=safe_repo_path,
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