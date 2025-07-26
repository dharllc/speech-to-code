import React from 'react';
import PromptComposer from './PromptComposer';
import RepositoryFileViewer from './RepositoryFileViewer';
import RepositorySelector from './RepositorySelector';
import type { SelectedFile } from '@/types/prompt';
import type { TreeNode } from '@/types/repository';

interface TwoColumnLayoutProps {
  selectedRepository: string | null;
  selectedFiles: SelectedFile[];
  onFileSelectionChange: (file: { path: string; type?: string }, isSelected: boolean) => void;
  onBatchFileSelection: (files: SelectedFile[]) => void;
  onClearAllFiles: () => void;
  onRepositorySelect: (repository: string | null) => void;
  setUserPrompt: (prompt: string) => void;
}

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ 
  selectedRepository, 
  selectedFiles, 
  onFileSelectionChange,
  onBatchFileSelection,
  onRepositorySelect,
  setUserPrompt 
}) => {

  const handleFileRemove = (filePath: string): void => {
    const fileToRemove = selectedFiles.find(f => f.path === filePath);
    if (fileToRemove && fileToRemove.type === 'directory' && fileToRemove.files) {
      fileToRemove.files.forEach(file => {
        onFileSelectionChange(file, false);
      });
    } else {
      onFileSelectionChange({ path: filePath }, false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left Column: PromptComposer */}
      <div className="h-[calc(100vh-8rem)] overflow-auto">
        <PromptComposer
          selectedRepository={selectedRepository}
          selectedFiles={selectedFiles}
          onFileRemove={handleFileRemove}
          onFileSelectionChange={onFileSelectionChange}
          onBatchFileSelection={onBatchFileSelection}
          setUserPrompt={setUserPrompt}
        />
      </div>

      {/* Right Column: Repository Browser */}
      <div className="h-[calc(100vh-8rem)] overflow-auto">
        <div className="mb-4">
          <RepositorySelector
            selectedRepository={selectedRepository}
            onSelect={onRepositorySelect}
          />
        </div>
        <RepositoryFileViewer
          selectedRepository={selectedRepository}
          selectedFiles={selectedFiles.map(file => ({
            name: file.path.split('/').pop() || '',
            type: file.type,
            path: file.path,
            ...(file.token_count !== undefined && { token_count: file.token_count })
          } as TreeNode))}
          onFileSelect={(file: TreeNode, isSelected: boolean) => {
            const selectedFile: SelectedFile = {
              path: file.path || '',
              type: file.type,
              ...(file.token_count !== undefined && { token_count: file.token_count })
            };
            onFileSelectionChange(selectedFile, isSelected);
          }}
        />
      </div>
    </div>
  );
};

export default TwoColumnLayout;