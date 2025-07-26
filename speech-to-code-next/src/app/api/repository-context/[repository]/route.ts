import { NextRequest, NextResponse } from 'next/server';
import { loadContextMap } from '@/utils/contextMap';
import * as path from 'path';

const CONTEXT_MAPS_DIR = path.join(process.cwd(), 'context_maps');

export async function GET(
  request: NextRequest,
  { params }: { params: { repository: string } }
) {
  try {
    const { repository } = params;
    
    if (!repository) {
      return NextResponse.json(
        { error: 'Repository parameter is required' }, 
        { status: 400 }
      );
    }

    const contextMap = loadContextMap(repository, CONTEXT_MAPS_DIR);
    
    if (!contextMap) {
      return NextResponse.json(
        { error: `Context map for repository '${repository}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(contextMap);
  } catch (error) {
    console.error('Error retrieving context map:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve context map' },
      { status: 500 }
    );
  }
}