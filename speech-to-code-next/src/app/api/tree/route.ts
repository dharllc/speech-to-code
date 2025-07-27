import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { 
  shouldSkipTokenCountForTree, 
  shouldExcludeDirectoryFromTree,
  isBinaryFile,
  detectBinaryContent
} from '@/lib/utils/fileFilters';

interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
  size?: number;
  skip_token_count?: boolean;
  item_count?: number;
  token_count?: number;
  total_token_count?: number;
}

function approximateTokenCount(text: string): number {
  // Simple approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

function buildTree(dirPath: string, relativePath: string = '', currentDepth: number = 0, maxDepth: number = 10): TreeNode | null {
  try {
    // Respect depth limit like FastAPI backend
    if (currentDepth > maxDepth) {
      return null;
    }

    const stats = fs.statSync(dirPath);
    const name = path.basename(dirPath);
    
    if (stats.isDirectory()) {
      // Check if this directory should be excluded (like FastAPI backend)
      if (shouldExcludeDirectoryFromTree(name)) {
        return null;
      }
      
      const children: TreeNode[] = [];
      const entries = fs.readdirSync(dirPath);
      
      for (const entry of entries) {
        const childPath = path.join(dirPath, entry);
        const childRelativePath = path.join(relativePath, entry);
        const childNode = buildTree(childPath, childRelativePath, currentDepth + 1, maxDepth);
        
        if (childNode) {
          children.push(childNode);
        }
      }
      
      // Sort children: directories first, then files, both alphabetically
      children.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      
      // Calculate item count and token count recursively
      const itemCount = children.reduce((total, child) => {
        if (child.type === 'file') {
          return total + 1;
        } else {
          return total + (child.item_count || 0);
        }
      }, 0);
      
      const totalTokenCount = children.reduce((total, child) => {
        if (child.type === 'file') {
          return total + (child.token_count || 0);
        } else {
          return total + (child.total_token_count || 0);
        }
      }, 0);
      
      return {
        name,
        type: 'directory',
        children,
        item_count: itemCount,
        total_token_count: totalTokenCount
      };
    } else {
      // For files, include them and calculate token count
      const skipTokenCount = shouldSkipTokenCountForTree(dirPath);
      
      const fileNode: TreeNode = {
        name,
        type: 'file',
        size: stats.size
      };

      // Add skip_token_count flag if needed (matches FastAPI behavior)
      if (skipTokenCount) {
        fileNode.skip_token_count = true;
        fileNode.token_count = 0;
      } else {
        // Calculate token count for non-skipped files
        try {
          // Check if it's a binary file
          if (isBinaryFile(dirPath)) {
            fileNode.token_count = 0;
          } else {
            // Check file size (limit to 1MB for token counting)
            const maxSize = 1024 * 1024; // 1MB
            if (stats.size > maxSize) {
              fileNode.token_count = 0;
            } else {
              try {
                const content = fs.readFileSync(dirPath, 'utf-8');
                
                // Check if content is actually binary
                if (detectBinaryContent(content)) {
                  fileNode.token_count = 0;
                } else {
                  fileNode.token_count = approximateTokenCount(content);
                }
              } catch {
                // If reading as UTF-8 fails, it's likely a binary file
                fileNode.token_count = 0;
              }
            }
          }
        } catch (error) {
          console.error(`Error calculating token count for ${dirPath}:`, error);
          fileNode.token_count = 0;
        }
      }

      return fileNode;
    }
  } catch (error) {
    console.error(`Error processing ${dirPath}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repository = searchParams.get('repository');
    const maxDepthParam = searchParams.get('max_depth');
    
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

    // Allow configurable max depth like FastAPI backend (defaults to 10)
    const maxDepth = maxDepthParam ? parseInt(maxDepthParam, 10) : 10;
    
    const tree = buildTree(fullPath, '', 0, maxDepth);
    
    if (!tree) {
      return NextResponse.json(
        { error: 'Failed to build tree structure' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      tree: JSON.stringify(tree),
      repository 
    });
  } catch (error) {
    console.error('Error building tree:', error);
    return NextResponse.json(
      { error: 'Failed to build tree structure' },
      { status: 500 }
    );
  }
}