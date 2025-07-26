import { NextResponse } from 'next/server';

/**
 * Health check endpoint - matches the FastAPI root endpoint
 * @returns Welcome message
 */
export async function GET() {
  return NextResponse.json({ 
    message: "Welcome to Speech-to-Code!" 
  });
}