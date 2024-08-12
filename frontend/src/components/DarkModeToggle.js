import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('dark-mode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
      document.documentElement.classList.toggle('dark', savedMode === 'true');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('dark-mode', newMode);
  };

  return (
    <button onClick={toggleDarkMode} className="p-2 rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

export default DarkModeToggle;