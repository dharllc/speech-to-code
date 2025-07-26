import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ 
  checked, 
  onChange, 
  size = 'medium',
  disabled = false 
}) => {
  const sizeClasses = size === 'small' 
    ? 'w-9 h-5' 
    : 'w-11 h-6';
  
  const toggleClasses = size === 'small'
    ? 'w-4 h-4 translate-x-4'
    : 'w-5 h-5 translate-x-5';

  return (
    <button
      type="button"
      className={`${sizeClasses} relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
    >
      <span
        className={`${checked ? toggleClasses : 'translate-x-0'} pointer-events-none inline-block ${size === 'small' ? 'w-4 h-4' : 'w-5 h-5'} transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
};