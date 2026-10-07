'use client';

import React from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="esl-backdrop" onClick={onClose} />
      <div className="esl-bottom-sheet">
        <div className="esl-sheet-handle" />
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px 4px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--c-text-1)' }}>{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: '30px', height: '30px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px', border: 'none',
                background: 'var(--c-surface-2)',
                cursor: 'pointer', fontSize: '16px', color: 'var(--c-text-3)',
              }}
            >×</button>
          </div>
        )}
        <div style={{ padding: '4px 20px 32px', overflowY: 'auto', maxHeight: '72vh' }}>
          {children}
        </div>
      </div>
    </>
  );
}
