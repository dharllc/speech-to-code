import React from 'react';

const SystemPromptDisplay = ({ content, tokenCount }) => (
  <div className="mb-4">
    <h3 className="text-xl font-semibold mb-2">System Prompt</h3>
    <textarea
      className="w-full h-64 p-2 bg-gray-800 text-white rounded-lg resize-none"
      value={content}
      readOnly
    />
    <div className="text-right mt-1 text-sm text-gray-400">
      Tokens: {tokenCount}
    </div>
  </div>
);

export default SystemPromptDisplay;