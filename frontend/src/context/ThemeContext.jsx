import { createContext, useContext, useState, useEffect } from 'react';

const ForgeThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('sf_theme') || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(activeTheme);
    localStorage.setItem('sf_theme', activeTheme);
  }, [activeTheme]);

  const toggleTheme = () => {
    setActiveTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (theme) => setActiveTheme(theme);

  return (
    <ForgeThemeContext.Provider value={{ activeTheme, toggleTheme, setTheme }}>
      {children}
    </ForgeThemeContext.Provider>
  );
};

export const useForgeTheme = () => {
  const ctx = useContext(ForgeThemeContext);
  if (!ctx) throw new Error('useForgeTheme must be used within ThemeProvider');
  return ctx;
};
