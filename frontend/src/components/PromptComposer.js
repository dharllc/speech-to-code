// File: frontend/src/components/PromptComposer.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { FiLoader, FiFile, FiFolder } from 'react-icons/fi';
import PromptActions from './PromptActions';
import PromptTextArea from './PromptTextArea';
import TranscriptionDisplay from './TranscriptionDisplay';
import FileChip from './FileChip';
import { analyzePromptForFiles } from '../services/llmService';
import FileSuggestions from './FileSuggestions';
import PromptPreview from './PromptPreview';
import { API_URL } from '../config/api';
import { useFileCombinations } from '../hooks/useFileCombinations';
import FileCombinations from './FileCombinations';
import PromptSettings from './PromptSettings';

// Import shadcn-style components
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";

const PromptComposer = ({ selectedRepository, selectedFiles, onFileRemove, setUserPrompt, onFileSelectionChange, onBatchFileSelection }) => {
  const [basePrompt, setBasePrompt] = useState('');
  const [fileContents, setFileContents] = useState({});
  const [transcriptionHistory, setTranscriptionHistory] = useState([]);
  const [status, setStatus] = useState('');
  const [treeStructure, setTreeStructure] = useState('');
  const [isTreeAdded, setIsTreeAdded] = useState(false);
  const [treeTokenCount, setTreeTokenCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [fileSuggestions, setFileSuggestions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutoAnalyzeEnabled, setIsAutoAnalyzeEnabled] = useState(() => 
    JSON.parse(localStorage.getItem('autoAnalyzeEnabled') || 'false')
  );
  const [addedBatches, setAddedBatches] = useState([]);
  const [autoAddEnabled, setAutoAddEnabled] = useState(() => 
    JSON.parse(localStorage.getItem('autoAddEnabled') || 'false')
  );
  const [enhancementDisabled, setEnhancementDisabled] = useState(() => 
    JSON.parse(localStorage.getItem('enhancementDisabled') || 'false')
  );
  const [isAutoCopyEnabled, setIsAutoCopyEnabled] = useState(() => 
    JSON.parse(localStorage.getItem('autoCopyEnabled') || 'false')
  );

  const MIN_PROMPT_LENGTH = 20;
  const lastPromptRef = useRef(basePrompt);
  const treeOperationRef = useRef(false);
  const lastCopiedPromptRef = useRef('');

  // Toggle to show/hide extra file chips
  const [showAllFiles, setShowAllFiles] = useState(false);
  const MAX_VISIBLE_FILE_CHIPS = 5;

  const {
    combinations,
    addCombination,
    removeCombination,
    clearCombinations
  } = useFileCombinations(selectedRepository);

  // Persist toggles to local storage
  useEffect(() => {
    localStorage.setItem('autoAnalyzeEnabled', JSON.stringify(isAutoAnalyzeEnabled));
    localStorage.setItem('autoCopyEnabled', JSON.stringify(isAutoCopyEnabled));
  }, [isAutoAnalyzeEnabled, isAutoCopyEnabled]);

  useEffect(() => {
    localStorage.setItem('autoAddEnabled', JSON.stringify(autoAddEnabled));
    localStorage.setItem('enhancementDisabled', JSON.stringify(enhancementDisabled));
  }, [autoAddEnabled, enhancementDisabled]);

  // Fetch tree structure whenever repository changes
  useEffect(() => {
    if (selectedRepository) {
      fetchTreeStructure(selectedRepository);
    }
  }, [selectedRepository]);

  // ======================
  //       ANALYSIS
  // ======================
  const analyzePrompt = useCallback(
    async (prompt) => {
      if (prompt.length < MIN_PROMPT_LENGTH || !selectedRepository || isAnalyzing) return;
      setIsAnalyzing(true);
      setStatus('Analyzing prompt for relevant files...');
      try {
        const response = await analyzePromptForFiles(selectedRepository, prompt);
        setFileSuggestions(response.suggestions);
      } catch (error) {
        console.error('Error getting file suggestions:', error);
        setStatus('Error analyzing prompt');
      } finally {
        setIsAnalyzing(false);
        setStatus('');
      }
    },
    [selectedRepository, isAnalyzing]
  );

  useEffect(() => {
    if (
      isAutoAnalyzeEnabled &&
      basePrompt.length >= MIN_PROMPT_LENGTH &&
      !isAnalyzing &&
      basePrompt !== lastPromptRef.current
    ) {
      const timeoutId = setTimeout(() => analyzePrompt(basePrompt), 1000);
      lastPromptRef.current = basePrompt;
      return () => clearTimeout(timeoutId);
    }
  }, [basePrompt, isAutoAnalyzeEnabled, isAnalyzing, analyzePrompt]);

  // ======================
  //  FILE CONTENT FETCH
  // ======================
  const fetchFileContents = async () => {
    const newContents = { ...fileContents };

    // Remove any old file paths no longer selected
    Object.keys(newContents).forEach(path => {
      const stillSelected = selectedFiles.some(file => {
        if (file.type === 'directory') {
          return file.files.some(f => f.path === path);
        }
        return file.path === path;
      });
      if (!stillSelected) {
        delete newContents[path];
      }
    });

    // Fetch content for newly added files
    for (const file of selectedFiles) {
      if (file.type === 'directory') {
        for (const subFile of file.files) {
          if (!newContents[subFile.path]) {
            try {
              const response = await axios.get(`${API_URL}/file_content?repository=${selectedRepository}&path=${subFile.path}`);
              if (response.data.is_binary) {
                console.log(`Skipping binary file: ${subFile.path}`);
                newContents[subFile.path] = { content: '', tokenCount: 0, isBinary: true };
              } else {
                newContents[subFile.path] = { 
                  content: response.data.content, 
                  tokenCount: response.data.token_count,
                  isBinary: false 
                };
              }
            } catch (error) {
              console.error(`Failed to fetch content for ${subFile.path}:`, error);
            }
          }
        }
      } else {
        // Single file
        if (!newContents[file.path]) {
          try {
            const response = await axios.get(`${API_URL}/file_content?repository=${selectedRepository}&path=${file.path}`);
            if (response.data.is_binary) {
              console.log(`Skipping binary file: ${file.path}`);
              newContents[file.path] = { content: '', tokenCount: 0, isBinary: true };
            } else {
              newContents[file.path] = { 
                content: response.data.content, 
                tokenCount: response.data.token_count,
                isBinary: false 
              };
            }
          } catch (error) {
            console.error(`Failed to fetch content for ${file.path}:`, error);
          }
        }
      }
    }

    setFileContents(newContents);
  };

  useEffect(() => {
    fetchFileContents();
  }, [selectedFiles, selectedRepository]);

  // ======================
  //  FETCH TREE STRUCTURE
  // ======================
  const fetchTreeStructure = async (repo) => {
    try {
      const response = await axios.get(`${API_URL}/tree?repository=${repo}`);
      const formattedTree = formatTreeStructure(JSON.parse(response.data.tree));
      setTreeStructure(formattedTree);
    } catch (error) {
      console.error('Failed to fetch tree structure:', error);
    }
  };

  const formatTreeStructure = (node, depth = 0) => {
    let result = '  '.repeat(depth) + node.name + '\n';
    if (node.children) {
      node.children.forEach(child => {
        result += formatTreeStructure(child, depth + 1);
      });
    }
    return result;
  };

  // ======================
  //   REMOVE SELECTED
  // ======================
  const removeFile = (filePath) => {
    const fileToRemove = selectedFiles.find(f => f.path === filePath);
    if (fileToRemove) {
      if (fileToRemove.type === 'directory') {
        fileToRemove.files.forEach(f => {
          setFileContents(prev => {
            const newContents = { ...prev };
            delete newContents[f.path];
            return newContents;
          });
        });
      } else {
        setFileContents(prev => {
          const newContents = { ...prev };
          delete newContents[filePath];
          return newContents;
        });
      }
    }
    onFileRemove(filePath);
    setHasUnsavedChanges(true);
  };

  // ======================
  // CONSTRUCT STRUCTURED PROMPT
  // ======================
  const getStructuredPrompt = useCallback(() => {
    const sections = [];

    // 1) user_request
    if (basePrompt.trim()) {
      sections.push(`<user_request>\n${basePrompt.trim()}\n</user_request>`);
    }

    // 2) repository_structure
    if (isTreeAdded && treeStructure.trim()) {
      sections.push(`<repository_structure>\n${treeStructure.trim()}\n</repository_structure>`);
    }

    // 3) file contents
    for (const [path, { content }] of Object.entries(fileContents)) {
      if (content && content.trim()) {
        sections.push(`<file path="${path}">\n${content.trim()}\n</file>`);
      }
    }

    return sections.join("\n\n");
  }, [basePrompt, fileContents, isTreeAdded, treeStructure]);

  // ======================
  //   CLEARING
  // ======================
  const clearAll = () => {
    setBasePrompt('');
    setFileContents({});
    setTranscriptionHistory([]);
    setIsTreeAdded(false);
    setTreeTokenCount(0);
    setFileSuggestions(null);
    selectedFiles.forEach(file => onFileRemove(file.path));
    setAddedBatches([]);
    setHasUnsavedChanges(false);
    lastPromptRef.current = '';
  };

  const clearFiles = () => {
    setFileContents({});
    setIsTreeAdded(false);
    setTreeTokenCount(0);
    setFileSuggestions(null);
    selectedFiles.forEach(file => onFileRemove(file.path));
    setAddedBatches([]);
    setHasUnsavedChanges(true);
  };

  // ======================
  //  TRANSCRIPTION
  // ======================
  const addToPrompt = useCallback((text) => {
    if (!text) return;
    setBasePrompt(prev => (prev ? `${prev}\n${text}` : text));
    setHasUnsavedChanges(true);
  }, []);

  const enhanceTranscription = async (text) => {
    if (!text) return;
    const timestamp = new Date().toISOString();
    setTranscriptionHistory(prev => [{ timestamp, raw: text, enhanced: '' }, ...prev]);

    if (autoAddEnabled && enhancementDisabled) {
      addToPrompt(text);
    }

    if (enhancementDisabled) {
      setStatus('Transcription ready');
      return;
    }

    setStatus('Enhancing transcription...');
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are a precise and efficient text improvement assistant. Your task is to enhance the readability of speech-generated text while preserving all original meaning and intent.'
            },
            {
              role: 'user',
              content: text
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const enhancedText = response.data.choices[0].message.content;
      setTranscriptionHistory(prev => {
        const index = prev.findIndex(item => item.timestamp === timestamp);
        if (index === -1) return prev;
        return prev.map((item, i) =>
          i === index ? { ...item, enhanced: enhancedText } : item
        );
      });

      if (autoAddEnabled && !enhancementDisabled) {
        addToPrompt(enhancedText);
      }

      setStatus('Transcription ready');
    } catch (error) {
      console.error('Error enhancing transcription:', error);
      setStatus('Error enhancing transcription');
    }
  };

  // ======================
  //  REPO TREE ACTIONS
  // ======================
  const addTreeStructure = async () => {
    if (!isTreeAdded && !treeOperationRef.current && treeStructure) {
      treeOperationRef.current = true;
      try {
        const response = await axios.post(`${API_URL}/count_tokens`, {
          text: treeStructure,
          model: 'gpt-3.5-turbo'
        });
        setTreeTokenCount(response.data.count);
        setIsTreeAdded(true);
        setHasUnsavedChanges(true);
      } catch (error) {
        console.error('Error counting tree structure tokens:', error);
      } finally {
        treeOperationRef.current = false;
      }
    }
  };

  const removeTreeStructure = () => {
    setIsTreeAdded(false);
    setTreeTokenCount(0);
    setHasUnsavedChanges(true);
  };

  // ======================
  //   BATCH ADD/REMOVE
  // ======================
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

  // ======================
  //  FILE CHIPS
  // ======================
  const getFileChips = () => {
    // Sort by token count descending, then alphabetically
    const sortedFiles = [...selectedFiles].sort((a, b) => {
      const aTokens = a.type === 'directory'
        ? (a.token_count?.total || 0)
        : (fileContents[a.path]?.tokenCount || 0);
      const bTokens = b.type === 'directory'
        ? (b.token_count?.total || 0)
        : (fileContents[b.path]?.tokenCount || 0);

      if (aTokens !== bTokens) return bTokens - aTokens;
      return a.path.localeCompare(b.path);
    });

    // Control how many we show before "Show more"
    const displayedFiles = showAllFiles
      ? sortedFiles
      : sortedFiles.slice(0, MAX_VISIBLE_FILE_CHIPS);

    const chips = displayedFiles.map(file => {
      if (file.type === 'directory') {
        return (
          <FileChip
            key={file.path}
            fileName={file.path}
            tokenCount={file.token_count}
            onRemove={() => removeFile(file.path)}
            isBinary={false} // directories aren't binary, but we keep the prop consistent
          />
        );
      } else {
        const tokenCount = fileContents[file.path]?.tokenCount || 0;
        const isBinary = fileContents[file.path]?.isBinary || false;
        return (
          <FileChip
            key={file.path}
            fileName={file.path}
            tokenCount={tokenCount}
            onRemove={() => removeFile(file.path)}
            isBinary={isBinary}
          />
        );
      }
    });

    return (
      <>
        {chips}
        {sortedFiles.length > MAX_VISIBLE_FILE_CHIPS && (
          <Badge 
            className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            variant="outline"
            onClick={() => setShowAllFiles(!showAllFiles)}
          >
            {showAllFiles
              ? 'Show less'
              : `Show ${sortedFiles.length - displayedFiles.length} more...`}
          </Badge>
        )}
      </>
    );
  };

  // ======================
  //  BASE PROMPT CHANGE
  // ======================
  const handleBasePromptChange = (newPrompt) => {
    setBasePrompt(newPrompt);
    setHasUnsavedChanges(true);
  };

  // Calculate total tokens for selected files
  const calculateTotalTokens = useCallback(() => {
    return Object.values(fileContents).reduce((total, { tokenCount }) => total + (tokenCount || 0), 0);
  }, [fileContents]);

  // Handle copy to clipboard
  const handleCopyToClipboard = useCallback(async () => {
    const prompt = getStructuredPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      // Save the combination after successful copy
      addCombination(selectedFiles, calculateTotalTokens());
      setStatus('Copied to clipboard!');
      setTimeout(() => {
        setStatus(prev => prev === 'Copied to clipboard!' ? '' : prev);
      }, 2000);
      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      setStatus('Failed to copy to clipboard');
      setTimeout(() => setStatus(''), 2000);
      return false;
    }
  }, [getStructuredPrompt, selectedFiles, addCombination, calculateTotalTokens]);

  // Watch for changes that should trigger auto-copy
  useEffect(() => {
    let timeoutId;
    if (!isAutoCopyEnabled || !hasUnsavedChanges) return;

    // Only copy if there are actual changes
    const currentPrompt = getStructuredPrompt();
    if (currentPrompt !== lastCopiedPromptRef.current) {
      timeoutId = setTimeout(() => {
        handleCopyToClipboard().then(success => {
          if (success) {
            lastCopiedPromptRef.current = currentPrompt;
            setStatus('Auto-copied to clipboard');
            const messageTimeoutId = setTimeout(() => {
              setStatus(prev => prev === 'Auto-copied to clipboard' ? '' : prev);
            }, 2000);
            return () => clearTimeout(messageTimeoutId);
          }
        });
      }, 1000); // Increased delay to prevent rapid copying
    }

    return () => timeoutId && clearTimeout(timeoutId);
  }, [isAutoCopyEnabled, hasUnsavedChanges, handleCopyToClipboard, getStructuredPrompt]);

  // Handle restoring a combination
  const handleRestoreCombination = useCallback(async (combination) => {
    try {
      setStatus('Restoring file combination...');
      
      // First, clear everything
      selectedFiles.forEach(file => onFileRemove(file.path));
      setFileContents({});
      
      // Then fetch all file contents first
      const newContents = {};
      const filesToAdd = [];
      
      for (const file of combination.files) {
        if (file.type === 'directory') {
          const directoryFiles = [];
          for (const subFile of file.files) {
            try {
              const response = await axios.get(`${API_URL}/file_content?repository=${selectedRepository}&path=${subFile.path}`);
              if (!response.data.is_binary) {
                newContents[subFile.path] = { 
                  content: response.data.content, 
                  tokenCount: response.data.token_count,
                  isBinary: false 
                };
                directoryFiles.push({
                  path: subFile.path,
                  type: 'file',
                  token_count: response.data.token_count
                });
              }
            } catch (error) {
              console.error(`Failed to fetch content for ${subFile.path}:`, error);
            }
          }
          if (directoryFiles.length > 0) {
            filesToAdd.push({
              path: file.path,
              type: 'directory',
              files: directoryFiles,
              token_count: {
                total: directoryFiles.reduce((sum, f) => sum + (f.token_count || 0), 0)
              }
            });
          }
        } else {
          try {
            const response = await axios.get(`${API_URL}/file_content?repository=${selectedRepository}&path=${file.path}`);
            if (!response.data.is_binary) {
              newContents[file.path] = { 
                content: response.data.content, 
                tokenCount: response.data.token_count,
                isBinary: false 
              };
              filesToAdd.push({
                path: file.path,
                type: 'file',
                token_count: response.data.token_count
              });
            }
          } catch (error) {
            console.error(`Failed to fetch content for ${file.path}:`, error);
          }
        }
      }
      
      // Update file contents first
      setFileContents(newContents);
      
      // Update all files at once using batch selection
      onBatchFileSelection(filesToAdd);
      
      // Force a re-render of the prompt preview
      setHasUnsavedChanges(true);
      
      // Update status
      setStatus('File combination restored');
      setTimeout(() => setStatus(''), 2000);
      
    } catch (error) {
      console.error('Error restoring combination:', error);
      setStatus('Error restoring combination');
      setTimeout(() => setStatus(''), 2000);
    }
  }, [onFileRemove, onBatchFileSelection, selectedRepository]);

  // ======================
  //  RENDER
  // ======================
  return (
    <div className="flex flex-col space-y-6 max-w-7xl mx-auto">
      {/* Settings Card */}
      <Card className="backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-0">
          <PromptSettings
            isAutoAnalyzeEnabled={isAutoAnalyzeEnabled}
            onToggleAutoAnalyze={() => setIsAutoAnalyzeEnabled(prev => !prev)}
            autoAddEnabled={autoAddEnabled}
            onToggleAutoAdd={() => setAutoAddEnabled(prev => !prev)}
            enhancementDisabled={enhancementDisabled}
            onToggleEnhancement={() => setEnhancementDisabled(prev => !prev)}
            onManualAnalyze={() => analyzePrompt(basePrompt)}
            isAnalyzing={isAnalyzing}
            promptLength={basePrompt.length}
            minPromptLength={MIN_PROMPT_LENGTH}
            autoCopyEnabled={isAutoCopyEnabled}
            onToggleAutoCopy={() => setIsAutoCopyEnabled(prev => !prev)}
          />
        </CardContent>
      </Card>

      {/* Main Composer Card */}
      <Card className="shadow border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Prompt Composer</h2>
            {status && (
              <Badge variant={status.includes('Error') ? 'destructive' : 'secondary'} className="animate-in fade-in">
                {status}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <PromptActions
            addTreeStructure={addTreeStructure}
            clearPrompt={clearAll}
            clearFiles={clearFiles}
            setTranscription={text => text && enhanceTranscription(text)}
            enhanceTranscription={enhanceTranscription}
            setStatus={setStatus}
            prompt={getStructuredPrompt()}
            setUserPrompt={prompt => {
              setUserPrompt(prompt);
              setHasUnsavedChanges(false);
            }}
            handleCopyToClipboard={handleCopyToClipboard}
          />

          {/* Loading Indicator */}
          {isAnalyzing && (
            <div className="flex items-center space-x-2 py-2">
              <FiLoader className="animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Analyzing prompt...</span>
            </div>
          )}

          {/* Selected Files Section */}
          <div className="mt-4">
            <div className="text-sm font-medium mb-2 text-muted-foreground flex items-center">
              <FiFolder className="mr-1" size={14} />
              Selected Files ({selectedFiles.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {isTreeAdded && (
                <FileChip
                  fileName="Repository Structure"
                  tokenCount={treeTokenCount}
                  onRemove={removeTreeStructure}
                  isRepositoryTree={true}
                />
              )}
              {getFileChips()}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Text Editor */}
          <div>
            <div className="text-sm font-medium mb-2 text-muted-foreground flex items-center">
              <FiFile className="mr-1" size={14} />
              Prompt
            </div>
            <PromptTextArea
              prompt={basePrompt}
              setPrompt={handleBasePromptChange}
              additionalTokenCount={
                treeTokenCount +
                selectedFiles.reduce((sum, file) => {
                  if (file.type === 'directory') return sum + (file.token_count?.total || 0);
                  return sum + (fileContents[file.path]?.tokenCount || 0);
                }, 0)
              }
              fullPrompt={getStructuredPrompt()}
            />
          </div>
          
          {/* Recent File Combinations */}
          {combinations.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-medium mb-2 text-muted-foreground flex items-center">
                <FiFolder className="mr-1" size={14} />
                Recent File Combinations
              </div>
              <FileCombinations
                combinations={combinations}
                onRestoreCombination={handleRestoreCombination}
                onRemoveCombination={removeCombination}
                currentSelection={selectedFiles}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Suggestions */}
      {fileSuggestions && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <FiFile className="mr-2" />
              Suggested Files
            </h3>
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
          </CardContent>
        </Card>
      )}

      {/* Transcription History */}
      {transcriptionHistory.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 8C13.1 8 14 8.9 14 10C14 11.1 13.1 12 12 12C10.9 12 10 11.1 10 10C10 8.9 10.9 8 12 8ZM12 18.2C9.5 18.2 7.29 16.92 6 14.98C6.03 12.99 10 11.9 12 11.9C13.99 11.9 17.97 12.99 18 14.98C16.71 16.92 14.5 18.2 12 18.2Z" 
                  fill="currentColor" />
              </svg>
              Transcription History
            </h3>
            <ScrollArea className="h-[200px]">
              <TranscriptionDisplay
                transcriptionHistory={transcriptionHistory}
                addToPrompt={addToPrompt}
                autoAddEnabled={autoAddEnabled}
                enhancementDisabled={enhancementDisabled}
              />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Prompt Preview */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" 
                fill="currentColor" />
            </svg>
            Prompt Preview
          </h3>
          <PromptPreview structuredPrompt={getStructuredPrompt()} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptComposer;