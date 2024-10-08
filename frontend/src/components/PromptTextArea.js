// Filename: PromptTextArea.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PromptTextArea = ({ prompt, setPrompt, additionalTokenCount }) => {
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
      const response = await axios.post('http://localhost:8000/count_tokens', {
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
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
    debouncedFunc.cancel = () => clearTimeout(timeout);
    return debouncedFunc;
  };

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
      <div className="text-right mt-1 text-sm text-gray-500 dark:text-gray-400">
        Tokens: {tokenCount + additionalTokenCount}
      </div>
    </div>
  );
};

export default PromptTextArea;
// End of file: PromptTextArea.js