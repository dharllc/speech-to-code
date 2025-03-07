import React from 'react';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 ${className || ''}`}
      {...props}
    />
  );
};

export { Skeleton }; 