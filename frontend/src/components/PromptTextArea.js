import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import PropTypes from 'prop-types';
import { ArrowDownToLine } from 'lucide-react';

const PromptTextArea = ({ prompt, setPrompt, additionalTokenCount, fullPrompt }) => {
  const [tokenCount, setTokenCount] = useState(0);
  const textareaRef = useRef(null);
  const lastKeyboardFocusRef = useRef(false);

  useEffect(() => {
    const debouncedUpdateTokenCount = debounce(updateTokenCount, 300);
    debouncedUpdateTokenCount(prompt);
    return () => debouncedUpdateTokenCount.cancel();
  }, [prompt]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        focusAndScrollToBottom(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const focusAndScrollToBottom = (fromKeyboard = false) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    textarea.focus();
    textarea.scrollTop = textarea.scrollHeight;
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    lastKeyboardFocusRef.current = fromKeyboard;
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const updateTokenCount = async (text) => {
    try {
      const response = await axios.post(`${API_URL}/count_tokens`, {
        text,
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

  const handlePasteButtonClick = () => {
    focusAndScrollToBottom(false);
  };

  return (
    <div className="mb-4 relative group">
      <textarea
        ref={textareaRef}
        className="w-full h-64 p-2 border rounded resize-none
                   bg-white dark:bg-gray-800 
                   text-gray-900 dark:text-gray-100
                   border-gray-300 dark:border-gray-700
                   focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                   focus:border-transparent
                   hover:border-blue-300 dark:hover:border-blue-600
                   transition-colors duration-200
                   scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600
                   scrollbar-track-gray-200 dark:scrollbar-track-gray-800"
        value={prompt}
        onChange={handlePromptChange}
        placeholder="Compose your request here..."
      />

      <button
        onClick={handlePasteButtonClick}
        className="absolute right-2 bottom-8 p-1.5 
                   bg-blue-500 text-white rounded-md
                   opacity-0 group-hover:opacity-100
                   transition-opacity duration-200
                   hover:bg-blue-600 focus:outline-none
                   shadow-sm hover:shadow-md"
        title="Focus at bottom (⌘K)"
      >
        <ArrowDownToLine size={14} />
      </button>

      <div className="flex justify-between items-center mt-1 text-xs">
        <div className="text-gray-500 dark:text-gray-400">
          Press ⌘K to focus at bottom
        </div>
        <div className={getTokenCountColor(tokenCount + additionalTokenCount)}>
          Tokens: {tokenCount + additionalTokenCount}
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