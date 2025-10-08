// Import Existing R2 Files into Media Library Database
// This script scans the R2 bucket and imports all existing files into the media_files table

const AUTH_COOKIE = "auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGNydWlzZW1hZGVlYXN5LmNvbSIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc1ODQ2MDg5MH0.czIYqBbKiViX9EWD5_fBiTcA8drDt6yhswWVjPSIGyY";

// File type detection from extension
function getFileTypeFromExtension(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'avif'];
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
  const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
  
  if (imageExtensions.includes(ext)) return 'image';
  if (videoExtensions.includes(ext)) return 'video';  
  if (audioExtensions.includes(ext)) return 'audio';
  if (documentExtensions.includes(ext)) return 'document';
  
  return 'file';
}

// MIME type detection from extension  
function getMimeTypeFromExtension(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  
  const mimeTypes = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg', 
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    'ico': 'image/x-icon',
    'avif': 'image/avif',
    
    // Videos
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    'm4v': 'video/x-m4v',
    
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'flac': 'audio/flac',
    'aac': 'audio/aac',
    'ogg': 'audio/ogg',
    'wma': 'audio/x-ms-wma',
    'm4a': 'audio/x-m4a',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'rtf': 'application/rtf'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// Smart category assignment based on path and filename
function assignSmartCategory(filePath, filename) {
  const pathLower = filePath.toLowerCase();
  const filenameLower = filename.toLowerCase();
  
  // Check for specific patterns in path or filename
  if (pathLower.includes('ncl') || pathLower.includes('norwegian') || 
      filenameLower.includes('ncl') || filenameLower.includes('norwegian')) {
    return 2; // NCL Logos
  }
  
  if (pathLower.includes('logo') || filenameLower.includes('logo') ||
      pathLower.includes('cme') || filenameLower.includes('cruisemadeeasy')) {
    return 3; // Our Logos
  }
  
  if (pathLower.includes('ship') || filenameLower.includes('ship') ||
      filenameLower.includes('deck') || filenameLower.includes('vessel')) {
    return 4; // Ship Images
  }
  
  if (pathLower.includes('destination') || pathLower.includes('port') ||
      filenameLower.includes('destination') || filenameLower.includes('port') ||
      filenameLower.includes('city') || filenameLower.includes('island')) {
    return 5; // Destination Photos
  }
  
  if (pathLower.includes('lifestyle') || pathLower.includes('experience') ||
      filenameLower.includes('lifestyle') || filenameLower.includes('cruise-life')) {
    return 6; // Cruise Lifestyle  
  }
  
  if (pathLower.includes('food') || pathLower.includes('dining') ||
      pathLower.includes('restaurant') || filenameLower.includes('food') ||
      filenameLower.includes('dining') || filenameLower.includes('restaurant')) {
    return 7; // Food & Dining
  }
  
  if (pathLower.includes('activity') || pathLower.includes('entertainment') ||
      filenameLower.includes('activity') || filenameLower.includes('pool') ||
      filenameLower.includes('entertainment') || filenameLower.includes('show')) {
    return 8; // Activities
  }
  
  if (pathLower.includes('cabin') || pathLower.includes('suite') ||
      pathLower.includes('stateroom') || filenameLower.includes('cabin') ||
      filenameLower.includes('suite') || filenameLower.includes('room')) {
    return 9; // Cabins & Suites
  }
  
  if (pathLower.includes('icon') || pathLower.includes('graphic') ||
      filenameLower.includes('icon') || filenameLower.includes('graphic') ||
      getMimeTypeFromExtension(filename) === 'image/svg+xml') {
    return 10; // Graphics & Icons
  }
  
  // Default to General category
  return 1;
}

// Generate clean title from filename
function generateTitle(filename) {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Replace hyphens, underscores with spaces
  let title = nameWithoutExt.replace(/[-_]/g, ' ');
  
  // Remove numbers and timestamps at the end
  title = title.replace(/\s*\d+\s*$/, '');
  title = title.replace(/\s*\d{4}-\d{2}-\d{2}.*$/, '');
  title = title.replace(/\s*\d{13,}.*$/, ''); // Remove timestamps
  
  // Capitalize words
  title = title.replace(/\b\w+/g, word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
  
  // Clean up extra spaces
  title = title.replace(/\s+/g, ' ').trim();
  
  return title || filename;
}

// Main import function
async function importExistingFiles() {
  console.log('🚀 Starting R2 bucket scan and media library import...');
  
  try {
    // Step 1: Get all files from API (this will list what's in our database)
    console.log('📂 Checking existing database entries...');
    
    const existingResponse = await fetch('http://localhost:8787/api/media?limit=1000', {
      headers: {
        'Cookie': AUTH_COOKIE,
        'Content-Type': 'application/json'
      }
    });
    
    if (!existingResponse.ok) {
      throw new Error(`Failed to fetch existing media: ${existingResponse.statusText}`);
    }
    
    const existingData = await existingResponse.json();
    const existingFiles = new Set(existingData.files.map(f => f.file_path));
    
    console.log(`📊 Found ${existingFiles.size} files already in database`);
    
    // Step 2: List all R2 objects using a temporary endpoint
    // We'll create a temporary API endpoint to list R2 objects
    console.log('🪣 Scanning R2 bucket for all files...');
    
    const scanResponse = await fetch('http://localhost:8787/api/media/scan-bucket', {
      method: 'POST',
      headers: {
        'Cookie': AUTH_COOKIE,
        'Content-Type': 'application/json'
      }
    });
    
    if (!scanResponse.ok) {
      console.error('❌ Bucket scan failed. Creating scan endpoint...');
      // We need to create the scan endpoint first
      return;
    }
    
    const bucketFiles = await scanResponse.json();
    console.log(`📦 Found ${bucketFiles.files.length} files in R2 bucket`);
    
    // Step 3: Import files that aren't in database
    let imported = 0;
    let skipped = 0;
    
    for (const file of bucketFiles.files) {
      if (existingFiles.has(file.key)) {
        skipped++;
        continue;
      }
      
      console.log(`📥 Importing: ${file.key}`);
      
      // Prepare file data for import
      const fileData = {
        filename: file.key.split('/').pop(),
        original_filename: file.key.split('/').pop(),
        title: generateTitle(file.key.split('/').pop()),
        file_path: file.key,
        file_url: `https://cdn.cruisemadeeasy.com/${file.key}`,
        file_type: getFileTypeFromExtension(file.key),
        file_size: file.size,
        mime_type: getMimeTypeFromExtension(file.key),
        category_id: assignSmartCategory(file.key, file.key.split('/').pop()),
        uploaded_by: 1, // Admin user
        upload_date: file.uploaded || new Date().toISOString()
      };
      
      // Import via API
      try {
        const importResponse = await fetch('http://localhost:8787/api/media/import-file', {
          method: 'POST',
          headers: {
            'Cookie': AUTH_COOKIE,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fileData)
        });
        
        if (importResponse.ok) {
          imported++;
        } else {
          console.error(`❌ Failed to import ${file.key}`);
        }
      } catch (error) {
        console.error(`❌ Import error for ${file.key}:`, error.message);
      }
      
      // Rate limiting
      if (imported % 10 === 0 && imported > 0) {
        console.log(`⏳ Imported ${imported} files, sleeping 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('✅ Import completed!');
    console.log(`📊 Summary:`);
    console.log(`   📥 Imported: ${imported} files`);
    console.log(`   ⏩ Skipped: ${skipped} files (already in database)`);
    console.log(`   📦 Total: ${bucketFiles.files.length} files in bucket`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  importExistingFiles();
}