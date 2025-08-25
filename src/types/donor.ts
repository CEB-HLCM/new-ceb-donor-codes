// Donor and contributor type interfaces

export interface Donor {
  NAME: string;
  TYPE: string; // "0" for non-government, "1" for government
  'CEB CODE': string; // Note: contains space, needs quotes
  'CONTRIBUTOR TYPE': string; // Maps to ContributorType.TYPE (C01, C02, etc.)
}

export interface ContributorType {
  NAME: string; // Human-readable name (e.g., "Government", "NGOs")
  TYPE: string; // Code (C01, C02, C03, etc.)
  DEFINITION: string; // Detailed description
}

// Enhanced donor interface with linked contributor type information
export interface DonorWithType extends Donor {
  contributorTypeInfo?: ContributorType;
}

// Data loading states
export interface DataState {
  donors: Donor[];
  contributorTypes: ContributorType[];
  donorsWithTypes: DonorWithType[];
  loading: boolean;
  error: string | null;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}
