import React, { createContext, useState, useContext, useMemo, type ReactNode } from 'react';

type CursorStyle = 'default' | 'pointer' | 'grab' | 'grabbing' | 'crosshair' | 'text' | 'move';

interface CursorContextType {
  cursor: CursorStyle;
  setCursor: (cursor: CursorStyle) => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
};

interface CursorProviderProps {
  children: ReactNode;
}

export const CursorProvider: React.FC<CursorProviderProps> = ({ children }) => {
  const [cursor, setCursor] = useState<CursorStyle>('default');

  const value = useMemo(() => ({ cursor, setCursor }), [cursor]);

  return (
    <CursorContext.Provider value={value}>
      {children}
    </CursorContext.Provider>
  );
};

