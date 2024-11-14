// File: frontend/src/components/PromptTextArea.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import PropTypes from 'prop-types';

const PromptTextArea = ({ prompt, setPrompt, additionalTokenCount, fullPrompt }) => {
  const [tokenCount, setTokenCount] = useState(0);

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
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
    debouncedFunc.cancel = () => clearTimeout(timeout);
    return debouncedFunc;
  };

  return (
    <div className="relative">
      <textarea
        value={prompt}
        onChange={handlePromptChange}
        placeholder="Enter your prompt here..."
        className="w-full h-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
      />
      <div className="absolute bottom-3 right-3 text-xs text-gray-500 dark:text-gray-400">
        {tokenCount + additionalTokenCount} tokens
      </div>
    </div>
  );
};

PromptTextArea.propTypes = {
  prompt: PropTypes.string.isRequired,
  setPrompt: PropTypes.func.isRequired,
  additionalTokenCount: PropTypes.number.isRequired,
  fullPrompt: PropTypes.string.isRequired,
};

export default PromptTextArea;