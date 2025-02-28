import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'default' | 'gradient';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-500 dark:bg-gray-600 text-white hover:bg-gray-600 dark:hover:bg-gray-700 focus:ring-gray-500',
  danger: 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 focus:ring-red-500',
  success: 'bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700 focus:ring-green-500',
  default: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-300',
  gradient: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 shadow-lg'
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      className={`
        ${variantStyles[variant]}
        py-2 
        px-4 
        rounded-full 
        transition-colors 
        duration-300 
        focus:outline-none 
        focus:ring-2 
        focus:ring-opacity-50
        text-sm
        whitespace-nowrap
        ${fullWidth ? 'w-full' : 'w-auto'}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export { Button };
