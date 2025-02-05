// Filename: frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import { MenuIcon, HomeIcon, SlidersIcon, TerminalIcon, Settings2Icon } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    return savedState !== null ? savedState === 'true' : window.innerWidth >= 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      const shouldBeOpen = window.innerWidth >= 1024;
      setIsSidebarOpen(shouldBeOpen);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const storedRepo = localStorage.getItem('selectedRepository');
    if (storedRepo) setSelectedRepository(storedRepo);
  }, []);

  const handleRepositorySelect = (repo) => {
    setSelectedRepository(repo);
    setSelectedFiles([]);
    localStorage.setItem('selectedRepository', repo);
  };

  const handleFileSelectionChange = (file, isSelected) => {
    setSelectedFiles(prev => {
      if (isSelected) return prev.some(f => f.path === file.path) ? prev : [...prev, file];
      return prev.filter(f => f.path !== file.path);
    });
  };

  const handleBatchFileSelection = (files) => {
    // Clear existing files first
    setSelectedFiles([]);
    // Then add all new files
    setSelectedFiles(files);
  };

  const handleClearAllFiles = () => setSelectedFiles([]);
  
  const toggleSidebar = () => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', newState.toString());
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex items-center px-3 py-2 gap-2
        ${isActive ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}
        transition-colors duration-150 ease-in-out
      `}
      end
    >
      <Icon size={18} />
      <span className="text-sm font-medium truncate">{label}</span>
    </NavLink>
  );

  return (
    <Router>
      <div className="flex h-screen bg-white dark:bg-gray-900">
        <div className={`h-full bg-gray-100 dark:bg-gray-800 transition-all duration-300 ease-in-out flex-shrink-0 ${
          isSidebarOpen ? 'w-48' : 'w-0'
        } overflow-hidden`}>
          <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-lg font-semibold text-gray-800 dark:text-white truncate">Navigation</span>
          </div>
          <nav className="space-y-1">
            <NavItem to="/" icon={HomeIcon} label="Prompt Composer" />
            <NavItem to="/system-prompt" icon={SlidersIcon} label="System Prompts" />
            <NavItem to="/llm-interaction" icon={TerminalIcon} label="Prompt UI" />
            <NavItem to="/settings" icon={Settings2Icon} label="Settings" />
          </nav>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
          <header className="h-16 flex items-center px-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={toggleSidebar} 
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
              aria-label="Toggle navigation menu"
            >
              <MenuIcon 
                size={24} 
                className={`text-gray-600 dark:text-gray-300 transform transition-transform duration-300 ${
                  isSidebarOpen ? 'rotate-90' : 'rotate-0'
                }`} 
              />
            </button>
            <h1 className="ml-4 text-xl font-bold text-gray-800 dark:text-white">Speech-to-Code</h1>
            <div className="ml-auto">
              <DarkModeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
            <div className="p-4">
              <Routes>
                <Route path="/" element={
                  <TwoColumnLayout 
                    selectedRepository={selectedRepository} 
                    selectedFiles={selectedFiles} 
                    onFileSelectionChange={handleFileSelectionChange}
                    onBatchFileSelection={handleBatchFileSelection}
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
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;