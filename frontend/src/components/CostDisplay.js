import React from 'react';

const CostDisplay = ({ totalCost }) => (
  <div className="mb-6 bg-gray-800 p-4 rounded-lg">
    <h3 className="text-xl font-bold mb-2">Total Cost: ${totalCost.toFixed(3)}</h3>
  </div>
);

export default CostDisplay;