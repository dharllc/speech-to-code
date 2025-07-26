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

interface UpdateSystemPromptRequest {
  name?: string;
  prompt?: string;
  stage?: string;
}

const PROMPTS_DIR = path.join(process.cwd(), 'data', 'system-prompts');

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
    if (!fs.existsSync(PROMPTS_DIR)) {
      fs.mkdirSync(PROMPTS_DIR, { recursive: true });
    }
    const filePath = getPromptFilePath(prompt.id);
    fs.writeFileSync(filePath, JSON.stringify(prompt, null, 2));
  } catch (error) {
    console.error(`Error saving prompt ${prompt.id}:`, error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;
    const prompt = loadPrompt(promptId);
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'System prompt not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Error getting system prompt:', error);
    return NextResponse.json(
      { error: 'Failed to get system prompt' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;
    const body: UpdateSystemPromptRequest = await request.json();
    
    const prompt = loadPrompt(promptId);
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'System prompt not found' },
        { status: 404 }
      );
    }
    
    // Update fields
    if (body.name !== undefined) prompt.name = body.name;
    if (body.prompt !== undefined) prompt.prompt = body.prompt;
    if (body.stage !== undefined) prompt.stage = body.stage;
    
    prompt.updated_at = new Date().toISOString();
    
    savePrompt(prompt);
    
    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Error updating system prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update system prompt' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const { promptId } = await params;
    const prompt = loadPrompt(promptId);
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'System prompt not found' },
        { status: 404 }
      );
    }
    
    // Delete the file
    const filePath = getPromptFilePath(promptId);
    fs.unlinkSync(filePath);
    
    return NextResponse.json({ message: 'System prompt deleted successfully' });
  } catch (error) {
    console.error('Error deleting system prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete system prompt' },
      { status: 500 }
    );
  }
}