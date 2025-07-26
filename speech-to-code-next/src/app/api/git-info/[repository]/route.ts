import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

interface GitInfo {
  branch: string;
  commit: string;
  commit_message: string;
  is_dirty: boolean;
  repository: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ repository: string }> }
) {
  try {
    const { repository } = await params;
    
    if (!repository) {
      return NextResponse.json(
        { error: 'Repository parameter is required' },
        { status: 400 }
      );
    }
    
    const repoPath = process.env.REPO_PATH;
    if (!repoPath) {
      return NextResponse.json(
        { error: 'REPO_PATH environment variable not set' },
        { status: 500 }
      );
    }
    
    const fullPath = path.join(repoPath, repository);
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    if (!fs.existsSync(path.join(fullPath, '.git'))) {
      return NextResponse.json(
        { error: 'Not a git repository' },
        { status: 400 }
      );
    }
    
    try {
      // Get current branch
      const { stdout: branchOutput } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: fullPath
      });
      const branch = branchOutput.trim();
      
      // Get current commit hash
      const { stdout: commitOutput } = await execAsync('git rev-parse HEAD', {
        cwd: fullPath
      });
      const commit = commitOutput.trim();
      
      // Get commit message
      const { stdout: messageOutput } = await execAsync('git log -1 --pretty=%B', {
        cwd: fullPath
      });
      const commitMessage = messageOutput.trim();
      
      // Check if working directory is dirty
      const { stdout: statusOutput } = await execAsync('git status --porcelain', {
        cwd: fullPath
      });
      const isDirty = statusOutput.trim().length > 0;
      
      const gitInfo: GitInfo = {
        branch,
        commit: commit.substring(0, 8), // Short hash
        commit_message: commitMessage,
        is_dirty: isDirty,
        repository
      };
      
      return NextResponse.json(gitInfo);
    } catch (gitError) {
      console.error('Git command error:', gitError);
      return NextResponse.json(
        { error: 'Failed to get git information' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error getting git info:', error);
    return NextResponse.json(
      { error: 'Failed to get git information' },
      { status: 500 }
    );
  }
}