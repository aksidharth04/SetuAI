import React from 'react';

export default function Button({ 
  children, 
  variant = 'outline',
  icon,
  onClick,
  className = '',
  disabled = false,
  type = 'button'
}) {
  const baseStyles = "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200";
  
  const variantStyles = {
    outline: "border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300",
    primary: "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles} 
        ${variantStyles[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {icon && (
        <span className="w-5 h-5 text-gray-500 dark:text-gray-400">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}