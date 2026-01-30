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
    
    // Replace @ imports with relative imports
    content = content.replace(/@\/components\/ui\//g, '../components/ui/');
    content = content.replace(/@\/components\//g, '../components/');
    content = content.replace(/@\/hooks\//g, '../hooks/');
    content = content.replace(/@\/lib\//g, '../lib/');
    content = content.replace(/@\/types\//g, '../types/');
    content = content.replace(/@\/pages\//g, '../pages/');
    
    // For files in components/ui, adjust paths
    if (filePath.includes('components/ui/')) {
      content = content.replace(/\.\.\/components\/ui\//g, './');
      content = content.replace(/\.\.\/lib\//g, '../../lib/');
    }
    
    // For files in components (not ui), adjust paths
    if (filePath.includes('components/') && !filePath.includes('components/ui/')) {
      content = content.replace(/\.\.\/components\//g, './');
      content = content.replace(/\.\.\/lib\//g, '../lib/');
      content = content.replace(/\.\.\/hooks\//g, '../hooks/');
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed imports in ${filePath}`);
  }
});