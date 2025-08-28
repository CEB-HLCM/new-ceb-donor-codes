// React Context for app-wide data access and management

import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { DataState } from '../types/donor';
import { useAppDataWithReload } from '../hooks/useAppData';

// Define the context interface
interface DataContextType extends DataState {
  reload: () => void;
}

// Create the context with undefined default (will be provided by provider)
const DataContext = createContext<DataContextType | undefined>(undefined);

// Props for the DataProvider component
interface DataProviderProps {
  children: ReactNode;
}

/**
 * Data Provider component that wraps the application and provides
 * donor codes data to all child components
 */
export function DataProvider({ children }: DataProviderProps) {
  const dataState = useAppDataWithReload();

  return (
    <DataContext.Provider value={dataState}>
      {children}
    </DataContext.Provider>
  );
}

/**
 * Custom hook to access the data context
 * Provides type-safe access to donor codes data throughout the app
 * 
 * @returns DataContextType with data, loading states, and reload function
 * @throws Error if used outside of DataProvider
 */
export function useDataContext(): DataContextType {
  const context = useContext(DataContext);
  
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  
  return context;
}

/**
 * Higher-order component wrapper for easier DataProvider integration
 * @param Component - Component to wrap with data provider
 * @returns Wrapped component with data context
 */
export function withDataProvider<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WrappedComponent(props: P) {
    return (
      <DataProvider>
        <Component {...props} />
      </DataProvider>
    );
  };
}

/**
 * Hook for accessing only the donors data (convenience hook)
 * @returns Array of donors with type information
 */
export function useDonors() {
  const { donorsWithTypes } = useDataContext();
  return donorsWithTypes;
}

/**
 * Hook for accessing only the contributor types data (convenience hook)
 * @returns Array of contributor type definitions
 */
export function useContributorTypes() {
  const { contributorTypes } = useDataContext();
  return contributorTypes;
}

/**
 * Hook for accessing loading and error states (convenience hook)
 * @returns Object with loading state and error message
 */
export function useDataStatus() {
  const { loading, error, reload } = useDataContext();
  return { loading, error, reload };
}
