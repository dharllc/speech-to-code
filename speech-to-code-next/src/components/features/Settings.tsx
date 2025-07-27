import React, { useState, useEffect } from 'react';
import RepositorySelector from './RepositorySelector';
import { Eye, EyeOff, Save } from 'lucide-react';
import { API_URL } from '@/lib/config/api';

interface SettingsProps {
  selectedRepository: string | null;
  onRepositorySelect: (repository: string | null) => void;
}

interface EnvVars {
  [key: string]: string;
}

interface ShowApiKeys {
  [key: string]: boolean;
}

const Settings: React.FC<SettingsProps> = ({ selectedRepository, onRepositorySelect }) => {
  const [envVars, setEnvVars] = useState<EnvVars>({});
  const [editedEnvVars, setEditedEnvVars] = useState<EnvVars>({});
  const [showApiKeys, setShowApiKeys] = useState<ShowApiKeys>({});
  const [updateMessage, setUpdateMessage] = useState<string>('');

  useEffect(() => {
    fetchEnvVars();
  }, []);

  const fetchEnvVars = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/env_vars`);
      const data: EnvVars = await response.json();
      setEnvVars(data);
      setEditedEnvVars(data);
      setShowApiKeys(Object.keys(data).reduce<ShowApiKeys>((acc, key) => {
        acc[key] = key === 'REPO_PATH';
        return acc;
      }, {}));
    } catch (error) {
      console.error('Error fetching environment variables:', error);
    }
  };

  const handleSave = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/env_vars`, {
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

  const toggleShowApiKey = (key: string): void => {
    setShowApiKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderEnvVar = (key: string): React.ReactElement => {
    const isApiKey = key.includes('API_KEY');
    return (
      <div key={key} className="mt-4">
        <h3 className="text-xl font-semibold mb-2">{key}</h3>
        <div className="flex items-center">
          <input
            type={showApiKeys[key] ? "text" : "password"}
            value={editedEnvVars[key] || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setEditedEnvVars(prev => ({ ...prev, [key]: e.target.value }))
            }
            className="border rounded px-2 py-1 mr-2 flex-grow bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          />
          {isApiKey && (
            <button 
              onClick={() => toggleShowApiKey(key)} 
              className="p-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {showApiKeys[key] ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <div className="max-w-md">
        <RepositorySelector onSelect={onRepositorySelect} selectedRepository={selectedRepository} />
      </div>
      {selectedRepository && (
        <p className="mt-4">Current repository: {selectedRepository}</p>
      )}
      {Object.entries(envVars).map(([key]) => renderEnvVar(key))}
      <button 
        onClick={handleSave} 
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center transition-colors duration-200"
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