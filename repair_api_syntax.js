const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(process.cwd(), 'frontend/src'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. Correct the previous broken variable assignments (missing closing quote)
    // Example: let url = "/api/recommend/for-user;
    // We look for /api/ followed by text and then a semicolon or newline without a quote
    const brokenVarRegex = /((?:let|const|var)\s+\w+\s*=\s*["'`]\/api\/[^\s"';]+)(?=["';]|\s|$)/g;
    // Actually, it's easier to just fix the varRegex from before to include the quote
    
    // Let's just do a clean pass.
    // First, let's revert the /api/ prefix if it's broken or just fix it.
    
    // Better: Find all strings starting with /api/ that are missing a closing quote
    // and add the quote.
    // But which quote? ", ', or `?
    // We can check the opening quote.
    
    const repairRegex = /((?:let|const|var)\s+\w+\s*=\s*)(["'`])(\/api\/[^"';`\s]+)(?![^"';`\s]*\2)/g;
    if (repairRegex.test(content)) {
        content = content.replace(repairRegex, '$1$2$3$2');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Repaired:', file);
    }
});
