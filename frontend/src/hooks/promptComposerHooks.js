import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import { analyzePromptForFiles } from '../services/llmService';

export const useFileContents = (selectedFiles, selectedRepository) => {
  const [fileContents, setFileContents] = useState({});
  
  useEffect(() => {
    const fetchFileContents = async () => {
      const newContents = { ...fileContents };
      Object.keys(newContents).forEach(path => {
        if (!selectedFiles.some(file => file.type === 'directory' ? file.files.some(f => f.path === path) : file.path === path)) delete newContents[path];
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

  return { fileContents, setFileContents };
};

export const useTreeStructure = (selectedRepository) => {
  const [treeStructure, setTreeStructure] = useState('');
  const [isTreeAdded, setIsTreeAdded] = useState(false);
  const [treeTokenCount, setTreeTokenCount] = useState(0);
  const treeOperationRef = useRef(false);

  useEffect(() => {
    if (selectedRepository) fetchTreeStructure(selectedRepository);
  }, [selectedRepository]);

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
      node.children.forEach(child => result += formatTreeStructure(child, depth + 1));
    }
    return result;
  };

  const addTreeStructure = async () => {
    if (!isTreeAdded && !treeOperationRef.current && treeStructure) {
      treeOperationRef.current = true;
      try {
        const response = await axios.post(`${API_URL}/count_tokens`, { text: treeStructure, model: 'gpt-3.5-turbo' });
        setTreeTokenCount(response.data.count);
        setIsTreeAdded(true);
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
  };

  return {
    treeStructure,
    isTreeAdded,
    treeTokenCount,
    addTreeStructure,
    removeTreeStructure
  };
};

export const useTranscription = (setStatus) => {
  const [transcriptionHistory, setTranscriptionHistory] = useState([]);
  const [autoAddEnabled, setAutoAddEnabled] = useState(() => JSON.parse(localStorage.getItem('autoAddEnabled') || 'false'));
  const [preferEnhanced, setPreferEnhanced] = useState(() => JSON.parse(localStorage.getItem('preferEnhanced') || 'true'));
  const [enhancementDisabled, setEnhancementDisabled] = useState(() => JSON.parse(localStorage.getItem('enhancementDisabled') || 'false'));

  useEffect(() => {
    localStorage.setItem('autoAddEnabled', JSON.stringify(autoAddEnabled));
    localStorage.setItem('preferEnhanced', JSON.stringify(preferEnhanced));
    localStorage.setItem('enhancementDisabled', JSON.stringify(enhancementDisabled));
  }, [autoAddEnabled, preferEnhanced, enhancementDisabled]);

  const enhanceTranscription = async (text, addToPrompt) => {
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
        model: 'gpt-4o-mini',
        messages: [
          {role: 'system', content: 'You are a precise and efficient text improvement assistant. Your task is to enhance the readability of speech-generated text while preserving all original meaning and intent.'},
          {role: 'user', content: text}
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

  return {
    transcriptionHistory,
    enhanceTranscription,
    autoAddEnabled,
    setAutoAddEnabled,
    preferEnhanced,
    setPreferEnhanced,
    enhancementDisabled,
    setEnhancementDisabled
  };
};

export const usePromptAnalysis = (selectedRepository, MIN_PROMPT_LENGTH) => {
  const [fileSuggestions, setFileSuggestions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutoAnalyzeEnabled, setIsAutoAnalyzeEnabled] = useState(() => JSON.parse(localStorage.getItem('autoAnalyzeEnabled') || 'false'));
  const lastPromptRef = useRef('');

  useEffect(() => {
    localStorage.setItem('autoAnalyzeEnabled', JSON.stringify(isAutoAnalyzeEnabled));
  }, [isAutoAnalyzeEnabled]);

  const analyzePrompt = useCallback(async (prompt) => {
    if (prompt.length < MIN_PROMPT_LENGTH || !selectedRepository || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const response = await analyzePromptForFiles(selectedRepository, prompt);
      setFileSuggestions(response.suggestions);
    } catch (error) {
      console.error('Error getting file suggestions:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedRepository, isAnalyzing, MIN_PROMPT_LENGTH]);

  return {
    fileSuggestions,
    setFileSuggestions,
    isAnalyzing,
    isAutoAnalyzeEnabled,
    setIsAutoAnalyzeEnabled,
    analyzePrompt,
    lastPromptRef
  };
};