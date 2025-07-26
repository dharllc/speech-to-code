export interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  path?: string;
  token_count?: number;
  total_token_count?: number;
  item_count?: number;
  children?: TreeNode[];
}

export interface FileType {
  count: number;
  files: TreeNode[];
}

export interface FileTypes {
  [extension: string]: FileType;
}

export interface WarningResult {
  warn: boolean;
  reason?: string;
  tokenWarning?: boolean;
  skipTokenCount?: boolean;
}

export interface RepositoryFileViewerProps {
  selectedRepository: string | null;
  onFileSelect: (file: TreeNode, isSelected: boolean) => void;
  selectedFiles: TreeNode[];
}

export type FolderSelectionState = 'none' | 'partial' | 'all';

export interface ExpandedFolders {
  [path: string]: boolean;
}