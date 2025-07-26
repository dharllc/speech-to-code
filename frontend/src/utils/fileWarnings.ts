interface WarningPatterns {
  files: readonly string[];
  extensions: readonly string[];
}

interface FileWarningResult {
  warn: boolean;
  reason?: string;
  tokenWarning?: boolean;
  skipTokenCount: boolean;
}

export const WARNING_PATTERNS: WarningPatterns = {
  files: [
    'package-lock.json', 'yarn.lock', '.DS_Store', 'Thumbs.db',
    'desktop.ini', '.gitignore', '.dockerignore', '.next'
  ] as const,
  extensions: [
    '.log', '.lock', '.pid', '.pyc', '.pyo', '.exe', '.dll', '.so', 
    '.dylib', '.zip', '.tar', '.gz', '.7z', '.rar', '.jpg', '.jpeg', 
    '.png', '.gif', '.bmp', '.ico', '.webp', '.svg', '.mp4', '.webm', 
    '.mov', '.wav', '.mp3', '.pdf', '.doc', '.docx', '.xls', '.xlsx',
    '.class', '.o', '.obj'
  ] as const
} as const;

export const shouldWarnAboutFile = (fileName: string, tokenCount: number = 0): FileWarningResult => {
  if (tokenCount > 100000) {
    return { warn: true, reason: 'Large file (>100k tokens)', tokenWarning: true, skipTokenCount: true };
  }

  const name = fileName.toLowerCase();
  if (WARNING_PATTERNS.files.includes(name)) {
    return { warn: true, reason: 'System/Configuration file', tokenWarning: false, skipTokenCount: true };
  }

  const ext = name.includes('.') ? '.' + name.split('.').pop() : null;
  if (ext && WARNING_PATTERNS.extensions.includes(ext)) {
    return { warn: true, reason: 'Binary/Media file', tokenWarning: false, skipTokenCount: true };
  }

  if (tokenCount > 50000) {
    return { warn: true, reason: 'Large file (>50k tokens)', tokenWarning: true, skipTokenCount: false };
  }

  return { warn: false, skipTokenCount: false };
};