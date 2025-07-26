import { NextRequest, NextResponse } from 'next/server';

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface LLMResponse {
  response: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost?: {
    input_cost: number;
    output_cost: number;
    total_cost: number;
  };
}

// Model configurations and pricing
const MODEL_CONFIGS = {
  'gpt-4o': {
    provider: 'openai',
    input_cost_per_1k: 0.0025,
    output_cost_per_1k: 0.01
  },
  'gpt-4o-mini': {
    provider: 'openai',
    input_cost_per_1k: 0.00015,
    output_cost_per_1k: 0.0006
  },
  'claude-3-5-sonnet-20241022': {
    provider: 'anthropic',
    input_cost_per_1k: 0.003,
    output_cost_per_1k: 0.015
  },
  'claude-3-5-haiku-20241022': {
    provider: 'anthropic',
    input_cost_per_1k: 0.001,
    output_cost_per_1k: 0.005
  },
  'gemini-1.5-pro': {
    provider: 'google',
    input_cost_per_1k: 0.00125,
    output_cost_per_1k: 0.005
  },
  'gemini-1.5-flash': {
    provider: 'google',
    input_cost_per_1k: 0.000075,
    output_cost_per_1k: 0.0003
  }
};

function approximateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

function calculateCost(inputTokens: number, outputTokens: number, model: string) {
  const config = MODEL_CONFIGS[model as keyof typeof MODEL_CONFIGS];
  if (!config) return null;
  
  const inputCost = (inputTokens / 1000) * config.input_cost_per_1k;
  const outputCost = (outputTokens / 1000) * config.output_cost_per_1k;
  
  return {
    input_cost: inputCost,
    output_cost: outputCost,
    total_cost: inputCost + outputCost
  };
}

async function callOpenAI(messages: LLMMessage[], model: string, temperature: number, maxTokens: number) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  return response.json();
}

async function callAnthropic(messages: LLMMessage[], model: string, temperature: number, maxTokens: number) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  // Convert messages format for Anthropic
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      messages: conversationMessages,
      system: systemMessage,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  
  // Convert response format to match OpenAI structure
  return {
    choices: [{
      message: {
        content: data.content[0].text
      }
    }],
    usage: {
      prompt_tokens: data.usage.input_tokens,
      completion_tokens: data.usage.output_tokens,
      total_tokens: data.usage.input_tokens + data.usage.output_tokens
    }
  };
}

async function callGoogle(messages: LLMMessage[], model: string, temperature: number, maxTokens: number) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Google API key not configured');
  }

  // Convert messages format for Google
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API error: ${error}`);
  }

  const data = await response.json();
  
  // Approximate token usage for Google
  const fullText = messages.map(m => m.content).join(' ');
  const responseText = data.candidates[0].content.parts[0].text;
  const promptTokens = approximateTokenCount(fullText);
  const completionTokens = approximateTokenCount(responseText);
  
  // Convert response format to match OpenAI structure
  return {
    choices: [{
      message: {
        content: responseText
      }
    }],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: LLMRequest = await request.json();
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Messages field is required and must be an array' },
        { status: 400 }
      );
    }
    
    const model = body.model || 'gpt-4o-mini';
    const temperature = body.temperature ?? 0.7;
    const maxTokens = body.max_tokens || 1000;
    
    const config = MODEL_CONFIGS[model as keyof typeof MODEL_CONFIGS];
    if (!config) {
      return NextResponse.json(
        { error: `Unsupported model: ${model}` },
        { status: 400 }
      );
    }
    
    let apiResponse;
    
    try {
      switch (config.provider) {
        case 'openai':
          apiResponse = await callOpenAI(body.messages, model, temperature, maxTokens);
          break;
        case 'anthropic':
          apiResponse = await callAnthropic(body.messages, model, temperature, maxTokens);
          break;
        case 'google':
          apiResponse = await callGoogle(body.messages, model, temperature, maxTokens);
          break;
        default:
          throw new Error(`Unsupported provider: ${config.provider}`);
      }
    } catch (error) {
      console.error('LLM API error:', error);
      return NextResponse.json(
        { error: `LLM API error: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
    
    const responseText = apiResponse.choices[0].message.content;
    const usage = apiResponse.usage;
    const cost = usage ? calculateCost(usage.prompt_tokens, usage.completion_tokens, model) : null;
    
    const response: LLMResponse = {
      response: responseText,
      model,
      usage,
      cost: cost || undefined
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in LLM interaction:', error);
    return NextResponse.json(
      { error: 'Failed to process LLM interaction' },
      { status: 500 }
    );
  }
}