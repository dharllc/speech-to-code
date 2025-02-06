// File: frontend/src/components/PromptComposer.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { FiLoader } from 'react-icons/fi';
import PromptActions from './PromptActions';
import PromptTextArea from './PromptTextArea';
import TranscriptionDisplay from './TranscriptionDisplay';
import FileChip from './FileChip';
import { analyzePromptForFiles } from '../services/llmService';
import FileSuggestions from './FileSuggestions';
import PromptAnalysisControls from './PromptAnalysisControls';
import PromptPreview from './PromptPreview';  // <-- NEW import
import { API_URL } from '../config/api';
import { useFileCombinations } from '../hooks/useFileCombinations';
import FileCombinations from './FileCombinations';

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
  const [preferEnhanced, setPreferEnhanced] = useState(() => 
    JSON.parse(localStorage.getItem('preferEnhanced') || 'true')
  );
  const [enhancementDisabled, setEnhancementDisabled] = useState(() => 
    JSON.parse(localStorage.getItem('enhancementDisabled') || 'false')
  );

  const MIN_PROMPT_LENGTH = 20;
  const lastPromptRef = useRef(basePrompt);
  const treeOperationRef = useRef(false);

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
  }, [isAutoAnalyzeEnabled]);

  useEffect(() => {
    localStorage.setItem('autoAddEnabled', JSON.stringify(autoAddEnabled));
    localStorage.setItem('preferEnhanced', JSON.stringify(preferEnhanced));
    localStorage.setItem('enhancementDisabled', JSON.stringify(enhancementDisabled));
  }, [autoAddEnabled, preferEnhanced, enhancementDisabled]);

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
  useEffect(() => {
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

    if (autoAddEnabled && (!preferEnhanced || enhancementDisabled)) {
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

      if (autoAddEnabled && preferEnhanced && !enhancementDisabled) {
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
          <button
            className="m-1 px-2 py-1 text-sm bg-gray-200 dark:bg-gray-800 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700"
            onClick={() => setShowAllFiles(!showAllFiles)}
          >
            {showAllFiles
              ? 'Show less'
              : `Show ${sortedFiles.length - displayedFiles.length} more...`}
          </button>
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
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setStatus('Failed to copy to clipboard');
      setTimeout(() => setStatus(''), 2000);
    }
  }, [getStructuredPrompt, selectedFiles, addCombination, calculateTotalTokens]);

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
  }, [onFileRemove, onBatchFileSelection, setStatus, selectedRepository]);

  // ======================
  //  RENDER
  // ======================
  return (
    <div className="p-2">
      <h2 className="text-base font-bold mb-2">Prompt Composer</h2>

      {/* Prompt Actions Bar */}
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

      {/* Chips for repo tree + files */}
      <div className="mb-2 flex flex-wrap gap-1">
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

      {/* Recent File Combinations */}
      <FileCombinations
        combinations={combinations}
        onRestoreCombination={handleRestoreCombination}
        onRemoveCombination={removeCombination}
        currentSelection={selectedFiles}
      />

      {/* Main Text Area for base prompt */}
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
        // Pass the structured prompt for "autoCopy" or token counting
        fullPrompt={getStructuredPrompt()}
      />

      {/* Analysis Controls / Suggestions */}
      <PromptAnalysisControls
        promptLength={basePrompt.length}
        minLength={MIN_PROMPT_LENGTH}
        isAnalyzing={isAnalyzing}
        isAutoAnalyzeEnabled={isAutoAnalyzeEnabled}
        onToggleAutoAnalyze={() => setIsAutoAnalyzeEnabled(prev => !prev)}
        onManualAnalyze={() => analyzePrompt(basePrompt)}
        disabled={!selectedRepository}
      />

      {/* Status Spinner */}
      {status && <div className="mb-1 text-xs text-gray-600">{status}</div>}
      {isAnalyzing && (
        <div className="flex items-center justify-center p-4 text-gray-500">
          <FiLoader className="animate-spin mr-2" />
        </div>
      )}

      {/* File Suggestions */}
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

      {/* Transcription History */}
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

      {/* Finally, show the new structured prompt preview */}
      <PromptPreview structuredPrompt={getStructuredPrompt()} />
    </div>
  );
};

export default PromptComposer;