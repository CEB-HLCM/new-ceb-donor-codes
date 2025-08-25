// Utility functions for validating and analyzing data relationships

import type { Donor, ContributorType, DonorWithType } from '../types/donor';

/**
 * Validate data integrity and relationships
 * @param donors Array of donor records
 * @param contributorTypes Array of contributor type definitions
 * @returns Validation report
 */
export function validateDataIntegrity(
  donors: Donor[],
  contributorTypes: ContributorType[]
) {
  const report = {
    donorsCount: donors.length,
    contributorTypesCount: contributorTypes.length,
    missingContributorTypes: [] as string[],
    validRelationships: 0,
    invalidRelationships: 0,
    duplicateCebCodes: [] as string[],
    emptyFields: {
      names: 0,
      cebCodes: 0,
      contributorTypes: 0,
    },
  };

  // Create lookup map for contributor types
  const contributorTypeMap = new Map<string, ContributorType>();
  contributorTypes.forEach(type => {
    contributorTypeMap.set(type.TYPE, type);
  });

  // Track CEB codes for duplicate detection
  const cebCodeCounts = new Map<string, number>();
  
  // Analyze each donor record
  donors.forEach(donor => {
    // Check for empty fields
    if (!donor.NAME?.trim()) report.emptyFields.names++;
    if (!donor['CEB CODE']?.trim()) report.emptyFields.cebCodes++;
    if (!donor['CONTRIBUTOR TYPE']?.trim()) report.emptyFields.contributorTypes++;

    // Check CEB code duplicates
    const cebCode = donor['CEB CODE'];
    if (cebCode) {
      cebCodeCounts.set(cebCode, (cebCodeCounts.get(cebCode) || 0) + 1);
    }

    // Validate contributor type relationship
    const contributorType = donor['CONTRIBUTOR TYPE'];
    if (contributorType) {
      if (contributorTypeMap.has(contributorType)) {
        report.validRelationships++;
      } else {
        report.invalidRelationships++;
        if (!report.missingContributorTypes.includes(contributorType)) {
          report.missingContributorTypes.push(contributorType);
        }
      }
    }
  });

  // Find duplicate CEB codes
  cebCodeCounts.forEach((count, code) => {
    if (count > 1) {
      report.duplicateCebCodes.push(code);
    }
  });

  return report;
}

/**
 * Generate summary statistics for loaded data
 * @param donorsWithTypes Array of donors with linked type information
 * @returns Summary statistics
 */
export function generateDataSummary(donorsWithTypes: DonorWithType[]) {
  const summary = {
    total: donorsWithTypes.length,
    government: 0,
    nonGovernment: 0,
    byContributorType: new Map<string, number>(),
    withValidTypeInfo: 0,
    withoutTypeInfo: 0,
  };

  donorsWithTypes.forEach(donor => {
    // Count by government/non-government
    if (donor.TYPE === '1') {
      summary.government++;
    } else {
      summary.nonGovernment++;
    }

    // Count by contributor type
    if (donor.contributorTypeInfo) {
      summary.withValidTypeInfo++;
      const typeName = donor.contributorTypeInfo.NAME;
      summary.byContributorType.set(
        typeName,
        (summary.byContributorType.get(typeName) || 0) + 1
      );
    } else {
      summary.withoutTypeInfo++;
    }
  });

  return summary;
}

/**
 * Log data validation report to console (for debugging)
 * @param donors Array of donor records
 * @param contributorTypes Array of contributor type definitions
 * @param donorsWithTypes Array of donors with linked type information
 */
export function logDataReport(
  donors: Donor[],
  contributorTypes: ContributorType[],
  donorsWithTypes: DonorWithType[]
) {
  console.group('🔍 Data Validation Report');
  
  const validation = validateDataIntegrity(donors, contributorTypes);
  const summary = generateDataSummary(donorsWithTypes);

  console.log('📊 Data Counts:', {
    donors: validation.donorsCount,
    contributorTypes: validation.contributorTypesCount,
  });

  console.log('🔗 Relationship Validation:', {
    valid: validation.validRelationships,
    invalid: validation.invalidRelationships,
    missingTypes: validation.missingContributorTypes,
  });

  console.log('📋 Summary by Type:', {
    government: summary.government,
    nonGovernment: summary.nonGovernment,
    withTypeInfo: summary.withValidTypeInfo,
    withoutTypeInfo: summary.withoutTypeInfo,
  });

  if (validation.duplicateCebCodes.length > 0) {
    console.warn('⚠️  Duplicate CEB Codes:', validation.duplicateCebCodes);
  }

  if (validation.emptyFields.names > 0 || validation.emptyFields.cebCodes > 0) {
    console.warn('⚠️  Empty Fields:', validation.emptyFields);
  }

  console.log('📈 Contributor Type Distribution:');
  Array.from(summary.byContributorType.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

  console.groupEnd();
}
