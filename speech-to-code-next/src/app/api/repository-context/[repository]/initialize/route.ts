import { NextRequest, NextResponse } from 'next/server';
import { generateContextMap, saveContextMap } from '@/utils/contextMap';
import * as path from 'path';
import * as fs from 'fs';

const CONTEXT_MAPS_DIR = path.join(process.cwd(), 'context_maps');

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ repository: string }> }
) {
  try {
    const { repository } = await context.params;
    
    if (!repository) {
      return NextResponse.json(
        { error: 'Repository parameter is required' }, 
        { status: 400 }
      );
    }

    // Get REPO_PATH from environment variable
    const REPO_PATH = process.env.REPO_PATH;
    if (!REPO_PATH) {
      return NextResponse.json(
        { error: 'REPO_PATH environment variable not configured' },
        { status: 500 }
      );
    }

    const repoPath = path.join(REPO_PATH, repository);
    
    if (!fs.existsSync(repoPath)) {
      return NextResponse.json(
        { error: `Repository '${repository}' not found` },
        { status: 404 }
      );
    }

    // Generate and save context map
    const contextMap = generateContextMap(repoPath, repository);
    saveContextMap(contextMap, CONTEXT_MAPS_DIR);

    return NextResponse.json({
      message: 'Context map initialized successfully',
      repositoryId: repository
    });
  } catch (error) {
    console.error('Error initializing context map:', error);
    return NextResponse.json(
      { error: `Failed to initialize context map: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}