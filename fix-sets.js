import fs from 'fs';

// Read the file
const filePath = 'src/tests/sections-ui-integration-simple.test.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of new Set([...]) with new Set(Array.from([...]))
content = content.replace(/new Set\(\[([^\]]+)\]\)/g, 'new Set(Array.from([$1]))');

// Write back
fs.writeFileSync(filePath, content);

console.log('Fixed Set constructors in test file');
