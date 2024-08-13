import React, { useState, useEffect } from 'react';
import * as promptService from '../services/promptService';

const SystemPromptManagement = () => {
  const [prompts, setPrompts] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('intent_understanding');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [qualityThreshold, setQualityThreshold] = useState(75);

  useEffect(() => {
    loadPrompts();
    loadQualityThreshold();
  }, []);

  const loadPrompts = async () => {
    try {
      const fetchedPrompts = await promptService.getPrompts();
      setPrompts(fetchedPrompts);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  };

  const loadQualityThreshold = async () => {
    try {
      const threshold = await promptService.getQualityThreshold();
      setQualityThreshold(threshold);
    } catch (error) {
      console.error('Failed to load quality threshold:', error);
    }
  };

  const handleCreatePrompt = async () => {
    try {
      await promptService.createPrompt(selectedCategory, newPromptContent);
      setNewPromptContent('');
      loadPrompts();
    } catch (error) {
      console.error('Failed to create prompt:', error);
    }
  };

  const handleUpdatePrompt = async (promptId, content) => {
    try {
      await promptService.updatePrompt(selectedCategory, promptId, content);
      loadPrompts();
    } catch (error) {
      console.error('Failed to update prompt:', error);
    }
  };

  const handleDeletePrompt = async (promptId) => {
    try {
      await promptService.deletePrompt(selectedCategory, promptId);
      loadPrompts();
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const handleSetDefaultPrompt = async (promptId) => {
    try {
      await promptService.setDefaultPrompt(selectedCategory, promptId);
      loadPrompts();
    } catch (error) {
      console.error('Failed to set default prompt:', error);
    }
  };

  const handleUpdateQualityThreshold = async () => {
    try {
      await promptService.updateQualityThreshold(qualityThreshold);
    } catch (error) {
      console.error('Failed to update quality threshold:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">System Prompt Management</h2>
      <div className="mb-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        >
          <option value="intent_understanding">Intent Understanding</option>
          <option value="code_planning">Code Planning</option>
          <option value="code_generation">Code Generation</option>
          <option value="quality_assessment">Quality Assessment</option>
          <option value="file_modification">File Modification</option>
          <option value="environment_management">Environment Management</option>
          <option value="light_verification">Light Verification</option>
        </select>
      </div>
      <div className="mb-4">
        <textarea
          value={newPromptContent}
          onChange={(e) => setNewPromptContent(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          rows="4"
          placeholder="Enter new prompt content"
        ></textarea>
        <button
          onClick={handleCreatePrompt}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Prompt
        </button>
      </div>
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Quality Assessment Threshold</h3>
        <input
          type="number"
          value={qualityThreshold}
          onChange={(e) => setQualityThreshold(Number(e.target.value))}
          className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          min="0"
          max="100"
        />
        <button
          onClick={handleUpdateQualityThreshold}
          className="ml-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Update Threshold
        </button>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Existing Prompts</h3>
        {prompts[selectedCategory]?.prompts.map((prompt) => (
          <div key={prompt.id} className="mb-4 p-4 border rounded bg-white dark:bg-gray-800">
            <textarea
              value={prompt.content}
              onChange={(e) => handleUpdatePrompt(prompt.id, e.target.value)}
              className="w-full p-2 border rounded mb-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              rows="3"
            ></textarea>
            <div className="flex justify-between">
              <button
                onClick={() => handleDeletePrompt(prompt.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => handleSetDefaultPrompt(prompt.id)}
                className={`px-3 py-1 ${
                  prompts[selectedCategory].default === prompt.id
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
                } text-white rounded`}
              >
                {prompts[selectedCategory].default === prompt.id ? 'Default' : 'Set as Default'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemPromptManagement;