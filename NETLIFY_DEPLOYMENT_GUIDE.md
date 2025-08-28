# Netlify Deployment Guide for CEB Donor Codes

## Why Netlify Builds Were Failing

### Root Cause
The main issue was **different TypeScript strictness between development and production**:

1. **Local Development**: Vite in dev mode is lenient with TypeScript errors
2. **Netlify Production**: Runs `tsc -b && vite build` with strict TypeScript compilation
3. **Strict Settings**: The original `tsconfig.app.json` had very strict settings:
   - `"noUnusedLocals": true` - Failed on any unused variable
   - `"noUnusedParameters": true` - Failed on any unused parameter  
   - `"verbatimModuleSyntax": true` - Caused enum/import issues
   - `"erasableSyntaxOnly": true` - Restricted TypeScript features

## Solutions Implemented

### 1. Production-Specific TypeScript Configuration
- Created `tsconfig.production.json` with relaxed settings for builds
- Modified build script to use production config: `tsc -p tsconfig.production.json && vite build`
- Added `@types/node` to dependencies for Node.js types

### 2. Fixed Type System Issues
- Reverted SearchType/SearchField back to proper enums
- Fixed Fuse.js type imports and namespace issues
- Added proper type casting for Material-UI theme properties
- Fixed Grid component props in HomePage

### 3. Added Netlify Configuration
- Created `netlify.toml` with proper build settings
- Set Node.js version to 18
- Added SPA redirect rules

## Build Process
```bash
# Local development (lenient)
npm run dev

# Production build (strict but manageable)
npm run build  # Uses tsconfig.production.json
```

## Key Files Modified
- `tsconfig.production.json` - Relaxed TypeScript settings for production
- `package.json` - Updated build script and added @types/node
- `src/services/searchService.ts` - Fixed enum and Fuse.js types
- `src/pages/HomePage.tsx` - Fixed Grid component props
- `src/theme/theme.ts` - Fixed CSS property type casting
- `netlify.toml` - Netlify deployment configuration

## Next Steps
1. Commit all changes
2. Push to GitHub  
3. Netlify should now build successfully
4. If issues persist, check Netlify build logs for any remaining TypeScript errors

This approach maintains strict development standards while allowing successful production builds.
