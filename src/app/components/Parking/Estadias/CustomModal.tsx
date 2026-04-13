'use client';
import React, { ReactNode } from 'react';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-lg p-6 w-96 max-w-full relative">
        {title && <h2 className="text-lg font-bold mb-4">{title}</h2>}
        
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
};

export default CustomModal;
