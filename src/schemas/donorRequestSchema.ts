// Zod validation schema for donor request form

import { z } from 'zod';

export const donorRequestSchema = z.object({
  entityName: z
    .string()
    .min(2, 'Entity name must be at least 2 characters')
    .max(100, 'Entity name cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s&\-\.]+$/, 'Entity name contains invalid characters'),

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

  justification: z
    .string()
    .min(10, 'Justification must be at least 10 characters')
    .max(500, 'Justification cannot exceed 500 characters'),

  contactEmail: z
    .string()
    .refine(
      (val) => val === '' || z.string().email().safeParse(val).success,
      { message: 'Please enter a valid email address' }
    ),

  contactName: z
    .string()
    .refine(
      (val) => val === '' || (val.length >= 2 && val.length <= 50),
      { message: 'Contact name must be 2-50 characters when provided' }
    ),

  priority: z
    .enum(['low', 'normal', 'high', ''], {
      errorMap: () => ({ message: 'Please select a priority level' })
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
  justification: donorRequestSchema.shape.justification,
  contactEmail: donorRequestSchema.shape.contactEmail,
  contactName: donorRequestSchema.shape.contactName,
  priority: donorRequestSchema.shape.priority,
  additionalNotes: donorRequestSchema.shape.additionalNotes
};
