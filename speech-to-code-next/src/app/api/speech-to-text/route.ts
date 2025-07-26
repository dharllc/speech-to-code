import { NextRequest, NextResponse } from 'next/server';

interface TranscriptionResponse {
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get the form data from the request
    const formData = await request.formData();
    const audioFile = formData.get('file') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/mpeg'];
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `Unsupported audio format: ${audioFile.type}. Supported formats: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size (25MB limit for OpenAI Whisper)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Create form data for OpenAI API
    const openaiFormData = new FormData();
    openaiFormData.append('file', audioFile);
    openaiFormData.append('model', 'whisper-1');

    // Optional parameters that can be included if provided
    const language = formData.get('language');
    const prompt = formData.get('prompt');
    const temperature = formData.get('temperature');
    const response_format = formData.get('response_format') || 'json';

    if (language) openaiFormData.append('language', language as string);
    if (prompt) openaiFormData.append('prompt', prompt as string);
    if (temperature) openaiFormData.append('temperature', temperature as string);
    openaiFormData.append('response_format', response_format as string);

    // Call OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: openaiFormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Whisper API error:', errorText);
      return NextResponse.json(
        { error: `Speech-to-text service error: ${response.status}` },
        { status: 500 }
      );
    }

    const transcriptionResult: TranscriptionResponse = await response.json();
    
    return NextResponse.json({
      text: transcriptionResult.text,
      success: true
    });

  } catch (error) {
    console.error('Error in speech-to-text endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process speech-to-text request' },
      { status: 500 }
    );
  }
}