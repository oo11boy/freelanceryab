'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  hideBottomNav: boolean;
  setHideBottomNav: (v: boolean) => void;
  hideHeader: boolean;
  setHideHeader: (v: boolean) => void;
  hideAll: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [hideBottomNav, setHideBottomNav] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);

  const hideAll = () => {
    setHideBottomNav(true);
    setHideHeader(true);
  };

  return (
    <UIContext.Provider
      value={{
        hideBottomNav,
        setHideBottomNav,
        hideHeader,
        setHideHeader,
        hideAll,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUILayout() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUILayout must be used within UIProvider');
  return ctx;
}