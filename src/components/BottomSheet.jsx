import React from 'react';
import { X } from 'lucide-react';

export default function BottomSheet({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity max-w-md mx-auto"
        onClick={onClose}
      />
      <div className="bottom-sheet max-h-[90vh] overflow-y-auto max-w-md mx-auto">
        <div className="sticky top-0 bg-brand-white p-4 border-b border-brand-border flex justify-between items-center z-10">
          <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-black transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </>
  );
}
