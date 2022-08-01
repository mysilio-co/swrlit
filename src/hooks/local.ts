import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';

export function useLocalStorage(key, initialValue) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [modified, setModified] = useState(Date.now());
  const storedValue = useMemo(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  }, [key, modified]);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = value => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        setModified(Date.now());
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

// This is a SWR middleware for using a local storage cache
export function localStorageMiddleware(useSWRNext) {
  return (key, fetcher, config) => {
    const [localStorage, setLocalStorage] = useLocalStorage(key);

    const swr = useSWRNext(key, fetcher, config);

    useEffect(() => {
      // Update localState if data is new
      if (swr.data !== localStorage) {
        setLocalStorage(swr.data);
      }
    }, [swr.data, localStorage]);

    // Return data from localStorage
    return Object.assign({}, swr, {
      data: localStorage,
    });
  };
}

export function useLocalSWR(key, fetcher, config) {
  config.use = [localStorageMiddleware, ...config.use];
  return useSWR(key, fetcher, config);
}
