import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CopyButton from './CopyButton';
import { API_URL } from '@/lib/config/api';
import { SystemPrompt, SystemPromptFormData } from '@/types/chat';

const SystemPromptManagement: React.FC = () => {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [newPrompt, setNewPrompt] = useState<SystemPromptFormData>({ 
    name: '', 
    step: '', 
    content: '', 
    is_default: false 
  });
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [error, setError] = useState('');
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchPrompts(); }, []);

  const fetchPrompts = async () => {
    try {
      const response = await axios.get<SystemPrompt[]>(`${API_URL}/system_prompts`);
      setPrompts(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch prompts');
      console.error('Error fetching prompts:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPrompt(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const promptData: SystemPromptFormData = {
        ...newPrompt,
        step: newPrompt.step.startsWith('Step ') ? newPrompt.step : `Step ${newPrompt.step}`,
        is_default: false
      };
      if (editingPrompt) {
        await axios.put(`${API_URL}/system_prompts/${editingPrompt.id}`, promptData);
      } else {
        await axios.post(`${API_URL}/system_prompts`, promptData);
      }
      fetchPrompts();
      setNewPrompt({ name: '', step: '', content: '', is_default: false });
      setEditingPrompt(null);
      setError('');
      setIsFormCollapsed(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save prompt');
      console.error('Error saving prompt:', err);
    }
  };

  const handleEdit = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setNewPrompt({ 
      name: prompt.name, 
      step: prompt.step, 
      content: prompt.content, 
      is_default: prompt.is_default 
    });
    setIsFormCollapsed(false);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/system_prompts/${id}`);
      fetchPrompts();
      setError('');
    } catch (err) {
      setError('Failed to delete prompt');
      console.error('Error deleting prompt:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="flex flex-col gap-4 p-6 max-w-screen-xl mx-auto w-full">
        <div ref={formRef} className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-all duration-300 ${isFormCollapsed ? 'h-16 overflow-hidden' : ''}`}>
          <div className="flex justify-between items-center p-4">
            <h2 className="text-2xl font-bold text-blue-500">{editingPrompt ? 'Edit Prompt' : 'Create Prompt'}</h2>
            <button onClick={() => setIsFormCollapsed(!isFormCollapsed)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
              <svg className={`w-6 h-6 transition-transform ${isFormCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 pt-0">
            <div className="flex gap-4 mb-4">
              <input 
                type="text" 
                name="name" 
                value={newPrompt.name} 
                onChange={handleInputChange} 
                placeholder="Prompt Name" 
                className="flex-1 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                required 
              />
              <input 
                type="text" 
                name="step" 
                value={newPrompt.step} 
                onChange={handleInputChange} 
                placeholder="Step (e.g., 1)" 
                className="w-32 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                required 
              />
            </div>
            <textarea 
              name="content" 
              value={newPrompt.content} 
              onChange={handleInputChange} 
              placeholder="Prompt Content" 
              className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y min-h-[200px] mb-4" 
              required 
            />
            <div className="flex gap-4">
              <button type="submit" className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium">
                {editingPrompt ? 'Update Prompt' : 'Add Prompt'}
              </button>
              {editingPrompt && (
                <button 
                  type="button" 
                  onClick={() => { 
                    setEditingPrompt(null); 
                    setNewPrompt({ name: '', step: '', content: '', is_default: false }); 
                  }} 
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
          {error && <p className="px-4 pb-4 text-red-500 text-sm">{error}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-transform hover:scale-[1.01]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  {prompt.name}
                  <span className="text-sm px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                    {prompt.step}
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <CopyButton textToCopy={prompt.content} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"/>
                  <button onClick={() => handleEdit(prompt)} className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(prompt.id)} className="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <pre className="text-sm mb-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto whitespace-pre-wrap break-words min-h-[50px] max-h-[500px]">
                {prompt.content}
              </pre>
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  {prompt.token_count} tokens
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(prompt.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemPromptManagement;