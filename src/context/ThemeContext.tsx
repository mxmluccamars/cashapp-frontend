import React, { createContext, useContext, useEffect, useState } from 'react';
import { F1_THEMES } from '../themes/f1Themes';
import type { F1Theme } from '../themes/f1Themes';

interface ThemeContextType {
  currentTheme: F1Theme;
  themeId: string;
  setTheme: (id: string) => void;
  availableThemes: F1Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Lê do cache local ou inicia por padrão na Racing Bulls
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem('cashapp_f1_theme') || 'rb';
  });

  const currentTheme = F1_THEMES[themeId] || F1_THEMES.rb;

  // Atualiza as variáveis CSS no documento HTML sempre que a equipe muda
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--f1-bg-dark', currentTheme.bgDark);
    root.style.setProperty('--f1-bg-card', currentTheme.bgCard);
    root.style.setProperty('--f1-primary', currentTheme.primary);
    root.style.setProperty('--f1-primary-hover', currentTheme.primaryHover);
    root.style.setProperty('--f1-secondary', currentTheme.secondary);
    root.style.setProperty('--f1-accent', currentTheme.accent);
    root.style.setProperty('--f1-badge-bg', currentTheme.badgeBg);

    localStorage.setItem('cashapp_f1_theme', themeId);
  }, [currentTheme, themeId]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeId,
        setTheme: setThemeId,
        availableThemes: Object.values(F1_THEMES)
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}