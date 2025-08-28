// Zod validation schema for donor request form

import { z } from 'zod';

export const donorRequestSchema = z.object({
  entityName: z
    .string()
    .min(2, 'Entity name must be at least 2 characters')
    .max(200, 'Entity name cannot exceed 200 characters')
    .refine(
      (val) => {
        // Allow all printable characters except control characters
        // This includes letters, numbers, spaces, and common punctuation/symbols
        const hasValidChars = /^[\x20-\x7E\u00A0-\uFFFF]+$/.test(val);
        const hasContent = val.trim().length > 0;
        return hasValidChars && hasContent;
      },
      { 
        message: 'Entity name contains invalid characters. Please use standard letters, numbers, spaces, and common punctuation only.' 
      }
    ),

  suggestedCode: z
    .string()
    .refine(
      (val) => val === '' || (val.length >= 2 && val.length <= 10 && /^[A-Z0-9]+$/.test(val)),
      {
        message: 'Code must be 2-10 uppercase letters and numbers, or empty'
      }
    ),

  customCode: z
    .string()
    .max(10, 'Code cannot exceed 10 characters')
    .regex(/^[A-Z0-9]*$/, 'Code can only contain uppercase letters and numbers')
    .optional(),

  contributorType: z
    .string()
    .min(1, 'Please select a contributor type'),

  donorType: z
    .enum(['0', '1'], {
      message: 'Please select Government or Non-Government'
    }),

  justification: z
    .string()
    .min(10, 'Justification must be at least 10 characters')
    .max(500, 'Justification cannot exceed 500 characters'),

  contactEmail: z
    .string()
    .email('Please enter a valid email address'),

  contactName: z
    .string()
    .min(2, 'Contact name must be at least 2 characters')
    .max(100, 'Contact name cannot exceed 100 characters')
    .refine(
      (val) => {
        // Allow printable characters for contact names
        const hasValidChars = /^[\x20-\x7E\u00A0-\uFFFF]+$/.test(val);
        const hasContent = val.trim().length > 0;
        return hasValidChars && hasContent;
      },
      { 
        message: 'Contact name contains invalid characters. Please use standard letters, numbers, spaces, and common punctuation only.' 
      }
    ),

  priority: z
    .enum(['low', 'normal', 'high'], {
      message: 'Please select a priority level'
    }),

  additionalNotes: z
    .string()
    .max(1000, 'Additional notes cannot exceed 1000 characters')
    .optional()
});

export type DonorRequestFormData = z.infer<typeof donorRequestSchema>;

// Field-specific validation schemas for real-time validation
export const fieldSchemas = {
  entityName: donorRequestSchema.shape.entityName,
  suggestedCode: donorRequestSchema.shape.suggestedCode,
  customCode: donorRequestSchema.shape.customCode,
  contributorType: donorRequestSchema.shape.contributorType,
  donorType: donorRequestSchema.shape.donorType,
  justification: donorRequestSchema.shape.justification,
  contactEmail: donorRequestSchema.shape.contactEmail,
  contactName: donorRequestSchema.shape.contactName,
  priority: donorRequestSchema.shape.priority,
  additionalNotes: donorRequestSchema.shape.additionalNotes
};
