const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const MANIFEST_FIREFOX = 'manifest.json';
const MANIFEST_CHROME = 'manifest.chrome.json';
const DIST_DIR = 'dist';

// Files to exclude from build
const EXCLUDE_PATTERNS = [
  '.git',
  '.github',
  'node_modules',
  'dist',
  'test_options.html',
  'verify_test.js',
  'package.json',
  'package-lock.json',
  'build.js',
  '.gitignore',
  '*.zip'
];

function getVersion(browser) {
  const manifestPath = browser === 'chrome' ? MANIFEST_CHROME : MANIFEST_FIREFOX;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return manifest.version;
}

function bumpVersion(type) {
  ['manifest.json', 'manifest.chrome.json'].forEach(manifestPath => {
    if (!fs.existsSync(manifestPath)) return;
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const [major, minor, patch] = manifest.version.split('.').map(Number);
    
    switch (type) {
      case 'major':
        manifest.version = `${major + 1}.0.0`;
        break;
      case 'minor':
        manifest.version = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        manifest.version = `${major}.${minor}.${patch + 1}`;
        break;
    }
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Updated ${manifestPath} to version ${manifest.version}`);
  });
  
  // Update package.json
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  pkg.version = manifest.version;
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
}

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(filePath);
    }
    return filePath.includes(pattern);
  });
}

async function buildExtension(browser) {
  const version = getVersion(browser);
  const outputName = `torrentbd-magnetter-${browser}-${version}.zip`;
  const outputPath = path.join(DIST_DIR, outputName);
  const tempDir = path.join(DIST_DIR, browser);
  
  // Create dist directory
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }
  
  // Create temp directory
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  
  console.log(`Building ${browser} extension v${version}...`);
  
  // Copy files
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (shouldExclude(srcPath)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyDir('.', tempDir);
  
  // Copy the correct manifest
  const manifestSource = browser === 'chrome' ? MANIFEST_CHROME : MANIFEST_FIREFOX;
  fs.copyFileSync(manifestSource, path.join(tempDir, 'manifest.json'));
  
  // Remove the other manifest if it exists
  const otherManifest = browser === 'chrome' ? MANIFEST_FIREFOX : MANIFEST_CHROME;
  const otherManifestPath = path.join(tempDir, path.basename(otherManifest));
  if (fs.existsSync(otherManifestPath)) {
    fs.unlinkSync(otherManifestPath);
  }
  
  // Create zip
  const output = fs.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      console.log(`✓ Created ${outputName} (${archive.pointer()} bytes)`);
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true });
      resolve();
    });
    
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(tempDir, false);
    archive.finalize();
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'bump') {
    const type = args[1] || 'patch';
    bumpVersion(type);
    return;
  }
  
  const browser = args[0];
  
  if (browser === 'firefox') {
    await buildExtension('firefox');
  } else if (browser === 'chrome') {
    await buildExtension('chrome');
  } else {
    // Build both
    await buildExtension('firefox');
    await buildExtension('chrome');
  }
}

main().catch(console.error);
