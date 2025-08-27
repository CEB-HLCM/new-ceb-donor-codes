// Request form and code generation interfaces

export type RequestAction = 'new' | 'update' | 'remove';

export interface DonorRequest {
  id: string;
  action: RequestAction; // NEW: Type of request
  entityName: string;
  suggestedCode: string;
  customCode?: string;
  contributorType: string;
  justification: string;
  contactEmail: string;
  contactName: string;
  priority: 'low' | 'normal' | 'high';
  additionalNotes?: string;
  createdAt: Date;
  status: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected';
  // NEW: Original donor data for update/remove requests
  originalDonor?: {
    name: string;
    code: string;
    contributorType: string;
    type: string;
  };
  // NEW: For removal requests
  removalReason?: 'duplicate' | 'obsolete' | 'merged' | 'incorrect' | 'other';
  removalJustification?: string;
  // NEW: For update requests - changes summary
  proposedChanges?: {
    name?: { from: string; to: string };
    code?: { from: string; to: string };
    contributorType?: { from: string; to: string };
  };
}

export interface CodeGenerationOptions {
  entityName: string;
  contributorType?: string;
  preferredLength?: number;
  excludeExisting?: boolean;
  maxSuggestions?: number;
}

export interface GeneratedCodeSuggestion {
  code: string;
  confidence: number; // 0-100 percentage
  reasoning: string;
  isUnique: boolean;
  pattern: CodePattern;
}

export interface CodeGenerationResult {
  primary: GeneratedCodeSuggestion;
  alternatives: GeneratedCodeSuggestion[];
  stats: {
    totalGenerated: number;
    uniqueCount: number;
    averageConfidence: number;
    processingTimeMs: number;
  };
}

export interface CodePattern {
  type: 'initials' | 'abbreviation' | 'acronym' | 'hybrid' | 'custom';
  description: string;
  example: string;
}

export interface CodeValidationResult {
  isValid: boolean;
  isUnique: boolean;
  conflicts: string[]; // Array of conflicting donor names
  suggestions: string[];
  formatIssues: string[];
}

export interface DonorRequestForm {
  entityName: string;
  suggestedCode: string;
  customCode: string;
  contributorType: string;
  justification: string;
  contactEmail: string;
  contactName: string;
  priority: 'low' | 'normal' | 'high';
  additionalNotes: string;
}

// NEW: Interface for donor data from the main donor list
export interface DonorData {
  'CEB CODE': string;
  NAME: string;
  'CONTRIBUTOR TYPE': string;
  TYPE: string;
}

// Request management interfaces
export interface RequestBasket {
  requests: DonorRequest[];
  lastModified: Date;
  totalCount: number;
}

export interface RequestSubmission {
  requests: DonorRequest[];
  submissionId: string;
  submittedAt: Date;
  submittedBy: {
    name: string;
    email: string;
  };
  notes?: string;
}
