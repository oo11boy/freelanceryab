'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  hideBottomNav: boolean;
  setHideBottomNav: (v: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [hideBottomNav, setHideBottomNav] = useState(false);
  return (
    <UIContext.Provider value={{ hideBottomNav, setHideBottomNav }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUILayout() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUILayout must be used within UIProvider');
  return ctx;
}