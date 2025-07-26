import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const repoPath = process.env.REPO_PATH;
    
    if (!repoPath) {
      return NextResponse.json(
        { error: 'REPO_PATH environment variable not set' },
        { status: 500 }
      );
    }

    if (!fs.existsSync(repoPath)) {
      return NextResponse.json(
        { error: 'Repository path does not exist' },
        { status: 404 }
      );
    }

    const entries = fs.readdirSync(repoPath, { withFileTypes: true });
    const directories = entries
      .filter(entry => entry.isDirectory())
      .filter(entry => !entry.name.startsWith('.'))
      .map(entry => entry.name)
      .sort();

    return NextResponse.json({ directories });
  } catch (error) {
    console.error('Error listing directories:', error);
    return NextResponse.json(
      { error: 'Failed to list directories' },
      { status: 500 }
    );
  }
}