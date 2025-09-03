// Custom React hook for managing application data loading

import { useState, useEffect } from 'react';
import type { DataState } from '../types/donor';
import { fetchAllData } from '../services/dataService';
import { logDataReport } from '../utils/dataValidation';

/**
 * Custom hook for loading and managing CEB donor codes data
 * Handles loading states, error handling, and data relationships
 * 
 * @returns DataState object with donors, types, loading state, and errors
 */
export function useAppData(): DataState {
  const [state, setState] = useState<DataState>({
    donors: [],
    contributorTypes: [],
    donorsWithTypes: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const result = await fetchAllData();

        // Only update state if component is still mounted
        if (isMounted) {
          if (result.errors.length > 0) {
            setState(prev => ({
              ...prev,
              donors: result.donors,
              contributorTypes: result.contributorTypes,
              donorsWithTypes: result.donorsWithTypes,
              loading: false,
              error: `Data loading issues: ${result.errors.join('; ')}`,
            }));
          } else {
            setState(prev => ({
              ...prev,
              donors: result.donors,
              contributorTypes: result.contributorTypes,
              donorsWithTypes: result.donorsWithTypes,
              loading: false,
              error: null,
            }));
          }

          // Log detailed validation report in development
          if (process.env.NODE_ENV === 'development') {
            logDataReport(result.donors, result.contributorTypes, result.donorsWithTypes);
          }
        }
      } catch (error) {
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setState(prev => ({
            ...prev,
            loading: false,
            error: `Failed to load data: ${errorMessage}`,
          }));
          console.error('Error in useAppData:', error);
        }
      }
    };

    loadData();

    // Cleanup function to prevent state updates on unmounted components
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - load data once on mount

  return state;
}

/**
 * Hook for reloading data manually (useful for refresh buttons)
 * @returns Object with current state and reload function
 */
export function useAppDataWithReload() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const [state, setState] = useState<DataState>({
    donors: [],
    contributorTypes: [],
    donorsWithTypes: [],
    loading: true,
    error: null,
  });

  const reload = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const result = await fetchAllData();

        if (isMounted) {
          if (result.errors.length > 0) {
            setState(prev => ({
              ...prev,
              donors: result.donors,
              contributorTypes: result.contributorTypes,
              donorsWithTypes: result.donorsWithTypes,
              loading: false,
              error: `Data loading issues: ${result.errors.join('; ')}`,
            }));
          } else {
            setState(prev => ({
              ...prev,
              donors: result.donors,
              contributorTypes: result.contributorTypes,
              donorsWithTypes: result.donorsWithTypes,
              loading: false,
              error: null,
            }));

            // Log detailed validation report in development
            if (process.env.NODE_ENV === 'development') {
              logDataReport(result.donors, result.contributorTypes, result.donorsWithTypes);
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setState(prev => ({
            ...prev,
            loading: false,
            error: `Failed to load data: ${errorMessage}`,
          }));
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]); // Reload when refreshTrigger changes

  return { ...state, reload };
}
