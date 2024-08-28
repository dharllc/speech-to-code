import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import RepositorySelector from './components/RepositorySelector';
import TwoColumnLayout from './components/TwoColumnLayout';
import DarkModeToggle from './components/DarkModeToggle';
import SystemPromptManagement from './components/SystemPromptManagement';
import LLMInteraction from './components/LLMInteraction';
import Settings from './components/Settings';

function App() {
  const [selectedRepository, setSelectedRepository] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [userPrompt, setUserPrompt] = useState('');

  useEffect(() => {
    const storedRepo = localStorage.getItem('selectedRepository');
    if (storedRepo) {
      setSelectedRepository(storedRepo);
    }
  }, []);

  const handleRepositorySelect = (repo) => {
    console.log("Selected repository:", repo);
    setSelectedRepository(repo);
    setSelectedFiles([]);
    localStorage.setItem('selectedRepository', repo);
  };

  const handleFileSelectionChange = (file, isSelected) => {
    setSelectedFiles(prev => {
      if (isSelected) {
        return prev.some(f => f.path === file.path) ? prev : [...prev, file];
      } else {
        return prev.filter(f => f.path !== file.path);
      }
    });
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
  };

  return (
    <Router>
      <div className="flex h-screen bg-white dark:bg-gray-900">
        {/* Sidebar */}
        <div className="w-64 bg-gray-100 dark:bg-gray-800">
          <nav className="mt-5">
            <ul>
              <li>
                <NavLink to="/" className={({ isActive }) => 
                  `block py-2 px-4 ${isActive ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}`
                } end>
                  Prompt Composer
                </NavLink>
              </li>
              <li>
                <NavLink to="/system-prompt" className={({ isActive }) => 
                  `block py-2 px-4 ${isActive ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}`
                }>
                  System Prompts
                </NavLink>
              </li>
              <li>
                <NavLink to="/llm-interaction" className={({ isActive }) => 
                  `block py-2 px-4 ${isActive ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}`
                }>
                  Prompt UI
                </NavLink>
              </li>
              <li>
                <NavLink to="/settings" className={({ isActive }) => 
                  `block py-2 px-4 ${isActive ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}`
                }>
                  Settings
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Speech-to-Code</h1>
            <DarkModeToggle />
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
            <Routes>
              <Route path="/" element={
                <TwoColumnLayout
                  selectedRepository={selectedRepository}
                  selectedFiles={selectedFiles}
                  onFileSelectionChange={handleFileSelectionChange}
                  onClearAllFiles={handleClearAllFiles}
                  setUserPrompt={setUserPrompt}
                />
              } />
              <Route path="/system-prompt" element={<SystemPromptManagement />} />
              <Route path="/llm-interaction" element={<LLMInteraction initialPrompt={userPrompt} />} />
              <Route path="/settings" element={
                <Settings
                  selectedRepository={selectedRepository}
                  onRepositorySelect={handleRepositorySelect}
                />
              } />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;