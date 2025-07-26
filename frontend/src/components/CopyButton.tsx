import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, className = '' }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <button
      onClick={copyToClipboard}
      className={`p-1 rounded text-xs transition-colors duration-200 ${className}`}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
};

export default CopyButton;