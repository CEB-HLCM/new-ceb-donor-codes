// Enhanced basket service for managing mixed request types (new/update/remove)

import type { DonorRequest, RequestBasket, RequestSubmission } from '../types/request';

const BASKET_STORAGE_KEY = 'ceb-donor-request-basket';
const BASKET_EXPIRY_DAYS = 7; // Basket data expires after 7 days

interface StoredBasketData {
  basket: RequestBasket;
  timestamp: number;
  expiryDate: number;
}

/**
 * Service for managing the request basket with localStorage persistence
 * Supports mixed request types: new, update, remove
 */
export class BasketService {
  private basket: RequestBasket;
  private listeners: Array<(basket: RequestBasket) => void> = [];

  constructor() {
    this.basket = this.loadBasket();
  }

  /**
   * Load basket from localStorage with expiry check
   */
  private loadBasket(): RequestBasket {
    try {
      const storedData = localStorage.getItem(BASKET_STORAGE_KEY);
      
      if (storedData) {
        const parsed: StoredBasketData = JSON.parse(storedData);
        
        // Check if data hasn't expired
        if (Date.now() < parsed.expiryDate) {
          // Convert date strings back to Date objects
          const basket = {
            ...parsed.basket,
            lastModified: new Date(parsed.basket.lastModified),
            requests: parsed.basket.requests.map(req => ({
              ...req,
              createdAt: new Date(req.createdAt)
            }))
          };
          return basket;
        } else {
          // Remove expired data
          localStorage.removeItem(BASKET_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to load basket from storage:', error);
      localStorage.removeItem(BASKET_STORAGE_KEY);
    }

    // Return empty basket if no valid data found
    return {
      requests: [],
      lastModified: new Date(),
      totalCount: 0
    };
  }

  /**
   * Save basket to localStorage with expiry
   */
  private saveBasket(): void {
    try {
      const dataToStore: StoredBasketData = {
        basket: this.basket,
        timestamp: Date.now(),
        expiryDate: Date.now() + (BASKET_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      };
      
      localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Failed to save basket to storage:', error);
    }
  }

  /**
   * Notify all listeners of basket changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.basket));
  }

  /**
   * Subscribe to basket changes
   */
  subscribe(listener: (basket: RequestBasket) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current basket
   */
  getBasket(): RequestBasket {
    return { ...this.basket };
  }

  /**
   * Add request to basket
   */
  addRequest(request: DonorRequest): void {
    // Check for duplicates (same entity name and action)
    const existingIndex = this.basket.requests.findIndex(
      req => req.entityName === request.entityName && req.action === request.action
    );

    if (existingIndex > -1) {
      // Replace existing request
      this.basket.requests[existingIndex] = { ...request };
    } else {
      // Add new request
      this.basket.requests.push({ ...request });
    }

    this.basket.lastModified = new Date();
    this.basket.totalCount = this.basket.requests.length;
    
    this.saveBasket();
    this.notifyListeners();
  }

  /**
   * Remove request from basket
   */
  removeRequest(requestId: string): void {
    this.basket.requests = this.basket.requests.filter(req => req.id !== requestId);
    this.basket.lastModified = new Date();
    this.basket.totalCount = this.basket.requests.length;
    
    this.saveBasket();
    this.notifyListeners();
  }

  /**
   * Update existing request in basket
   */
  updateRequest(requestId: string, updates: Partial<DonorRequest>): void {
    const index = this.basket.requests.findIndex(req => req.id === requestId);
    
    if (index > -1) {
      this.basket.requests[index] = { ...this.basket.requests[index], ...updates };
      this.basket.lastModified = new Date();
      
      this.saveBasket();
      this.notifyListeners();
    }
  }

  /**
   * Clear all requests from basket
   */
  clearBasket(): void {
    this.basket = {
      requests: [],
      lastModified: new Date(),
      totalCount: 0
    };
    
    this.saveBasket();
    this.notifyListeners();
  }

  /**
   * Get requests by action type
   */
  getRequestsByAction(action: 'new' | 'update' | 'remove'): DonorRequest[] {
    return this.basket.requests.filter(req => req.action === action);
  }

  /**
   * Get requests by status
   */
  getRequestsByStatus(status: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected'): DonorRequest[] {
    return this.basket.requests.filter(req => req.status === status);
  }

  /**
   * Bulk update request status
   */
  bulkUpdateStatus(requestIds: string[], status: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected'): void {
    let updated = false;
    
    this.basket.requests.forEach(req => {
      if (requestIds.includes(req.id)) {
        req.status = status;
        updated = true;
      }
    });

    if (updated) {
      this.basket.lastModified = new Date();
      this.saveBasket();
      this.notifyListeners();
    }
  }

  /**
   * Bulk remove requests
   */
  bulkRemoveRequests(requestIds: string[]): void {
    const originalLength = this.basket.requests.length;
    this.basket.requests = this.basket.requests.filter(req => !requestIds.includes(req.id));
    
    if (this.basket.requests.length !== originalLength) {
      this.basket.lastModified = new Date();
      this.basket.totalCount = this.basket.requests.length;
      
      this.saveBasket();
      this.notifyListeners();
    }
  }

  /**
   * Prepare submission package
   */
  prepareSubmission(contactInfo: { name: string; email: string }, notes?: string): RequestSubmission {
    return {
      requests: [...this.basket.requests],
      submissionId: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date(),
      submittedBy: contactInfo,
      notes
    };
  }

  /**
   * Get basket statistics
   */
  getStats(): {
    total: number;
    byAction: { new: number; update: number; remove: number };
    byStatus: { draft: number; pending: number; submitted: number; approved: number; rejected: number };
    byPriority: { low: number; normal: number; high: number };
  } {
    const requests = this.basket.requests;
    
    return {
      total: requests.length,
      byAction: {
        new: requests.filter(r => r.action === 'new').length,
        update: requests.filter(r => r.action === 'update').length,
        remove: requests.filter(r => r.action === 'remove').length
      },
      byStatus: {
        draft: requests.filter(r => r.status === 'draft').length,
        pending: requests.filter(r => r.status === 'pending').length,
        submitted: requests.filter(r => r.status === 'submitted').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length
      },
      byPriority: {
        low: requests.filter(r => r.priority === 'low').length,
        normal: requests.filter(r => r.priority === 'normal').length,
        high: requests.filter(r => r.priority === 'high').length
      }
    };
  }

  /**
   * Export basket as CSV
   */
  exportAsCSV(): string {
    const headers = [
      'Action',
      'Entity Name',
      'Suggested Code',
      'Custom Code',
      'Contributor Type',
      'Status',
      'Priority',
      'Contact Name',
      'Contact Email',
      'Created At',
      'Justification'
    ];

    const rows = this.basket.requests.map(req => [
      req.action,
      req.entityName,
      req.suggestedCode,
      req.customCode || '',
      req.contributorType,
      req.status,
      req.priority,
      req.contactName,
      req.contactEmail,
      req.createdAt.toISOString(),
      req.justification
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  /**
   * Export basket as JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(this.basket, null, 2);
  }
}

// Create singleton instance
export const basketService = new BasketService();
