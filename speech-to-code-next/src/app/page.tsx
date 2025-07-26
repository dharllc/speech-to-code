'use client';

import React, { useState, useEffect } from 'react';
import { MenuIcon, HomeIcon, SlidersIcon, TerminalIcon, Settings2Icon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import TwoColumnLayout from '@/components/features/TwoColumnLayout';
import DarkModeToggle from '@/components/features/DarkModeToggle';
import SystemPromptManagement from '@/components/features/SystemPromptManagement';
import LLMInteraction from '@/components/features/LLMInteraction';
import Settings from '@/components/features/Settings';
import type { SelectedFile } from '@/types/prompt';

interface NavItemProps {
  isActive: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}

type ActivePage = 'home' | 'system-prompt' | 'llm-interaction' | 'settings';

export default function Home() {
  const [instanceId] = useState<string>(() => {
    // Get existing instance ID or create a new one
    if (typeof window === 'undefined') return '';
    const existingId = sessionStorage.getItem('currentInstanceId');
    if (existingId) return existingId;
    
    const newId = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('currentInstanceId', newId);
    return newId;
  });

  const [selectedRepository, setSelectedRepository] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const savedState = sessionStorage.getItem(`${instanceId}_sidebarOpen`);
    return savedState !== null ? savedState === 'true' : window.innerWidth >= 1024;
  });

  // Update document title when selected repository changes
  useEffect(() => {
    document.title = selectedRepository 
      ? `Speech-to-Code - ${selectedRepository}`
      : 'Speech-to-Code';
  }, [selectedRepository]);

  useEffect(() => {
    const handleResize = (): void => {
      const shouldBeOpen = window.innerWidth >= 1024;
      setIsSidebarOpen(shouldBeOpen);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !instanceId) return;
    const storedRepo = sessionStorage.getItem(`${instanceId}_selectedRepository`);
    if (storedRepo) setSelectedRepository(storedRepo);
  }, [instanceId]);

  const handleRepositorySelect = (repo: string | null): void => {
    setSelectedRepository(repo || '');
    setSelectedFiles([]);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`${instanceId}_selectedRepository`, repo || '');
    }
  };

  const handleFileSelectionChange = (file: { path: string; type?: string }, isSelected: boolean): void => {
    setSelectedFiles(prev => {
      if (isSelected) {
        // Check if file already exists before adding
        return prev.some(f => f.path === file.path) 
          ? prev 
          : [...prev, file as SelectedFile];
      }
      return prev.filter(f => f.path !== file.path);
    });
  };

  const handleBatchFileSelection = (files: SelectedFile[]): void => {
    // Clear existing files first
    setSelectedFiles([]);
    // Then add all new files
    setSelectedFiles(files);
  };

  const handleClearAllFiles = (): void => setSelectedFiles([]);
  
  const toggleSidebar = (): void => {
    const newState = !isSidebarOpen;
    setIsSidebarOpen(newState);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`${instanceId}_sidebarOpen`, newState.toString());
    }
  };

  const NavItem: React.FC<NavItemProps> = ({ isActive, onClick, icon: Icon, label }) => (
    <button 
      onClick={onClick}
      className={`
        flex items-center px-3 py-2 gap-2 w-full text-left
        ${isActive ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}
        transition-colors duration-150 ease-in-out
      `}
    >
      <Icon size={18} />
      <span className="text-sm font-medium truncate">{label}</span>
    </button>
  );

  const renderActivePage = () => {
    switch (activePage) {
      case 'home':
        return (
          <TwoColumnLayout 
            selectedRepository={selectedRepository} 
            selectedFiles={selectedFiles} 
            onFileSelectionChange={handleFileSelectionChange}
            onBatchFileSelection={handleBatchFileSelection}
            onClearAllFiles={handleClearAllFiles} 
            onRepositorySelect={handleRepositorySelect}
            setUserPrompt={setUserPrompt} 
          />
        );
      case 'system-prompt':
        return <SystemPromptManagement />;
      case 'llm-interaction':
        return <LLMInteraction initialPrompt={userPrompt} />;
      case 'settings':
        return (
          <Settings 
            selectedRepository={selectedRepository} 
            onRepositorySelect={handleRepositorySelect} 
          />
        );
      default:
        return (
          <TwoColumnLayout 
            selectedRepository={selectedRepository} 
            selectedFiles={selectedFiles} 
            onFileSelectionChange={handleFileSelectionChange}
            onBatchFileSelection={handleBatchFileSelection}
            onClearAllFiles={handleClearAllFiles} 
            onRepositorySelect={handleRepositorySelect}
            setUserPrompt={setUserPrompt} 
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <div className={`h-full bg-gray-100 dark:bg-gray-800 transition-all duration-300 ease-in-out flex-shrink-0 ${
        isSidebarOpen ? 'w-48' : 'w-0'
      } overflow-hidden`}>
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-lg font-semibold text-gray-800 dark:text-white truncate">Navigation</span>
        </div>
        <nav className="space-y-1">
          <NavItem 
            isActive={activePage === 'home'} 
            onClick={() => setActivePage('home')} 
            icon={HomeIcon} 
            label="Prompt Composer" 
          />
          <NavItem 
            isActive={activePage === 'system-prompt'} 
            onClick={() => setActivePage('system-prompt')} 
            icon={SlidersIcon} 
            label="System Prompts" 
          />
          <NavItem 
            isActive={activePage === 'llm-interaction'} 
            onClick={() => setActivePage('llm-interaction')} 
            icon={TerminalIcon} 
            label="Prompt UI" 
          />
          <NavItem 
            isActive={activePage === 'settings'} 
            onClick={() => setActivePage('settings')} 
            icon={Settings2Icon} 
            label="Settings" 
          />
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
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
}