// Request form and code generation interfaces

export interface DonorRequest {
  id: string;
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
