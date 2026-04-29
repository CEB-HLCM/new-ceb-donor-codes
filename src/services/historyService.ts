/**
 * History Service for managing request submission history
 * Stores submission data in localStorage with 6-month expiration
 */

import type { RequestSubmission } from '../types/request';

const HISTORY_STORAGE_KEY = 'ceb-donor-request-history';
const HISTORY_EXPIRY_DAYS = 180; // 6 months
const MAX_HISTORY_ENTRIES = 500;

export interface HistoryEntry extends RequestSubmission {
  status: 'submitted' | 'completed' | 'failed';
  submissionResult?: any;
  expiryDate: number;
}

class HistoryService {
  private static instance: HistoryService;

  private constructor() {}

  static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  /**
   * Get all valid (non-expired) history entries from localStorage
   */
  getHistory(): HistoryEntry[] {
    try {
      const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!storedHistory) {
        return [];
      }

      const parsed: HistoryEntry[] = JSON.parse(storedHistory);
      
      // Filter out expired entries
      const now = Date.now();
      const validHistory = parsed.filter(entry => entry.expiryDate > now);
      
      // Convert date strings back to Date objects
      const processedHistory = validHistory.map(entry => ({
        ...entry,
        submittedAt: new Date(entry.submittedAt),
        requests: entry.requests.map(req => ({
          ...req,
          createdAt: new Date(req.createdAt)
        }))
      }));
      
      // Clean up expired entries if any were removed
      if (validHistory.length !== parsed.length) {
        this.saveHistory(processedHistory);
      }
      
      return processedHistory;
    } catch (error) {
      console.error('Failed to load submission history:', error);
      return [];
    }
  }

  /**
   * Add a new submission to history
   */
  addToHistory(submission: RequestSubmission, status: HistoryEntry['status'], result?: any): void {
    try {
      const currentHistory = this.getHistory();
      
      const historyEntry: HistoryEntry = {
        ...submission,
        status,
        submissionResult: result,
        expiryDate: Date.now() + (HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      };

      // Add new entry at the beginning and limit to max entries
      const updatedHistory = [historyEntry, ...currentHistory].slice(0, MAX_HISTORY_ENTRIES);
      
      this.saveHistory(updatedHistory);
    } catch (error) {
      console.error('Failed to add submission to history:', error);
    }
  }

  /**
   * Clear all history entries
   */
  clearHistory(): void {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear submission history:', error);
    }
  }

  /**
   * Save history to localStorage
   */
  private saveHistory(historyData: HistoryEntry[]): void {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyData));
    } catch (error) {
      console.error('Failed to save submission history:', error);
    }
  }

  /**
   * Get a specific history entry by submission ID
   */
  getSubmissionById(submissionId: string): HistoryEntry | null {
    const history = this.getHistory();
    return history.find(entry => entry.submissionId === submissionId) || null;
  }

  /**
   * Update the status of a submission
   */
  updateSubmissionStatus(submissionId: string, newStatus: HistoryEntry['status']): boolean {
    try {
      const history = this.getHistory();
      const updatedHistory = history.map(entry => {
        if (entry.submissionId === submissionId) {
          return { ...entry, status: newStatus };
        }
        return entry;
      });
      
      // Only save if something changed
      if (JSON.stringify(history) !== JSON.stringify(updatedHistory)) {
        this.saveHistory(updatedHistory);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update submission status:', error);
      return false;
    }
  }

  /**
   * Get history statistics
   */
  getStats() {
    const history = this.getHistory();
    
    const byStatus = {
      submitted: history.filter(h => h.status === 'submitted').length,
      completed: history.filter(h => h.status === 'completed').length,
      failed: history.filter(h => h.status === 'failed').length
    };

    const totalRequests = history.reduce((sum, entry) => sum + entry.requests.length, 0);

    return {
      totalSubmissions: history.length,
      totalRequests,
      byStatus
    };
  }
}

// Export singleton instance
export const historyService = HistoryService.getInstance();