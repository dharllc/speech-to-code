import * as fs from 'fs';
import * as path from 'path';

export interface FileMetadata {
  type: string;
  size: number;
  lastModified: string;
  key_elements: string[];
  summary: string;
}

export interface ContextMap {
  repositoryId: string;
  lastUpdated: string;
  files: Record<string, FileMetadata>;
  projectDescription: string;
}

function parsePythonFile(content: string): string[] {
  // Basic Python parsing - extract function names and imports
  const functionMatches = content.match(/def\s+(\w+)/g) || [];
  const functions = functionMatches.map(match => match.replace('def ', ''));
  
  const importMatches = content.match(/(?:import\s+(\w+)|from\s+(\w+)\s+import)/g) || [];
  const imports = importMatches.map(match => {
    const importMatch = match.match(/import\s+(\w+)/);
    const fromMatch = match.match(/from\s+(\w+)/);
    return importMatch?.[1] || fromMatch?.[1] || '';
  }).filter(Boolean);
  
  return [...new Set([...functions, ...imports])];
}

function parseJavaScriptFile(content: string): string[] {
  const functionMatches = content.match(/(?:function\s+(\w+)|(\w+)\s*=\s*(?:function|\([^)]*\)\s*=>))/g) || [];
  const functions = functionMatches.map(match => {
    const nameMatch = match.match(/function\s+(\w+)|(\w+)\s*=/);
    return nameMatch?.[1] || nameMatch?.[2] || '';
  }).filter(Boolean);
  
  const importMatches = content.match(/(?:import\s+{\s*([^}]+)\s*}|import\s+(\w+))\s+from/g) || [];
  const imports = importMatches.map(match => {
    const namedMatch = match.match(/import\s+{\s*([^}]+)\s*}/);
    const defaultMatch = match.match(/import\s+(\w+)\s+from/);
    return namedMatch?.[1]?.split(',').map(s => s.trim()) || [defaultMatch?.[1]];
  }).flat().filter(Boolean);
  
  return [...new Set([...functions, ...imports])];
}

function extractReadmeDescription(content: string): string {
  const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
  if (!lines.length) return '';
  
  const description: string[] = [];
  for (const line of lines) {
    if (line.startsWith('#')) continue;
    description.push(line);
    if (description.join(' ').length > 500) break;
  }
  
  return description.join(' ').slice(0, 500);
}

function getFileMetadata(filepath: string, content: string): FileMetadata {
  const fileType = path.extname(filepath).slice(1).toLowerCase();
  let keyElements: string[] = [];
  let summary = '';

  // Fast categorization based on file type and basic content analysis
  if (['js', 'jsx', 'ts', 'tsx'].includes(fileType)) {
    keyElements = parseJavaScriptFile(content);
    
    const isComponent = ['React.', 'export default', '<div', '<>', 'function', 'const'].some(x => content.includes(x));
    const hasHooks = ['useState', 'useEffect', 'useContext', 'useRef'].some(x => content.includes(x));
    
    const summaryParts: string[] = [];
    if (isComponent) {
      summaryParts.push('React component');
      if (hasHooks) {
        summaryParts.push('with hooks');
      }
    } else if (content.includes('export')) {
      summaryParts.push('JS/TS module');
    }
    
    if (keyElements.length) {
      summaryParts.push(`(${keyElements.length} exports/functions)`);
    }
    
    summary = summaryParts.join(' ') || 'JavaScript/TypeScript file';
    
  } else if (fileType === 'py') {
    keyElements = parsePythonFile(content);
    
    const isApi = ['@app.route', 'fastapi', 'django', 'flask'].some(x => content.includes(x));
    const isClass = content.includes('class ');
    
    const summaryParts: string[] = [];
    if (isApi) {
      summaryParts.push('API endpoints');
    } else if (isClass) {
      summaryParts.push('Python class');
    }
    
    if (keyElements.length) {
      summaryParts.push(`(${keyElements.length} functions/imports)`);
    }
    
    summary = summaryParts.join(' ') || 'Python module';
    
  } else if (['json', 'yaml', 'yml'].includes(fileType)) {
    const isPackage = filepath.toLowerCase().includes('package.json');
    const isConfig = ['config', 'settings', 'next.config'].some(x => filepath.toLowerCase().includes(x));
    
    if (isPackage) {
      summary = 'Package configuration';
    } else if (isConfig) {
      summary = 'Project configuration';
    } else {
      summary = `${fileType.toUpperCase()} data file`;
    }
    
  } else if (fileType === 'md') {
    const isDoc = ['readme', 'doc', 'guide', 'contributing'].some(x => filepath.toLowerCase().includes(x));
    summary = isDoc ? 'Documentation' : 'Markdown file';
    
  } else if (['css', 'scss', 'sass', 'less'].includes(fileType)) {
    const isModule = filepath.toLowerCase().includes('.module.');
    const isGlobal = filepath.toLowerCase().includes('global');
    
    if (isModule) {
      summary = 'CSS Module';
    } else if (isGlobal) {
      summary = 'Global styles';
    } else {
      summary = 'Stylesheet';
    }
    
  } else {
    summary = `${fileType} file`;
  }

  const stats = fs.statSync(filepath);
  
  return {
    type: fileType,
    size: content.length,
    lastModified: stats.mtime.toISOString(),
    key_elements: keyElements,
    summary
  };
}

export function generateContextMap(repoPath: string, repoName: string): ContextMap {
  if (!fs.existsSync(repoPath)) {
    throw new Error(`Repository path not found: ${repoPath}`);
  }

  // Directories to exclude
  const EXCLUDED_DIRS = new Set([
    '.git', 'node_modules', 'venv', '.venv', '__pycache__',
    '.next', // Next.js build output
    'out', // Next.js static export
    'build', // Build directories
    'dist',
    'coverage', // Test coverage
    '.vercel', // Vercel deployment
    'public/static', // Static assets
    '.turbo', // Turborepo cache
    '.mypy_cache', // MyPy cache
    '.pytest_cache', // Pytest cache
    '.ruff_cache', // Ruff cache
    'certs', // Certificate files
    'logs', // Log files
  ]);

  // File extensions to exclude
  const EXCLUDED_EXTENSIONS = new Set([
    // Build artifacts
    'map', // Source maps
    'min.js', 'min.css', // Minified files
    // Binary and media files
    'jpg', 'jpeg', 'png', 'gif', 'ico', 'svg', 'webp',
    'mp3', 'mp4', 'wav', 'ogg', 'webm',
    'pdf', 'doc', 'docx', 'xls', 'xlsx',
    'ttf', 'woff', 'woff2', 'eot',
    // Cache and temporary files
    'cache', 'log', 'tmp',
    // Package management
    'lock',
  ]);

  // Specific files to exclude
  const EXCLUDED_FILES = new Set([
    'package-lock.json',
    'yarn.lock',
    '.npmrc',
    '.yarnrc',
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    '.env.test',
    'tsconfig.tsbuildinfo',
    '.eslintcache',
  ]);

  const contextMap: ContextMap = {
    repositoryId: repoName,
    lastUpdated: new Date().toISOString(),
    files: {},
    projectDescription: ''
  };

  function walkDirectory(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip excluded directories
        if (EXCLUDED_DIRS.has(entry.name)) {
          continue;
        }
        walkDirectory(fullPath);
      } else {
        // Skip files starting with dot, excluded files, and excluded extensions
        if (entry.name.startsWith('.') || 
            EXCLUDED_FILES.has(entry.name) ||
            EXCLUDED_EXTENSIONS.has(path.extname(entry.name).slice(1))) {
          continue;
        }

        const relativePath = path.relative(repoPath, fullPath);
        
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          
          if (entry.name.toLowerCase() === 'readme.md') {
            contextMap.projectDescription = extractReadmeDescription(content);
          } else {
            contextMap.files[relativePath] = getFileMetadata(fullPath, content);
          }
        } catch (error) {
          // Skip files that can't be read as UTF-8
          continue;
        }
      }
    }
  }

  walkDirectory(repoPath);
  return contextMap;
}

export function saveContextMap(contextMap: ContextMap, basePath: string): void {
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }
  
  const filepath = path.join(basePath, `${contextMap.repositoryId}.json`);
  fs.writeFileSync(filepath, JSON.stringify(contextMap, null, 2));
}

export function loadContextMap(repoName: string, basePath: string): ContextMap | null {
  const filepath = path.join(basePath, `${repoName}.json`);
  
  if (!fs.existsSync(filepath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}