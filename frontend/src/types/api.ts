import type { FileSuggestionResponse } from './prompt';

// LLM Types
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequestPayload {
  messages: LLMMessage[];
  temperature: number;
  model: string;
}

export interface LLMResponse {
  response: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  tokenCounts?: {
    input: number;
    output: number;
  };
  cost?: number;
}

// Model Types
export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
  max_tokens?: number;
  description?: string;
}

export interface AvailableModelsResponse {
  models: AvailableModel[];
}

// File Analysis Types
export interface AnalyzePromptPayload {
  repository: string;
  prompt: string;
}

export interface FileInfo {
  file_path: string;
  content?: string;
  line_numbers?: number[];
  relevance_score?: number;
}

export interface AnalyzePromptResponse extends FileSuggestionResponse {
  files: FileInfo[];
  analysis?: string;
}

// Chat Session Types
export interface ChatSession {
  id: string;
  title: string;
  messages: LLMMessage[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ChatSessionData {
  title?: string;
  messages?: LLMMessage[];
  updated_at?: string;
  deleted_at?: string;
  metadata?: Record<string, unknown>;
}

// Error Response Type
export interface APIError {
  message: string;
  code?: string;
  details?: unknown;
}