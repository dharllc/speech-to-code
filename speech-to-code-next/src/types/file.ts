export interface FileItem {
  path: string;
  type: 'file' | 'directory';
  files?: FileItem[];
}

export interface CombinationFile {
  path: string;
  type: 'file' | 'directory';
  files?: { path: string }[];
}

export interface FileCombination {
  id: number;
  timestamp: string;
  repository: string;
  files: CombinationFile[];
  totalTokens: number;
}

export interface UseFileCombinationsReturn {
  combinations: FileCombination[];
  addCombination: (files: FileItem[], totalTokens: number) => void;
  removeCombination: (combinationId: number) => void;
  clearCombinations: () => void;
}