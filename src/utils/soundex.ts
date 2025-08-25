/**
 * Soundex algorithm implementation for "sounds like" matching
 * Converts names to phonetic codes for similarity matching
 * Example: "Smith" and "Smyth" both convert to "S530"
 */

export function soundex(str: string): string {
  if (!str || str.length === 0) return '';
  
  // Convert to uppercase and remove non-alphabetic characters
  const cleanStr = str.toUpperCase().replace(/[^A-Z]/g, '');
  if (cleanStr.length === 0) return '';
  
  // Keep the first letter
  let result = cleanStr[0];
  
  // Soundex mapping table
  const soundexMap: { [key: string]: string } = {
    'B': '1', 'F': '1', 'P': '1', 'V': '1',
    'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
    'D': '3', 'T': '3',
    'L': '4',
    'M': '5', 'N': '5',
    'R': '6'
  };
  
  // Process remaining characters
  let prevCode = soundexMap[cleanStr[0]] || '';
  
  for (let i = 1; i < cleanStr.length && result.length < 4; i++) {
    const char = cleanStr[i];
    const code = soundexMap[char];
    
    // Skip vowels (A, E, I, O, U, Y, H, W) and duplicates
    if (code && code !== prevCode) {
      result += code;
      prevCode = code;
    } else if (!code) {
      prevCode = '';
    }
  }
  
  // Pad with zeros to length 4
  return result.padEnd(4, '0');
}

/**
 * Compare two strings using Soundex algorithm
 */
export function soundexMatch(str1: string, str2: string): boolean {
  return soundex(str1) === soundex(str2);
}

/**
 * Get soundex similarity score (0-1, where 1 is identical)
 */
export function soundexSimilarity(str1: string, str2: string): number {
  const code1 = soundex(str1);
  const code2 = soundex(str2);
  
  if (code1 === code2) return 1;
  if (code1.length === 0 || code2.length === 0) return 0;
  
  // Calculate character-by-character similarity
  let matches = 0;
  const minLength = Math.min(code1.length, code2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (code1[i] === code2[i]) matches++;
  }
  
  return matches / 4; // Soundex codes are always 4 characters
}
