import React from 'react';
import { FaDollarSign, FaCoins } from 'react-icons/fa';

const CostDisplay = ({ totalCost, totalTokens }) => (
  <div className="flex gap-2 text-sm mb-2">
    <div className="flex items-center bg-gray-800 rounded px-2 py-1">
      <FaDollarSign className="text-green-400 mr-1" />
      <span className="text-green-400 font-bold">${totalCost.toFixed(4)}</span>
    </div>
    <div className="flex items-center bg-gray-800 rounded px-2 py-1">
      <FaCoins className="text-yellow-400 mr-1" />
      <span className="text-yellow-400 font-bold">{totalTokens.input + totalTokens.output}</span>
      <span className="text-gray-400 ml-1 text-xs">
        ({totalTokens.input} in + {totalTokens.output} out)
      </span>
    </div>
  </div>
);

export default CostDisplay;