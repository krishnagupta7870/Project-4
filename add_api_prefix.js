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

    // Replace api.method("/path") with api.method("/api/path")
    // but only if it doesn't already start with /api/
    const methods = ['get', 'post', 'put', 'delete', 'patch'];
    methods.forEach(method => {
        const regex = new RegExp(`api\\.${method}\\(["'](?!/api/)(/.*?)["']`, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, `api.${method}("/api$1"`);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Fixed:', file);
    }
});
