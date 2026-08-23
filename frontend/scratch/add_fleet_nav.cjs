const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/features/admin');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add Users to lucide-react import
  if (content.includes('lucide-react') && !content.includes('Users')) {
    content = content.replace(/import \{(.*?)\} from 'lucide-react';/, (match, p1) => {
      return `import {${p1}, Users} from 'lucide-react';`;
    });
  }

  // Add navItem
  if (content.includes('const navItems = [') && !content.includes("href: '/admin/agents'")) {
    content = content.replace(
      /{ label: 'Control Tower', href: '\/admin', icon: <BarChart size=\{20\} \/> },/,
      "{ label: 'Control Tower', href: '/admin', icon: <BarChart size={20} /> },\n  { label: 'Fleet / Agents', href: '/admin/agents', icon: <Users size={20} /> },"
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Admin navigation updated in all pages.');
