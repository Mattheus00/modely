import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function BottomSheet({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="bottom-sheet max-h-[92vh] flex flex-col max-w-md mx-auto overflow-hidden">
        <div className="flex-shrink-0 bg-brand-white p-4 border-b border-brand-border flex justify-between items-center z-10">
          <h2 className="text-sm font-bold uppercase tracking-widest">{title}</h2>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-black transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
}
