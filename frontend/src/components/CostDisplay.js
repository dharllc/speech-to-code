// Filename: frontend/src/components/CostDisplay.js

import React from 'react';
import { FaDollarSign, FaCoins } from 'react-icons/fa';

const CostDisplay = ({ totalCost, totalTokens }) => {
  // Summed total tokens
  const total = totalTokens.input + totalTokens.output;

  // Format cost to show "<$0.01" for costs less than 1 cent
  const formattedCost = totalCost < 0.01 ? "<$0.01" : `$${totalCost.toFixed(2)}`;

  return (
    <div className="mb-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-between text-xs">
      {/* Cost */}
      <div className="flex items-center space-x-1">
        <FaDollarSign className="text-green-500 dark:text-green-400" />
        <span className="font-semibold text-gray-700 dark:text-gray-200">Cost:</span>
        <span className="text-green-700 dark:text-green-300">{formattedCost}</span>
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