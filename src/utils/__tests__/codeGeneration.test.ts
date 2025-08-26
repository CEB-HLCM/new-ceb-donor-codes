// Simple test to verify code generation functionality
// Note: This is a basic test - comprehensive testing will be in Phase 8

import { extractInitials, generateAbbreviations, cleanCode, scoreCodeQuality } from '../nameProcessing';
import { validateCodeFormat, checkCodeUniqueness } from '../codeValidation';
import { CodeGenerationService } from '../../services/codeGenerationService';
import type { Donor } from '../../types/donor';

// Mock donor data for testing
const mockDonors: Donor[] = [
  {
    NAME: "World Health Organization",
    TYPE: "0",
    "CEB CODE": "WHO",
    "CONTRIBUTOR TYPE": "C04A"
  },
  {
    NAME: "UNICEF",
    TYPE: "0", 
    "CEB CODE": "UNICEF",
    "CONTRIBUTOR TYPE": "C02"
  },
  {
    NAME: "Gates Foundation",
    TYPE: "0",
    "CEB CODE": "GATES",
    "CONTRIBUTOR TYPE": "C05"
  }
];

describe('Code Generation System', () => {
  describe('Name Processing', () => {
    test('extractInitials should work correctly', () => {
      const initials = extractInitials("World Health Organization");
      expect(initials).toContain("WHO");
    });

    test('generateAbbreviations should create meaningful abbreviations', () => {
      const abbrevs = generateAbbreviations("United Nations");
      expect(abbrevs.length).toBeGreaterThan(0);
      expect(abbrevs[0]).toMatch(/^[A-Z]+$/);
    });

    test('cleanCode should sanitize input', () => {
      expect(cleanCode("who-123!")).toBe("WHO123");
      expect(cleanCode("test code")).toBe("TESTCODE");
    });

    test('scoreCodeQuality should rate codes appropriately', () => {
      const score = scoreCodeQuality("WHO", "World Health Organization");
      expect(score).toBeGreaterThan(50);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Code Validation', () => {
    test('validateCodeFormat should catch invalid formats', () => {
      const valid = validateCodeFormat("WHO123");
      expect(valid.isValid).toBe(true);
      
      const invalid = validateCodeFormat("w!");
      expect(invalid.isValid).toBe(false);
      expect(invalid.issues.length).toBeGreaterThan(0);
    });

    test('checkCodeUniqueness should detect conflicts', () => {
      const unique = checkCodeUniqueness("NEWCODE", mockDonors);
      expect(unique.isUnique).toBe(true);
      
      const duplicate = checkCodeUniqueness("WHO", mockDonors);
      expect(duplicate.isUnique).toBe(false);
      expect(duplicate.conflicts).toContain("World Health Organization");
    });
  });

  describe('Code Generation Service', () => {
    test('should generate multiple suggestions', () => {
      const service = new CodeGenerationService(mockDonors);
      const result = service.generateCode({
        entityName: "International Development Agency"
      });
      
      expect(result.primary).toBeDefined();
      expect(result.primary.code).toMatch(/^[A-Z0-9]+$/);
      expect(result.primary.confidence).toBeGreaterThan(0);
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    test('should validate custom codes', () => {
      const service = new CodeGenerationService(mockDonors);
      
      // Test unique code
      const unique = service.validateCustomCode("NEWORG");
      expect(unique.isValid).toBe(true);
      expect(unique.isAvailable).toBe(true);
      
      // Test duplicate code
      const duplicate = service.validateCustomCode("WHO");
      expect(duplicate.isAvailable).toBe(false);
      expect(duplicate.suggestions.length).toBeGreaterThan(0);
    });
  });
});

// Integration test
describe('Integration Test', () => {
  test('complete code generation workflow', () => {
    const service = new CodeGenerationService(mockDonors);
    
    // Generate codes for a new entity
    const result = service.generateCode({
      entityName: "European Development Bank",
      maxSuggestions: 3
    });

    // Verify result structure
    expect(result.primary).toBeDefined();
    expect(result.alternatives.length).toBeLessThanOrEqual(3);
    expect(result.stats.totalGenerated).toBeGreaterThan(0);
    expect(result.stats.processingTimeMs).toBeGreaterThan(0);

    // Verify all suggestions are unique
    const allCodes = [result.primary, ...result.alternatives].map(s => s.code);
    const uniqueCodes = new Set(allCodes);
    expect(uniqueCodes.size).toBe(allCodes.length);

    // Verify all suggestions are valid
    allCodes.forEach(code => {
      const validation = validateCodeFormat(code);
      expect(validation.isValid).toBe(true);
    });
  });
});

console.log('✅ Code Generation Tests - Run these with Jest in Phase 8');
