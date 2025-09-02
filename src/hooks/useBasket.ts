// React hook for basket management with enhanced functionality

import { useState, useEffect, useCallback } from 'react';
import { basketService } from '../services/basketService';
import type { DonorRequest, RequestBasket, RequestSubmission } from '../types/request';

export interface UseBasketReturn {
  // State
  basket: RequestBasket;
  isLoading: boolean;
  
  // Basic operations
  addRequest: (request: DonorRequest) => void;
  removeRequest: (requestId: string) => void;
  updateRequest: (requestId: string, updates: Partial<DonorRequest>) => void;
  clearBasket: () => void;
  
  // Queries
  getRequestsByAction: (action: 'new' | 'update' | 'remove') => DonorRequest[];
  getRequestsByStatus: (status: DonorRequest['status']) => DonorRequest[];
  
  // Bulk operations
  bulkUpdateStatus: (requestIds: string[], status: DonorRequest['status']) => void;
  bulkRemoveRequests: (requestIds: string[]) => void;
  
  // Reordering (drag and drop)
  reorderRequests: (oldIndex: number, newIndex: number) => void;
  
  // Utilities
  hasRequest: (entityName: string, action: DonorRequest['action']) => boolean;
  getRequest: (requestId: string) => DonorRequest | undefined;
  getStats: () => ReturnType<typeof basketService.getStats>;
  
  // Export functions
  exportAsCSV: () => string;
  exportAsJSON: () => string;
  downloadCSV: (filename?: string) => void;
  downloadJSON: (filename?: string) => void;
  
  // Submission
  prepareSubmission: (contactInfo: { name: string; email: string }, notes?: string) => RequestSubmission;
}

/**
 * Hook for managing the request basket
 * Provides real-time updates and comprehensive basket operations
 */
export function useBasket(): UseBasketReturn {
  const [basket, setBasket] = useState<RequestBasket>(basketService.getBasket());
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to basket changes
  useEffect(() => {
    const unsubscribe = basketService.subscribe((updatedBasket) => {
      setBasket(updatedBasket);
    });

    return unsubscribe;
  }, []);

  // Basic operations
  const addRequest = useCallback((request: DonorRequest) => {
    setIsLoading(true);
    try {
      basketService.addRequest(request);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeRequest = useCallback((requestId: string) => {
    setIsLoading(true);
    try {
      basketService.removeRequest(requestId);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateRequest = useCallback((requestId: string, updates: Partial<DonorRequest>) => {
    setIsLoading(true);
    try {
      basketService.updateRequest(requestId, updates);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearBasket = useCallback(() => {
    setIsLoading(true);
    try {
      basketService.clearBasket();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Query functions
  const getRequestsByAction = useCallback((action: 'new' | 'update' | 'remove') => {
    return basketService.getRequestsByAction(action);
  }, []);

  const getRequestsByStatus = useCallback((status: DonorRequest['status']) => {
    return basketService.getRequestsByStatus(status);
  }, []);

  // Bulk operations
  const bulkUpdateStatus = useCallback((requestIds: string[], status: DonorRequest['status']) => {
    setIsLoading(true);
    try {
      basketService.bulkUpdateStatus(requestIds, status);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkRemoveRequests = useCallback((requestIds: string[]) => {
    setIsLoading(true);
    try {
      basketService.bulkRemoveRequests(requestIds);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reordering for drag and drop
  const reorderRequests = useCallback((oldIndex: number, newIndex: number) => {
    setIsLoading(true);
    try {
      basketService.reorderRequests(oldIndex, newIndex);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Utility functions
  const hasRequest = useCallback((entityName: string, action: DonorRequest['action']) => {
    return basket.requests.some(req => req.entityName === entityName && req.action === action);
  }, [basket.requests]);

  const getRequest = useCallback((requestId: string) => {
    return basket.requests.find(req => req.id === requestId);
  }, [basket.requests]);

  const getStats = useCallback(() => {
    return basketService.getStats();
  }, []);

  // Export functions
  const exportAsCSV = useCallback(() => {
    return basketService.exportAsCSV();
  }, []);

  const exportAsJSON = useCallback(() => {
    return basketService.exportAsJSON();
  }, []);

  const downloadCSV = useCallback((filename: string = 'donor-requests') => {
    const csvContent = basketService.exportAsCSV();
    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
  }, []);

  const downloadJSON = useCallback((filename: string = 'donor-requests') => {
    const jsonContent = basketService.exportAsJSON();
    downloadFile(jsonContent, `${filename}.json`, 'application/json');
  }, []);

  // Submission
  const prepareSubmission = useCallback((contactInfo: { name: string; email: string }, notes?: string) => {
    return basketService.prepareSubmission(contactInfo, notes);
  }, []);

  return {
    // State
    basket,
    isLoading,
    
    // Basic operations
    addRequest,
    removeRequest,
    updateRequest,
    clearBasket,
    
    // Queries
    getRequestsByAction,
    getRequestsByStatus,
    
    // Bulk operations
    bulkUpdateStatus,
    bulkRemoveRequests,
    
    // Reordering
    reorderRequests,
    
    // Utilities
    hasRequest,
    getRequest,
    getStats,
    
    // Export functions
    exportAsCSV,
    exportAsJSON,
    downloadCSV,
    downloadJSON,
    
    // Submission
    prepareSubmission
  };
}

/**
 * Utility function to download content as file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Hook for basket statistics with automatic updates
 */
export function useBasketStats() {
  const { getStats } = useBasket();
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    const unsubscribe = basketService.subscribe(() => {
      setStats(getStats());
    });

    return unsubscribe;
  }, [getStats]);

  return stats;
}
