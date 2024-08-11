import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

  const renderTree = (node, path = '') => {
    if (!node) return null;
    const currentPath = `${path}/${node.name}`;
    const cleanPath = currentPath.replace(new RegExp(`^/${selectedRepository}/`), '');
    const isSelected = selectedFiles.some(file => file.path === cleanPath);
    const isExpanded = expandedFolders[currentPath];

    return (
      <div key={currentPath} className="ml-4">
        <div
          className={`cursor-pointer ${isSelected ? 'bg-blue-200' : ''} hover:bg-gray-100 flex items-center`}
          onClick={(e) => handleFileClick(node, currentPath, e)}
        >
          <span className="mr-2">{node.type === 'directory' ? (isExpanded ? '📂' : '📁') : '📄'}</span>
          <span className="flex-grow">{node.name}</span>
        </div>
        {node.type === 'directory' && isExpanded && node.children.map(child => renderTree(child, currentPath))}
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