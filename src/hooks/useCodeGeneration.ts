// React hook for code generation functionality

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDataContext } from '../context/DataContext';
import { CodeGenerationService } from '../services/codeGenerationService';
import type { 
  CodeGenerationResult, 
  CodeGenerationOptions,
  GeneratedCodeSuggestion 
} from '../types/request';

export interface UseCodeGenerationOptions {
  autoGenerate?: boolean;
  debounceDelay?: number;
  maxSuggestions?: number;
}

export interface UseCodeGenerationReturn {
  // Generation state
  isGenerating: boolean;
  result: CodeGenerationResult | null;
  error: string | null;
  
  // Generation functions
  generateCodes: (entityName: string, options?: Partial<CodeGenerationOptions>) => Promise<void>;
  clearResults: () => void;
  
  // Custom code validation
  validateCustomCode: (code: string) => {
    isValid: boolean;
    isAvailable: boolean;
    issues: string[];
    suggestions: string[];
  };
  
  // Quick access to results
  primarySuggestion: GeneratedCodeSuggestion | null;
  alternativeSuggestions: GeneratedCodeSuggestion[];
  
  // Service instance for advanced usage
  codeService: CodeGenerationService;
}

const defaultOptions: UseCodeGenerationOptions = {
  autoGenerate: false,
  debounceDelay: 500,
  maxSuggestions: 4
};

export function useCodeGeneration(options: UseCodeGenerationOptions = {}): UseCodeGenerationReturn {
  const { donorsWithTypes } = useDataContext();
  const opts = { ...defaultOptions, ...options };

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CodeGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create code generation service instance
  const codeService = useMemo(() => {
    return new CodeGenerationService(donorsWithTypes.map(d => ({
      NAME: d.NAME,
      TYPE: d.TYPE,
      'CEB CODE': d['CEB CODE'],
      'CONTRIBUTOR TYPE': d['CONTRIBUTOR TYPE']
    })));
  }, [donorsWithTypes]);

  // Update service when donors change
  useEffect(() => {
    codeService.updateDonors(donorsWithTypes.map(d => ({
      NAME: d.NAME,
      TYPE: d.TYPE,
      'CEB CODE': d['CEB CODE'],
      'CONTRIBUTOR TYPE': d['CONTRIBUTOR TYPE']
    })));
  }, [donorsWithTypes, codeService]);

  // Generate codes function
  const generateCodes = useCallback(async (
    entityName: string,
    generationOptions: Partial<CodeGenerationOptions> = {}
  ) => {
    if (!entityName?.trim()) {
      setError('Entity name is required');
      setResult(null);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const fullOptions: CodeGenerationOptions = {
        entityName: entityName.trim(),
        maxSuggestions: opts.maxSuggestions,
        preferredLength: 5,
        excludeExisting: true,
        ...generationOptions
      };

      const generationResult = codeService.generateCode(fullOptions);
      setResult(generationResult);
      setError(null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate codes';
      setError(errorMessage);
      setResult(null);
      console.error('Code generation error:', err);
      
    } finally {
      setIsGenerating(false);
    }
  }, [codeService, opts.maxSuggestions]);

  // Clear results
  const clearResults = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  // Validate custom code
  const validateCustomCode = useCallback((code: string) => {
    try {
      return codeService.validateCustomCode(code);
    } catch (err) {
      console.error('Code validation error:', err);
      return {
        isValid: false,
        isAvailable: false,
        issues: ['Validation failed'],
        suggestions: []
      };
    }
  }, [codeService]);

  // Quick access to results
  const primarySuggestion = useMemo(() => {
    return result?.primary || null;
  }, [result]);

  const alternativeSuggestions = useMemo(() => {
    return result?.alternatives || [];
  }, [result]);

  return {
    isGenerating,
    result,
    error,
    generateCodes,
    clearResults,
    validateCustomCode,
    primarySuggestion,
    alternativeSuggestions,
    codeService
  };
}

// Debounced version for real-time generation
export function useDebouncedCodeGeneration(
  entityName: string,
  options: UseCodeGenerationOptions & { enabled?: boolean } = {}
): UseCodeGenerationReturn {
  
  const { enabled = true, debounceDelay = 500, ...otherOptions } = options;
  const codeGeneration = useCodeGeneration(otherOptions);
  const [debouncedEntityName, setDebouncedEntityName] = useState('');

  // Debounce entity name changes
  useEffect(() => {
    if (!enabled || !entityName?.trim()) {
      setDebouncedEntityName('');
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedEntityName(entityName.trim());
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [entityName, enabled, debounceDelay]);

  // Auto-generate when debounced name changes
  useEffect(() => {
    if (debouncedEntityName && enabled) {
      codeGeneration.generateCodes(debouncedEntityName);
    } else {
      codeGeneration.clearResults();
    }
  }, [debouncedEntityName, enabled, codeGeneration]);

  return codeGeneration;
}
