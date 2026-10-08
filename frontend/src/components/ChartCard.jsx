/**
 * components/ChartCard.jsx
 * ------------------------
 * Wrapper for chart components with consistent styling.
 */

import React from 'react';

const ChartCard = ({ title, children, action }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {action && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {action}
          </div>
        )}
      </div>
      <div className="w-full h-80">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;