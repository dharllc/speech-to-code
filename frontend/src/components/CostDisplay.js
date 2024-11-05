import React from 'react';
import { FaDollarSign, FaCoins } from 'react-icons/fa';

const CostDisplay = ({ totalCost, totalTokens }) => (
  <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Usage Summary</h3>
    </div>
    <div className="flex flex-wrap -mx-2">
      <div className="w-full sm:w-1/2 px-2 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex items-center">
          <FaDollarSign className="text-green-500 dark:text-green-400 mr-2 text-xl" />
          <div>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Cost</span>
            <p className="text-2xl font-bold text-green-500 dark:text-green-400">${totalCost.toFixed(3)}</p>
          </div>
        </div>
      </div>
      <div className="w-full sm:w-1/2 px-2 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg flex items-center">
          <FaCoins className="text-yellow-500 dark:text-yellow-400 mr-2 text-xl" />
          <div>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Tokens</span>
            <p className="text-2xl font-bold text-yellow-500 dark:text-yellow-400">
              {totalTokens.input + totalTokens.output}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                (in: {totalTokens.input}, out: {totalTokens.output})
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default CostDisplay;