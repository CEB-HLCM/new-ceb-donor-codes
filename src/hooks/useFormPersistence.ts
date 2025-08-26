// Form persistence hook for auto-save functionality

import { useState, useEffect, useCallback } from 'react';

export interface UseFormPersistenceOptions {
  key: string;
  debounceDelay?: number;
  enabled?: boolean;
}

export interface UseFormPersistenceReturn<T> {
  // Persisted data
  data: T | null;
  
  // Persistence functions
  saveData: (data: T) => void;
  clearData: () => void;
  
  // State
  isLoading: boolean;
  lastSaved: Date | null;
  
  // Utils
  hasData: boolean;
}

const defaultOptions = {
  debounceDelay: 1000,
  enabled: true
};

export function useFormPersistence<T>(
  initialData: T,
  options: UseFormPersistenceOptions
): UseFormPersistenceReturn<T> {
  
  const opts = { ...defaultOptions, ...options };
  const { key, debounceDelay, enabled } = opts;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load data on mount
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    try {
      const savedData = localStorage.getItem(key);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setData(parsed.data);
        setLastSaved(parsed.timestamp ? new Date(parsed.timestamp) : null);
      } else {
        setData(initialData);
      }
    } catch (error) {
      console.warn('Failed to load persisted form data:', error);
      setData(initialData);
    } finally {
      setIsLoading(false);
    }
  }, [key, enabled, initialData]);

  // Save data to localStorage
  const persistToStorage = useCallback((dataToSave: T) => {
    if (!enabled) return;

    try {
      const saveObject = {
        data: dataToSave,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(saveObject));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to persist form data:', error);
    }
  }, [key, enabled]);

  // Debounced save function
  const saveData = useCallback((newData: T) => {
    setData(newData);

    if (!enabled) return;

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for debounced save
    const timeout = setTimeout(() => {
      persistToStorage(newData);
      setSaveTimeout(null);
    }, debounceDelay);

    setSaveTimeout(timeout);
  }, [enabled, debounceDelay, persistToStorage, saveTimeout]);

  // Clear persisted data
  const clearData = useCallback(() => {
    setData(null);
    setLastSaved(null);
    
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }

    if (enabled) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Failed to clear persisted form data:', error);
      }
    }
  }, [key, enabled, saveTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const hasData = data !== null && Object.keys(data as any).length > 0;

  return {
    data,
    saveData,
    clearData,
    isLoading,
    lastSaved,
    hasData
  };
}

// Specialized hook for draft management
export function useDraftManagement<T>(
  formId: string,
  initialData: T
) {
  const persistence = useFormPersistence(initialData, {
    key: `donor-request-draft-${formId}`,
    debounceDelay: 2000, // Longer delay for drafts
    enabled: true
  });

  // Auto-save draft on data changes
  const saveDraft = useCallback((data: T) => {
    persistence.saveData(data);
  }, [persistence.saveData]);

  // Load draft with confirmation
  const loadDraft = useCallback(() => {
    return persistence.data;
  }, [persistence.data]);

  // Clear draft (e.g., after successful submission)
  const clearDraft = useCallback(() => {
    persistence.clearData();
  }, [persistence.clearData]);

  return {
    ...persistence,
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft: persistence.hasData
  };
}

// Hook for managing multiple form states
export function useMultiFormPersistence<T extends Record<string, any>>(
  formConfigs: { [K in keyof T]: { key: string; initialData: T[K] } }
) {
  const forms = {} as {
    [K in keyof T]: UseFormPersistenceReturn<T[K]>
  };

  // Create persistence hooks for each form
  Object.entries(formConfigs).forEach(([formKey, config]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    forms[formKey as keyof T] = useFormPersistence(config.initialData, {
      key: config.key,
      debounceDelay: 1500
    });
  });

  // Bulk operations
  const clearAllForms = useCallback(() => {
    Object.values(forms).forEach(form => {
      (form as UseFormPersistenceReturn<any>).clearData();
    });
  }, [forms]);

  const hasAnyData = Object.values(forms).some(form => 
    (form as UseFormPersistenceReturn<any>).hasData
  );

  return {
    forms,
    clearAllForms,
    hasAnyData
  };
}
