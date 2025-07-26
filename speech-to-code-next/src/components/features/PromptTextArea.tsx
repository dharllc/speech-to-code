import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../../lib/config/api';
import { ArrowDownToLine } from 'lucide-react';

interface PromptTextAreaProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  additionalTokenCount: number;
}

interface TokenCountResponse {
  count: number;
}

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

const PromptTextArea: React.FC<PromptTextAreaProps> = ({ prompt, setPrompt, additionalTokenCount }) => {
  const [tokenCount, setTokenCount] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastKeyboardFocusRef = useRef<boolean>(false);

  useEffect(() => {
    const debouncedUpdateTokenCount = debounce(updateTokenCount, 300);
    debouncedUpdateTokenCount(prompt);
    return () => debouncedUpdateTokenCount.cancel();
  }, [prompt]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        focusAndScrollToBottom(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const focusAndScrollToBottom = (fromKeyboard: boolean = false) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    textarea.focus();
    textarea.scrollTop = textarea.scrollHeight;
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    lastKeyboardFocusRef.current = fromKeyboard;
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const updateTokenCount = async (text: string) => {
    try {
      const response = await axios.post<TokenCountResponse>(`${API_URL}/count_tokens`, {
        text,
        model: 'gpt-3.5-turbo'
      });
      setTokenCount(response.data.count);
    } catch (error) {
      console.error('Error counting tokens:', error);
      setTokenCount(0);
    }
  };

  const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): DebouncedFunction<T> => {
    let timeout: NodeJS.Timeout | null = null;
    const debouncedFunc = (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
    debouncedFunc.cancel = () => {
      if (timeout) clearTimeout(timeout);
    };
    return debouncedFunc;
  };

  const getTokenCountColor = (total: number): string => {
    if (total >= 100000) return 'text-red-500 dark:text-red-400 font-semibold';
    if (total >= 50000) return 'text-yellow-500 dark:text-yellow-400 font-semibold';
    return 'text-gray-500 dark:text-gray-400';
  };

  const handlePasteButtonClick = () => {
    focusAndScrollToBottom(false);
  };

  return (
    <div className="relative group">
      <textarea
        ref={textareaRef}
        className="w-full h-64 p-4 border rounded-md resize-none
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
        className="absolute right-3 bottom-10 p-2
                   bg-blue-500 text-white rounded-md
                   opacity-0 group-hover:opacity-100
                   transition-opacity duration-200
                   hover:bg-blue-600 focus:outline-none
                   shadow-sm hover:shadow-md"
        title="Focus at bottom (⌘K)"
        aria-label="Focus at bottom of textarea"
      >
        <ArrowDownToLine size={16} />
      </button>

      <div className="flex justify-between items-center mt-2 px-1 text-xs">
        <div className="text-gray-500 dark:text-gray-400 flex items-center">
          <span className="inline-flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
            <span className="font-mono mr-1">⌘K</span> 
            to focus at bottom
          </span>
        </div>
        <div className={`${getTokenCountColor(tokenCount + additionalTokenCount)} px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700`}>
          Tokens: {tokenCount + additionalTokenCount}
        </div>
      </div>
    </div>
  );
};

export default PromptTextArea;