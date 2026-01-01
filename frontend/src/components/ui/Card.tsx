import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`} {...props}>
      {children}
    </div>
  );
}
