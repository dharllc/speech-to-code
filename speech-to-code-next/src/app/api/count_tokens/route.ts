import { NextRequest, NextResponse } from 'next/server';

interface TokenRequest {
  text: string;
  model?: string; // Optional field for compatibility
}

function approximateTokenCount(text: string): number {
  // Simple approximation: ~4 characters per token
  // This matches the Python backend implementation
  return Math.ceil(text.length / 4);
}

export async function POST(request: NextRequest) {
  try {
    const body: TokenRequest = await request.json();
    
    if (typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'Text field is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Allow empty strings - they just have 0 tokens
    const text = body.text || '';
    
    const tokenCount = approximateTokenCount(text);
    
    return NextResponse.json({
      count: tokenCount,
      character_count: text.length
    });
  } catch (error) {
    console.error('Error counting tokens:', error);
    return NextResponse.json(
      { error: 'Failed to count tokens' },
      { status: 500 }
    );
  }
}