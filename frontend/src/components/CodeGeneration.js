import React, { useState, useEffect } from 'react';
import * as llmService from '../services/llmService';

const CodeGeneration = ({ isActive, onComplete, intentData, repository, prompt }) => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [fullPrompt, setFullPrompt] = useState('');
  const [codeChanges, setCodeChanges] = useState([]);

  useEffect(() => {
    if (isActive && intentData) {
      preparePrompt();
    }
  }, [isActive, intentData]);

  const preparePrompt = () => {
    const promptContent = `${prompt?.prompts[0]?.content}\n\nRepository: ${repository}\n\nIntent Understanding: ${intentData.response}\n\nGenerate Code:`;
    setFullPrompt(promptContent);
  };

  const handleCodeGeneration = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await llmService.getCompletion(fullPrompt, '');
      setResponse(result.completion);
      parseCodeChanges(result.completion);
    } catch (error) {
      setError('An error occurred while generating code.');
      console.error('Error in code generation:', error);
    }
    setIsLoading(false);
  };

  const parseCodeChanges = (completion) => {
    const fileRegex = /File: (.+)\n\n([\s\S]+?)(?=\n\nFile:|$)/g;
    const changes = [];
    let match;

    while ((match = fileRegex.exec(completion)) !== null) {
      changes.push({
        fileName: match[1],
        content: match[2].trim()
      });
    }

    setCodeChanges(changes);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  if (!isActive) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mt-4">
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Code Generation</h3>
      <button
        onClick={handleCodeGeneration}
        disabled={isLoading}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Generating...' : 'Generate Code'}
      </button>
      <button
        onClick={() => setShowFullPrompt(!showFullPrompt)}
        className="mt-2 ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        {showFullPrompt ? 'Hide Prompt' : 'Show Prompt'}
      </button>
      {showFullPrompt && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Full Prompt:</h4>
          <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded mt-2 text-sm">
            {fullPrompt}
          </pre>
        </div>
      )}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {codeChanges.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Generated Code Changes:</h4>
          {codeChanges.map((change, index) => (
            <div key={index} className="mt-2">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300">{change.fileName}</h5>
              <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 text-sm overflow-x-auto">
                {change.content}
              </pre>
              <button
                onClick={() => copyToClipboard(change.content)}
                className="mt-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Copy Code
              </button>
            </div>
          ))}
          <button
            onClick={() => onComplete(codeChanges)}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Finish
          </button>
        </div>
      )}
    </div>
  );
};

export default CodeGeneration;