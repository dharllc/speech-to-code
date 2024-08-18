import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SystemPromptManagement = () => {
  const [prompts, setPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState({ name: '', content: '' });
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [error, setError] = useState('');
  const [steps, setSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState('');

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/system_prompts');
      setPrompts(response.data);
      const uniqueSteps = [...new Set(response.data.map(prompt => prompt.step))];
      setSteps(uniqueSteps);
    } catch (err) {
      setError('Failed to fetch prompts');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPrompt(prev => ({ ...prev, [name]: value }));
  };

  const handleStepChange = (e) => {
    const value = e.target.value;
    setSelectedStep(value);
    if (value === 'new') {
      setNewPrompt(prev => ({ ...prev, name: '' }));
    } else {
      setNewPrompt(prev => ({ ...prev, name: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const promptData = {
        ...newPrompt,
        step: newPrompt.name,
        is_default: false
      };
      if (editingPrompt) {
        await axios.put(`http://localhost:8000/system_prompts/${editingPrompt.id}`, promptData);
      } else {
        await axios.post('http://localhost:8000/system_prompts', promptData);
      }
      fetchPrompts();
      setNewPrompt({ name: '', content: '' });
      setSelectedStep('');
      setEditingPrompt(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save prompt');
    }
  };

  const handleEdit = (prompt) => {
    setEditingPrompt(prompt);
    setNewPrompt({ name: prompt.name, content: prompt.content });
    setSelectedStep(prompt.step);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/system_prompts/${id}`);
      fetchPrompts();
    } catch (err) {
      setError('Failed to delete prompt');
    }
  };

  const handleSetDefault = async (prompt) => {
    try {
      await axios.put(`http://localhost:8000/system_prompts/${prompt.id}`, { ...prompt, is_default: true });
      fetchPrompts();
    } catch (err) {
      setError('Failed to set prompt as default');
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-900 text-white">
      <h2 className="text-2xl font-bold mb-4">System Prompt Management</h2>
      
      <form onSubmit={handleSubmit} className="mb-8 bg-gray-800 p-4 rounded">
        <div className="mb-4">
          <label className="block mb-2">Step:</label>
          <select
            value={selectedStep}
            onChange={handleStepChange}
            className="w-full p-2 border rounded bg-gray-700 text-white"
            required
          >
            <option value="">Select a step or add new</option>
            {steps.map(step => (
              <option key={step} value={step}>{step}</option>
            ))}
            <option value="new">Add new step</option>
          </select>
        </div>
        {selectedStep === 'new' && (
          <div className="mb-4">
            <label className="block mb-2">New Step Name:</label>
            <input
              type="text"
              name="name"
              value={newPrompt.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded bg-gray-700 text-white"
              required
            />
          </div>
        )}
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
        <h4 className="font-bold text-lg">{prompt.name}</h4>
        <div>
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
      <div className="mt-2 flex justify-end">
        {!prompt.is_default ? (
          <button onClick={() => handleSetDefault(prompt)} className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600">
            Set as Default
          </button>
        ) : (
          <span className="text-green-500 text-sm">Default</span>
        )}
      </div>
    </div>
  ))}
</div>
    </div>
  );
};

export default SystemPromptManagement;