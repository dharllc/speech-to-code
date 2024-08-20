import React from 'react';

const SystemPromptDisplay = ({ content }) => (
  <div className="mb-6">
    <label className="block mb-2 font-semibold">System Prompt:</label>
    <textarea
      value={content}
      className="w-full p-3 border rounded-lg bg-gray-800 text-white text-sm resize-none"
      rows="4"
      readOnly
    ></textarea>
  </div>
);

export default SystemPromptDisplay;