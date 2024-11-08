import React, { useState, useEffect } from 'react';
import PromptActions from './PromptActions';
import PromptTextArea from './PromptTextArea';
import TranscriptionDisplay from './TranscriptionDisplay';
import FileChip from './FileChip';
import FileSuggestions from './FileSuggestions';
import PromptAnalysisControls from './PromptAnalysisControls';
import { useFileContents, useTreeStructure, useTranscription, usePromptAnalysis } from '../hooks/promptComposerHooks';
import { FiLoader } from 'react-icons/fi';
import axios from 'axios';
import { API_URL } from '../config/api';

const PromptComposer = ({ selectedRepository, selectedFiles, onFileRemove, setUserPrompt, onFileSelectionChange }) => {
  const [basePrompt, setBasePrompt] = useState('');
  const [status, setStatus] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [addedBatches, setAddedBatches] = useState([]);
  const MIN_PROMPT_LENGTH = 25;

  const { fileContents } = useFileContents(selectedFiles, selectedRepository);
  const { treeStructure, isTreeAdded, treeTokenCount, addTreeStructure, removeTreeStructure } = useTreeStructure(selectedRepository);
  const { transcriptionHistory, enhanceTranscription, autoAddEnabled, setAutoAddEnabled, preferEnhanced, setPreferEnhanced, enhancementDisabled, setEnhancementDisabled } = useTranscription(setStatus);
  const { fileSuggestions, setFileSuggestions, isAnalyzing, isAutoAnalyzeEnabled, setIsAutoAnalyzeEnabled, analyzePrompt, lastPromptRef } = usePromptAnalysis(selectedRepository, MIN_PROMPT_LENGTH);

  useEffect(() => {
    if (isAutoAnalyzeEnabled && basePrompt.length >= MIN_PROMPT_LENGTH && !isAnalyzing && basePrompt !== lastPromptRef.current) {
      const timeoutId = setTimeout(() => analyzePrompt(basePrompt), 1000);
      lastPromptRef.current = basePrompt;
      return () => clearTimeout(timeoutId);
    }
  }, [basePrompt, isAutoAnalyzeEnabled, isAnalyzing, analyzePrompt, lastPromptRef]);

  const getFullPrompt = () => {
    const filesContent = Object.entries(fileContents)
      .map(([path, { content }]) => `File: ${path}\n\n${content}\n\n`)
      .join('');
    const treeContent = isTreeAdded ? `[Repository Structure for ${selectedRepository}]\n${treeStructure}\n\n` : '';
    return `${basePrompt}\n${treeContent}${filesContent}`.trim();
  };

  const clearAll = () => {
    setBasePrompt('');
    setHasUnsavedChanges(false);
    setFileSuggestions(null);
    selectedFiles.forEach(file => onFileRemove(file.path));
    setAddedBatches([]);
    lastPromptRef.current = '';
  };

  const addToPrompt = (text) => {
    if (!text) return;
    setBasePrompt(prev => prev ? `${prev}\n${text}` : text);
    setHasUnsavedChanges(true);
  };

  const handleBasePromptChange = (newPrompt) => {
    setBasePrompt(newPrompt);
    setHasUnsavedChanges(true);
  };

  const handleBatchAdd = (batchKey) => {
    if (!fileSuggestions || !fileSuggestions[batchKey]) return;
    fileSuggestions[batchKey].forEach(item => {
      if (!selectedFiles.some(file => file.path === item.file)) {
        onFileSelectionChange({ path: item.file }, true);
      }
    });
    setAddedBatches(prev => [...prev, batchKey]);
    setHasUnsavedChanges(true);
  };

  const handleBatchRemove = (batchKey) => {
    if (!fileSuggestions || !fileSuggestions[batchKey]) return;
    fileSuggestions[batchKey].forEach(item => {
      if (selectedFiles.some(file => file.path === item.file)) {
        onFileRemove(item.file);
      }
    });
    setAddedBatches(prev => prev.filter(key => key !== batchKey));
    setHasUnsavedChanges(true);
  };

  const getFileChips = () => selectedFiles.map(file => {
    if (file.type === 'directory') {
      return <FileChip key={file.path} fileName={file.path} tokenCount={file.token_count} onRemove={() => onFileRemove(file.path)} />;
    }
    const tokenCount = fileContents[file.path]?.tokenCount || 0;
    return <FileChip key={file.path} fileName={file.path} tokenCount={tokenCount} onRemove={() => onFileRemove(file.path)} />;
  });

  return (
    <div className="p-2">
      <h2 className="text-base font-bold mb-2">Prompt Composer</h2>
      <PromptActions
        addTreeStructure={addTreeStructure}
        clearPrompt={clearAll}
        setTranscription={text => text && enhanceTranscription(text, addToPrompt)}
        enhanceTranscription={enhanceTranscription}
        setStatus={setStatus}
        prompt={getFullPrompt()}
        setUserPrompt={prompt => {
          setUserPrompt(prompt);
          setHasUnsavedChanges(false);
        }}
      />
      <div className="mb-2">
        {isTreeAdded && <FileChip fileName="Repository Structure" tokenCount={treeTokenCount} onRemove={removeTreeStructure} />}
        {getFileChips()}
      </div>
      <PromptTextArea 
        prompt={basePrompt} 
        setPrompt={handleBasePromptChange}
        additionalTokenCount={treeTokenCount + selectedFiles.reduce((sum, file) => {
          if (file.type === 'directory') return sum + file.token_count.total;
          return sum + (fileContents[file.path]?.tokenCount || 0);
        }, 0)}
      />
      <PromptAnalysisControls
        promptLength={basePrompt.length}
        minLength={MIN_PROMPT_LENGTH}
        isAnalyzing={isAnalyzing}
        isAutoAnalyzeEnabled={isAutoAnalyzeEnabled}
        onToggleAutoAnalyze={() => setIsAutoAnalyzeEnabled(prev => !prev)}
        onManualAnalyze={() => analyzePrompt(basePrompt)}disabled={!selectedRepository}
        />
        {status && <div className="mb-1 text-xs text-gray-600">{status}</div>}
        {isAnalyzing && (
          <div className="flex items-center justify-center p-4 text-gray-500">
            <FiLoader className="animate-spin mr-2" />
          </div>
        )}
        {fileSuggestions && (
          <FileSuggestions
            suggestions={{
              high_confidence: fileSuggestions.high_confidence,
              medium_confidence: fileSuggestions.medium_confidence,
              low_confidence: fileSuggestions.low_confidence
            }}
            onBatchAdd={handleBatchAdd}
            onBatchRemove={handleBatchRemove}
            addedBatches={addedBatches}
          />
        )}
        <TranscriptionDisplay
          transcriptionHistory={transcriptionHistory}
          addToPrompt={addToPrompt}
          autoAddEnabled={autoAddEnabled}
          setAutoAddEnabled={setAutoAddEnabled}
          preferEnhanced={preferEnhanced}
          setPreferEnhanced={setPreferEnhanced}
          enhancementDisabled={enhancementDisabled}
          setEnhancementDisabled={setEnhancementDisabled}
        />
      </div>
    );
  };
  
  export default PromptComposer;