'use client';
import React, { ReactNode } from 'react';

interface FormContainerProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export const FormContainer: React.FC<FormContainerProps> = ({ children, title, className }) => {
  return (
    <div
      className={`
        bg-white
        rounded-2xl
        shadow-lg
        p-8
        w-full
        max-w-3xl    // aumentamos el ancho máximo
        mx-auto
        border
        border-gray-200
        ${className ?? ''}
      `}
    >
      {title && (
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 select-none">
          {title}
        </h2>
      )}

      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};
