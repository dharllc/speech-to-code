import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const DarkModeToggle: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedMode = localStorage.getItem('dark-mode');
    let isDarkMode = false;
    
    if (savedMode) {
      isDarkMode = savedMode === 'true';
    } else {
      // Check system preference if no saved preference
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    setDarkMode(isDarkMode);
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, []);

  const toggleDarkMode = (): void => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dark-mode', newMode.toString());
    }
  };

  return (
    <button 
      onClick={toggleDarkMode} 
      className="p-2 rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default DarkModeToggle;