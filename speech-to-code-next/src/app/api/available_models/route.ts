import { NextResponse } from 'next/server';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_window: number;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  supports_tools: boolean;
  supports_vision: boolean;
  description: string;
}

const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    context_window: 128000,
    input_cost_per_1k: 0.0025,
    output_cost_per_1k: 0.01,
    supports_tools: true,
    supports_vision: true,
    description: 'Most capable OpenAI model, great for complex reasoning'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    context_window: 128000,
    input_cost_per_1k: 0.00015,
    output_cost_per_1k: 0.0006,
    supports_tools: true,
    supports_vision: true,
    description: 'Fast and cost-effective model for most tasks'
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    context_window: 200000,
    input_cost_per_1k: 0.003,
    output_cost_per_1k: 0.015,
    supports_tools: true,
    supports_vision: true,
    description: 'Best Claude model for coding and complex analysis'
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    context_window: 200000,
    input_cost_per_1k: 0.001,
    output_cost_per_1k: 0.005,
    supports_tools: true,
    supports_vision: false,
    description: 'Fast and efficient Claude model for quick tasks'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    context_window: 2000000,
    input_cost_per_1k: 0.00125,
    output_cost_per_1k: 0.005,
    supports_tools: true,
    supports_vision: true,
    description: 'Powerful Google model with massive context window'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    context_window: 1000000,
    input_cost_per_1k: 0.000075,
    output_cost_per_1k: 0.0003,
    supports_tools: true,
    supports_vision: true,
    description: 'Fast and cost-effective Google model'
  }
];

export async function GET() {
  try {
    // Check which API keys are available
    const hasOpenAI = !!process.env.REACT_APP_OPENAI_API_KEY;
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasGoogle = !!process.env.GOOGLE_API_KEY;
    
    // Filter models based on available API keys
    const availableModels = AVAILABLE_MODELS.filter(model => {
      switch (model.provider) {
        case 'OpenAI':
          return hasOpenAI;
        case 'Anthropic':
          return hasAnthropic;
        case 'Google':
          return hasGoogle;
        default:
          return false;
      }
    });
    
    return NextResponse.json({
      models: availableModels,
      api_keys_configured: {
        openai: hasOpenAI,
        anthropic: hasAnthropic,
        google: hasGoogle
      }
    });
  } catch (error) {
    console.error('Error getting available models:', error);
    return NextResponse.json(
      { error: 'Failed to get available models' },
      { status: 500 }
    );
  }
}