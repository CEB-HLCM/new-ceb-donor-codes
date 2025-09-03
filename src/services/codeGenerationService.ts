// Intelligent code generation service

import type { Donor } from '../types/donor';
import type { 
  CodeGenerationOptions, 
  CodeGenerationResult, 
  GeneratedCodeSuggestion 
} from '../types/request';

import { 
  extractInitials, 
  generateAbbreviations, 
  generateCodeVariants, 
  analyzeCodePattern,
  scoreCodeQuality,
  cleanCode
} from '../utils/nameProcessing';

import { validateCode } from '../utils/codeValidation';

export class CodeGenerationService {
  private donors: Donor[] = [];

  constructor(donors: Donor[] = []) {
    this.donors = donors;
  }

  /**
   * Update the donor database for validation
   */
  updateDonors(donors: Donor[]): void {
    this.donors = donors;
  }

  /**
   * Generate intelligent code suggestions for an entity
   */
  generateCode(options: CodeGenerationOptions): CodeGenerationResult {
    const startTime = performance.now();
    
    const {
      entityName,
      contributorType,
      preferredLength = 5,
      maxSuggestions = 5
    } = options;

    if (!entityName?.trim()) {
      throw new Error('Entity name is required for code generation');
    }

    const suggestions: GeneratedCodeSuggestion[] = [];
    
    // Strategy 1: Initials-based codes
    const initials = extractInitials(entityName);
    for (const initial of initials) {
      const codes = this.generateFromInitials(initial, preferredLength);
      suggestions.push(...codes.map(code => this.createSuggestion(code, entityName, 'initials')));
    }

    // Strategy 2: Abbreviation-based codes  
    const abbreviations = generateAbbreviations(entityName);
    for (const abbrev of abbreviations) {
      const codes = this.generateFromAbbreviation(abbrev, preferredLength);
      suggestions.push(...codes.map(code => this.createSuggestion(code, entityName, 'abbreviation')));
    }

    // Strategy 3: Smart hybrid approach
    const hybrids = this.generateHybridCodes(entityName, preferredLength);
    suggestions.push(...hybrids.map(code => this.createSuggestion(code, entityName, 'hybrid')));

    // Remove duplicates and sort by confidence
    const uniqueSuggestions = this.removeDuplicates(suggestions);
    const sortedSuggestions = uniqueSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions + 1); // +1 for primary

    const endTime = performance.now();

    if (sortedSuggestions.length === 0) {
      // Fallback: Generate simple codes when main algorithms fail
      const fallbackCodes = this.generateFallbackCodes(entityName);
      if (fallbackCodes.length > 0) {
        sortedSuggestions.push(...fallbackCodes);
      } else {
        throw new Error(`Could not generate any valid codes for "${entityName}". Try a different entity name or use custom code.`);
      }
    }

    const [primary, ...alternatives] = sortedSuggestions;

    return {
      primary,
      alternatives: alternatives.slice(0, maxSuggestions),
      stats: {
        totalGenerated: suggestions.length,
        uniqueCount: uniqueSuggestions.length,
        averageConfidence: this.calculateAverageConfidence(uniqueSuggestions),
        processingTimeMs: Math.round(endTime - startTime)
      }
    };
  }

  /**
   * Generate codes from initials
   */
  private generateFromInitials(initials: string, preferredLength: number): string[] {
    const codes: string[] = [];
    const baseInitials = cleanCode(initials);

    if (baseInitials.length === 0) return codes;

    // Add base initials
    codes.push(baseInitials);

    // If too short, add numbers
    if (baseInitials.length < preferredLength) {
      const needed = preferredLength - baseInitials.length;
      if (needed <= 3) {
        for (let i = 1; i <= 99; i++) {
          const numberPart = i.toString().padStart(needed, '0');
          codes.push(baseInitials + numberPart);
          if (codes.length >= 10) break; // Limit variants
        }
      }
    }

    // If too long, try shortened versions
    if (baseInitials.length > preferredLength) {
      codes.push(baseInitials.substring(0, preferredLength));
      codes.push(baseInitials.substring(0, preferredLength - 1) + '1');
    }

    return codes;
  }

  /**
   * Generate codes from abbreviations
   */
  private generateFromAbbreviation(abbreviation: string, preferredLength: number): string[] {
    const codes: string[] = [];
    const baseAbbrev = cleanCode(abbreviation);

    if (baseAbbrev.length === 0) return codes;

    codes.push(baseAbbrev);

    // Add numbered variants if needed
    if (baseAbbrev.length < preferredLength) {
      codes.push(baseAbbrev + '01');
      codes.push(baseAbbrev + '1');
    }

    // Try shortened versions if too long
    if (baseAbbrev.length > preferredLength + 2) {
      codes.push(baseAbbrev.substring(0, preferredLength));
    }

    return codes;
  }

  /**
   * Generate hybrid codes using smart combinations
   */
  private generateHybridCodes(entityName: string, preferredLength: number): string[] {
    const codes: string[] = [];
    const words = entityName.toUpperCase().split(/\s+/).filter(w => w.length > 0);

    if (words.length === 0) return codes;

    // Strategy: First word prefix + other initials
    if (words.length > 1) {
      const firstWord = words[0];
      const otherInitials = words.slice(1).map(w => w[0]).join('');

      // Try different prefix lengths
      for (let prefixLen = 2; prefixLen <= Math.min(4, firstWord.length); prefixLen++) {
        const prefix = firstWord.substring(0, prefixLen);
        const hybrid = prefix + otherInitials;
        
        if (hybrid.length >= 3 && hybrid.length <= 8) {
          codes.push(hybrid);
          
          // Add numbered variant if close to preferred length
          if (hybrid.length < preferredLength) {
            codes.push(hybrid + '01');
          }
        }
      }
    }

    // Strategy: Take chunks from long single words
    if (words.length === 1 && words[0].length > 6) {
      const word = words[0];
      codes.push(word.substring(0, preferredLength));
      codes.push(word.substring(0, preferredLength - 1) + '1');
    }

    return codes;
  }

  /**
   * Create a suggestion object with validation and scoring
   */
  private createSuggestion(
    code: string, 
    entityName: string, 
    strategyType: string
  ): GeneratedCodeSuggestion {
    
    const cleanedCode = cleanCode(code);
    const validation = validateCode(cleanedCode, this.donors);
    const quality = scoreCodeQuality(cleanedCode, entityName);
    const pattern = analyzeCodePattern(cleanedCode);

    // Calculate confidence based on multiple factors
    let confidence = quality;
    
    // Boost confidence for unique codes
    if (validation.isUnique) {
      confidence += 20;
    } else {
      confidence -= 30;
    }

    // Boost for good format
    if (validation.isValid) {
      confidence += 10;
    } else {
      confidence -= 20;
    }

    // Strategy-based adjustments
    if (strategyType === 'initials') {
      confidence += 5; // Prefer initials-based codes
    }

    // Ensure confidence is within bounds
    confidence = Math.max(0, Math.min(100, confidence));

    return {
      code: cleanedCode,
      confidence: Math.round(confidence),
      reasoning: this.generateReasoning(cleanedCode, entityName, strategyType, validation),
      isUnique: validation.isUnique,
      pattern
    };
  }

  /**
   * Generate human-readable reasoning for a code suggestion
   */
  private generateReasoning(
    code: string, 
    entityName: string, 
    strategy: string, 
    validation: any
  ): string {
    
    const reasons: string[] = [];

    // Explain the generation strategy
    switch (strategy) {
      case 'initials':
        reasons.push('Generated from entity name initials');
        break;
      case 'abbreviation':
        reasons.push('Created using name abbreviation technique');
        break;
      case 'hybrid':
        reasons.push('Combines word prefixes with initials');
        break;
    }

    // Explain validation results
    if (validation.isUnique) {
      reasons.push('unique in current database');
    } else {
      reasons.push(`conflicts with ${validation.conflicts.length} existing code(s)`);
    }

    // Explain pattern
    const pattern = analyzeCodePattern(code);
    reasons.push(`follows ${pattern.type} pattern`);

    return reasons.join(', ');
  }

  /**
   * Remove duplicate suggestions
   */
  private removeDuplicates(suggestions: GeneratedCodeSuggestion[]): GeneratedCodeSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      if (seen.has(suggestion.code)) {
        return false;
      }
      seen.add(suggestion.code);
      return true;
    });
  }

  /**
   * Calculate average confidence score
   */
  private calculateAverageConfidence(suggestions: GeneratedCodeSuggestion[]): number {
    if (suggestions.length === 0) return 0;
    
    const total = suggestions.reduce((sum, suggestion) => sum + suggestion.confidence, 0);
    return Math.round(total / suggestions.length);
  }

  /**
   * Generate fallback codes when main algorithms fail
   */
  private generateFallbackCodes(entityName: string): GeneratedCodeSuggestion[] {
    const fallbacks: GeneratedCodeSuggestion[] = [];
    const cleanName = cleanCode(entityName.replace(/\s+/g, ''));
    
    try {
      // Fallback 1: First 4-6 letters of cleaned name
      if (cleanName.length >= 4) {
        for (let len = 4; len <= Math.min(6, cleanName.length); len++) {
          const code = cleanName.substring(0, len);
          const validation = validateCode(code, this.donors);
          if (validation.isValid) {
            fallbacks.push({
              code,
              confidence: validation.isUnique ? 60 : 40,
              reasoning: `Fallback: First ${len} letters of entity name`,
              isUnique: validation.isUnique,
              pattern: { type: 'abbreviation', description: 'Name abbreviation fallback', example: code }
            });
          }
        }
      }

      // Fallback 2: First 3 letters + numbers
      if (cleanName.length >= 3) {
        const base = cleanName.substring(0, 3);
        for (let i = 1; i <= 99; i++) {
          const code = base + i.toString().padStart(2, '0');
          const validation = validateCode(code, this.donors);
          if (validation.isValid && validation.isUnique) {
            fallbacks.push({
              code,
              confidence: 50,
              reasoning: `Fallback: First 3 letters + number ${i}`,
              isUnique: true,
              pattern: { type: 'hybrid', description: 'Letters + numbers fallback', example: code }
            });
            if (fallbacks.length >= 3) break; // Limit fallback suggestions
          }
        }
      }

      // Fallback 3: Random letters from name + numbers
      if (fallbacks.length === 0 && cleanName.length >= 2) {
        const letters = cleanName.substring(0, 2) + cleanName.charAt(cleanName.length - 1);
        const code = letters + '01';
        const validation = validateCode(code, this.donors);
        if (validation.isValid) {
          fallbacks.push({
            code,
            confidence: 30,
            reasoning: 'Fallback: Simple letter combination + numbers',
            isUnique: validation.isUnique,
            pattern: { type: 'custom', description: 'Emergency fallback pattern', example: code }
          });
        }
      }

    } catch (error) {
      console.error('Error in fallback code generation:', error);
    }

    return fallbacks;
  }

  /**
   * Generate a specific number of unique codes for an entity
   */
  generateMultipleCodes(entityName: string, count: number = 5): string[] {
    const result = this.generateCode({ 
      entityName, 
      maxSuggestions: count - 1 
    });

    const codes = [result.primary.code, ...result.alternatives.map(alt => alt.code)];
    return codes.slice(0, count);
  }

  /**
   * Check if a custom code is available and suggest improvements
   */
  validateCustomCode(code: string): {
    isValid: boolean;
    isAvailable: boolean;
    issues: string[];
    suggestions: string[];
  } {
    
    const validation = validateCode(code, this.donors);
    const suggestions: string[] = [];

    if (!validation.isUnique) {
      // Generate alternatives
      const variants = generateCodeVariants(code, 5);
      for (const variant of variants) {
        const variantValidation = validateCode(variant, this.donors);
        if (variantValidation.isUnique && variantValidation.isValid) {
          suggestions.push(variant);
        }
      }
    }

    return {
      isValid: validation.isValid,
      isAvailable: validation.isUnique,
      issues: [...validation.formatIssues, ...validation.conflicts.map(c => `Conflicts with: ${c}`)],
      suggestions: suggestions.slice(0, 3)
    };
  }
}
