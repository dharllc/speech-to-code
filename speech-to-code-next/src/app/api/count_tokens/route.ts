import { NextRequest, NextResponse } from 'next/server';

interface TokenRequest {
  text: string;
}

function approximateTokenCount(text: string): number {
  // Simple approximation: ~4 characters per token
  // This matches the Python backend implementation
  return Math.ceil(text.length / 4);
}

export async function POST(request: NextRequest) {
  try {
    const body: TokenRequest = await request.json();
    
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'Text field is required and must be a string' },
        { status: 400 }
      );
    }
    
    const tokenCount = approximateTokenCount(body.text);
    
    return NextResponse.json({
      count: tokenCount,
      character_count: body.text.length
    });
  } catch (error) {
    console.error('Error counting tokens:', error);
    return NextResponse.json(
      { error: 'Failed to count tokens' },
      { status: 500 }
    );
  }
}