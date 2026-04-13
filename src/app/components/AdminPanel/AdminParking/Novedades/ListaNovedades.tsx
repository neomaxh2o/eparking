'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Novedad } from '@/app/hooks/Parking/useNovedades';
import { motion, AnimatePresence } from 'framer-motion';

interface ListaNovedadesProps {
  novedades: Novedad[];
  currentUserName: string; // nombre del usuario actual
}

export default function ListaNovedades({ novedades, currentUserName }: ListaNovedadesProps) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Detecta si el usuario está en la parte inferior
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

      const isAtBottom = scrollHeight - scrollTop - clientHeight < 5; // margen pequeño
      setAutoScroll(isAtBottom);
    };

    const el = containerRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll automático solo si está activado
  useEffect(() => {
    if (autoScroll) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [novedades, autoScroll]);

  if (novedades.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-md transition-colors duration-300">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Novedades Recientes
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No hay novedades registradas para tu parking.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 shadow-md max-h-[480px] overflow-y-auto flex flex-col space-y-2 transition-colors duration-300"
    >
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Novedades Recientes
      </h3>

      <AnimatePresence initial={false}>
        {novedades.map((n: Novedad) => {
          const novRecipients: string[] = (n.recipients ?? []).map(
            (r: string | { _id: string }) => (typeof r === 'string' ? r : r._id)
          );

          let alignment = 'justify-start';
          let bgColor = 'bg-white dark:bg-gray-700';
          let bubbleCorners = 'rounded-bl-none';

          if (n.category === 'Mensajes') {
            if (n.isGlobal) {
              alignment = 'justify-center';
              bgColor = 'bg-blue-300 dark:bg-blue-500';
              bubbleCorners = 'rounded-lg';
            } else if (n.author === currentUserName) {
              alignment = 'justify-end';
              bgColor = 'bg-blue-100 dark:bg-blue-600';
              bubbleCorners = 'rounded-br-none';
            } else if (novRecipients.includes(currentUserName)) {
              alignment = 'justify-start';
              bgColor = 'bg-gray-100 dark:bg-gray-800';
              bubbleCorners = 'rounded-bl-none';
            }
          }

          return (
            <motion.div
              key={n._id}
              className={`flex ${alignment}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className={`border border-gray-300 dark:border-gray-600 shadow-sm max-w-[70%] ${bgColor} p-4 rounded-lg ${bubbleCorners}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-blue-600 dark:text-blue-300">
                    {n.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(n.date).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {n.description}
                </p>
                {n.author && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                    @{n.author}
                  </p>
                )}
                {n.category === 'Mensajes' && (
                  <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                    {n.isGlobal
                      ? 'Mensaje global para todos los operadores'
                      : `Destinatarios: ${novRecipients.length}`}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* marcador invisible para autoscroll */}
      <div ref={endRef} />
    </div>
  );
}
