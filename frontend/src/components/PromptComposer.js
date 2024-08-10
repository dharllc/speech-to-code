import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PromptActions from './PromptActions';
import PromptTextArea from './PromptTextArea';
import TranscriptionDisplay from './TranscriptionDisplay';

const PromptComposer = ({ selectedRepository }) => {
  const [prompt, setPrompt] = useState('');
  const [treeStructure, setTreeStructure] = useState('');
  const [transcription, setTranscription] = useState('');
  const [enhancedTranscription, setEnhancedTranscription] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (selectedRepository) {
      fetchTreeStructure(selectedRepository);
      setPrompt('');
    }
  }, [selectedRepository]);

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
    if (!prompt.includes('[Repository Structure]')) {
      const updatedPrompt = `${prompt}\n[Repository Structure for ${selectedRepository}]\n${treeStructure}`.trim();
      setPrompt(updatedPrompt);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Prompt Composer</h2>
      <PromptActions
        addTreeStructure={addTreeStructure}
        clearPrompt={() => setPrompt('')}
        setTranscription={setTranscription}
        enhanceTranscription={enhanceTranscription}
        setStatus={setStatus}
        prompt={prompt}
      />
      <PromptTextArea prompt={prompt} setPrompt={setPrompt} />
      {status && <div className="mb-2 text-sm text-gray-600">{status}</div>}
      <TranscriptionDisplay
        transcription={transcription}
        enhancedTranscription={enhancedTranscription}
        addToPrompt={(text) => setPrompt(prev => `${prev}\n${text}`.trim())}
      />
    </div>
  );
};

export default PromptComposer;