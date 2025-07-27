import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { 
  shouldExcludeDirectoryFromContext, 
  shouldExcludeFromContext, 
  getFileType
} from '@/lib/utils/fileFilters';

interface AnalyzePromptRequest {
  prompt: string;
  repository: string;
  selected_files?: string[];
}

interface FileSuggestion {
  file_path: string;
  reason: string;
  confidence: number;
  file_type: string;
}

interface AnalyzePromptResponse {
  suggestions: FileSuggestion[];
  analysis: {
    keywords: string[];
    intent: string;
    complexity: 'low' | 'medium' | 'high';
  };
}


function extractKeywords(prompt: string): string[] {
  const keywords = prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));
  
  return [...new Set(keywords)].slice(0, 10);
}

function determineIntent(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('bug') || lowerPrompt.includes('fix') || lowerPrompt.includes('error')) {
    return 'debugging';
  }
  if (lowerPrompt.includes('add') || lowerPrompt.includes('create') || lowerPrompt.includes('implement')) {
    return 'feature_development';
  }
  if (lowerPrompt.includes('refactor') || lowerPrompt.includes('improve') || lowerPrompt.includes('optimize')) {
    return 'refactoring';
  }
  if (lowerPrompt.includes('test') || lowerPrompt.includes('spec')) {
    return 'testing';
  }
  if (lowerPrompt.includes('document') || lowerPrompt.includes('readme') || lowerPrompt.includes('comment')) {
    return 'documentation';
  }
  
  return 'general_inquiry';
}

function determineComplexity(prompt: string): 'low' | 'medium' | 'high' {
  const wordCount = prompt.split(/\s+/).length;
  const hasSpecificTerms = /\b(algorithm|architecture|performance|optimization|security|database|api|framework)\b/i.test(prompt);
  
  if (wordCount > 50 || hasSpecificTerms) return 'high';
  if (wordCount > 20) return 'medium';
  return 'low';
}

function getAllFiles(dirPath: string, relativeTo: string = dirPath): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(relativeTo, fullPath);
      
      if (entry.isDirectory()) {
        // Use centralized directory exclusion logic
        if (!shouldExcludeDirectoryFromContext(entry.name)) {
          files.push(...getAllFiles(fullPath, relativeTo));
        }
      } else {
        // Use centralized file exclusion logic
        if (!shouldExcludeFromContext(relativePath)) {
          files.push(relativePath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return files;
}

function scoreFileRelevance(filePath: string, keywords: string[], intent: string): { score: number; reason: string } {
  const fileName = path.basename(filePath).toLowerCase();
  const dirName = path.dirname(filePath).toLowerCase();
  const fileType = getFileType(filePath);
  
  let score = 0;
  const reasons: string[] = [];
  
  // Keyword matching
  for (const keyword of keywords) {
    if (fileName.includes(keyword)) {
      score += 3;
      reasons.push(`filename contains "${keyword}"`);
    } else if (dirName.includes(keyword)) {
      score += 2;
      reasons.push(`directory contains "${keyword}"`);
    }
  }
  
  // Intent-based scoring
  switch (intent) {
    case 'testing':
      if (fileName.includes('test') || fileName.includes('spec')) {
        score += 5;
        reasons.push('test file');
      }
      break;
    case 'documentation':
      if (fileType === 'documentation') {
        score += 5;
        reasons.push('documentation file');
      }
      break;
    case 'debugging':
      if (fileName.includes('error') || fileName.includes('log')) {
        score += 3;
        reasons.push('error/log file');
      }
      break;
  }
  
  // File type preferences based on centralized file type detection
  const normalizedFileType = getFileType(filePath);
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rust', 'swift', 'kotlin', 'scala', 'clojure', 'haskell', 'ocaml', 'vue', 'svelte', 'html', 'css', 'scss', 'sass', 'less'].includes(normalizedFileType)) {
    score += 1;
  } else if (['json', 'yml', 'yaml', 'toml', 'xml'].includes(normalizedFileType)) {
    score += 0.5;
  }
  
  const reason = reasons.length > 0 ? reasons.join(', ') : 'general relevance';
  
  return { score, reason };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzePromptRequest = await request.json();
    
    if (!body.prompt || !body.repository) {
      return NextResponse.json(
        { error: 'Prompt and repository are required' },
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
    
    const fullPath = path.join(repoPath, body.repository);
    
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    
    // Analyze the prompt
    const keywords = extractKeywords(body.prompt);
    const intent = determineIntent(body.prompt);
    const complexity = determineComplexity(body.prompt);
    
    // Get all files in the repository
    const allFiles = getAllFiles(fullPath);
    
    // Score and rank files
    const scoredFiles = allFiles
      .map(filePath => {
        const { score, reason } = scoreFileRelevance(filePath, keywords, intent);
        return {
          file_path: filePath,
          reason,
          confidence: Math.min(score / 10, 1), // Normalize to 0-1
          file_type: getFileType(filePath),
          score
        };
      })
      .filter(file => file.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Top 10 suggestions
      .map(({ score, ...file }) => { 
        void score; // Explicitly mark as used
        return file; 
      });
    
    const response: AnalyzePromptResponse = {
      suggestions: scoredFiles,
      analysis: {
        keywords,
        intent,
        complexity
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error analyzing prompt:', error);
    return NextResponse.json(
      { error: 'Failed to analyze prompt' },
      { status: 500 }
    );
  }
}