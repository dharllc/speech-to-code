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

interface UpdateChatSessionRequest {
  title?: string;
  repository?: string;
  is_active?: boolean;
}

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'chat-sessions');

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
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
    const filePath = getSessionFilePath(session.id);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
  } catch (error) {
    console.error(`Error saving session ${session.id}:`, error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = loadSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error getting chat session:', error);
    return NextResponse.json(
      { error: 'Failed to get chat session' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body: UpdateChatSessionRequest = await request.json();
    
    const session = loadSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Update fields
    if (body.title !== undefined) session.title = body.title;
    if (body.repository !== undefined) session.repository = body.repository;
    if (body.is_active !== undefined) session.is_active = body.is_active;
    
    session.updated_at = new Date().toISOString();
    
    saveSession(session);
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = loadSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Soft delete by setting is_active to false
    session.is_active = false;
    session.updated_at = new Date().toISOString();
    
    saveSession(session);
    
    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}