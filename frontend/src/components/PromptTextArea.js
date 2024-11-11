// File: frontend/src/components/PromptTextArea.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import PropTypes from 'prop-types';

const PromptTextArea = ({ prompt, setPrompt, additionalTokenCount, fullPrompt }) => {
  const [tokenCount, setTokenCount] = useState(0);
  const [autoCopy, setAutoCopy] = useState(() => 
    JSON.parse(localStorage.getItem('autoCopyEnabled') || 'false')
  );

  useEffect(() => {
    if (autoCopy && fullPrompt) {
      navigator.clipboard.writeText(fullPrompt)
        .then(() => {
          console.log('Prompt copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy prompt:', err);
        });
    }
  }, [fullPrompt, autoCopy]);

  useEffect(() => {
    const debouncedUpdateTokenCount = debounce(updateTokenCount, 300);
    debouncedUpdateTokenCount(prompt);
    return () => debouncedUpdateTokenCount.cancel();
  }, [prompt]);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const updateTokenCount = async (text) => {
    try {
      const response = await axios.post(`${API_URL}/count_tokens`, {
        text: text,
        model: 'gpt-3.5-turbo'
      });
      setTokenCount(response.data.count);
    } catch (error) {
      console.error('Error counting tokens:', error);
      setTokenCount(0);
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    const debouncedFunc = (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
    debouncedFunc.cancel = () => clearTimeout(timeout);
    return debouncedFunc;
  };

  const getTokenCountColor = (total) => {
    if (total >= 100000) return 'text-red-500 dark:text-red-400 font-semibold';
    if (total >= 50000) return 'text-yellow-500 dark:text-yellow-400 font-semibold';
    return 'text-gray-500 dark:text-gray-400';
  };

  const totalTokens = tokenCount + additionalTokenCount;

  return (
    <div className="mb-4">
      <textarea
        className="w-full h-64 p-2 border rounded resize-none
                   bg-white dark:bg-gray-800 
                   text-gray-900 dark:text-gray-100
                   border-gray-300 dark:border-gray-700
                   focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                   focus:border-transparent
                   scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600
                   scrollbar-track-gray-200 dark:scrollbar-track-gray-800"
        value={prompt}
        onChange={handlePromptChange}
        placeholder="Compose your prompt here..."
      />
      <div className="flex justify-between items-center mt-1">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoCopy"
            checked={autoCopy}
            onChange={(e) => {
              setAutoCopy(e.target.checked);
              localStorage.setItem('autoCopyEnabled', JSON.stringify(e.target.checked));
            }}
            className="mr-2"
          />
          <label htmlFor="autoCopy" className="text-sm text-gray-600 dark:text-gray-400">
            Auto Copy
          </label>
        </div>
        <div className={getTokenCountColor(totalTokens)}>
          Tokens: {totalTokens}
        </div>
      </div>
    </div>
  );
};

PromptTextArea.propTypes = {
  prompt: PropTypes.string.isRequired,
  setPrompt: PropTypes.func.isRequired,
  additionalTokenCount: PropTypes.number.isRequired,
  fullPrompt: PropTypes.string.isRequired
};

export default PromptTextArea;