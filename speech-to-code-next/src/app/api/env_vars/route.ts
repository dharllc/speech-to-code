import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Environment variables management endpoints
 * Matches the FastAPI /env_vars endpoints
 */

const ENV_FILE_PATH = path.join(process.cwd(), '../.env');

/**
 * Get current environment variables (GET /env_vars)
 */
export async function GET() {
  try {
    return NextResponse.json({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "",
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
      REPO_PATH: process.env.REPO_PATH || ""
    });
  } catch (error) {
    console.error('Error getting environment variables:', error);
    return NextResponse.json(
      { error: 'Failed to get environment variables' },
      { status: 500 }
    );
  }
}

/**
 * Update environment variable (POST /env_vars)
 * Expected body format: { "key": "value" } - single key-value pair
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the first (and should be only) key-value pair
    const entries = Object.entries(body);
    if (entries.length !== 1) {
      return NextResponse.json(
        { error: 'Request must contain exactly one key-value pair' },
        { status: 400 }
      );
    }
    
    const [key, value] = entries[0];
    
    // Validate that it's one of the allowed environment variables
    const allowedKeys = ['OPENAI_API_KEY', 'GOOGLE_API_KEY', 'ANTHROPIC_API_KEY', 'REPO_PATH'];
    if (!allowedKeys.includes(key)) {
      return NextResponse.json(
        { error: `Invalid environment variable key. Allowed keys: ${allowedKeys.join(', ')}` },
        { status: 400 }
      );
    }
    
    if (typeof value !== 'string') {
      return NextResponse.json(
        { error: 'Environment variable value must be a string' },
        { status: 400 }
      );
    }
    
    // Update the .env file
    await updateEnvFile(key, value);
    
    // Update the current process environment (for immediate effect)
    process.env[key] = value;
    
    return NextResponse.json({
      message: `${key} updated successfully`
    });
  } catch (error) {
    console.error('Error updating environment variable:', error);
    return NextResponse.json(
      { error: 'Failed to update environment variable' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to update the .env file
 */
async function updateEnvFile(key: string, value: string): Promise<void> {
  try {
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(ENV_FILE_PATH)) {
      envContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
    }
    
    // Split into lines
    const lines = envContent.split('\n');
    
    // Find if the key already exists
    let keyExists = false;
    const updatedLines = lines.map(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith(`${key}=`)) {
        keyExists = true;
        return `${key}="${value}"`;
      }
      return line;
    });
    
    // If key doesn't exist, add it
    if (!keyExists) {
      updatedLines.push(`${key}="${value}"`);
    }
    
    // Write back to file
    const newContent = updatedLines.join('\n');
    fs.writeFileSync(ENV_FILE_PATH, newContent, 'utf-8');
  } catch (error) {
    console.error('Error updating .env file:', error);
    throw new Error(`Failed to update .env file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}