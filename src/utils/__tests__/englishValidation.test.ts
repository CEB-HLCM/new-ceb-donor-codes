// Test cases for English name validation
import { 
  validateEnglishCharacters, 
  validateEnglishName, 
  getDefaultEnglishValidationConfig,
  generateEnglishSuggestions 
} from '../englishValidation';

describe('English Name Validation', () => {
  
  describe('validateEnglishCharacters', () => {
    
    test('should accept valid English names', () => {
      const validNames = [
        'World Health Organization',
        'United Nations Children\'s Fund',
        'Bill & Melinda Gates Foundation',
        'Doctors Without Borders',
        'International Red Cross',
        'Save the Children International',
        'Oxfam America',
        'World Bank Group',
        'AT&T Foundation',
        'Johnson & Johnson',
        'St. Jude Children\'s Research Hospital',
        'McDonald\'s Corporation'
      ];

      validNames.forEach(name => {
        const result = validateEnglishCharacters(name);
        expect(result.isValid).toBe(true);
        expect(result.issues.length).toBe(0);
      });
    });

    test('should flag non-English characters', () => {
      const nonEnglishNames = [
        'Médecins Sans Frontières', // French accents
        'Deutsche Gesellschaft für Internationale Zusammenarbeit', // German umlaut
        '中国红十字会', // Chinese characters
        'Federación Internacional', // Spanish accent
        'Organisation des Nations Unies', // French
        'Всемирная организация здравоохранения', // Cyrillic
        'منظمة الصحة العالمية', // Arabic
        'Organização Mundial da Saúde' // Portuguese
      ];

      nonEnglishNames.forEach(name => {
        const result = validateEnglishCharacters(name);
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.issues.some(issue => 
          issue.toLowerCase().includes('english') || 
          issue.toLowerCase().includes('characters')
        )).toBe(true);
      });
    });

    test('should handle edge cases', () => {
      // Empty string
      expect(validateEnglishCharacters('').isValid).toBe(false);
      
      // Only spaces
      expect(validateEnglishCharacters('   ').isValid).toBe(false);
      
      // Null/undefined
      expect(validateEnglishCharacters(null as any).isValid).toBe(false);
      expect(validateEnglishCharacters(undefined as any).isValid).toBe(false);
      
      // Very short names
      expect(validateEnglishCharacters('UN').isValid).toBe(true);
      
      // Names with numbers
      expect(validateEnglishCharacters('3M Foundation').isValid).toBe(true);
    });

    test('should detect excessive punctuation', () => {
      const excessivePunctuation = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const result = validateEnglishCharacters(excessivePunctuation);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => 
        issue.toLowerCase().includes('punctuation')
      )).toBe(true);
    });

    test('should generate suggestions for non-English names', () => {
      const result = validateEnglishCharacters('Médecins Sans Frontières');
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toContain('Medecins Sans Frontieres');
    });
  });

  describe('validateEnglishName', () => {
    
    test('should respect different strictness levels', () => {
      const testName = 'Médecins Sans Frontières';
      
      // Permissive mode
      const permissive = validateEnglishName(testName, {
        strictness: 'permissive',
        allowOverride: true,
        requireJustification: false
      });
      expect(permissive.isValid).toBe(false); // Still flags as invalid but allows override
      expect(permissive.issues.every(issue => issue.canOverride)).toBe(true);
      
      // Moderate mode
      const moderate = validateEnglishName(testName, {
        strictness: 'moderate',
        allowOverride: true,
        requireJustification: true
      });
      expect(moderate.isValid).toBe(false);
      expect(moderate.issues.some(issue => issue.type === 'warning')).toBe(true);
      
      // Strict mode
      const strict = validateEnglishName(testName, {
        strictness: 'strict',
        allowOverride: false,
        requireJustification: true
      });
      expect(strict.isValid).toBe(false);
      expect(strict.issues.some(issue => issue.type === 'error')).toBe(true);
    });

    test('should provide confidence scores', () => {
      const englishName = 'World Health Organization';
      const nonEnglishName = '中国红十字会';
      
      const englishResult = validateEnglishName(englishName, getDefaultEnglishValidationConfig());
      const nonEnglishResult = validateEnglishName(nonEnglishName, getDefaultEnglishValidationConfig());
      
      expect(englishResult.confidence).toBeGreaterThan(nonEnglishResult.confidence);
      expect(englishResult.confidence).toBeGreaterThan(0.8);
      expect(nonEnglishResult.confidence).toBeLessThan(0.8);
    });

    test('should handle mixed language names', () => {
      const mixedNames = [
        'UNICEF España',
        'WHO Europe',
        'Caritas Deutschland',
        'Cruz Roja Internacional',
        'Banco Mundial América Latina'
      ];

      mixedNames.forEach(name => {
        const result = validateEnglishName(name, getDefaultEnglishValidationConfig());
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateEnglishSuggestions', () => {
    
    test('should suggest translations for common terms', () => {
      const testCases = [
        { input: 'Organisation Mondiale de la Santé', expected: 'world' },
        { input: 'Deutsche Gesellschaft', expected: 'society' },
        { input: 'Fundación Internacional', expected: 'foundation' },
        { input: 'Université de Paris', expected: 'university' }
      ];

      testCases.forEach(({ input, expected }) => {
        const suggestions = generateEnglishSuggestions(input);
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions.some(s => s.toLowerCase().includes(expected))).toBe(true);
      });
    });

    test('should remove accents and special characters', () => {
      const input = 'Médecins Sans Frontières';
      const suggestions = generateEnglishSuggestions(input);
      
      expect(suggestions.some(s => s.includes('Medecins Sans Frontieres'))).toBe(true);
    });

    test('should return empty array for already English names', () => {
      const englishName = 'World Health Organization';
      const suggestions = generateEnglishSuggestions(englishName);
      
      expect(suggestions.length).toBe(0);
    });
  });

  describe('getDefaultEnglishValidationConfig', () => {
    
    test('should return valid configuration', () => {
      const config = getDefaultEnglishValidationConfig();
      
      expect(config).toHaveProperty('strictness');
      expect(config).toHaveProperty('allowOverride');
      expect(config).toHaveProperty('requireJustification');
      
      expect(['permissive', 'moderate', 'strict']).toContain(config.strictness);
      expect(typeof config.allowOverride).toBe('boolean');
      expect(typeof config.requireJustification).toBe('boolean');
    });
  });
});

describe('Real-world Test Cases', () => {
  const config = getDefaultEnglishValidationConfig();

  test('should handle UN organization names correctly', () => {
    const unOrganizations = [
      'United Nations',
      'World Health Organization',
      'United Nations Children\'s Fund',
      'World Food Programme',
      'International Labour Organization',
      'United Nations Educational, Scientific and Cultural Organization'
    ];

    unOrganizations.forEach(name => {
      const result = validateEnglishName(name, config);
      expect(result.isValid).toBe(true);
    });
  });

  test('should handle international NGO names', () => {
    const ngos = [
      'Amnesty International',
      'Human Rights Watch',
      'Transparency International',
      'International Committee of the Red Cross',
      'Médecins Sans Frontières', // Should flag
      'Ärzte ohne Grenzen', // Should flag
      'أطباء بلا حدود' // Should flag
    ];

    const englishNgos = ngos.slice(0, 4);
    const nonEnglishNgos = ngos.slice(4);

    englishNgos.forEach(name => {
      const result = validateEnglishName(name, config);
      expect(result.isValid).toBe(true);
    });

    nonEnglishNgos.forEach(name => {
      const result = validateEnglishName(name, config);
      expect(result.isValid).toBe(false);
    });
  });

  test('should handle corporate foundation names', () => {
    const foundations = [
      'Bill & Melinda Gates Foundation',
      'Ford Foundation',
      'Rockefeller Foundation',
      'Open Society Foundations',
      'Robert Wood Johnson Foundation'
    ];

    foundations.forEach(name => {
      const result = validateEnglishName(name, config);
      expect(result.isValid).toBe(true);
    });
  });

  test('should provide helpful error messages', () => {
    const testName = 'Médecins Sans Frontières';
    const result = validateEnglishName(testName, config);
    
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0].message).toContain('English');
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions!.length).toBeGreaterThan(0);
  });
});

