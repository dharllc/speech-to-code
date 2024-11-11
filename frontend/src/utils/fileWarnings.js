export const WARNING_PATTERNS = {
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
  
  export const shouldWarnAboutFile = (fileName, tokenCount = 0) => {
    if (tokenCount > 100000) {
      return { warn: true, reason: 'Large file (>100k tokens)', tokenWarning: true };
    }
  
    const name = fileName.toLowerCase();
    if (WARNING_PATTERNS.files.includes(name)) {
      return { warn: true, reason: 'System/Configuration file' };
    }
  
    const ext = name.includes('.') ? '.' + name.split('.').pop() : null;
    if (ext && WARNING_PATTERNS.extensions.includes(ext)) {
      return { warn: true, reason: 'Binary/Media file' };
    }
  
    if (tokenCount > 50000) {
      return { warn: true, reason: 'Large file (>50k tokens)', tokenWarning: true };
    }
  
    return { warn: false };
  };