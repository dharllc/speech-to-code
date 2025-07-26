import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  repository?: string;
  conversation_count: number;
}

interface CreateChatSessionRequest {
  title: string;
  repository?: string;
}

// Simple file-based storage for chat sessions
const SESSIONS_DIR = path.join(process.cwd(), 'data', 'chat-sessions');

function ensureDataDir() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

function generateId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getSessionFilePath(sessionId: string): string {
  return path.join(SESSIONS_DIR, `${sessionId}.json`);
}

function loadSession(sessionId: string): ChatSession | null {
  try {
    const filePath = getSessionFilePath(sessionId);
    if (!fs.existsSync(filePath)) return null;
    
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading session ${sessionId}:`, error);
    return null;
  }
}

function saveSession(session: ChatSession): void {
  try {
    ensureDataDir();
    const filePath = getSessionFilePath(session.id);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
  } catch (error) {
    console.error(`Error saving session ${session.id}:`, error);
    throw error;
  }
}

function listAllSessions(): ChatSession[] {
  try {
    ensureDataDir();
    const files = fs.readdirSync(SESSIONS_DIR);
    const sessions: ChatSession[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const sessionId = file.replace('.json', '');
        const session = loadSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }
    }
    
    return sessions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  } catch (error) {
    console.error('Error listing sessions:', error);
    return [];
  }
}

export async function GET() {
  try {
    const sessions = listAllSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error getting chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to get chat sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateChatSessionRequest = await request.json();
    
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    const session: ChatSession = {
      id: generateId(),
      title: body.title,
      created_at: now,
      updated_at: now,
      is_active: true,
      repository: body.repository,
      conversation_count: 0
    };
    
    saveSession(session);
    
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}