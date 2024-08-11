import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (selectedRepository) {
      fetchTreeStructure(selectedRepository);
    }
  }, [selectedRepository]);

  const fetchTreeStructure = async (repo) => {
    try {
      const response = await axios.get(`http://localhost:8000/tree?repository=${repo}`);
      setTreeStructure(JSON.parse(response.data.tree));
      initializeExpandedFolders(JSON.parse(response.data.tree));
    } catch (error) {
      console.error('Failed to fetch tree structure:', error);
    }
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

  const handleFileClick = (node, path, event) => {
    const cleanPath = path.replace(new RegExp(`^/${selectedRepository}/`), '');
    if (node.type === 'directory') {
      toggleFolder(path);
    } else if (event.detail === 2) {  // Double click
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
            isSelected ? 'bg-blue-100 font-semibold' : ''
          } hover:bg-gray-50 flex items-center py-0.5 px-1 rounded`}
          onClick={(e) => handleFileClick(node, currentPath, e)}
        >
          <Icon className={`mr-1 ${node.type === 'directory' ? 'text-yellow-500' : 'text-gray-500'}`} size={14} />
          <span className="truncate">{node.name}</span>
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
    <div className="h-full overflow-auto">
      <h3 className="text-lg font-bold mb-2">Repository Structure</h3>
      {treeStructure ? renderTree(treeStructure) : <p>Loading repository structure...</p>}
    </div>
  );
};

export default RepositoryFileViewer;