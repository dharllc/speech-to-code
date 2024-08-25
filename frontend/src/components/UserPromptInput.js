import React from 'react';

const UserPromptInput = ({ value, onChange, tokenCount }) => (
  <div className="mb-4">
    <textarea
      className="w-full h-32 p-2 bg-gray-800 text-white rounded-lg resize-none"
      value={value}
      onChange={onChange}
      placeholder="Enter your prompt here..."
    />
    <div className="text-right mt-1 text-sm text-gray-400">
      Tokens: {tokenCount}
    </div>
  </div>
);

export default UserPromptInput;