const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'client', 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

const exclude = ['Login.tsx', 'LicenseExpired.tsx', 'UnauthorizedMachine.tsx'];

files.forEach(file => {
    if (exclude.includes(file)) return;

    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Regex to find the <h1> title tag. 
    // It usually has classes like text-3xl, text-2xl, font-bold, font-black, etc.
    // And it's almost always at the top of the component's JSX.
    const h1Regex = /<h1[^>]*>[\s\S]*?<\/h1>/i;
    
    // We want to remove the <h1> tag if it contains the "Page Title"
    // Usually it's inside a div with "flex flex-col sm:flex-row justify-between items-start" 
    // or similar.
    
    // Let's be aggressive and remove the first <h1> if it looks like a page header.
    const match = content.match(h1Regex);
    if (match) {
        // Only remove if it's one of the large text classes
        if (match[0].includes('text-3xl') || match[0].includes('text-2xl') || match[0].includes('text-xl')) {
            console.log(`Removing title from ${file}: ${match[0].substring(0, 50)}...`);
            content = content.replace(h1Regex, '');
            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
});
