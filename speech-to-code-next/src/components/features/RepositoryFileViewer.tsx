import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  FiFolder, FiFile, FiCode, FiFileText, FiSearch, 
  FiPlus, FiMinus, FiAlertTriangle, FiEye, FiEyeOff, FiX, FiCheck 
} from 'react-icons/fi';
import { API_URL } from '@/lib/config/api';
import type { IconType } from 'react-icons';
import type { 
  TreeNode, 
  FileTypes, 
  WarningResult, 
  RepositoryFileViewerProps, 
  FolderSelectionState,
  ExpandedFolders
} from '@/types/repository';

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

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const shouldWarnAboutFile = (name: string, type: string, tokenCount: number = 0): WarningResult => {
  if (tokenCount > 100000) {
    return { warn: true, reason: 'Large file (>100k tokens)', tokenWarning: true };
  }
  
  if (type === 'file') {
    if (WARNING_PATTERNS.files.includes(name)) {
      return { warn: true, reason: 'System/Configuration file', skipTokenCount: true };
    }
    const ext = name.includes('.') ? '.' + name.split('.').pop()!.toLowerCase() : null;
    if (ext && WARNING_PATTERNS.extensions.includes(ext)) {
      return { warn: true, reason: 'Binary/Media file', skipTokenCount: true };
    }
  }
  
  return { warn: false };
};

interface FileTypeButtonsProps {
  fileTypes: FileTypes;
  selectedFiles: TreeNode[];
  onTypeSelect: (ext: string, files: TreeNode[]) => void;
}

const FileTypeButtons: React.FC<FileTypeButtonsProps> = ({ fileTypes, selectedFiles, onTypeSelect }) => {
  const getTypeState = (ext: string): boolean => {
    const fileType = fileTypes[ext];
    if (!fileType) return false;
    const filesOfType = fileType.files.filter(file => 
      selectedFiles.some(selected => selected.path === file.path)
    );
    return filesOfType.length === fileType.count;
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

const getFileIcon = (type: string, name: string): IconType => {
  if (type === 'directory') return FiFolder;
  if (name.endsWith('.js') || name.endsWith('.py')) return FiCode;
  if (name.endsWith('.md') || name.endsWith('.txt')) return FiFileText;
  return FiFile;
};

/**
 * Recursively gather all files in a folder node (ignoring warned files).
 */
const getAllFilesInFolder = (node: TreeNode, fullPath: string, repositoryName: string): TreeNode[] => {
  let collected: TreeNode[] = [];
  
  // Clean path relative to the repository
  const cleanFullPath = fullPath.replace(new RegExp(`^/${repositoryName}/`), '');

  if (node.type === 'file') {
    // Check if we should exclude this file
    const warning = shouldWarnAboutFile(node.name, node.type, node.token_count);
    if (!warning.warn) {
      collected.push({ ...node, path: cleanFullPath });
    }
  } else if (node.children) {
    node.children.forEach(child => {
      const childPath = `${fullPath}/${child.name}`;
      collected = [
        ...collected,
        ...getAllFilesInFolder(child, childPath, repositoryName)
      ];
    });
  }
  return collected;
};

/**
 * Determines whether a folder is:
 * - "none": no files selected
 * - "partial": some (but not all) files selected
 * - "all": all files selected
 */
const getFolderSelectionState = (
  node: TreeNode, 
  fullPath: string, 
  selectedFiles: TreeNode[], 
  repositoryName: string
): FolderSelectionState => {
  if (!node || node.type !== 'directory') return 'none';

  const allFolderFiles = getAllFilesInFolder(node, fullPath, repositoryName);
  if (allFolderFiles.length === 0) return 'none';

  let selectedCount = 0;
  allFolderFiles.forEach(file => {
    if (selectedFiles.some(sel => sel.path === file.path)) {
      selectedCount++;
    }
  });

  if (selectedCount === 0) {
    return 'none';
  } else if (selectedCount === allFolderFiles.length) {
    return 'all';
  }
  return 'partial';
};

const RepositoryFileViewer: React.FC<RepositoryFileViewerProps> = ({ 
  selectedRepository, 
  onFileSelect, 
  selectedFiles 
}) => {
  const [treeStructure, setTreeStructure] = useState<TreeNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<ExpandedFolders>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredPaths, setFilteredPaths] = useState<Set<string>>(new Set());
  const [showWarnedFiles, setShowWarnedFiles] = useState<boolean>(false);
  const [instanceId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('currentInstanceId') || '';
  });

  const fileTypes = useMemo<FileTypes>(() => {
    if (!treeStructure) return {};
    const types: FileTypes = {};
    
    const processNode = (node: TreeNode, path: string = ''): void => {
      if (node.type === 'file') {
        const warning = shouldWarnAboutFile(node.name, node.type, node.token_count);
        if (!warning.warn) {
          const ext = node.name.includes('.') 
            ? '.' + node.name.split('.').pop()!.toLowerCase() 
            : null;

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

  const handleTypeSelect = (_ext: string, files: TreeNode[]): void => {
    const filesOfType = files.map(f => f.path);
    const selectedOfType = selectedFiles.filter(f => filesOfType.includes(f.path!));
    const isTypeFullySelected = selectedOfType.length === files.length;

    if (isTypeFullySelected) {
      // Deselect
      files.forEach(file => {
        onFileSelect(file, false);
      });
    } else {
      // Select
      files.forEach(file => {
        if (!selectedFiles.some(f => f.path === file.path)) {
          onFileSelect(file, true);
        }
      });
    }
  };

  const sortTreeStructure = useCallback(function sortTreeStructureRecursive(node: TreeNode): TreeNode {
    if (node.type === 'directory' && node.children) {
      // Calculate total token count for directories
      node.children.forEach(child => {
        if (child.type === 'directory' && child.children) {
          child.total_token_count = child.children.reduce((sum, n) => {
            return sum + (n.token_count || 0) + (n.total_token_count || 0);
          }, 0);
        }
      });

      node.children = node.children.sort((a, b) => {
        if (a.type === b.type) {
          // For same type (both files or both directories), sort by token count
          const aTokens = a.type === 'directory' ? (a.total_token_count || 0) : (a.token_count || 0);
          const bTokens = b.type === 'directory' ? (b.total_token_count || 0) : (b.token_count || 0);
          return bTokens - aTokens; // Descending order
        }
        return a.type === 'directory' ? -1 : 1; // Still keep directories first
      });
      
      // Recursively sort children
      node.children.forEach(sortTreeStructureRecursive);
    }
    return node;
  }, []);

  const fetchTreeStructure = useCallback(async (repo: string) => {
    try {
      const response = await axios.get(`${API_URL}/tree?repository=${repo}`);
      const parsedTree: TreeNode = JSON.parse(response.data.tree);
      const sortedTree = sortTreeStructure(parsedTree);
      setTreeStructure(sortedTree);
      
      // Load saved state or initialize all folders as expanded
      const savedState = typeof window !== 'undefined' ? sessionStorage.getItem(`${instanceId}_expandedFolders-${repo}`) : null;
      if (savedState) {
        setExpandedFolders(JSON.parse(savedState));
      } else {
        const initialState: ExpandedFolders = {};
        const initializeFolders = (node: TreeNode, path: string = ''): void => {
          if (node.type === 'directory') {
            initialState[path] = true;
            node.children?.forEach(child => 
              initializeFolders(child, `${path}/${node.name}`)
            );
          }
        };
        initializeFolders(sortedTree);
        setExpandedFolders(initialState);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`${instanceId}_expandedFolders-${repo}`, JSON.stringify(initialState));
        }
      }
    } catch (error) {
      console.error('Failed to fetch tree structure:', error);
    }
  }, [instanceId, sortTreeStructure]);

  useEffect(() => {
    if (selectedRepository) {
      fetchTreeStructure(selectedRepository);
    }
  }, [selectedRepository, fetchTreeStructure]);

  const toggleFolder = (path: string): void => {
    const newState = {
      ...expandedFolders,
      [path]: !expandedFolders[path]
    };
    setExpandedFolders(newState);
    if (typeof window !== 'undefined' && selectedRepository) {
      sessionStorage.setItem(`${instanceId}_expandedFolders-${selectedRepository}`, JSON.stringify(newState));
    }
  };

  /**
   * Select or Deselect all valid (non-warned) files in a folder.
   */
  const selectFolder = (node: TreeNode, path: string): void => {
    if (!selectedRepository) return;
    
    const files = getAllFilesInFolder(node, path, selectedRepository);

    // If all these files are already selected, then we remove them; otherwise we add them
    const isFolderFullySelected = files.every(file =>
      selectedFiles.some(selected => selected.path === file.path)
    );

    files.forEach(file => {
      onFileSelect(file, !isFolderFullySelected);
    });
  };

  useEffect(() => {
    if (!treeStructure || !searchTerm) {
      setFilteredPaths(new Set());
      return;
    }

    const paths = new Set<string>();
    const matchingFolders = new Set<string>();
    
    const searchFiles = (node: TreeNode, path: string = ''): void => {
      const currentPath = `${path}/${node.name}`;
      
      // If this node matches the search term
      if (node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        paths.add(currentPath);
        
        // If it's a folder, add it to matching folders set
        if (node.type === 'directory') {
          matchingFolders.add(currentPath);
        }
        
        // Add all parent paths to ensure they're visible
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
    
    // Store both regular paths and matching folders in the filtered paths
    setFilteredPaths(paths);
    // Store matching folders separately
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        `${instanceId}_matchingFolders-${searchTerm}`, 
        JSON.stringify(Array.from(matchingFolders))
      );
    }
    
    // Auto-expand all matching folders
    if (paths.size > 0) {
      const newExpandedFolders: ExpandedFolders = {};
      paths.forEach(path => {
        const parts = path.split('/');
        let current = '';
        parts.forEach(part => {
          if (part) {
            current += `/${part}`;
            newExpandedFolders[current] = true;
          }
        });
      });
      setExpandedFolders(prev => ({ ...prev, ...newExpandedFolders }));
    }
  }, [searchTerm, treeStructure, instanceId]);

  const shouldShowNode = (node: TreeNode, path: string): boolean => {
    if (!searchTerm) return true;
    
    // Get the matching folders from session storage
    const matchingFoldersStr = typeof window !== 'undefined' ? sessionStorage.getItem(`${instanceId}_matchingFolders-${searchTerm}`) : null;
    const matchingFolders = matchingFoldersStr ? new Set(JSON.parse(matchingFoldersStr)) : new Set();
    
    // If any parent folder matches the search term, show all its contents
    const pathParts = path.split('/');
    let currentPath = '';
    for (const part of pathParts) {
      if (part) {
        currentPath += `/${part}`;
        if (matchingFolders.has(currentPath)) {
          return true;
        }
      }
    }
    
    // Otherwise, show only if the path is in filtered paths
    return filteredPaths.has(path) || node.name.toLowerCase().includes(searchTerm.toLowerCase());
  };

  const handleFileClick = (node: TreeNode, path: string): void => {
    if (!selectedRepository) return;
    
    const cleanPath = path.replace(new RegExp(`^/${selectedRepository}/`), '');
    if (node.type === 'directory') {
      toggleFolder(path);
    } else {
      const isCurrentlySelected = selectedFiles.some(file => file.path === cleanPath);
      onFileSelect({ ...node, path: cleanPath }, !isCurrentlySelected);
    }
  };

  /**
   * Recursively renders the tree structure.
   */
  const renderTree = (node: TreeNode, path: string = '', depth: number = 0): React.ReactElement | null => {
    if (!node || !selectedRepository) return null;

    const currentPath = `${path}/${node.name}`;
    const cleanPath = currentPath.replace(new RegExp(`^/${selectedRepository}/`), '');
    const warning = node.type === 'file' 
      ? shouldWarnAboutFile(node.name, node.type, node.token_count) 
      : { warn: false };

    if (warning.warn && !showWarnedFiles) return null;

    // Determine folder selection state if directory
    let folderSelectionState: FolderSelectionState = 'none';
    if (node.type === 'directory') {
      folderSelectionState = getFolderSelectionState(
        node, 
        currentPath, 
        selectedFiles, 
        selectedRepository
      );
    }

    const isExpanded = expandedFolders[currentPath];
    const Icon = getFileIcon(node.type, node.name);

    // Check if file is currently selected
    const isFileSelected = node.type === 'file' && selectedFiles.some(file => file.path === cleanPath);

    if (!shouldShowNode(node, currentPath)) return null;


    // Tri-state icon for the right-hand button in directories
    const getFolderControlIcon = (state: FolderSelectionState): React.ReactElement => {
      switch (state) {
        case 'all':
          return <FiCheck size={12} className="text-gray-500 dark:text-gray-400" />;
        case 'partial':
          return <FiMinus size={12} className="text-gray-500 dark:text-gray-400" />;
        default:
          // none
          return <FiPlus size={12} className="text-gray-500 dark:text-gray-400" />;
      }
    };

    const folderControlAriaLabel = {
      none: 'Select all files in folder',
      partial: 'Partially selected - click to select/deselect all files',
      all: 'Deselect all files in folder'
    }[folderSelectionState];

    return (
      <div key={currentPath} className={`ml-${depth} text-sm`}>
        <div
          className={`
            flex items-center py-0.5 px-1 rounded transition-colors duration-150
            ${warning.warn ? 'opacity-75' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
            ${
              // If this node is a file and it is selected, highlight the row
              isFileSelected 
                ? 'bg-blue-50 dark:bg-blue-800' 
                : ''
            }
            cursor-pointer
          `}
          onClick={() => handleFileClick(node, currentPath)}
        >
          <div className="flex items-center flex-grow">
            {/* Folder/File icon */}
            <Icon
              className={`
                mr-1
                ${
                  node.type === 'directory'
                    ? folderSelectionState === 'all'
                      ? 'text-green-500'
                      : folderSelectionState === 'partial'
                        ? 'text-blue-500'
                        : 'text-yellow-500'
                    : warning.warn
                      ? 'text-red-500 dark:text-red-400'
                      : isFileSelected 
                        ? 'text-blue-600 dark:text-blue-300'
                        : 'text-gray-500 dark:text-gray-400'
                }
              `}
              size={14}
            />
            
            {/* File/Folder name */}
            <span
              className={`
                truncate flex-grow
                ${
                  warning.warn 
                    ? 'text-gray-500 dark:text-gray-500'
                    : isFileSelected
                      ? 'text-blue-800 dark:text-blue-100 font-medium'
                      : 'text-gray-900 dark:text-gray-100'
                }
              `}
            >
              {node.name}
            </span>

            {/* If the file is selected, show a small check mark */}
            {isFileSelected && node.type === 'file' && (
              <FiCheck 
                className="ml-1 text-blue-600 dark:text-blue-300" 
                size={14}
                title="This file is selected"
              />
            )}

            {/* Warning icon if needed */}
            {warning.warn && (
              <FiAlertTriangle 
                className="ml-1 text-red-500 dark:text-red-400" 
                size={14}
                title={warning.reason || 'Warning'}
              />
            )}
          </div>

          {/* Folder-level select/deselect button */}
          {node.type === 'directory' && (
            <button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                selectFolder(node, currentPath);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              aria-label={folderControlAriaLabel}
            >
              {getFolderControlIcon(folderSelectionState)}
            </button>
          )}

          {/* Token/item counts */}
          <span
            className={`
              text-xs ml-2 pr-2
              ${warning.warn 
                ? 'text-red-500 dark:text-red-400' 
                : 'text-gray-500 dark:text-gray-400'
              }
            `}
          >
            {node.type === 'directory'
              ? `${formatNumber(node.item_count || 0)} items${
                  node.total_token_count && !warning.skipTokenCount
                    ? `, ${formatNumber(node.total_token_count)} tokens`
                    : ''
                }`
              : node.token_count && !warning.skipTokenCount
                ? `${formatNumber(node.token_count)} tokens`
                : ''}
          </span>
        </div>

        {/* Render children if expanded */}
        {node.type === 'directory' && isExpanded && node.children && (
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
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 pr-14 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Clear search button */}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-7 top-2.5 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                aria-label="Clear Search"
              >
                <FiX size={18} />
              </button>
            )}
            {/* Search icon */}
            <FiSearch className="absolute right-3 top-2.5 text-gray-400" size={16} />
          </div>

          {/* File type quick-select */}
          {Object.keys(fileTypes).length > 0 && (
            <FileTypeButtons
              fileTypes={fileTypes}
              selectedFiles={selectedFiles}
              onTypeSelect={handleTypeSelect}
            />
          )}
        </div>
      </div>

      {/* File Tree */}
      <div className="mt-3">
        {treeStructure ? (
          renderTree(treeStructure)
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Loading repository structure...
          </p>
        )}
      </div>
    </div>
  );
};

export default RepositoryFileViewer;