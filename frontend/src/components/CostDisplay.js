// Filename: frontend/src/components/CostDisplay.js

import React from 'react';
import { FaDollarSign, FaCoins } from 'react-icons/fa';

const CostDisplay = ({ totalCost, totalTokens }) => {
  // Summed total tokens
  const total = totalTokens.input + totalTokens.output;

  return (
    <div className="mb-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-between text-xs">
      {/* Cost */}
      <div className="flex items-center space-x-1">
        <FaDollarSign className="text-green-500 dark:text-green-400" />
        <span className="font-semibold text-gray-700 dark:text-gray-200">Cost:</span>
        <span className="text-green-700 dark:text-green-300">${totalCost.toFixed(3)}</span>
      </div>
      {/* Tokens */}
      <div className="flex items-center space-x-1">
        <FaCoins className="text-yellow-500 dark:text-yellow-400" />
        <span className="font-semibold text-gray-700 dark:text-gray-200">Tokens:</span>
        <span className="text-yellow-700 dark:text-yellow-300">{total}</span>
        <span className="text-gray-500 dark:text-gray-400">
          (in: {totalTokens.input}, out: {totalTokens.output})
        </span>
      </div>
    </div>
  );
};

export default CostDisplay;