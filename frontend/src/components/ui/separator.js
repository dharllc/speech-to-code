import React from 'react';

const Separator = ({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}) => {
  return (
    <div
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation}
      className={`
        ${orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px'} 
        bg-gray-200 dark:bg-gray-800 
        ${className || ''}
      `}
      {...props}
    />
  );
};

export { Separator }; 