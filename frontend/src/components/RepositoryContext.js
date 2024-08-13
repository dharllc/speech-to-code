import React, { useState, useEffect } from 'react';
import * as repositoryService from '../services/repositoryService';

const RepositoryContext = ({ onFileSelect }) => {
  const [repository, setRepository] = useState('');
  const [tree, setTree] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (repository) {
      loadTree();
    }
  }, [repository]);

  const loadTree = async () => {
    try {
      const treeData = await repositoryService.getTree(repository);
      setTree(treeData);
    } catch (error) {
      console.error('Failed to load repository tree:', error);
    }
  };

  const handleFileSelect = async (path) => {
    try {
      const content = await repositoryService.getFileContent(repository, path);
      const updatedFiles = [...selectedFiles, { path, content }];
      setSelectedFiles(updatedFiles);
      onFileSelect(updatedFiles);
    } catch (error) {
      console.error('Failed to load file content:', error);
    }
  };

  const renderTree = (node) => (
    <ul key={node.path}>
      <li>
        {node.type === 'file' ? (
          <button onClick={() => handleFileSelect(node.path)}>{node.name}</button>
        ) : (
          <span>{node.name}</span>
        )}
      </li>
      {node.children && node.children.map(renderTree)}
    </ul>
  );

  return (
    <div>
      <select onChange={(e) => setRepository(e.target.value)}>
        <option value="">Select a repository</option>
        {/* Add repository options here */}
      </select>
      {tree && renderTree(tree)}
    </div>
  );
};

export default RepositoryContext;