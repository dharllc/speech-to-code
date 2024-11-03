import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink } from 'react-router-dom';
import { MenuIcon, XIcon } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const storedRepo = localStorage.getItem('selectedRepository');
    if (storedRepo) setSelectedRepository(storedRepo);

    const handleResize = () => {
      const isWide = window.innerWidth >= 768;
      setIsSidebarOpen(isWide);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const handleClearAllFiles = () => setSelectedFiles([]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div className="flex h-screen bg-white dark:bg-gray-900">
        <button 
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 rounded bg-gray-200 dark:bg-gray-700 md:hidden"
          aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {isSidebarOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
        </button>

        <div 
          className={`fixed md:relative w-64 h-full bg-gray-100 dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out z-40
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          <nav className="mt-16 md:mt-5">
            <ul className="space-y-1">
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

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white ml-12 md:ml-0">Speech-to-Code</h1>
            <DarkModeToggle />
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
            <div className="p-4">
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
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;