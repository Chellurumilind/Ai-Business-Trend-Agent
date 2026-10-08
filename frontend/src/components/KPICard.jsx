/**
 * components/KPICard.jsx
 * ----------------------
 * Reusable card for displaying key performance indicators.
 * Used in the dashboard for totals, ROI, growth rates, etc.
 */

import React from 'react';

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    green:   'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red:     'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple:  'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`inline-flex items-center gap-1 mt-2 text-xs font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;