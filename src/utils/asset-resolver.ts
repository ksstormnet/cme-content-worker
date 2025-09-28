// Dynamic asset filename resolver for Worker
// Automatically discovers built asset filenames and serves from R2 bucket

import { readdir } from 'fs/promises';
import { join } from 'path';

interface AssetManifest {
  jsFile: string;
  cssFile: string;
}

let cachedManifest: AssetManifest | null = null;

/**
 * Scans the built assets directory and returns the current JS/CSS filenames
 * Caches the result to avoid repeated filesystem access
 */
export async function getAssetManifest(): Promise<AssetManifest> {
  if (cachedManifest) {
    return cachedManifest;
  }

  try {
    const assetsDir = join(process.cwd(), 'dist/client/assets');
    const files = await readdir(assetsDir);
    
    // Find the main JS and CSS files (they follow the pattern index-[hash].js/css)
    const jsFile = files.find(file => file.startsWith('index-') && file.endsWith('.js'));
    const cssFile = files.find(file => file.startsWith('index-') && file.endsWith('.css'));
    
    if (!jsFile || !cssFile) {
      throw new Error(`Could not find built assets. Found files: ${files.join(', ')}`);
    }
    
    cachedManifest = {
      jsFile: `https://cdn.cruisemadeeasy.com/built-js/${jsFile}`,
      cssFile: `https://cdn.cruisemadeeasy.com/built-js/${cssFile}`
    };
    
    console.log('📦 Asset manifest resolved:', cachedManifest);
    return cachedManifest;
    
  } catch (error) {
    console.error('❌ Failed to resolve asset manifest:', error);
    
    // Fallback to current known filenames if filesystem access fails
    const fallback = {
      jsFile: 'https://cdn.cruisemadeeasy.com/built-js/index-DAljFaMt.js',
      cssFile: 'https://cdn.cruisemadeeasy.com/built-js/index-D1z_T5He.css'
    };
    
    console.warn('⚠️ Using fallback asset manifest:', fallback);
    cachedManifest = fallback;
    return fallback;
  }
}

/**
 * Clears the cached manifest (useful when assets are rebuilt)
 */
export function clearAssetCache(): void {
  cachedManifest = null;
  console.log('🗑️ Asset manifest cache cleared');
}

/**
 * Gets asset URLs synchronously (returns cached values or fallback)
 * Use this when you need immediate access and can't await
 */
export function getAssetManifestSync(): AssetManifest {
  if (cachedManifest) {
    return cachedManifest;
  }
  
  // Return fallback if not yet loaded
  return {
    jsFile: 'https://cdn.cruisemadeeasy.com/built-js/index-DAljFaMt.js',
    cssFile: 'https://cdn.cruisemadeeasy.com/built-js/index-D1z_T5He.css'
  };
}