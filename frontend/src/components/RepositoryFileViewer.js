import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RepositoryFileViewer = ({ selectedRepository, onFileSelect, selectedFiles }) => {
  const [treeStructure, setTreeStructure] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [lineCounts, setLineCounts] = useState({});

  useEffect(() => {
    if (selectedRepository) {
      fetchTreeStructure(selectedRepository);
    }
  }, [selectedRepository]);

  const fetchTreeStructure = async (repo) => {
    try {
      const response = await axios.get(`http://localhost:8000/tree?repository=${repo}`);
      const tree = JSON.parse(response.data.tree);
      setTreeStructure(tree);
      initializeExpandedFolders(tree);
      fetchAllLineCounts(repo, tree);
    } catch (error) {
      console.error('Failed to fetch tree structure:', error);
    }
  };

  const fetchAllLineCounts = async (repo, tree) => {
    const allPaths = getAllFilePaths(tree);
    const counts = {};
    
    for (const path of allPaths) {
      try {
        const cleanPath = path.replace(new RegExp(`^/${repo}/`), '');
        const response = await axios.get(`http://localhost:8000/file_lines?repository=${repo}&file_path=${cleanPath}`);
        counts[path] = response.data.line_count;
      } catch (error) {
        console.error(`Failed to fetch line count for ${path}:`, error);
        counts[path] = 'N/A';
      }
    }
    
    setLineCounts(counts);
  };

  const getAllFilePaths = (node, basePath = '') => {
    const currentPath = `${basePath}/${node.name}`;
    if (node.type === 'file') return [currentPath];
    return node.children.flatMap(child => getAllFilePaths(child, currentPath));
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

  const countFiles = (node) => {
    if (node.type === 'file') return 1;
    return node.children.reduce((acc, child) => acc + countFiles(child), 0);
  };

  const handleFileClick = (node, path) => {
    const cleanPath = path.replace(new RegExp(`^/${selectedRepository}/`), '');
    onFileSelect({ ...node, path: cleanPath });
  };

  const renderTree = (node, path = '') => {
    if (!node) return null;
    const currentPath = `${path}/${node.name}`;
    const isSelected = selectedFiles.some(file => file.path === currentPath.replace(new RegExp(`^/${selectedRepository}/`), ''));
    const isExpanded = expandedFolders[currentPath];

    const showLineCount = ['js', 'py', 'md', 'txt'].includes(node.name.split('.').pop().toLowerCase());

    return (
      <div key={currentPath} className="ml-4">
        <div
          className={`cursor-pointer ${isSelected ? 'bg-blue-200' : ''} hover:bg-gray-100 flex items-center`}
          onClick={() => node.type === 'directory' ? toggleFolder(currentPath) : handleFileClick(node, currentPath)}
        >
          <span className="mr-2">{node.type === 'directory' ? (isExpanded ? '📂' : '📁') : '📄'}</span>
          <span className="flex-grow">{node.name}</span>
          {node.type === 'directory' && (
            <span className="ml-2 text-xs text-gray-500">({countFiles(node)} files)</span>
          )}
          {node.type === 'file' && showLineCount && lineCounts[currentPath] !== undefined && (
            <span className="ml-2 text-xs text-gray-500">({lineCounts[currentPath]} lines)</span>
          )}
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