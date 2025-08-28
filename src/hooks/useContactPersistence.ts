// Smart contact details persistence for better UX across forms

import { useState, useEffect, useCallback } from 'react';

interface ContactDetails {
  contactName: string;
  contactEmail: string;
}

const CONTACT_STORAGE_KEY = 'ceb-donor-contact-details';
const STORAGE_EXPIRY_DAYS = 30; // Contact details expire after 30 days

interface StoredContactData {
  contactDetails: ContactDetails;
  timestamp: number;
  expiryDate: number;
}

/**
 * Hook for persisting contact details across form sessions
 * Automatically saves and restores contact name and email to improve UX
 */
export function useContactPersistence() {
  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    contactName: '',
    contactEmail: ''
  });
  
  const [isLoaded, setIsLoaded] = useState(false);

  // Load contact details from localStorage on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(CONTACT_STORAGE_KEY);
      
      if (storedData) {
        const parsed: StoredContactData = JSON.parse(storedData);
        
        // Check if data hasn't expired
        if (Date.now() < parsed.expiryDate) {
          setContactDetails(parsed.contactDetails);
        } else {
          // Remove expired data
          localStorage.removeItem(CONTACT_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to load contact details from storage:', error);
      // Clear potentially corrupted data
      localStorage.removeItem(CONTACT_STORAGE_KEY);
    }
    
    setIsLoaded(true);
  }, []);

  // Save contact details to localStorage
  const saveContactDetails = useCallback((details: ContactDetails) => {
    try {
      // Only save if both fields have meaningful content
      if (details.contactName.trim().length >= 2 && details.contactEmail.includes('@')) {
        const dataToStore: StoredContactData = {
          contactDetails: details,
          timestamp: Date.now(),
          expiryDate: Date.now() + (STORAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        };
        
        localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(dataToStore));
        setContactDetails(details);
      }
    } catch (error) {
      console.warn('Failed to save contact details to storage:', error);
    }
  }, []);

  // Update contact details (with automatic saving)
  const updateContactDetails = useCallback((updates: Partial<ContactDetails>) => {
    const newDetails = { ...contactDetails, ...updates };
    setContactDetails(newDetails);
    
    // Auto-save when both fields are complete
    if (newDetails.contactName.trim().length >= 2 && newDetails.contactEmail.includes('@')) {
      saveContactDetails(newDetails);
    }
  }, [contactDetails, saveContactDetails]);

  // Clear stored contact details
  const clearContactDetails = useCallback(() => {
    try {
      localStorage.removeItem(CONTACT_STORAGE_KEY);
      setContactDetails({ contactName: '', contactEmail: '' });
    } catch (error) {
      console.warn('Failed to clear contact details from storage:', error);
    }
  }, []);

  // Check if contact details are available and valid
  const hasValidContactDetails = useCallback(() => {
    return contactDetails.contactName.trim().length >= 2 && 
           contactDetails.contactEmail.includes('@');
  }, [contactDetails]);

  return {
    contactDetails,
    isLoaded,
    updateContactDetails,
    saveContactDetails,
    clearContactDetails,
    hasValidContactDetails: hasValidContactDetails()
  };
}

/**
 * Utility function to pre-fill React Hook Form with stored contact details
 */
export function useContactFormIntegration(setValue: (name: string, value: any) => void) {
  const { contactDetails, isLoaded } = useContactPersistence();

  useEffect(() => {
    if (isLoaded && contactDetails.contactName && contactDetails.contactEmail) {
      setValue('contactName', contactDetails.contactName);
      setValue('contactEmail', contactDetails.contactEmail);
    }
  }, [isLoaded, contactDetails, setValue]);

  return { contactDetails, isLoaded };
}
