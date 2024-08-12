import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PromptActions from './PromptActions';
import PromptTextArea from './PromptTextArea';
import TranscriptionDisplay from './TranscriptionDisplay';
import FileChip from './FileChip';

const PromptComposer = ({ selectedRepository, selectedFiles, onFileRemove }) => {
  const [basePrompt, setBasePrompt] = useState('');
  const [fileContents, setFileContents] = useState({});
  const [transcription, setTranscription] = useState('');
  const [enhancedTranscription, setEnhancedTranscription] = useState('');
  const [status, setStatus] = useState('');
  const [treeStructure, setTreeStructure] = useState('');

  useEffect(() => {
    if (selectedRepository) {
      fetchTreeStructure(selectedRepository);
    }
  }, [selectedRepository]);

  useEffect(() => {
    const fetchFileContents = async () => {
      const newContents = { ...fileContents };
      for (const file of selectedFiles) {
        if (!newContents[file.path]) {
          try {
            const response = await axios.get(`http://localhost:8000/file_content?repository=${selectedRepository}&path=${file.path}`);
            newContents[file.path] = {
              content: response.data.content,
              tokenCount: response.data.token_count
            };
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
      const response = await axios.get(`http://localhost:8000/tree?repository=${repo}`);
      const formattedTree = formatTreeStructure(JSON.parse(response.data.tree));
      setTreeStructure(formattedTree);
    } catch (error) {
      console.error('Failed to fetch tree structure:', error);
    }
  };

  const formatTreeStructure = (node, depth = 0) => {
    let result = '  '.repeat(depth) + node.name + '\n';
    if (node.children) {
      for (let child of node.children) {
        result += formatTreeStructure(child, depth + 1);
      }
    }
    return result;
  };

  const removeFile = (filePath) => {
    setFileContents(prev => {
      const newContents = { ...prev };
      delete newContents[filePath];
      return newContents;
    });
    onFileRemove(filePath);
  };

  const getFullPrompt = () => {
    const filesContent = Object.entries(fileContents)
      .map(([path, { content }]) => `File: ${path}\n\n${content}\n\n`)
      .join('');
    return `${basePrompt}\n${filesContent}`.trim();
  };

  const clearAll = () => {
    setBasePrompt('');
    setFileContents({});
    setTranscription('');
    setEnhancedTranscription('');
    selectedFiles.forEach(file => onFileRemove(file.path));
  };

  const enhanceTranscription = async (text) => {
    setStatus('Enhancing transcription...');
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a precise and efficient text improvement assistant. Your task is to enhance the readability of speech-generated text while preserving all original meaning and intent. Follow these guidelines strictly:1. Remove filler words and unnecessary repetitions.2. Correct grammar and punctuation.3. Maintain the original tone and style of the speaker. Do not add any new information or expand on the original content.5. If the input contains specific data like numbers or lists, preserve them exactly as provided.6. Do not ask questions or seek clarification; work with the given input as is.7. Provide only the improved text in your response, without any explanations or comments.'
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

      setEnhancedTranscription(response.data.choices[0].message.content);
      setStatus('Transcription ready');
    } catch (error) {
      console.error('Error enhancing transcription:', error);
      setStatus('Error enhancing transcription');
    }
  };

  const addTreeStructure = () => {
    if (!basePrompt.includes('[Repository Structure]')) {
      const newPrompt = `${basePrompt}\n[Repository Structure for ${selectedRepository}]\n${treeStructure}`.trim();
      setBasePrompt(newPrompt);
    }
  };

  return (
    <div className="p-2">
      <h2 className="text-base font-bold mb-2">Prompt Composer</h2>
      <PromptActions
        addTreeStructure={addTreeStructure}
        clearPrompt={clearAll}
        setTranscription={setTranscription}
        enhanceTranscription={enhanceTranscription}
        setStatus={setStatus}
        prompt={getFullPrompt()}
      />
      <div className="mb-2">
        {Object.entries(fileContents).map(([path, { tokenCount }]) => (
          <FileChip
            key={path}
            fileName={path.split('/').pop()}
            tokenCount={tokenCount}
            onRemove={() => removeFile(path)}
          />
        ))}
      </div>
      <PromptTextArea 
        prompt={getFullPrompt()} 
        setPrompt={setBasePrompt}
      />
      {status && <div className="mb-1 text-xs text-gray-600">{status}</div>}
      <TranscriptionDisplay
        transcription={transcription}
        enhancedTranscription={enhancedTranscription}
        addToPrompt={(text) => setBasePrompt(prev => `${prev}\n${text}`.trim())}
      />
    </div>
  );
};

export default PromptComposer;