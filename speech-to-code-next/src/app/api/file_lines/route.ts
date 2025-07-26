import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Get line count for a specific file
 * Matches the FastAPI /file_lines endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repository = searchParams.get('repository');
    const filePath = searchParams.get('file_path');
    
    if (!repository || !filePath) {
      return NextResponse.json(
        { error: 'Repository and file_path parameters are required' },
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
    
    const fullPath = path.join(repoPath, repository, filePath);
    
    // Security check: ensure the path is within the repository
    const resolvedPath = path.resolve(fullPath);
    const resolvedRepoPath = path.resolve(path.join(repoPath, repository));
    
    if (!resolvedPath.startsWith(resolvedRepoPath)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: `File not found: ${filePath}` },
        { status: 404 }
      );
    }
    
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Path is a directory, not a file' },
        { status: 400 }
      );
    }
    
    try {
      // Count lines using a readable stream for better memory efficiency
      const content = fs.readFileSync(fullPath, { encoding: 'utf-8', flag: 'r' });
      
      // Count lines by splitting on newlines
      const lineCount = content.split('\n').length;
      
      return NextResponse.json({
        line_count: lineCount
      });
    } catch (error) {
      console.error('Error reading file for line count:', error);
      return NextResponse.json(
        { error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in file_lines endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}