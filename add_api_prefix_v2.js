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

    // 1. Replace api.method("/path") or api.method(`/path`) with /api/ prefix
    const methods = ['get', 'post', 'put', 'delete', 'patch'];
    methods.forEach(method => {
        // Regex to match api.method( followed by ", ', or ` and a / (but not /api/)
        const regex = new RegExp(`api\\.${method}\\(\\s*([\`\"'])(?!/api/)(/.*?)`, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, `api.${method}($1/api$2`);
            changed = true;
        }
    });

    // 2. Catch common variable assignments like let url = "/..."
    // Specifically for recommendations.js and similar
    const varRegex = /((?:let|const|var)\s+\w+\s*=\s*[\`\"'])(?!\/api\/)(\/.*?)[\`\"']/g;
    if (varRegex.test(content)) {
        // This is riskier so let's be specific or just manually fix known files
        // For now let's just apply it to everything but check for /api/
        content = content.replace(varRegex, '$1/api$2');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Improved Fixed:', file);
    }
});
