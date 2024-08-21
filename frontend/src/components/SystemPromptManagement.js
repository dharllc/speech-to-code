// Filename: frontend/src/components/SystemPromptManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CopyButton from './CopyButton';

const SystemPromptManagement = () => {
  const [prompts, setPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState({ name: '', step: '', content: '', is_default: false });
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/system_prompts');
      setPrompts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch prompts');
      console.error('Error fetching prompts:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPrompt(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const promptData = {
        ...newPrompt,
        step: newPrompt.step.startsWith('Step ') ? newPrompt.step : `Step ${newPrompt.step}`,
        is_default: false
      };
      if (editingPrompt) {
        await axios.put(`http://localhost:8000/system_prompts/${editingPrompt.id}`, promptData);
      } else {
        await axios.post('http://localhost:8000/system_prompts', promptData);
      }
      fetchPrompts();
      setNewPrompt({ name: '', step: '', content: '', is_default: false });
      setEditingPrompt(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save prompt');
      console.error('Error saving prompt:', err);
    }
  };

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt);
    setNewPrompt({
      name: prompt.name,
      step: prompt.step,
      content: prompt.content,
      is_default: prompt.is_default
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/system_prompts/${id}`);
      fetchPrompts();
      setError('');
    } catch (err) {
      setError('Failed to delete prompt');
      console.error('Error deleting prompt:', err);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-900 text-white">
      <h2 className="text-2xl font-bold mb-4">System Prompt Management</h2>
      
      <form onSubmit={handleSubmit} className="mb-8 bg-gray-800 p-4 rounded">
        <div className="mb-4">
          <label className="block mb-2">Name:</label>
          <input
            type="text"
            name="name"
            value={newPrompt.name}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-gray-700 text-white"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Step:</label>
          <input
            type="text"
            name="step"
            value={newPrompt.step}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-gray-700 text-white"
            required
            placeholder="e.g., 1 or Step 1"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Content:</label>
          <textarea
            name="content"
            value={newPrompt.content}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-gray-700 text-white"
            rows="4"
            required
          ></textarea>
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          {editingPrompt ? 'Update Prompt' : 'Add Prompt'}
        </button>
      </form>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <div className="grid grid-cols-1 gap-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="bg-gray-800 p-4 rounded shadow">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-lg">{prompt.name} ({prompt.step})</h4>
              <div className="flex items-center">
                <CopyButton 
                  textToCopy={prompt.content} 
                  className="mr-2 bg-gray-700 hover:bg-gray-600"
                />
                <button onClick={() => handleEdit(prompt)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 text-sm hover:bg-yellow-600">
                  Edit
                </button>
                <button onClick={() => handleDelete(prompt.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                  Delete
                </button>
              </div>
            </div>
            <pre className="text-sm mb-2 text-gray-300 whitespace-pre-wrap bg-gray-700 p-2 rounded">
              {prompt.content}
            </pre>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>Tokens: {prompt.token_count}</span>
              <span>{new Date(prompt.timestamp).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemPromptManagement;
// End of file: frontend/src/components/SystemPromptManagement.js