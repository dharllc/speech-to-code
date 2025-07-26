import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface SystemPrompt {
  id: string;
  name: string;
  prompt: string;
  stage: string;
  created_at: string;
  updated_at: string;
}

interface CreateSystemPromptRequest {
  name: string;
  prompt: string;
  stage: string;
}

// Simple file-based storage for system prompts
const PROMPTS_DIR = path.join(process.cwd(), 'data', 'system-prompts');

function ensureDataDir() {
  if (!fs.existsSync(PROMPTS_DIR)) {
    fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  }
}

function generateId(): string {
  return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getPromptFilePath(promptId: string): string {
  return path.join(PROMPTS_DIR, `${promptId}.json`);
}

function loadPrompt(promptId: string): SystemPrompt | null {
  try {
    const filePath = getPromptFilePath(promptId);
    if (!fs.existsSync(filePath)) return null;
    
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading prompt ${promptId}:`, error);
    return null;
  }
}

function savePrompt(prompt: SystemPrompt): void {
  try {
    ensureDataDir();
    const filePath = getPromptFilePath(prompt.id);
    fs.writeFileSync(filePath, JSON.stringify(prompt, null, 2));
  } catch (error) {
    console.error(`Error saving prompt ${prompt.id}:`, error);
    throw error;
  }
}

function listAllPrompts(): SystemPrompt[] {
  try {
    ensureDataDir();
    const files = fs.readdirSync(PROMPTS_DIR);
    const prompts: SystemPrompt[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const promptId = file.replace('.json', '');
        const prompt = loadPrompt(promptId);
        if (prompt) {
          prompts.push(prompt);
        }
      }
    }
    
    return prompts.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  } catch (error) {
    console.error('Error listing prompts:', error);
    return [];
  }
}

export async function GET() {
  try {
    const prompts = listAllPrompts();
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error getting system prompts:', error);
    return NextResponse.json(
      { error: 'Failed to get system prompts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSystemPromptRequest = await request.json();
    
    if (!body.name || !body.prompt || !body.stage) {
      return NextResponse.json(
        { error: 'Name, prompt, and stage are required' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    const prompt: SystemPrompt = {
      id: generateId(),
      name: body.name,
      prompt: body.prompt,
      stage: body.stage,
      created_at: now,
      updated_at: now
    };
    
    savePrompt(prompt);
    
    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error('Error creating system prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create system prompt' },
      { status: 500 }
    );
  }
}