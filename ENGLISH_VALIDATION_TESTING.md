# English Name Validation - Testing Guide

## Phase 1: Character Set Validation Implementation

This document provides comprehensive testing instructions for the newly implemented English name validation feature.

## Overview

The English name validation system helps ensure donor entity names are provided in English, as required by CEB standards. The system provides:

- **Real-time validation** as users type entity names
- **Helpful suggestions** for non-English names
- **Configurable strictness levels** (permissive, moderate, strict)
- **Override capability** with justification requirements
- **User-friendly warnings** instead of hard blocks

## Testing the Feature

### 1. Access the Feature

1. Navigate to the donor request form: **https://new-ceb-donor-codes.netlify.app/donor-request**
2. Start filling out the "Entity Information" step
3. Enter an entity name in the "Entity Name" field

### 2. Test Valid English Names

Try these names that **should pass validation**:

```
✅ World Health Organization
✅ United Nations Children's Fund
✅ Bill & Melinda Gates Foundation
✅ Doctors Without Borders
✅ International Red Cross
✅ Save the Children International
✅ Oxfam America
✅ World Bank Group
✅ AT&T Foundation
✅ Johnson & Johnson
✅ St. Jude Children's Research Hospital
✅ McDonald's Corporation
✅ 3M Foundation
✅ NATO
✅ UNESCO
```

**Expected Result**: No warnings appear, form validation passes

### 3. Test Non-English Names

Try these names that **should trigger warnings**:

#### French Names:
```
⚠️ Médecins Sans Frontières
⚠️ Organisation des Nations Unies
⚠️ Fondation Bill et Melinda Gates
⚠️ Société des Nations
```

#### German Names:
```
⚠️ Deutsche Gesellschaft für Internationale Zusammenarbeit
⚠️ Ärzte ohne Grenzen
⚠️ Weltgesundheitsorganisation
```

#### Spanish Names:
```
⚠️ Federación Internacional de Sociedades de la Cruz Roja
⚠️ Organización Mundial de la Salud
⚠️ Médicos Sin Fronteras
```

#### Other Languages:
```
⚠️ 中国红十字会 (Chinese)
⚠️ Всемирная организация здравоохранения (Russian)
⚠️ منظمة الصحة العالمية (Arabic)
⚠️ Organização Mundial da Saúde (Portuguese)
```

**Expected Result**: 
- Warning alert appears below the entity name field
- Alert shows validation issues and suggestions
- Checkbox appears to acknowledge non-English name
- Justification text field appears when checkbox is checked

### 4. Test Suggestion System

When entering non-English names, check that suggestions appear:

1. Enter: `Organisation Mondiale de la Santé`
   - **Expected suggestion**: "English equivalent: World Health Organization"

2. Enter: `Médecins Sans Frontières`
   - **Expected suggestion**: "Without accents: Medecins Sans Frontieres"

3. Enter: `Deutsche Gesellschaft`
   - **Expected suggestion**: "English equivalent: German Society"

### 5. Test Override Functionality

1. Enter a non-English name (e.g., `Médecins Sans Frontières`)
2. Check the acknowledgment checkbox: "I understand this name may not be in English..."
3. Fill in the justification field with a reason like:
   ```
   This is the official legal name of the organization as registered in France. 
   The organization is internationally known by this French name.
   ```
4. Continue to the next step

**Expected Result**: Form should allow progression despite the non-English name

### 6. Test Suggestion Application

1. Enter a non-English name that generates suggestions
2. Click the "Apply" button next to a suggestion
3. Verify the entity name field updates with the suggested text
4. Confirm the warning disappears if the suggestion is in English

### 7. Test Edge Cases

#### Very Short Names:
```
✅ UN (should pass)
✅ WHO (should pass)
```

#### Names with Numbers:
```
✅ 3M Foundation (should pass)
✅ G20 Foundation (should pass)
```

#### Names with Special Characters:
```
✅ AT&T Foundation (should pass)
✅ Johnson & Johnson (should pass)
⚠️ Café de la Paix (should warn - accented characters)
```

#### Empty/Invalid Input:
```
❌ (empty string - should show required field error)
❌ "   " (only spaces - should show validation error)
```

### 8. Test Different Strictness Levels

The app currently runs in **moderate** strictness mode. To test different levels, you would need to modify the configuration, but here's what to expect:

- **Permissive**: Warns about non-English but allows easy override
- **Moderate**: Shows warnings and requires justification (current setting)
- **Strict**: Shows errors and may block submission entirely

### 9. Integration Testing

1. **Complete Form Flow**: 
   - Enter a non-English name
   - Acknowledge and justify it
   - Complete the rest of the form
   - Submit successfully

2. **Form Persistence**:
   - Enter non-English name and justification
   - Save draft
   - Reload page and load draft
   - Verify acknowledgment and justification are preserved

3. **Validation Summary**:
   - Complete form with non-English name
   - Go to review step
   - Verify English validation issues appear in validation summary

## Expected User Experience

### Positive UX Elements:
- ✅ **Non-blocking**: Users can still submit with justification
- ✅ **Helpful**: Provides suggestions and explanations
- ✅ **Educational**: Explains why English names are preferred
- ✅ **Flexible**: Allows legitimate exceptions with proper justification

### Warning Indicators:
- 🔶 **Warning Alert**: Yellow/orange alert box for non-English names
- 🔶 **Suggestion Chips**: Clickable suggestions to improve the name
- 🔶 **Justification Field**: Clear explanation of what's needed
- 🔶 **Educational Content**: Explains the business rationale

## Technical Implementation Details

### Files Modified:
- `src/utils/englishValidation.ts` - Core validation logic
- `src/schemas/donorRequestSchema.ts` - Form validation schema
- `src/components/form/EnglishValidationAlert.tsx` - UI component
- `src/pages/DonorRequestPage.tsx` - Form integration
- `src/utils/__tests__/englishValidation.test.ts` - Test cases

### Configuration:
- **Current Mode**: Moderate strictness
- **Override**: Allowed with justification
- **Environment**: Development/Testing friendly

## Reporting Issues

When testing, please report:

1. **False Positives**: English names incorrectly flagged as non-English
2. **False Negatives**: Non-English names not being detected
3. **UI Issues**: Problems with the warning display or user interaction
4. **Performance**: Any delays in validation or suggestion generation
5. **Suggestions**: Ideas for improving the validation accuracy or user experience

## Next Steps (Future Phases)

- **Phase 2**: Language detection using AI/ML libraries
- **Phase 3**: Dictionary-based validation for higher accuracy
- **Phase 4**: Custom organizational name database integration
- **Phase 5**: Batch validation for existing database cleanup

---

**Testing Status**: ✅ Ready for Testing
**Implementation**: Phase 1 Complete
**Next Review**: After user feedback collection
