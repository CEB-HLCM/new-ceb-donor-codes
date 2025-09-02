// Enhanced email service for mixed request submissions using EmailJS

import emailjs from '@emailjs/browser';
import type { DonorRequest, RequestSubmission } from '../types/request';

// EmailJS configuration - Using environment variables for security
const EMAIL_CONFIG = {
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  privateKey: import.meta.env.VITE_EMAILJS_PRIVATE_KEY,
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID
};

export interface EmailSubmissionResult {
  success: boolean;
  submissionId?: string;
  error?: string;
  details?: any;
}

/**
 * Enhanced email service for submitting mixed request types
 */
export class EmailService {
  private initialized = false;

  /**
   * Initialize EmailJS (call once at app startup)
   */
  async initialize(): Promise<void> {
    try {
      // Validate environment variables are loaded
      if (!EMAIL_CONFIG.publicKey || !EMAIL_CONFIG.serviceId || !EMAIL_CONFIG.templateId) {
        throw new Error('EmailJS environment variables not properly configured. Check .env.local file.');
      }

      emailjs.init(EMAIL_CONFIG.publicKey);
      this.initialized = true;
      console.log('EmailJS initialized successfully with environment variables');
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
      throw new Error(`Email service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit mixed request submission via email
   */
  async submitRequests(submission: RequestSubmission): Promise<EmailSubmissionResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Group requests by action type for better email organization
      const groupedRequests = {
        new: submission.requests.filter(r => r.action === 'new'),
        update: submission.requests.filter(r => r.action === 'update'),
        remove: submission.requests.filter(r => r.action === 'remove')
      };

      // Prepare email content
      const emailContent = this.formatEmailContent(submission, groupedRequests);

      // Send email via EmailJS
      const response = await emailjs.send(
        EMAIL_CONFIG.serviceId,
        EMAIL_CONFIG.templateId,
        emailContent
      );

      console.log('Email sent successfully:', response);

      return {
        success: true,
        submissionId: submission.submissionId,
        details: response
      };

    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Handle specific EmailJS errors
      let errorMessage = 'Unknown email error';
      if (error && typeof error === 'object' && 'text' in error) {
        errorMessage = String(error.text);
        
        // Handle common EmailJS errors with user-friendly messages
        if (errorMessage.includes('Invalid grant') || errorMessage.includes('reconnect')) {
          errorMessage = 'Email service configuration needs to be updated. Please contact the administrator to reconnect the Gmail account.';
        } else if (errorMessage.includes('Unauthorized')) {
          errorMessage = 'Email service authorization expired. Please contact the administrator.';
        } else if (errorMessage.includes('Rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        details: error
      };
    }
  }

  /**
   * Format email content to match the new template structure
   */
  private formatEmailContent(
    submission: RequestSubmission, 
    groupedRequests: { new: DonorRequest[]; update: DonorRequest[]; remove: DonorRequest[] }
  ): Record<string, any> {
    const { new: newRequests, update: updateRequests, remove: removeRequests } = groupedRequests;
    
    // Format requests for human-readable table
    const requestsTable = this.formatRequestsTable(submission.requests);
    
    // Format JSON snippets for new requests (for database addition)
    const jsonSnippets = this.formatJsonSnippets(newRequests);

    // Template variables matching your EmailJS template
    return {
      // Template variables: {{name}} and {{email}}
      name: submission.submittedBy.name,
      email: submission.submittedBy.email,
      
      // Template variable: {{{requests}}} - human readable table
      requests: requestsTable,
      
      // Template variable: {{{json_snippet}}} - JSON for database
      json_snippet: jsonSnippets
    };
  }

  /**
   * Format requests as a human-readable table
   */
  private formatRequestsTable(requests: DonorRequest[]): string {
    const lines = [];
    
    lines.push('REQUEST DETAILS:');
    lines.push('================');
    lines.push('');

    requests.forEach((req, index) => {
      lines.push(`${index + 1}. ${req.action.toUpperCase()} REQUEST:`);
      lines.push(`   Entity Name: ${req.entityName}`);
      lines.push(`   Code: ${req.customCode || req.suggestedCode}`);
      lines.push(`   Contributor Type: ${req.contributorType}`);
      lines.push(`   Priority: ${req.priority.toUpperCase()}`);
      lines.push(`   Contact: ${req.contactName} (${req.contactEmail})`);
      lines.push(`   Justification: ${req.justification}`);
      
      if (req.originalDonor && (req.action === 'update' || req.action === 'remove')) {
        lines.push(`   Original Entity: ${req.originalDonor.name}`);
        lines.push(`   Original Code: ${req.originalDonor.code}`);
      }
      
      if (req.removalReason && req.action === 'remove') {
        lines.push(`   Removal Reason: ${req.removalReason.toUpperCase()}`);
      }
      
      if (req.additionalNotes) {
        lines.push(`   Additional Notes: ${req.additionalNotes}`);
      }
      
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Format JSON snippets for new requests (for database addition)
   */
  private formatJsonSnippets(newRequests: DonorRequest[]): string {
    if (newRequests.length === 0) {
      return 'No new requests requiring JSON database entries.';
    }

    const lines = [];
    lines.push('JSON DATABASE ENTRIES FOR NEW REQUESTS:');
    lines.push('=======================================');
    lines.push('');

    newRequests.forEach((req, index) => {
      const jsonObject = {
        "NAME": req.entityName,
        "TYPE": this.getTypeFromContributorType(req.contributorType),
        "CEB CODE": req.customCode || req.suggestedCode,
        "CONTRIBUTOR TYPE": req.contributorType
      };

      lines.push(`${index + 1}. ${req.entityName}:`);
      lines.push(JSON.stringify(jsonObject, null, 2));
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Map contributor type to TYPE field (0=Non-government, 1=Government)
   */
  private getTypeFromContributorType(contributorType: string): string {
    // C01 = Government, others are typically non-government
    return contributorType === 'C01' ? '1' : '0';
  }

  /**
   * Format proposed changes for update requests
   */
  private formatChanges(changes: DonorRequest['proposedChanges']): string {
    if (!changes) return '';
    
    const parts = [];
    if (changes.name) {
      parts.push(`Name: "${changes.name.from}" → "${changes.name.to}"`);
    }
    if (changes.code) {
      parts.push(`Code: "${changes.code.from}" → "${changes.code.to}"`);
    }
    if (changes.contributorType) {
      parts.push(`Type: "${changes.contributorType.from}" → "${changes.contributorType.to}"`);
    }
    
    return parts.length > 0 ? `Changes: ${parts.join(', ')}` : '';
  }

  /**
   * Get highest priority from requests for legacy compatibility
   */
  private getHighestPriority(requests: DonorRequest[]): string {
    const priorities = requests.map(r => r.priority);
    if (priorities.includes('high')) return 'high';
    if (priorities.includes('normal')) return 'normal';
    return 'low';
  }

  /**
   * Test email connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const emailService = new EmailService();

// Auto-initialize on import
emailService.initialize().catch(console.error);
