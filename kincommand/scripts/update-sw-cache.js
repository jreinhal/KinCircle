import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const distDir = path.resolve(process.cwd(), 'dist');
const swPath = path.join(distDir, 'sw.js');

if (!fs.existsSync(swPath)) {
  console.log('sw.js not found in dist; skipping cache version update.');
  process.exit(0);
}

const hash = crypto.createHash('sha256');

const collectFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath);
    } else if (entry.isFile()) {
      hash.update(fs.readFileSync(fullPath));
    }
  });
};

collectFiles(distDir);

const buildHash = hash.digest('hex').slice(0, 10);
const swContents = fs.readFileSync(swPath, 'utf8');
const updated = swContents.replace(/__BUILD_HASH__/g, buildHash);

fs.writeFileSync(swPath, updated, 'utf8');
console.log(`Updated service worker cache hash: ${buildHash}`);
