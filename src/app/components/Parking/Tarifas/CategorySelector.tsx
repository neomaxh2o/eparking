'use client';

import React from 'react';

// Lista de categorías
const categorias = ['Automóvil', 'Camioneta', 'Bicicleta', 'Motocicleta', 'Otros'] as const;
export type Categoria = typeof categorias[number];

interface CategorySelectorProps {
  value?: Categoria; // valor opcional para permitir placeholder
  onChange: (newCategoria: Categoria) => void;
  label?: string;
  id?: string;
  placeholder?: string;
  className?: string;
}

export default function CategorySelector({
  value,
  onChange,
  label = 'Categoría',
  id = 'category-select',
  placeholder = '-- Seleccionar categoría --',
  className = '',
}: CategorySelectorProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <label htmlFor={id} className="block mb-2 font-semibold text-gray-700">
        {label}
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value as Categoria)}
        className="w-full sm:w-48 border border-gray-300 rounded px-3 py-2 focus:outline-yellow-500 focus:ring-2 focus:ring-yellow-300 text-gray-800 transition-colors"
        aria-label={label}
      >
        <option value="">{placeholder}</option>
        {categorias.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}

