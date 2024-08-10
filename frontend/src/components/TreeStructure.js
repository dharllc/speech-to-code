// frontend/src/components/TreeStructure.js

import React from 'react';

const TreeNode = ({ node }) => {
  const { name, type, children } = node;

  return (
    <div className="ml-4">
      <span className={type === 'directory' ? 'font-bold' : ''}>{name}</span>
      {children && children.length > 0 && (
        <div className="ml-4">
          {children.map((child, index) => (
            <TreeNode key={`${child.name}-${index}`} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeStructure = ({ treeData }) => {
  const tree = JSON.parse(treeData);

  return (
    <div className="mt-4 p-4 border rounded">
      <h3 className="text-lg font-bold mb-2">Project Structure</h3>
      <TreeNode node={tree} />
    </div>
  );
};

export default TreeStructure;