// English name validation utilities for donor entity names
// Phase 1: Character Set Validation

export interface EnglishValidationResult {
  isValid: boolean;
  confidence: number;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    canOverride: boolean;
  }>;
  suggestions?: string[];
  shouldShowAlert?: boolean;
}

export interface EnglishValidationConfig {
  strictness: 'permissive' | 'moderate' | 'strict';
  allowOverride: boolean;
  requireJustification: boolean;
}

/**
 * Phase 1: Basic character set validation for English names
 * Validates that entity names use primarily Latin characters and common punctuation
 */
export function validateEnglishCharacters(name: string): { isValid: boolean; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  if (!name || typeof name !== 'string') {
    issues.push('Entity name is required');
    return { isValid: false, issues, suggestions };
  }

  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    issues.push('Entity name cannot be empty');
    return { isValid: false, issues, suggestions };
  }

  // Allow Latin characters, numbers, spaces, and common organizational punctuation
  const englishPattern = /^[A-Za-z0-9\s\-'.,()&/]+$/;
  
  if (!englishPattern.test(trimmed)) {
    issues.push('Entity name contains non-English characters. Please use only Latin letters, numbers, and common punctuation.');
    
    // Generate suggestion by removing accents and normalizing characters
    const englishEquivalent = trimmed
      .normalize('NFD') // Normalize to decomposed form (separates base chars from diacritics)
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/accent marks
      .replace(/[^\w\s\-'.,()&/]/g, ''); // Remove any remaining non-English characters
    
    if (englishEquivalent.length > 0 && englishEquivalent !== trimmed) {
      suggestions.push(`Consider: "${englishEquivalent}"`);
    }
  }
  
  // Check for reasonable letter ratio (should be mostly letters)
  const letters = (trimmed.match(/[A-Za-z]/g) || []).length;
  const letterRatio = letters / trimmed.length;
  
  if (letterRatio < 0.5) {
    issues.push('Entity name should be primarily composed of letters');
  }
  
  // Check for excessive punctuation
  const punctuation = (trimmed.match(/[^\w\s]/g) || []).length;
  const punctuationRatio = punctuation / trimmed.length;
  
  if (punctuationRatio > 0.3) {
    issues.push('Entity name contains excessive punctuation');
  }

  // Check for common non-English patterns
  const suspiciousPatterns = [
    { pattern: /[àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ]/i, message: 'Contains accented characters (French/Spanish/Portuguese style)' },
    { pattern: /[äöüß]/i, message: 'Contains German characters' },
    { pattern: /[αβγδεζηθικλμνξοπρστυφχψω]/i, message: 'Contains Greek characters' },
    { pattern: /[абвгдежзийклмнопрстуфхцчшщъыьэюя]/i, message: 'Contains Cyrillic characters' }
  ];

  suspiciousPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(trimmed)) {
      issues.push(message);
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Main English validation function that combines multiple checks
 */
export function validateEnglishName(name: string, config: EnglishValidationConfig): EnglishValidationResult {
  const issues: EnglishValidationResult['issues'] = [];
  let confidence = 1.0;
  
  // Phase 1: Character validation
  const charValidation = validateEnglishCharacters(name);
  
  if (!charValidation.isValid) {
    charValidation.issues.forEach(issue => {
      const severity = config.strictness === 'strict' ? 'error' : 
                      config.strictness === 'moderate' ? 'warning' : 'warning'; // Changed from 'info' to 'warning'
      
      issues.push({
        type: severity,
        message: issue,
        canOverride: config.allowOverride
      });
    });
    
    confidence -= 0.3;
  }

  // Determine overall validity based on strictness
  const hasErrors = issues.some(issue => issue.type === 'error');
  const hasWarnings = issues.some(issue => issue.type === 'warning');
  
  let isValid = !hasErrors;
  if (config.strictness === 'strict') {
    isValid = !hasErrors && !hasWarnings;
  } else if (config.strictness === 'moderate') {
    isValid = !hasErrors;
  } else {
    // Permissive: show warnings but don't block - for UI we still want to show the alert
    isValid = !hasErrors;
  }
  
  // IMPORTANT: For UI purposes, if there are any issues (errors OR warnings), 
  // we should show the validation alert. The 'isValid' field just determines 
  // if it blocks form submission.
  const shouldShowAlert = issues.length > 0;

  return {
    isValid,
    confidence: Math.max(0, confidence),
    issues,
    suggestions: charValidation.suggestions.length > 0 ? charValidation.suggestions : undefined,
    shouldShowAlert // Add this field to help the UI decide when to show alerts
  };
}

/**
 * Get default validation configuration based on environment
 */
export function getDefaultEnglishValidationConfig(): EnglishValidationConfig {
  const env = typeof window !== 'undefined' 
    ? (window as any).__VITE_ENV__ || 'development'
    : 'development';
    
  const configs = {
    development: {
      strictness: 'permissive' as const,
      allowOverride: true,
      requireJustification: false
    },
    testing: {
      strictness: 'moderate' as const,
      allowOverride: true,
      requireJustification: true
    },
    production: {
      strictness: 'moderate' as const, // Start moderate, can increase later
      allowOverride: true,
      requireJustification: true
    }
  };

  return configs[env as keyof typeof configs] || configs.development;
}

/**
 * Generate helpful suggestions for non-English names
 */
export function generateEnglishSuggestions(name: string): string[] {
  const suggestions: string[] = [];
  
  // Common translation patterns
  const translations: { [key: string]: string } = {
    // French
    'organisation': 'organization',
    'société': 'society',
    'fondation': 'foundation',
    'université': 'university',
    'centre': 'center',
    'institut': 'institute',
    'internationale': 'international',
    'nationale': 'national',
    'mondiale': 'world',
    
    // Spanish
    'organización': 'organization',
    'fundación': 'foundation',
    'universidad': 'university',
    'internacional': 'international',
    'nacional': 'national',
    'mundial': 'world',
    
    // German (only unique terms)
    'gesellschaft': 'society',
    'stiftung': 'foundation',
    'universität': 'university',
    'zentrum': 'center'
  };

  let suggested = name.toLowerCase();
  let hasTranslations = false;
  
  Object.entries(translations).forEach(([foreign, english]) => {
    if (suggested.includes(foreign)) {
      suggested = suggested.replace(new RegExp(foreign, 'gi'), english);
      hasTranslations = true;
    }
  });

  if (hasTranslations) {
    // Convert to title case
    const titleCase = suggested.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
    suggestions.push(`English equivalent: "${titleCase}"`);
  }

  // Remove accents and special characters
  const deAccented = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s\-'.,()&/]/g, ''); // Remove other special chars
    
  if (deAccented !== name && deAccented.length > 0) {
    suggestions.push(`Without accents: "${deAccented}"`);
  }

  return suggestions;
}
