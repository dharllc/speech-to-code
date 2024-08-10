import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PromptTextArea = ({ prompt, setPrompt }) => {
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
    <div className="relative mb-4">
      <textarea
        className="w-full h-64 p-2 border rounded"
        value={prompt}
        onChange={handlePromptChange}
        placeholder="Compose your prompt here..."
      />
      <div className="absolute bottom-2 right-2 text-sm text-gray-500">
        Tokens: {tokenCount}
      </div>
    </div>
  );
};

export default PromptTextArea;