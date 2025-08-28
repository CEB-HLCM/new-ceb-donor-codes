// Data service for fetching and processing CSV data from CEB GitHub repository

import type { Donor, ContributorType, DonorWithType, ApiResponse } from '../types/donor';
import { sampleDonors, sampleContributorTypes } from '../data/sampleData';

// CSV data URLs - Handle CORS issues in production using reliable CORS proxy
const isDevelopment = import.meta.env.DEV;

// CORS proxy for production (AllOrigins - free, reliable, no rate limits)
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/CEB-HLCM/FS-Public-Codes/refs/heads/main';

// For development: Vite proxy | For production: CORS proxy to GitHub raw URLs
const DONORS_CSV_URL = isDevelopment
  ? '/api/csv/CEB-HLCM/FS-Public-Codes/refs/heads/main/DONORS.csv'
  : CORS_PROXY + encodeURIComponent(`${GITHUB_RAW_BASE}/DONORS.csv`);

const CONTRIBUTOR_TYPES_CSV_URL = isDevelopment
  ? '/api/csv/CEB-HLCM/FS-Public-Codes/refs/heads/main/CONTRIBUTOR_TYPES.csv'
  : CORS_PROXY + encodeURIComponent(`${GITHUB_RAW_BASE}/CONTRIBUTOR_TYPES.csv`);

/**
 * Lightweight CSV parser - converts CSV text to array of objects
 * @param csvText - Raw CSV text with headers
 * @returns Array of objects with column headers as keys
 */
function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.trim().split('\n');
  console.log(`CSV Parsing: ${lines.length} lines found`);
  
  if (lines.length < 2) {
    console.warn('CSV has less than 2 lines:', lines);
    return [];
  }

  // Clean up headers (remove BOM and extra whitespace)
  const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim());
  console.log('CSV Headers:', headers);
  
  const result: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV parsing with potential quoted fields
    const values = parseCSVLine(line);
    if (values.length !== headers.length) {
      console.warn(`Line ${i} has ${values.length} values but expected ${headers.length}:`, values);
      continue;
    }

    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = values[index]?.trim() || '';
    });
    result.push(obj);
  }

  console.log(`CSV Parsing completed: ${result.length} records`);
  return result;
}

/**
 * Parse a single CSV line handling quoted fields and commas within quotes
 * @param line - Single CSV line
 * @returns Array of field values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

/**
 * Fetch CSV data from a URL with error handling and retry logic
 * Handles both direct CSV URLs (development) and GitHub API responses (production)
 * @param url - CSV file URL or GitHub API URL
 * @param retries - Number of retry attempts
 * @returns Promise with CSV text content
 */
async function fetchCSV(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Minimal headers for CORS proxy compatibility
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv,text/plain,*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();

      if (!csvText.trim()) {
        throw new Error('Empty CSV response');
      }

      return csvText;
    } catch (error) {
      console.warn(`Attempt ${attempt}/${retries} failed for ${url}:`, error);
      if (attempt === retries) {
        throw new Error(`Failed to fetch CSV after ${retries} attempts: ${error}`);
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error('Unexpected error in fetchCSV');
}

/**
 * Fetch and parse donors data from GitHub
 * @returns Promise with parsed Donor array
 */
export async function fetchDonors(): Promise<ApiResponse<Donor[]>> {
  try {
    const csvText = await fetchCSV(DONORS_CSV_URL);
    console.log('Raw CSV Text Sample:', csvText.substring(0, 500) + '...');
    
    const donors = parseCSV<Donor>(csvText);
    console.log(`Loaded ${donors.length} donors from CSV`);
    
    // Log first few donors to check data structure
    if (donors.length > 0) {
      console.log('First 3 donors:', donors.slice(0, 3));
    }
    
    return {
      data: donors,
      success: true,
    };
  } catch (error) {
    console.error('Error fetching donors:', error);
    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching donors',
    };
  }
}

/**
 * Fetch and parse contributor types data from GitHub
 * @returns Promise with parsed ContributorType array
 */
export async function fetchContributorTypes(): Promise<ApiResponse<ContributorType[]>> {
  try {
    const csvText = await fetchCSV(CONTRIBUTOR_TYPES_CSV_URL);
    const contributorTypes = parseCSV<ContributorType>(csvText);
    
    console.log(`Loaded ${contributorTypes.length} contributor types from CSV`);
    return {
      data: contributorTypes,
      success: true,
    };
  } catch (error) {
    console.error('Error fetching contributor types:', error);
    return {
      data: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching contributor types',
    };
  }
}

/**
 * Link donors with their contributor type information
 * @param donors - Array of donor records
 * @param contributorTypes - Array of contributor type definitions
 * @returns Array of donors with linked contributor type info
 */
export function linkDonorsWithTypes(
  donors: Donor[], 
  contributorTypes: ContributorType[]
): DonorWithType[] {
  const contributorTypeMap = new Map<string, ContributorType>();
  contributorTypes.forEach(type => {
    contributorTypeMap.set(type.TYPE, type);
  });

  return donors.map(donor => ({
    ...donor,
    contributorTypeInfo: contributorTypeMap.get(donor['CONTRIBUTOR TYPE']),
  }));
}

/**
 * Fetch all data required for the application
 * @returns Promise with all linked data
 */
export async function fetchAllData(): Promise<{
  donors: Donor[];
  contributorTypes: ContributorType[];
  donorsWithTypes: DonorWithType[];
  errors: string[];
}> {
  const [donorsResponse, contributorTypesResponse] = await Promise.all([
    fetchDonors(),
    fetchContributorTypes(),
  ]);

  const errors: string[] = [];
  let donors = donorsResponse.data;
  let contributorTypes = contributorTypesResponse.data;

  // Fallback to sample data if CSV fetching fails
  if (!donorsResponse.success) {
    console.warn('Failed to fetch donors CSV, using sample data:', donorsResponse.error);
    donors = sampleDonors;
    errors.push(`Donors CSV failed, using sample data: ${donorsResponse.error}`);
  }

  if (!contributorTypesResponse.success) {
    console.warn('Failed to fetch contributor types CSV, using sample data:', contributorTypesResponse.error);
    contributorTypes = sampleContributorTypes;
    errors.push(`Contributor Types CSV failed, using sample data: ${contributorTypesResponse.error}`);
  }

  const donorsWithTypes = linkDonorsWithTypes(donors, contributorTypes);

  return {
    donors,
    contributorTypes,
    donorsWithTypes,
    errors,
  };
}
