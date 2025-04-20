import { rm } from 'fs/promises';
import { join } from 'path';

const cacheDir = join(process.cwd(), 'node_modules', '.vite');

async function removeCache() {
  try {
    await rm(cacheDir, { recursive: true, force: true });
    console.log(`Removed ${cacheDir}`);
  } catch (error) {
    console.error(`Error removing ${cacheDir}:`, error);
  }
}

removeCache();
