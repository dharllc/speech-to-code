import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { 
  shouldExcludeDirectoryFromContext, 
  shouldIncludeInFileTypeStats, 
  getFileType 
} from '@/lib/utils/fileFilters';

interface FileTypeStats {
  [extension: string]: {
    count: number;
    totalSize: number;
  };
}

interface FileStatsResponse {
  repository: string;
  totalFiles: number;
  totalSize: number;
  fileTypes: FileTypeStats;
  lastUpdated: string;
}

function collectFileStats(dirPath: string, stats: FileTypeStats = {}): FileTypeStats {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Use centralized directory exclusion logic
        if (!shouldExcludeDirectoryFromContext(entry.name)) {
          collectFileStats(fullPath, stats);
        }
      } else {
        // Use centralized file inclusion logic for statistics
        if (shouldIncludeInFileTypeStats(fullPath)) {
          try {
            const fileStat = fs.statSync(fullPath);
            const fileType = getFileType(fullPath);
            
            if (!stats[fileType]) {
              stats[fileType] = { count: 0, totalSize: 0 };
            }
            
            stats[fileType].count++;
            stats[fileType].totalSize += fileStat.size;
          } catch (error) {
            // Skip files that can't be read
            console.warn(`Cannot read file stats for ${fullPath}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return stats;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repository = searchParams.get('repository');
    
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
    
    const fileTypeStats = collectFileStats(fullPath);
    
    // Calculate totals
    let totalFiles = 0;
    let totalSize = 0;
    
    for (const stats of Object.values(fileTypeStats)) {
      totalFiles += stats.count;
      totalSize += stats.totalSize;
    }
    
    const response: FileStatsResponse = {
      repository,
      totalFiles,
      totalSize,
      fileTypes: fileTypeStats,
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error collecting file statistics:', error);
    return NextResponse.json(
      { error: 'Failed to collect file statistics' },
      { status: 500 }
    );
  }
}