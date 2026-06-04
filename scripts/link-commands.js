#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const SOURCE_DIR = path.join(__dirname, '..', 'commands');
const TARGET_DIR = path.join(os.homedir(), '.config', 'opencode', 'commands');

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function linkFile(sourcePath, targetPath) {
  try {
    // Remove target if it already exists
    try {
      await fs.unlink(targetPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        // Ignore if file doesn't exist
      }
    }

    // Try symlink first
    try {
      await fs.symlink(sourcePath, targetPath);
      console.log(`✓ Symlinked: ${path.relative(SOURCE_DIR, sourcePath)}`);
      return 'symlink';
    } catch (symlinkError) {
      // Symlink failed (likely permissions), try hardlink
      try {
        await fs.link(sourcePath, targetPath);
        console.log(`✓ Hardlinked: ${path.relative(SOURCE_DIR, sourcePath)}`);
        return 'hardlink';
      } catch (hardlinkError) {
        console.error(`✗ Failed to link: ${path.relative(SOURCE_DIR, sourcePath)}`);
        console.error(`  Reason: ${hardlinkError.message}`);
        return 'failed';
      }
    }
  } catch (error) {
    console.error(`✗ Error processing: ${path.relative(SOURCE_DIR, sourcePath)}`);
    console.error(`  Reason: ${error.message}`);
    return 'failed';
  }
}

async function processDirectory(sourceDir, targetDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  const results = {
    symlinks: 0,
    hardlinks: 0,
    failed: 0,
    directories: 0
  };

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await ensureDir(targetPath);
      console.log(`✓ Created directory: ${path.relative(SOURCE_DIR, sourcePath)}`);
      results.directories++;
      
      // Recursively process subdirectory
      const subResults = await processDirectory(sourcePath, targetPath);
      results.symlinks += subResults.symlinks;
      results.hardlinks += subResults.hardlinks;
      results.failed += subResults.failed;
      results.directories += subResults.directories;
    } else if (entry.isFile()) {
      const result = await linkFile(sourcePath, targetPath);
      if (result === 'symlink') {
        results.symlinks++;
      } else if (result === 'hardlink') {
        results.hardlinks++;
      } else {
        results.failed++;
      }
    }
  }

  return results;
}

async function main() {
  console.log('Starting link process...');
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Target: ${TARGET_DIR}`);
  console.log('');

  try {
    // Ensure source directory exists
    await fs.access(SOURCE_DIR);
  } catch (error) {
    console.error(`Error: Source directory does not exist: ${SOURCE_DIR}`);
    process.exit(1);
  }

  // Ensure target directory exists
  await ensureDir(TARGET_DIR);
  console.log(`✓ Target directory ready: ${TARGET_DIR}`);
  console.log('');

  // Process all files and directories
  const results = await processDirectory(SOURCE_DIR, TARGET_DIR);

  // Print summary
  console.log('');
  console.log('Summary:');
  console.log(`  Directories created: ${results.directories}`);
  console.log(`  Symlinks created: ${results.symlinks}`);
  console.log(`  Hardlinks created: ${results.hardlinks}`);
  console.log(`  Failed: ${results.failed}`);
  console.log('');
  console.log('Done!');

  if (results.failed > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
