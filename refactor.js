const fs = require('fs');
const path = require('path');

const jsDirs = ['js', 'js/components', 'js/views'];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace `const X = ` with `window.X = ` at the top level
  // This regex matches `const X = ` at the beginning of a line (allowing spaces)
  content = content.replace(/^(const|let|var)\s+([A-Z][a-zA-Z0-9_]*)\s*=/gm, 'window.$2 =');
  
  fs.writeFileSync(filePath, content);
}

jsDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) return;
  fs.readdirSync(fullPath).forEach(file => {
    if (file.endsWith('.js')) {
      processFile(path.join(fullPath, file));
    }
  });
});

console.log("Refactoring complete.");
