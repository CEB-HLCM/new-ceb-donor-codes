// Utility functions for processing entity names and generating codes

/**
 * Extract meaningful initials from an entity name
 * Handles various naming patterns and edge cases
 */
export function extractInitials(entityName: string): string[] {
  if (!entityName || typeof entityName !== 'string') {
    return [];
  }

  // Clean and normalize the name
  const cleaned = entityName
    .trim()
    .replace(/[^\w\s&-]/g, '') // Remove special chars except &, -
    .replace(/\s+/g, ' ') // Normalize whitespace
    .toUpperCase();

  // Handle common organizational patterns
  const words = cleaned.split(' ').filter(word => word.length > 0);
  
  // Filter out common stop words but keep important ones
  const stopWords = new Set([
    'THE', 'OF', 'AND', 'FOR', 'TO', 'IN', 'ON', 'AT', 'BY', 'WITH', 'FROM',
    'INTO', 'THROUGH', 'DURING', 'BEFORE', 'AFTER', 'ABOVE', 'BELOW', 'UP',
    'DOWN', 'OUT', 'OFF', 'OVER', 'UNDER', 'AGAIN', 'FURTHER', 'THEN', 'ONCE'
  ]);

  const significantWords = words.filter(word => {
    // Keep words that are:
    // 1. Not stop words
    // 2. Or important organizational terms
    // 3. Or single letters (like "&")
    return !stopWords.has(word) || 
           word.length === 1 || 
           ['FUND', 'FOUNDATION', 'ORGANIZATION', 'CENTRE', 'CENTER', 'AGENCY', 'BANK'].includes(word);
  });

  // Generate different initial patterns
  const patterns: string[] = [];

  // Pattern 1: First letter of each significant word
  if (significantWords.length > 0) {
    patterns.push(significantWords.map(word => word[0]).join(''));
  }

  // Pattern 2: First 2-3 letters of first word + first letter of others
  if (significantWords.length > 1) {
    const firstWord = significantWords[0];
    const otherInitials = significantWords.slice(1).map(word => word[0]).join('');
    
    if (firstWord.length >= 3) {
      patterns.push(firstWord.substring(0, 3) + otherInitials);
    }
    if (firstWord.length >= 2) {
      patterns.push(firstWord.substring(0, 2) + otherInitials);
    }
  }

  // Pattern 3: For long single words, take meaningful chunks
  if (significantWords.length === 1 && significantWords[0].length > 6) {
    const word = significantWords[0];
    patterns.push(word.substring(0, 4));
    patterns.push(word.substring(0, 5));
    patterns.push(word.substring(0, 6));
  }

  // Pattern 4: Handle hyphenated words specially
  const hyphenatedParts = cleaned.split('-').filter(part => part.length > 0);
  if (hyphenatedParts.length > 1) {
    patterns.push(hyphenatedParts.map(part => part[0]).join(''));
    patterns.push(hyphenatedParts.map(part => part.substring(0, 2)).join(''));
  }

  // Remove duplicates and filter reasonable lengths
  return [...new Set(patterns)].filter(pattern => 
    pattern.length >= 2 && pattern.length <= 8
  );
}

/**
 * Generate abbreviations from entity name using various techniques
 */
export function generateAbbreviations(entityName: string): string[] {
  if (!entityName) return [];

  const abbreviations: string[] = [];
  const cleaned = entityName.toUpperCase().trim();

  // Method 1: Remove vowels (keep first letter and consonants)
  const consonants = cleaned.replace(/[^A-Z]/g, '').replace(/[AEIOU]/g, '');
  if (consonants.length >= 3 && consonants.length <= 8) {
    abbreviations.push(consonants);
  }

  // Method 2: Take first N consonants after vowel removal
  if (consonants.length > 4) {
    abbreviations.push(consonants.substring(0, 4));
    abbreviations.push(consonants.substring(0, 5));
  }

  // Method 3: Smart vowel removal (keep some vowels for readability)
  const smartAbbrev = cleaned
    .replace(/[^A-Z]/g, '')
    .replace(/[AEIOU](?![AEIOU])/g, '') // Remove isolated vowels
    .substring(0, 6);
  
  if (smartAbbrev.length >= 3) {
    abbreviations.push(smartAbbrev);
  }

  return [...new Set(abbreviations)];
}

/**
 * Clean and validate code format
 */
export function cleanCode(code: string): string {
  if (!code) return '';
  
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Only letters and numbers
    .substring(0, 10); // Reasonable max length
}

/**
 * Check if a code follows common patterns
 */
export function analyzeCodePattern(code: string): CodePattern {
  if (!code) {
    return {
      type: 'custom',
      description: 'Empty code',
      example: ''
    };
  }

  const cleaned = cleanCode(code);
  const hasNumbers = /\d/.test(cleaned);
  const letterCount = cleaned.replace(/\d/g, '').length;
  const numberCount = cleaned.replace(/[A-Z]/g, '').length;

  // Pattern analysis
  if (letterCount >= 3 && numberCount === 0) {
    if (letterCount <= 4) {
      return {
        type: 'initials',
        description: 'Initials-based code (3-4 letters)',
        example: 'WHO, UNICEF'
      };
    } else {
      return {
        type: 'abbreviation',
        description: 'Abbreviation (5+ letters)',
        example: 'WORLDBANK, GATESV'
      };
    }
  }

  if (letterCount >= 2 && numberCount > 0) {
    return {
      type: 'hybrid',
      description: 'Letters + numbers combination',
      example: 'WHO123, GATES01'
    };
  }

  if (letterCount === 2 && numberCount === 0) {
    return {
      type: 'acronym',
      description: 'Two-letter country/region code',
      example: 'CH, ZA'
    };
  }

  return {
    type: 'custom',
    description: 'Custom format',
    example: cleaned
  };
}

/**
 * Generate variants of a base code with numbers
 */
export function generateCodeVariants(baseCode: string, maxVariants: number = 5): string[] {
  const cleaned = cleanCode(baseCode);
  const variants: string[] = [cleaned];

  // Add numbered variants
  for (let i = 1; i <= maxVariants && variants.length < maxVariants; i++) {
    variants.push(`${cleaned}${i.toString().padStart(2, '0')}`);
    variants.push(`${cleaned}${i}`);
  }

  // Add some alternative patterns
  if (cleaned.length > 3) {
    const shortened = cleaned.substring(0, cleaned.length - 1);
    variants.push(`${shortened}01`);
    variants.push(`${shortened}1`);
  }

  return [...new Set(variants)];
}

/**
 * Score the quality of a generated code
 */
export function scoreCodeQuality(code: string, entityName: string): number {
  if (!code || !entityName) return 0;

  let score = 50; // Base score

  const cleaned = cleanCode(code);
  const nameUpper = entityName.toUpperCase();

  // Length scoring (prefer 4-6 characters)
  if (cleaned.length >= 4 && cleaned.length <= 6) {
    score += 20;
  } else if (cleaned.length === 3 || cleaned.length === 7) {
    score += 10;
  } else {
    score -= 10;
  }

  // Check if code letters appear in entity name
  const codeLetters = cleaned.replace(/\d/g, '');
  let foundLetters = 0;
  for (const letter of codeLetters) {
    if (nameUpper.includes(letter)) {
      foundLetters++;
    }
  }
  const letterMatch = (foundLetters / codeLetters.length) * 100;
  score += letterMatch * 0.3;

  // Prefer codes without too many numbers
  const numberCount = cleaned.replace(/[A-Z]/g, '').length;
  if (numberCount === 0) {
    score += 15;
  } else if (numberCount <= 2) {
    score += 5;
  } else {
    score -= 10;
  }

  // Readability bonus (avoid too many consonants in a row)
  const consonantClusters = cleaned.match(/[BCDFGHJKLMNPQRSTVWXYZ]{4,}/g);
  if (!consonantClusters) {
    score += 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
