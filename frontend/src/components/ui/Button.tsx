import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({ 
  children, 
  onClick, 
  className = "", 
  variant = 'primary', 
  size = 'md',
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-full";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 focus:ring-blue-500",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-blue-600 focus:ring-gray-400",
    danger: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white focus:ring-red-500",
    outline: "bg-transparent border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-400",
    white: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm focus:ring-gray-400"
  };

  const sizes = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const variantStyles = variants[variant] || variants.primary;
  const sizeStyles = sizes[size] || sizes.md;

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
