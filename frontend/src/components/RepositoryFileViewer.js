import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiFolder, FiFile, FiCode, FiFileText } from 'react-icons/fi';

const getFileIcon = (type, name) => {
  if (type === 'directory') return FiFolder;
  if (name.endsWith('.js') || name.endsWith('.py')) return FiCode;
  if (name.endsWith('.md') || name.endsWith('.txt')) return FiFileText;
  return FiFile;
};

const RepositoryFileViewer = ({ selectedRepository, onFileSelect, selectedFiles }) => {
  const [treeStructure, setTreeStructure] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});

  const fetchTreeStructure = useCallback(async (repo) => {
    try {
      const response = await axios.get(`http://localhost:8000/tree?repository=${repo}`);
      const parsedTree = JSON.parse(response.data.tree);
      setTreeStructure(parsedTree);
      initializeExpandedFolders(parsedTree);
    } catch (error) {
      console.error('Failed to fetch tree structure:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedRepository) {
      fetchTreeStructure(selectedRepository);
    }
  }, [selectedRepository, fetchTreeStructure]);

  const initializeExpandedFolders = (node, path = '') => {
    if (node.type === 'directory') {
      setExpandedFolders(prev => ({ ...prev, [path]: true }));
      node.children.forEach(child => initializeExpandedFolders(child, `${path}/${node.name}`));
    }
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleFileClick = (node, path, event) => {
    const cleanPath = path.replace(new RegExp(`^/${selectedRepository}/`), '');
    if (node.type === 'directory') {
      toggleFolder(path);
    } else if (event.detail === 2) {
      onFileSelect({ ...node, path: cleanPath });
    }
  };

  const renderTree = (node, path = '', depth = 0) => {
    if (!node) return null;
    const currentPath = `${path}/${node.name}`;
    const cleanPath = currentPath.replace(new RegExp(`^/${selectedRepository}/`), '');
    const isSelected = selectedFiles.some(file => file.path === cleanPath);
    const isExpanded = expandedFolders[currentPath];
    const Icon = getFileIcon(node.type, node.name);
  
    return (
      <div key={currentPath} className={`ml-${depth} text-sm`}>
        <div
          className={`cursor-pointer ${
            isSelected ? 'bg-blue-100 dark:bg-blue-800 font-semibold' : ''
          } hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center py-0.5 px-1 rounded transition-colors duration-150`}
          onClick={(e) => handleFileClick(node, currentPath, e)}
        >
          <Icon className={`mr-1 ${node.type === 'directory' ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'}`} size={14} />
          <span className="truncate flex-grow text-gray-900 dark:text-gray-100">{node.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 pr-2">
            {node.type === 'directory' 
              ? `${node.item_count || 0} items${node.token_count ? `, ${node.token_count} tokens` : ''}`
              : node.token_count ? `${node.token_count} tokens` : ''}
          </span>
        </div>
        {node.type === 'directory' && isExpanded && (
          <div className="ml-2">
            {node.children.map(child => renderTree(child, currentPath, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto pr-2">
      <h3 className="text-base font-bold mb-2">Repository Structure</h3>
      {treeStructure ? renderTree(treeStructure) : <p className="text-sm text-gray-700 dark:text-gray-300">Loading repository structure...</p>}
    </div>
  );
};

export default RepositoryFileViewer;