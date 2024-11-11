import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { FiFolder, FiFile, FiCode, FiFileText, FiSearch, FiPlus, FiMinus } from 'react-icons/fi';
import { API_URL } from '../config/api';

const CORE_FILE_TYPES = [
 'js', 'jsx', 'ts', 'tsx', 'py', 'go', 'java', 'kt', 'rb', 'rs', 
 'cpp', 'hpp', 'c', 'h', 'json', 'css', 'scss', 'less', 'html', 
 'htm', 'php', 'swift', 'sql'
];

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

 const fileTypes = useMemo(() => {
   if (!treeStructure) return {};
   const types = {};
   
   const processNode = (node, path = '') => {
     if (node.type === 'file') {
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
    // Remove all files of this type
    files.forEach(file => {
      onFileSelect(file, false);
    });
  } else {
    // Add all files of this type that aren't already selected
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
      const aTokens = a.type === 'directory' ? (a.token_count?.total || 0) : (a.token_count || 0);
      const bTokens = b.type === 'directory' ? (b.token_count?.total || 0) : (b.token_count || 0);
      if (aTokens !== bTokens) return bTokens - aTokens;
      return a.name.localeCompare(b.name);
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
             {selectedFiles.some(file => file.path === `${cleanPath}/*`) ? (
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

 return (
   <div className="h-full overflow-auto pr-2">
     <div className="sticky top-0 bg-white dark:bg-gray-800 z-10">
       <h3 className="text-base font-bold mb-2">Repository Structure</h3>
       <div className="space-y-3 pb-3 border-b dark:border-gray-700">
         <div className="relative">
           <input
             type="text"
             placeholder="Search files..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full px-3 py-2 pr-10 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
           />
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