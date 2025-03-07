import React from 'react';

const badgeVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/80',
  secondary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  destructive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  outline: 'border border-gray-200 bg-white text-gray-950 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50 dark:hover:bg-gray-800',
};

const Badge = ({
  className,
  variant = 'default',
  ...props
}) => {
  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${badgeVariants[variant]} ${className || ''}`}
      {...props}
    />
  );
};

export { Badge, badgeVariants }; 