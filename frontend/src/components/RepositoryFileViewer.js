// Filename: frontend/src/components/RepositoryFileViewer.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  FiFolder, FiFile, FiCode, FiFileText, FiSearch, 
  FiPlus, FiMinus, FiAlertTriangle, FiEye, FiEyeOff, FiX 
} from 'react-icons/fi';
import { API_URL } from '../config/api';

const CORE_FILE_TYPES = [
  'js', 'jsx', 'ts', 'tsx', 'py', 'go', 'java', 'kt', 'rb', 'rs', 
  'cpp', 'hpp', 'c', 'h', 'json', 'css', 'scss', 'less', 'html', 
  'htm', 'php', 'swift', 'sql', 'yml', 'yaml', 'tf', 'md'
];

const WARNING_PATTERNS = {
  files: [
    'package-lock.json', 'yarn.lock', '.DS_Store', 'Thumbs.db',
    'desktop.ini', '.gitignore', '.dockerignore'
  ],
  extensions: [
    '.log', '.lock', '.pid', '.pyc', '.pyo', '.exe', '.dll', '.so', 
    '.dylib', '.zip', '.tar', '.gz', '.7z', '.rar', '.jpg', '.jpeg', 
    '.png', '.gif', '.bmp', '.ico', '.webp', '.svg', '.mp4', '.webm', 
    '.mov', '.wav', '.mp3', '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.class', '.o', '.obj'
  ]
};

const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const shouldWarnAboutFile = (name, type, tokenCount = 0) => {
  if (tokenCount > 100000) {
    return { warn: true, reason: 'Large file (>100k tokens)', tokenWarning: true };
  }
  
  if (type === 'file') {
    if (WARNING_PATTERNS.files.includes(name)) {
      return { warn: true, reason: 'System/Configuration file', skipTokenCount: true };
    }
    const ext = name.includes('.') ? '.' + name.split('.').pop().toLowerCase() : null;
    if (ext && WARNING_PATTERNS.extensions.includes(ext)) {
      return { warn: true, reason: 'Binary/Media file', skipTokenCount: true };
    }
  }
  
  return { warn: false };
};

const FileTypeButtons = ({ fileTypes, selectedFiles, onTypeSelect }) => {
  const getTypeState = (ext) => {
    const filesOfType = fileTypes[ext].files.filter(file => 
      selectedFiles.some(selected => selected.path === file.path)
    );
    return filesOfType.length === fileTypes[ext].count;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(fileTypes)
        .sort(([,a], [,b]) => b.count - a.count)
        .map(([ext, { count, files }]) => (
          <button
            key={ext}
            onClick={() => onTypeSelect(ext, files)}
            className={`
              inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
              transition-colors duration-150 ease-in-out
              ${getTypeState(ext)
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}
              hover:bg-blue-50 dark:hover:bg-blue-900
            `}
          >
            {ext.substring(1)}
            <span className={`
              ml-1.5 px-1.5 py-0.5 rounded-full text-xs
              ${getTypeState(ext)
                ? 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'}
            `}>
              {count}
            </span>
          </button>
        ))}
    </div>
  );
};

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
  const [showWarnedFiles, setShowWarnedFiles] = useState(false);

  const fileTypes = useMemo(() => {
    if (!treeStructure) return {};
    const types = {};
    
    const processNode = (node, path = '') => {
      if (node.type === 'file') {
        const warning = shouldWarnAboutFile(node.name, node.type, node.token_count);
        if (!warning.warn) {
          const ext = node.name.includes('.') ? 
            '.' + node.name.split('.').pop().toLowerCase() : 
            null;
          if (ext && CORE_FILE_TYPES.includes(ext.substring(1))) {
            if (!types[ext]) {
              types[ext] = { count: 0, files: [] };
            }
            types[ext].count++;
            types[ext].files.push({
              ...node,
              path: `${path}/${node.name}`.replace(new RegExp(`^/${selectedRepository}/`), '')
            });
          }
        }
      }
      if (node.children) {
        node.children.forEach(child => processNode(child, `${path}/${node.name}`));
      }
    };

    processNode(treeStructure);
    return types;
  }, [treeStructure, selectedRepository]);

  const handleTypeSelect = (ext, files) => {
    const filesOfType = files.map(f => f.path);
    const selectedOfType = selectedFiles.filter(f => filesOfType.includes(f.path));
    const isTypeFullySelected = selectedOfType.length === files.length;

    if (isTypeFullySelected) {
      files.forEach(file => {
        onFileSelect(file, false);
      });
    } else {
      files.forEach(file => {
        if (!selectedFiles.some(f => f.path === file.path)) {
          onFileSelect(file, true);
        }
      });
    }
  };

  const fetchTreeStructure = useCallback(async (repo) => {
    try {
      const response = await axios.get(`${API_URL}/tree?repository=${repo}`);
      const parsedTree = JSON.parse(response.data.tree);
      const sortedTree = sortTreeStructure(parsedTree);
      setTreeStructure(sortedTree);
      
      // Load saved state or initialize all folders as expanded
      const savedState = localStorage.getItem(`expandedFolders-${repo}`);
      if (savedState) {
        setExpandedFolders(JSON.parse(savedState));
      } else {
        const initialState = {};
        const initializeFolders = (node, path = '') => {
          if (node.type === 'directory') {
            initialState[path] = true;
            node.children?.forEach(child => 
              initializeFolders(child, `${path}/${node.name}`)
            );
          }
        };
        initializeFolders(sortedTree);
        setExpandedFolders(initialState);
        localStorage.setItem(`expandedFolders-${repo}`, JSON.stringify(initialState));
      }
    } catch (error) {
      console.error('Failed to fetch tree structure:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedRepository) {
      fetchTreeStructure(selectedRepository);
    }
  }, [selectedRepository, fetchTreeStructure]);

  const toggleFolder = (path) => {
    const newState = {
      ...expandedFolders,
      [path]: !expandedFolders[path]
    };
    setExpandedFolders(newState);
    localStorage.setItem(`expandedFolders-${selectedRepository}`, JSON.stringify(newState));
  };

  const sortTreeStructure = (node) => {
    if (node.type === 'directory' && node.children) {
      node.children = node.children.sort((a, b) => {
        if (a.type === b.type) {
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        }
        return a.type === 'directory' ? -1 : 1;
      });
      node.children.forEach(sortTreeStructure);
    }
    return node;
  };

  const selectFolder = (node, path) => {
    const getAllFiles = (node, currentPath) => {
      let files = [];
      if (node.type === 'file') {
        const warning = shouldWarnAboutFile(node.name, node.type, node.token_count);
        if (!warning.warn) {
          const cleanPath = currentPath.replace(new RegExp(`^/${selectedRepository}/`), '');
          files.push({ ...node, path: cleanPath });
        }
      } else if (node.children) {
        node.children.forEach(child => {
          files = [...files, ...getAllFiles(child, `${currentPath}/${child.name}`)];
        });
      }
      return files;
    };

    const files = getAllFiles(node, path);
    const cleanPath = path.replace(new RegExp(`^/${selectedRepository}/`), '');
    const isFolderSelected = files.every(file => 
      selectedFiles.some(selected => selected.path === file.path)
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
          if (part) {
            currentPath += `/${part}`;
            newExpandedFolders[currentPath] = true;
          }
        });
      });
      setExpandedFolders(prev => ({ ...prev, ...newExpandedFolders }));
    }
  }, [searchTerm, treeStructure]);

  const shouldShowNode = (node, path) => {
    if (!searchTerm) return true;
    return filteredPaths.has(path) || node.name.toLowerCase().includes(searchTerm.toLowerCase());
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

  const renderTree = (node, path = '', depth = 0) => {
    if (!node) return null;

    const currentPath = `${path}/${node.name}`;
    const cleanPath = currentPath.replace(new RegExp(`^/${selectedRepository}/`), '');
    const warning = node.type === 'file' ? shouldWarnAboutFile(node.name, node.type, node.token_count) : { warn: false };

    if (warning.warn && !showWarnedFiles) return null;

    const isSelected = selectedFiles.some(file => 
      file.path === cleanPath || 
      (file.path === `${cleanPath}/*`) ||
      (file.files && file.files.some(f => f.path === cleanPath))
    );
    const isExpanded = expandedFolders[currentPath];
    const Icon = getFileIcon(node.type, node.name);

    if (!shouldShowNode(node, currentPath)) return null;

    return (
      <div key={currentPath} className={`ml-${depth} text-sm`}>
        <div className={`
          cursor-pointer
          ${isSelected ? 'bg-blue-100 dark:bg-blue-800 font-semibold' : ''}
          ${warning.warn ? 'opacity-75' : ''}
          hover:bg-gray-100 dark:hover:bg-gray-700
          flex items-center py-0.5 px-1 rounded transition-colors duration-150
        `}>
          <div className="flex items-center flex-grow" onClick={() => handleFileClick(node, currentPath)}>
            <Icon className={`mr-1 ${
              node.type === 'directory' 
                ? 'text-yellow-500' 
                : warning.warn
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
            }`} size={14} />
            <span className={`truncate flex-grow ${
              warning.warn ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
            }`}>
              {node.name}
            </span>
            {warning.warn && (
              <FiAlertTriangle 
                className="ml-1 text-red-500 dark:text-red-400" 
                size={14}
                title={warning.reason}
              />
            )}
          </div>
          {node.type === 'directory' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                selectFolder(node, currentPath);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              aria-label={selectedFiles.some(file => file.path === `${cleanPath}/*`) ? "Deselect All" : "Select All"}
            >
              {selectedFiles.some(file => file.path === `${cleanPath}/*`) ? (
                <FiMinus size={12} className="text-gray-500 dark:text-gray-400" />
              ) : (
                <FiPlus size={12} className="text-gray-500 dark:text-gray-400" />
              )}
            </button>
          )}
          <span className={`text-xs ml-2 pr-2 ${
            warning.warn ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {node.type === 'directory' 
              ? `${formatNumber(node.item_count || 0)} items${node.token_count && !node.skip_token_count ? `, ${formatNumber(node.token_count)} tokens` : ''}`
              : node.token_count && !node.skip_token_count ? `${formatNumber(node.token_count)} tokens` : ''}
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
      <div className="sticky top-0 bg-white dark:bg-gray-800 z-10">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-bold">Repository Structure</h3>
          <button
            onClick={() => setShowWarnedFiles(!showWarnedFiles)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            aria-label={showWarnedFiles ? "Hide Excluded Files" : "Show Excluded Files"}
          >
            {showWarnedFiles ? (
              <>
                <FiEyeOff size={14} />
                Hide Excluded Files
              </>
            ) : (
              <>
                <FiEye size={14} />
                Show Excluded Files
              </>
            )}
          </button>
        </div>
        <div className="space-y-3 pb-3 border-b dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 pr-14 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Clear (X) Button - Visible Only When There is Text */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-7 top-2.5 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                aria-label="Clear Search"
              >
                <FiX size={18} />
              </button>
            )}
            {/* Search (Magnifying Glass) Icon */}
            <FiSearch className="absolute right-3 top-2.5 text-gray-400" size={16} />
          </div>
          {Object.keys(fileTypes).length > 0 && (
            <FileTypeButtons
              fileTypes={fileTypes}
              selectedFiles={selectedFiles}
              onTypeSelect={handleTypeSelect}
            />
          )}
        </div>
      </div>
      <div className="mt-3">
        {treeStructure ? renderTree(treeStructure) : (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Loading repository structure...
          </p>
        )}
      </div>
    </div>
  );
};

export default RepositoryFileViewer;