import { useState, useEffect } from 'react';

// url: https://designcode.io/react-hooks-handbook-uselocalstorage-hook
const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState(() => {
    let currentValue: T;

    try {
      currentValue = JSON.parse(localStorage.getItem(key) || String(defaultValue));
    } catch (error) {
      currentValue = defaultValue;
    }

    return currentValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue];
};

export default useLocalStorage;
