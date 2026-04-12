import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load dark mode preference from backend
  const loadDarkMode = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        // Check localStorage for theme preference when not logged in
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme !== null) {
          setDarkMode(savedTheme === 'true');
        }
        setLoading(false);
        return;
      }

      const res = await authAPI.getPreferences();
      if (res.data?.success && res.data.preferences) {
        setDarkMode(res.data.preferences.darkMode || false);
      }
    } catch (error) {
      console.error("Failed to load dark mode:", error);
      // Fallback to localStorage
      const savedTheme = localStorage.getItem('darkMode');
      if (savedTheme !== null) {
        setDarkMode(savedTheme === 'true');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDarkMode();
  }, [loadDarkMode]);

  // Apply dark mode to entire application
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
      // Also add to root element for all components
      const root = document.getElementById('root');
      if (root) root.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
      const root = document.getElementById('root');
      if (root) root.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const toggleDarkMode = async () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Save to localStorage as backup
    localStorage.setItem('darkMode', newDarkMode);
    
    // Save to backend if logged in
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await authAPI.updatePreferences({ darkMode: newDarkMode });
      }
    } catch (error) {
      console.error("Failed to save dark mode preference:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};