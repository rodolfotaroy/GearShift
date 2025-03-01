import React from 'react';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'danger' 
  | 'success' 
  | 'default' 
  | 'gradient';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
  secondary: 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
  success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
  default: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-300',
  gradient: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
};

export const Button: React.FC<ButtonProps> = ({
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
        rounded-full
        px-4 
        py-2 
        text-sm 
        font-medium
        transition-colors 
        duration-300 
        focus:outline-none 
        focus:ring-2 
        focus:ring-opacity-50
        ${fullWidth ? 'w-full' : 'w-auto'}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
