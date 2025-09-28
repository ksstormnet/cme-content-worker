// Simple asset URL resolver for Worker
// Returns consistent CDN URLs for React assets

interface AssetManifest {
  jsFile: string;
  cssFile: string;
}

// Fixed CDN URLs - assets are uploaded as index.js and index.css
const ASSET_MANIFEST: AssetManifest = {
  jsFile: 'https://cdn.cruisemadeeasy.com/built-js/latest/index.js',
  cssFile: 'https://cdn.cruisemadeeasy.com/built-js/latest/index.css'
};

/**
 * Gets the asset manifest with consistent CDN URLs
 * No dynamic resolution needed - assets are always uploaded to the same paths
 */
export async function getAssetManifest(): Promise<AssetManifest> {
  console.log('📦 Asset manifest resolved:', ASSET_MANIFEST);
  return ASSET_MANIFEST;
}

/**
 * Gets asset URLs synchronously
 * Always returns the same consistent URLs
 */
export function getAssetManifestSync(): AssetManifest {
  return ASSET_MANIFEST;
}

/**
 * Clears the cached manifest (no-op since we use fixed URLs)
 */
export function clearAssetCache(): void {
  console.log('🗑️ Asset cache cleared (no-op for fixed URLs)');
}