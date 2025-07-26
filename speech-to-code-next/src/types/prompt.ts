export interface FileContent {
  content: string;
  tokenCount: number;
  isBinary: boolean;
}

export interface TranscriptionItem {
  timestamp: string;
  raw: string;
  enhanced: string;
}

export interface FileSuggestion {
  file: string;
  relevance: number;
  reason?: string;
}

export interface FileSuggestionResponse {
  suggestions: {
    high_confidence: FileSuggestion[];
    medium_confidence: FileSuggestion[];
    low_confidence: FileSuggestion[];
  };
}

export interface TreeNode {
  name: string;
  children?: TreeNode[];
}

export interface SelectedFile {
  path: string;
  type: 'file' | 'directory';
  files?: { path: string; type: 'file'; token_count?: number }[];
  token_count?: { total: number } | number;
}

export interface PromptComposerProps {
  selectedRepository: string | null;
  selectedFiles: SelectedFile[];
  onFileRemove: (filePath: string) => void;
  setUserPrompt: (prompt: string) => void;
  onFileSelectionChange: (file: { path: string; type?: string }, add: boolean) => void;
  onBatchFileSelection: (files: SelectedFile[]) => void;
}

export interface FileContentResponse {
  content: string;
  token_count: number;
  is_binary: boolean;
}

export interface TreeResponse {
  tree: string;
}

export interface TokenCountResponse {
  count: number;
}