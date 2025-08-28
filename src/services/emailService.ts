// Enhanced email service for mixed request submissions using EmailJS

import emailjs from '@emailjs/browser';
import type { DonorRequest, RequestSubmission } from '../types/request';

// EmailJS configuration (preserved from original app)
const EMAIL_CONFIG = {
  serviceId: 'add_new_duty_station',
  templateId: 'template_okd4w8x', 
  userId: 'user_ANTAfHrBooXuOmxNxi1Yn'
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
      emailjs.init(EMAIL_CONFIG.userId);
      this.initialized = true;
      console.log('EmailJS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
      throw new Error('Email service initialization failed');
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
   * Format email content for mixed request types
   */
  private formatEmailContent(
    submission: RequestSubmission, 
    groupedRequests: { new: DonorRequest[]; update: DonorRequest[]; remove: DonorRequest[] }
  ): Record<string, any> {
    const { new: newRequests, update: updateRequests, remove: removeRequests } = groupedRequests;
    
    // Create formatted sections for each request type
    const sections = [];
    
    // NEW REQUESTS SECTION
    if (newRequests.length > 0) {
      sections.push(`
=== NEW DONOR CODE REQUESTS (${newRequests.length}) ===

${newRequests.map((req, index) => `
${index + 1}. Entity: ${req.entityName}
   Suggested Code: ${req.customCode || req.suggestedCode}
   Contributor Type: ${req.contributorType}
   Priority: ${req.priority.toUpperCase()}
   Justification: ${req.justification}
   ${req.additionalNotes ? `Additional Notes: ${req.additionalNotes}` : ''}
`).join('\n')}
      `);
    }

    // UPDATE REQUESTS SECTION  
    if (updateRequests.length > 0) {
      sections.push(`
=== DONOR CODE UPDATE REQUESTS (${updateRequests.length}) ===

${updateRequests.map((req, index) => `
${index + 1}. Original: ${req.originalDonor?.name} (${req.originalDonor?.code})
   Updated Entity: ${req.entityName}
   New Code: ${req.customCode || req.suggestedCode}
   New Contributor Type: ${req.contributorType}
   Priority: ${req.priority.toUpperCase()}
   Justification: ${req.justification}
   ${req.proposedChanges ? this.formatChanges(req.proposedChanges) : ''}
   ${req.additionalNotes ? `Additional Notes: ${req.additionalNotes}` : ''}
`).join('\n')}
      `);
    }

    // REMOVAL REQUESTS SECTION
    if (removeRequests.length > 0) {
      sections.push(`
=== DONOR CODE REMOVAL REQUESTS (${removeRequests.length}) ===

${removeRequests.map((req, index) => `
${index + 1}. Entity: ${req.originalDonor?.name || req.entityName}
   Code to Remove: ${req.originalDonor?.code || req.suggestedCode}
   Removal Reason: ${req.removalReason?.toUpperCase()}
   Priority: ${req.priority.toUpperCase()}
   Justification: ${req.removalJustification || req.justification}
   ${req.additionalNotes ? `Additional Notes: ${req.additionalNotes}` : ''}
`).join('\n')}
      `);
    }

    // Compile email template variables
    return {
      // Header information
      submission_id: submission.submissionId,
      submission_date: submission.submittedAt.toISOString(),
      contact_name: submission.submittedBy.name,
      contact_email: submission.submittedBy.email,
      
      // Summary counts
      total_requests: submission.requests.length,
      new_count: newRequests.length,
      update_count: updateRequests.length,
      remove_count: removeRequests.length,
      
      // Main content
      request_details: sections.join('\n\n'),
      
      // Additional notes
      submission_notes: submission.notes || 'No additional notes provided',
      
      // Legacy fields for compatibility with existing template
      entity_name: submission.requests[0]?.entityName || 'Multiple Entities',
      suggested_code: submission.requests[0]?.suggestedCode || 'Mixed Requests',
      justification: `Mixed submission with ${submission.requests.length} requests`,
      contributor_type: 'Mixed Types',
      priority: this.getHighestPriority(submission.requests),
      
      // Metadata
      submission_type: 'Mixed Request Submission',
      app_version: 'CEB Donor Codes v2.0 (Phase 5)'
    };
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
