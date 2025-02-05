import { useState, useEffect } from 'react';

const MAX_COMBINATIONS = 5;
const STORAGE_KEY_PREFIX = 'fileCombinations_';

export const useFileCombinations = (selectedRepository) => {
  const [combinations, setCombinations] = useState([]);

  // Load combinations from localStorage when repository changes
  useEffect(() => {
    if (selectedRepository) {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${selectedRepository}`);
      setCombinations(stored ? JSON.parse(stored) : []);
    } else {
      setCombinations([]);
    }
  }, [selectedRepository]);

  // Save combinations to localStorage whenever they change
  useEffect(() => {
    if (selectedRepository) {
      if (combinations.length > 0) {
        localStorage.setItem(
          `${STORAGE_KEY_PREFIX}${selectedRepository}`,
          JSON.stringify(combinations)
        );
      } else {
        // If there are no combinations, remove the key from localStorage
        localStorage.removeItem(`${STORAGE_KEY_PREFIX}${selectedRepository}`);
      }
    }
  }, [combinations, selectedRepository]);

  const addCombination = (files, totalTokens) => {
    if (!files || files.length === 0) return;

    const newCombination = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      repository: selectedRepository,
      files: files.map(file => ({
        path: file.path,
        type: file.type,
        files: file.type === 'directory' ? file.files.map(f => ({ path: f.path })) : undefined
      })),
      totalTokens
    };

    setCombinations(prev => {
      // Check for duplicates (same files regardless of order)
      const isDuplicate = prev.some(comb => 
        comb.files.length === files.length &&
        comb.files.every(file => 
          files.some(f => f.path === file.path)
        )
      );

      if (isDuplicate) return prev;

      // Add new combination and limit to MAX_COMBINATIONS
      const updated = [newCombination, ...prev].slice(0, MAX_COMBINATIONS);
      return updated;
    });
  };

  const removeCombination = (combinationId) => {
    setCombinations(prev => {
      const updated = prev.filter(c => c.id !== combinationId);
      // If this was the last combination, the useEffect above will clean up localStorage
      return updated;
    });
  };

  const clearCombinations = () => {
    setCombinations([]);
    if (selectedRepository) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${selectedRepository}`);
    }
  };

  return {
    combinations,
    addCombination,
    removeCombination,
    clearCombinations
  };
}; 