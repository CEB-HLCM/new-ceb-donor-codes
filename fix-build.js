// Quick build fix script to remove unused imports and fix common issues
// This script addresses the major TypeScript errors for Netlify deployment

const fs = require('fs');
const path = require('path');

const fixes = [
  // Remove unused imports from RequestBasket
  {
    file: 'src/components/basket/RequestBasket.tsx',
    find: /downloadJSON\s*[,}]/g,
    replace: ''
  },
  // Remove unused imports from RequestSubmission
  {
    file: 'src/components/basket/RequestSubmission.tsx',
    find: /import.*Divider.*from '@mui\/material';?\n/g,
    replace: ''
  },
  // Fix various page imports
  {
    file: 'src/pages/DonorRequestPage.tsx',
    find: /import.*useMemo.*,?\s*/g,
    replace: 'import '
  }
];

// Process each fix
fixes.forEach(fix => {
  const filePath = path.join(__dirname, fix.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(fix.find, fix.replace);
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${fix.file}`);
  }
});

console.log('Build fixes applied successfully');
