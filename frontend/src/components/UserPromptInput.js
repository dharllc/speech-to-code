import React from 'react';

const UserPromptInput = ({ value, onChange }) => (
  <div className="mb-6">
    <label className="block mb-2 font-semibold">User Prompt:</label>
    <textarea
      value={value}
      onChange={onChange}
      className="w-full p-3 border rounded-lg bg-gray-800 text-white text-sm resize-none"
      rows="4"
      required
    ></textarea>
  </div>
);

export default UserPromptInput;