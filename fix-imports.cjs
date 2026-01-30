const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/not-found.tsx',
  'frontend/src/pages/dashboard.tsx',
  'frontend/src/pages/upload.tsx',
  'frontend/src/pages/results.tsx',
  'frontend/src/pages/analysis.tsx',
  'frontend/src/components/layout/navbar.tsx',
  'frontend/src/components/upload/file-upload.tsx',
  'frontend/src/components/pipeline/pipeline-status.tsx',
  'frontend/src/components/results/results-table.tsx',
  'frontend/src/components/ai/conversational-interface.tsx'
];

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace @ imports with relative imports based on file location
    if (filePath.includes('pages/')) {
      content = content.replace(/@\/components\//g, '../components/');
      content = content.replace(/@\/hooks\//g, '../hooks/');
      content = content.replace(/@\/lib\//g, '../lib/');
      content = content.replace(/@\/types\//g, '../types/');
    } else if (filePath.includes('components/layout/')) {
      content = content.replace(/@\/components\/ui\//g, '../ui/');
      content = content.replace(/@\/lib\//g, '../../lib/');
    } else if (filePath.includes('components/')) {
      content = content.replace(/@\/components\/ui\//g, '../ui/');
      content = content.replace(/@\/hooks\//g, '../../hooks/');
      content = content.replace(/@\/lib\//g, '../../lib/');
      content = content.replace(/@\/types\//g, '../../types/');
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed imports in ${filePath}`);
  }
});