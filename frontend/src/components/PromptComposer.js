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
import { API_URL } from '../config/api';

const PromptComposer = ({ selectedRepository, selectedFiles, onFileRemove, setUserPrompt, onFileSelectionChange }) => {
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
  const MIN_PROMPT_LENGTH = 25;
  const lastPromptRef = useRef(basePrompt);
  const treeOperationRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('autoAnalyzeEnabled', JSON.stringify(isAutoAnalyzeEnabled));
  }, [isAutoAnalyzeEnabled]);

  useEffect(() => {
    localStorage.setItem('autoAddEnabled', JSON.stringify(autoAddEnabled));
    localStorage.setItem('preferEnhanced', JSON.stringify(preferEnhanced));
    localStorage.setItem('enhancementDisabled', JSON.stringify(enhancementDisabled));
  }, [autoAddEnabled, preferEnhanced, enhancementDisabled]);

  useEffect(() => {
    if (selectedRepository) fetchTreeStructure(selectedRepository);
  }, [selectedRepository]);

  const analyzePrompt = useCallback(async (prompt) => {
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
  }, [selectedRepository, isAnalyzing]);

  useEffect(() => {
    if (isAutoAnalyzeEnabled && basePrompt.length >= MIN_PROMPT_LENGTH && !isAnalyzing && basePrompt !== lastPromptRef.current) {
      const timeoutId = setTimeout(() => analyzePrompt(basePrompt), 1000);
      lastPromptRef.current = basePrompt;
      return () => clearTimeout(timeoutId);
    }
  }, [basePrompt, isAutoAnalyzeEnabled, isAnalyzing, analyzePrompt]);

  useEffect(() => {
    const fetchFileContents = async () => {
      const newContents = { ...fileContents };
      Object.keys(newContents).forEach(path => {
        if (!selectedFiles.some(file => {
          if (file.type === 'directory') return file.files.some(f => f.path === path);
          return file.path === path;
        })) delete newContents[path];
      });

      for (const file of selectedFiles) {
        if (file.type === 'directory') {
          for (const subFile of file.files) {
            if (!newContents[subFile.path]) {
              try {
                const response = await axios.get(`${API_URL}/file_content?repository=${selectedRepository}&path=${subFile.path}`);
                newContents[subFile.path] = { content: response.data.content, tokenCount: response.data.token_count };
              } catch (error) {
                console.error(`Failed to fetch content for ${subFile.path}:`, error);
              }
            }
          }
        } else if (!newContents[file.path]) {
          try {
            const response = await axios.get(`${API_URL}/file_content?repository=${selectedRepository}&path=${file.path}`);
            newContents[file.path] = { content: response.data.content, tokenCount: response.data.token_count };
          } catch (error) {
            console.error(`Failed to fetch content for ${file.path}:`, error);
          }
        }
      }
      setFileContents(newContents);
    };
    fetchFileContents();
  }, [selectedFiles, selectedRepository]);

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

  const getFullPrompt = useCallback(() => {
    const filesContent = Object.entries(fileContents)
      .map(([path, { content }]) => `File: ${path}\n\n${content}\n\n`)
      .join('');
    const treeContent = isTreeAdded ? `[Repository Structure for ${selectedRepository}]\n${treeStructure}\n\n` : '';
    return `${basePrompt}\n${treeContent}${filesContent}`.trim();
  }, [basePrompt, fileContents, isTreeAdded, treeStructure, selectedRepository]);

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

  const addToPrompt = useCallback((text) => {
    if (!text) return;
    setBasePrompt(prev => prev ? `${prev}\n${text}` : text);
    setHasUnsavedChanges(true);
  }, []);

  const enhanceTranscription = async (text) => {
    if (!text) return;
    const timestamp = new Date().toISOString();
    setTranscriptionHistory(prev => [{timestamp, raw: text, enhanced: ''}, ...prev]);

    if (autoAddEnabled && (!preferEnhanced || enhancementDisabled)) {
      addToPrompt(text);
    }

    if (enhancementDisabled) {
      setStatus('Transcription ready');
      return;
    }

    setStatus('Enhancing transcription...');
    
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a precise and efficient text improvement assistant. Your task is to enhance the readability of speech-generated text while preserving all original meaning and intent.'
          },
          {
            role: 'user',
            content: text
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const enhancedText = response.data.choices[0].message.content;
      
      setTranscriptionHistory(prev => {
        const index = prev.findIndex(item => item.timestamp === timestamp);
        if (index === -1) return prev;
        return prev.map((item, i) => i === index ? {...item, enhanced: enhancedText} : item);
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

  const getFileChips = () => {
    return selectedFiles
      .sort((a, b) => {
        const aTokens = a.type === 'directory' ? (a.token_count?.total || 0) : (fileContents[a.path]?.tokenCount || 0);
        const bTokens = b.type === 'directory' ? (b.token_count?.total || 0) : (fileContents[b.path]?.tokenCount || 0);
        if (aTokens !== bTokens) return bTokens - aTokens;
        return a.path.localeCompare(b.path);
      })
      .map(file => {
        if (file.type === 'directory') {
          return (
            <FileChip
              key={file.path}
              fileName={file.path}
              tokenCount={file.token_count}
              onRemove={() => removeFile(file.path)}
            />
          );
        }
        const tokenCount = fileContents[file.path]?.tokenCount || 0;
        return (
          <FileChip
            key={file.path}
            fileName={file.path}
            tokenCount={tokenCount}
            onRemove={() => removeFile(file.path)}
          />
        );
      });
  };

  return (
    <div className="p-2">
      <h2 className="text-base font-bold mb-2">Prompt Composer</h2>
      <PromptActions
        addTreeStructure={addTreeStructure}
        clearPrompt={clearAll}
        clearFiles={clearFiles}
        setTranscription={text => text && enhanceTranscription(text)}
        enhanceTranscription={enhanceTranscription}
        setStatus={setStatus}
        prompt={getFullPrompt()}
        setUserPrompt={prompt => {
          setUserPrompt(prompt);
          setHasUnsavedChanges(false);
        }}
      />
      <div className="mb-2">
        {isTreeAdded && (
          <FileChip
            fileName="Repository Structure"
            tokenCount={treeTokenCount}
            onRemove={removeTreeStructure}
          />
        )}
        {getFileChips()}
      </div>
      <PromptTextArea 
        prompt={basePrompt} 
        setPrompt={handleBasePromptChange}
        additionalTokenCount={
          treeTokenCount + 
          selectedFiles.reduce((sum, file) => {
            if (file.type === 'directory') return sum + file.token_count.total;
            return sum + (fileContents[file.path]?.tokenCount || 0);
          }, 0)
        }
        fullPrompt={getFullPrompt()}
      />
      <PromptAnalysisControls
        promptLength={basePrompt.length}
        minLength={MIN_PROMPT_LENGTH}
        isAnalyzing={isAnalyzing}
        isAutoAnalyzeEnabled={isAutoAnalyzeEnabled}
        onToggleAutoAnalyze={() => setIsAutoAnalyzeEnabled(prev => !prev)}
        onManualAnalyze={() => analyzePrompt(basePrompt)}
        disabled={!selectedRepository}
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