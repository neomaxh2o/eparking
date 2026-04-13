'use client';
import React, { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
}

export default function PaymentModal({ isOpen, onClose, onFileSelect }: PaymentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAccept = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
      onClose();
    } else {
      alert('Debes seleccionar un archivo');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-96">
        <h3 className="text-lg font-bold mb-2">Adjuntar Comprobante de Pago</h3>
        <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="bg-gray-400 px-3 py-1 rounded">Cancelar</button>
          <button onClick={handleAccept} className="bg-blue-600 text-white px-3 py-1 rounded">Aceptar</button>
        </div>
      </div>
    </div>
  );
}
