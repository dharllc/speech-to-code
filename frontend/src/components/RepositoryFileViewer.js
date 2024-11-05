import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FiFolder, FiFile, FiCode, FiFileText, FiCheck, FiSquare, FiSearch, FiPlus, FiMinus } from 'react-icons/fi';
import { API_URL } from '../config/api';

const getFileIcon = (type, name) => {
  if (type === 'directory') return FiFolder;
  if (name.endsWith('.js') || name.endsWith('.py')) return FiCode;
  if (name.endsWith('.md') || name.endsWith('.txt')) return FiFileText;
  return FiFile;
};

const RepositoryFileViewer = ({ selectedRepository, onFileSelect, selectedFiles }) => {
  const [treeStructure, setTreeStructure] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPaths, setFilteredPaths] = useState(new Set());

  const fetchTreeStructure = useCallback(async (repo) => {
    try {
      const response = await axios.get(`${API_URL}/tree?repository=${repo}`);
      const parsedTree = JSON.parse(response.data.tree);
      const sortedTree = sortTreeStructure(parsedTree);
      setTreeStructure(sortedTree);
      initializeExpandedFolders(sortedTree);
    } catch (error) {
      console.error('Failed to fetch tree structure:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedRepository) {
      fetchTreeStructure(selectedRepository);
    }
  }, [selectedRepository, fetchTreeStructure]);

  const sortTreeStructure = (node) => {
    if (node.type === 'directory' && node.children) {
      node.children = node.children.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return (b.token_count || 0) - (a.token_count || 0);
      });
      node.children.forEach(sortTreeStructure);
    }
    return node;
  };

  const initializeExpandedFolders = (node, path = '') => {
    if (node.type === 'directory') {
      setExpandedFolders(prev => ({ ...prev, [path]: true }));
      node.children.forEach(child => initializeExpandedFolders(child, `${path}/${node.name}`));
    }
  };

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const selectFolder = (node, path) => {
    const getAllFiles = (node, currentPath) => {
      let files = [];
      if (node.type === 'file') {
        const cleanPath = currentPath.replace(new RegExp(`^/${selectedRepository}/`), '');
        files.push({ ...node, path: cleanPath });
      } else if (node.children) {
        node.children.forEach(child => {
          files = [...files, ...getAllFiles(child, `${currentPath}/${child.name}`)];
        });
      }
      return files;
    };

    const files = getAllFiles(node, path);
    const isFolderSelected = files.every(file => 
      selectedFiles.some(selectedFile => selectedFile.path === file.path)
    );

    files.forEach(file => {
      onFileSelect(file, !isFolderSelected);
    });
  };

  useEffect(() => {
    if (!treeStructure || !searchTerm) {
      setFilteredPaths(new Set());
      return;
    }

    const paths = new Set();
    const searchFiles = (node, path = '') => {
      const currentPath = `${path}/${node.name}`;
      if (node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        paths.add(currentPath);
        let parentPath = path;
        while (parentPath) {
          paths.add(parentPath);
          parentPath = parentPath.substring(0, parentPath.lastIndexOf('/'));
        }
      }
      if (node.children) {
        node.children.forEach(child => searchFiles(child, currentPath));
      }
    };

    searchFiles(treeStructure);
    setFilteredPaths(paths);
    
    if (paths.size > 0) {
      const newExpandedFolders = {};
      paths.forEach(path => {
        const parts = path.split('/');
        let currentPath = '';
        parts.forEach(part => {
          currentPath += `${part}/`;
          newExpandedFolders[currentPath.slice(0, -1)] = true;
        });
      });
      setExpandedFolders(prev => ({ ...prev, ...newExpandedFolders }));
    }
  }, [searchTerm, treeStructure]);

  const shouldShowNode = (node, path) => {
    if (!searchTerm) return true;
    return filteredPaths.has(path) || node.name.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const renderTree = (node, path = '', depth = 0) => {
    if (!node) return null;
    const currentPath = `${path}/${node.name}`;
    const cleanPath = currentPath.replace(new RegExp(`^/${selectedRepository}/`), '');
    const isSelected = selectedFiles.some(file => file.path === cleanPath);
    const isExpanded = expandedFolders[currentPath];
    const Icon = getFileIcon(node.type, node.name);
    
    if (!shouldShowNode(node, currentPath)) return null;

    return (
      <div key={currentPath} className={`ml-${depth} text-sm`}>
        <div className={`cursor-pointer ${
          isSelected ? 'bg-blue-100 dark:bg-blue-800 font-semibold' : ''
        } hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center py-0.5 px-1 rounded transition-colors duration-150`}>
          <div className="flex items-center flex-grow" onClick={() => handleFileClick(node, currentPath)}>
            <Icon className={`mr-1 ${node.type === 'directory' ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'}`} size={14} />
            <span className="truncate flex-grow text-gray-900 dark:text-gray-100">{node.name}</span>
          </div>
          {node.type === 'directory' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                selectFolder(node, currentPath);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              {selectedFiles.some(file => file.path.startsWith(cleanPath)) ? (
                <FiMinus size={12} className="text-gray-500 dark:text-gray-400" />
              ) : (
                <FiPlus size={12} className="text-gray-500 dark:text-gray-400" />
              )}
            </button>
          )}
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

  const handleFileClick = (node, path) => {
    const cleanPath = path.replace(new RegExp(`^/${selectedRepository}/`), '');
    if (node.type === 'directory') {
      toggleFolder(path);
    } else {
      const isCurrentlySelected = selectedFiles.some(file => file.path === cleanPath);
      onFileSelect({ ...node, path: cleanPath }, !isCurrentlySelected);
    }
  };

  return (
    <div className="h-full overflow-auto pr-2">
      <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 pb-2">
        <h3 className="text-base font-bold mb-2">Repository Structure</h3>
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pr-10 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FiSearch className="absolute right-3 top-2.5 text-gray-400" size={16} />
        </div>
      </div>
      {treeStructure ? renderTree(treeStructure) : (
        <p className="text-sm text-gray-700 dark:text-gray-300">Loading repository structure...</p>
      )}
    </div>
  );
};

export default RepositoryFileViewer;