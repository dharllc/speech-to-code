import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { 
  shouldSkipTokenCountForTree, 
  isBinaryFile,
  detectBinaryContent 
} from '@/lib/utils/fileFilters';

function approximateTokenCount(text: string): number {
  // Simple approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

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
        { error: 'File not found' },
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
    
    const skipTokenCount = shouldSkipTokenCountForTree(fullPath);
    
    // Check if it's a binary file
    if (isBinaryFile(fullPath)) {
      return NextResponse.json({
        content: '[Binary file]',
        token_count: 0,
        is_binary: true,
        skip_token_count: skipTokenCount,
        size: stats.size
      });
    }
    
    // Check file size (limit to 1MB for text files)
    const maxSize = 1024 * 1024; // 1MB
    if (stats.size > maxSize) {
      return NextResponse.json({
        content: '[File too large]',
        token_count: 0,
        is_too_large: true,
        skip_token_count: skipTokenCount,
        size: stats.size
      });
    }
    
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check if content is actually binary (like FastAPI backend)
      if (detectBinaryContent(content)) {
        return NextResponse.json({
          content: '[Binary file]',
          token_count: 0,
          is_binary: true,
          skip_token_count: skipTokenCount,
          size: stats.size
        });
      }
      
      // Only count tokens if we're not supposed to skip
      const tokenCount = skipTokenCount ? 0 : approximateTokenCount(content);
      
      return NextResponse.json({
        content,
        token_count: tokenCount,
        is_binary: false,
        skip_token_count: skipTokenCount,
        size: stats.size
      });
    } catch {
      // If reading as UTF-8 fails, it's likely a binary file
      return NextResponse.json({
        content: '[Binary file]',
        token_count: 0,
        is_binary: true,
        skip_token_count: skipTokenCount,
        size: stats.size
      });
    }
  } catch (error) {
    console.error('Error reading file:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}