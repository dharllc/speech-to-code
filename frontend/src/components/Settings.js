import React, { useState, useEffect } from 'react';
import RepositorySelector from './RepositorySelector';
import { Eye, EyeOff, Save } from 'lucide-react';

const Settings = ({ selectedRepository, onRepositorySelect }) => {
  const [envVars, setEnvVars] = useState({});
  const [editedEnvVars, setEditedEnvVars] = useState({});
  const [showApiKeys, setShowApiKeys] = useState({});
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    fetchEnvVars();
  }, []);

  const fetchEnvVars = async () => {
    try {
      const response = await fetch('http://localhost:8000/env_vars');
      const data = await response.json();
      setEnvVars(data);
      setEditedEnvVars(data);
      setShowApiKeys(Object.keys(data).reduce((acc, key) => {
        acc[key] = key === 'REPO_PATH';
        return acc;
      }, {}));
    } catch (error) {
      console.error('Error fetching environment variables:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://localhost:8000/env_vars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedEnvVars),
      });
      if (response.ok) {
        setEnvVars(editedEnvVars);
        setUpdateMessage('Environment variables updated successfully!');
        setTimeout(() => setUpdateMessage(''), 3000);
      } else {
        setUpdateMessage('Failed to update environment variables.');
      }
    } catch (error) {
      console.error('Error updating environment variables:', error);
      setUpdateMessage('Error updating environment variables.');
    }
  };

  const toggleShowApiKey = (key) => {
    setShowApiKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderEnvVar = (key, value) => {
    const isApiKey = key.includes('API_KEY');
    return (
      <div key={key} className="mt-4">
        <h3 className="text-xl font-semibold mb-2">{key}</h3>
        <div className="flex items-center">
          <input
            type={showApiKeys[key] ? "text" : "password"}
            value={editedEnvVars[key]}
            onChange={(e) => setEditedEnvVars(prev => ({ ...prev, [key]: e.target.value }))}
            className="border rounded px-2 py-1 mr-2 flex-grow bg-gray-700 text-white"
          />
          {isApiKey && (
            <button onClick={() => toggleShowApiKey(key)} className="p-1 text-white">
              {showApiKeys[key] ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 text-white">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <div className="max-w-md">
        <RepositorySelector onSelect={onRepositorySelect} selectedRepository={selectedRepository} />
      </div>
      {selectedRepository && (
        <p className="mt-4">Current repository: {selectedRepository}</p>
      )}
      {Object.entries(envVars).map(([key, value]) => renderEnvVar(key, value))}
      <button 
        onClick={handleSave} 
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded flex items-center"
      >
        <Save size={20} className="mr-2" />
        Save Settings
      </button>
      {updateMessage && (
        <p className={`mt-2 ${updateMessage.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
          {updateMessage}
        </p>
      )}
    </div>
  );
};

export default Settings;