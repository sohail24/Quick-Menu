import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-2.5 rounded-lg border bg-white
          text-gray-900 placeholder:text-gray-400
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : 'border-gray-200'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
