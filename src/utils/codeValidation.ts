// Code validation utilities

import type { Donor } from '../types/donor';
import type { CodeValidationResult } from '../types/request';

/**
 * Validate code format according to CEB standards
 */
export function validateCodeFormat(code: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!code || typeof code !== 'string') {
    issues.push('Code is required');
    return { isValid: false, issues };
  }

  const trimmed = code.trim();
  
  if (trimmed.length === 0) {
    issues.push('Code cannot be empty');
    return { isValid: false, issues };
  }

  if (trimmed.length < 2) {
    issues.push('Code must be at least 2 characters long');
  }

  if (trimmed.length > 10) {
    issues.push('Code cannot exceed 10 characters');
  }

  // Check for valid characters (letters and numbers only)
  if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
    issues.push('Code can only contain letters and numbers');
  }

  // Check for at least one letter
  if (!/[A-Za-z]/.test(trimmed)) {
    issues.push('Code must contain at least one letter');
  }

  // Warn about potential issues
  if (/^\d+$/.test(trimmed)) {
    issues.push('Code should not be only numbers');
  }

  if (trimmed.toLowerCase() === trimmed) {
    issues.push('Code should contain uppercase letters');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Check if code is unique among existing donors
 */
export function checkCodeUniqueness(
  code: string, 
  existingDonors: Donor[]
): { isUnique: boolean; conflicts: string[] } {
  
  if (!code) {
    return { isUnique: false, conflicts: [] };
  }

  const normalizedCode = code.toUpperCase().trim();
  const conflicts: string[] = [];

  for (const donor of existingDonors) {
    const existingCode = donor['CEB CODE']?.toUpperCase().trim();
    if (existingCode === normalizedCode) {
      conflicts.push(donor.NAME);
    }
  }

  return {
    isUnique: conflicts.length === 0,
    conflicts
  };
}

/**
 * Find similar codes that might cause confusion
 */
export function findSimilarCodes(
  code: string, 
  existingDonors: Donor[], 
  threshold: number = 0.8
): string[] {
  
  if (!code || existingDonors.length === 0) {
    return [];
  }

  const normalizedCode = code.toUpperCase().trim();
  const similarCodes: string[] = [];

  for (const donor of existingDonors) {
    const existingCode = donor['CEB CODE']?.toUpperCase().trim();
    if (!existingCode || existingCode === normalizedCode) continue;

    const similarity = calculateCodeSimilarity(normalizedCode, existingCode);
    if (similarity >= threshold) {
      similarCodes.push(`${existingCode} (${donor.NAME})`);
    }
  }

  return similarCodes;
}

/**
 * Calculate similarity between two codes
 */
export function calculateCodeSimilarity(code1: string, code2: string): number {
  if (!code1 || !code2) return 0;
  
  const str1 = code1.toUpperCase();
  const str2 = code2.toUpperCase();
  
  if (str1 === str2) return 1;

  // Levenshtein distance
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
}

/**
 * Comprehensive code validation
 */
export function validateCode(
  code: string, 
  existingDonors: Donor[]
): CodeValidationResult {
  
  const formatResult = validateCodeFormat(code);
  const uniquenessResult = checkCodeUniqueness(code, existingDonors);
  const similarCodes = findSimilarCodes(code, existingDonors);

  // Generate suggestions if there are issues
  const suggestions: string[] = [];
  
  if (!uniquenessResult.isUnique) {
    // Suggest numbered variants
    const baseCode = code.toUpperCase().trim();
    for (let i = 1; i <= 5; i++) {
      const variant = `${baseCode}${i.toString().padStart(2, '0')}`;
      const variantCheck = checkCodeUniqueness(variant, existingDonors);
      if (variantCheck.isUnique) {
        suggestions.push(variant);
      }
    }
  }

  if (!formatResult.isValid) {
    // Suggest cleaned version
    const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length >= 2) {
      suggestions.push(cleaned);
    }
  }

  return {
    isValid: formatResult.isValid && uniquenessResult.isUnique,
    isUnique: uniquenessResult.isUnique,
    conflicts: uniquenessResult.conflicts,
    suggestions: [...new Set(suggestions)],
    formatIssues: formatResult.issues
  };
}

/**
 * Check if a code follows best practices
 */
export function checkCodeBestPractices(code: string): { score: number; recommendations: string[] } {
  const recommendations: string[] = [];
  let score = 100;

  if (!code) return { score: 0, recommendations: ['Code is required'] };

  const trimmed = code.trim().toUpperCase();

  // Length recommendations
  if (trimmed.length < 3) {
    score -= 20;
    recommendations.push('Consider using at least 3 characters for better uniqueness');
  } else if (trimmed.length > 7) {
    score -= 10;
    recommendations.push('Shorter codes (3-6 characters) are generally preferred');
  }

  // Pattern recommendations
  const hasNumbers = /\d/.test(trimmed);
  const letterCount = trimmed.replace(/\d/g, '').length;
  const numberCount = trimmed.replace(/[A-Z]/g, '').length;

  if (numberCount > letterCount) {
    score -= 15;
    recommendations.push('Codes should primarily use letters, not numbers');
  }

  if (numberCount > 2) {
    score -= 10;
    recommendations.push('Avoid using more than 2 numbers in a code');
  }

  // Readability checks
  const consecutiveConsonants = trimmed.match(/[BCDFGHJKLMNPQRSTVWXYZ]{4,}/);
  if (consecutiveConsonants) {
    score -= 15;
    recommendations.push('Avoid long sequences of consonants for better readability');
  }

  const repeatingChars = trimmed.match(/(.)\1{2,}/);
  if (repeatingChars) {
    score -= 10;
    recommendations.push('Avoid repeating the same character more than twice');
  }

  return {
    score: Math.max(0, score),
    recommendations
  };
}
