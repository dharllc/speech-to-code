import type { LLMMessage } from './api';

export interface LLMInteractionProps {
  initialPrompt?: string;
}

export interface StageData {
  // Stage 1
  clarityScore?: number;
  fileRequests?: FileRequest[];
  questions?: string[];
  summary?: string;
  
  // Stage 2
  feasibilityScore?: number;
  additionalFileRequests?: FileRequest[];
  technicalQuestions?: string[];
  implementationPlan?: ImplementationPlan;
  
  // Stage 3
  instructionQuality?: number;
  instructions?: Instructions;
  safetyChecks?: SafetyCheck[];
  refinementSuggestions?: string[];
}

export interface FileRequest {
  file: string;
  reason: string;
}

export interface ImplementationPlan {
  changes: FileChange[];
}

export interface FileChange {
  file: string;
  changes: string;
}

export interface Instructions {
  steps: InstructionStep[];
}

export interface InstructionStep {
  file: string;
  instructions: string;
}

export interface SafetyCheck {
  safe: boolean;
  concerns: string[];
}

export interface TokenCounts {
  input: number;
  output: number;
}

export interface ConversationEntry extends LLMMessage {
  timestamp?: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelDetails {
  id: string;
  name: string;
  provider: string;
  max_tokens?: number;
  description?: string;
}

export interface AvailableModels {
  [provider: string]: ModelDetails[];
}