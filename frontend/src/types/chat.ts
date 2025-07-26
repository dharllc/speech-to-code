// Chat Session Types
export interface ChatSession {
  id: string;
  title: string;
  conversation_history: ConversationEntry[];
  stage_history?: StageHistoryEntry[];
  included_files?: string[];
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ConversationEntry {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  model?: string;
  tokenCount?: number;
}

export interface StageHistoryEntry {
  stage: 'stage1-understand-validate' | 'stage2-plan-validate' | 'stage3-agent-instructions';
  timestamp: string;
  clarityScore?: number;
  feasibilityScore?: number;
  instructionQuality?: number;
  summary?: {
    understanding?: string;
    questions?: string[];
  };
  implementationPlan?: {
    summary?: string;
    steps?: string[];
  };
  instructions?: {
    objective?: string;
    details?: string[];
  };
}

// System Prompt Types
export interface SystemPrompt {
  id: string;
  name: string;
  step: string;
  content: string;
  is_default: boolean;
  token_count: number;
  timestamp: string;
}

export interface SystemPromptFormData {
  name: string;
  step: string;
  content: string;
  is_default: boolean;
}