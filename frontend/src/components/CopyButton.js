import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const CopyButton = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={copyToClipboard}
      style={{ marginLeft: '8px' }} // Ensure some spacing from the text
      className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-300"
    >
      {copied ? <Check size={20} /> : <Copy size={20} />}
    </button>
  );
};

export default CopyButton;