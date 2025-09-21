#!/usr/bin/env node
/**
 * WordPress Media Library Export & Download Script
 * Session 4: Media Library Export & Download Script
 * 
 * Exports complete WordPress media library and creates bulk download system:
 * - Complete media metadata inventory with all file variants
 * - Image sizes, alt text, captions, and file organization
 * - WordPress upload directory structure mapping
 * - Parallel download manager with rate limiting and retry logic
 * - Progress tracking, error handling, and resume capability
 * - File validation and integrity checking
 * - Download logs and success/failure reporting
 */

import { promises as fs } from 'fs';
import { createWriteStream, existsSync } from 'fs';
import { dirname, join, extname } from 'path';
import { createWordPressAPI } from '../src/utils/wp-api.ts';
import https from 'https';
import { URL } from 'url';

interface MediaItem {
  id: number;
  title: {
    rendered: string;
  };
  alt_text: string;
  caption: {
    rendered: string;
  };
  description: {
    rendered: string;
  };
  media_type: string;
  mime_type: string;
  media_details: {
    width?: number;
    height?: number;
    file: string;
    filesize?: number;
    sizes?: Record<string, {
      file: string;
      width: number;
      height: number;
      mime_type: string;
      filesize?: number;
    }>;
    image_meta?: any;
  };
  source_url: string;
  date: string;
  modified: string;
  author: number;
  post: number;
  guid: {
    rendered: string;
  };
  link: string;
  slug: string;
  status: string;
  _links: any;
}

interface MediaInventory {
  id: number;
  title: string;
  alt_text: string;
  caption: string;
  description: string;
  media_type: string;
  mime_type: string;
  file_path: string;
  source_url: string;
  filesize: number;
  dimensions: {
    width: number;
    height: number;
  };
  image_sizes: Array<{
    name: string;
    file: string;
    url: string;
    width: number;
    height: number;
    filesize: number;
  }>;
  upload_date: string;
  modified_date: string;
  local_path: string;
  download_urls: string[];
}

interface DownloadStats {
  total_files: number;
  total_size: number;
  downloaded_files: number;
  downloaded_size: number;
  failed_downloads: number;
  skipped_files: number;
  start_time: string;
  end_time?: string;
  duration?: string;
}

interface ExportResult {
  timestamp: string;
  session: string;
  source_site: string;
  summary: {
    total_media_items: number;
    total_files_to_download: number;
    total_download_size: number;
    image_files: number;
    video_files: number;
    document_files: number;
    other_files: number;
    unique_upload_months: number;
    oldest_media: string;
    newest_media: string;
  };
  media_inventory: MediaInventory[];
  upload_structure: {
    base_path: string;
    directories: string[];
    file_organization: Record<string, number>;
  };
  download_plan: {
    batch_size: number;
    concurrent_downloads: number;
    retry_attempts: number;
    rate_limit_ms: number;
    estimated_duration: string;
  };
  download_stats: DownloadStats;
}

class WordPressMediaExporter {
  private api: any;
  private results: ExportResult;
  private downloadDir: string = './wp-components/media';

  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      session: '4',
      source_site: 'https://cruisemadeeasy.com',
      summary: {
        total_media_items: 0,
        total_files_to_download: 0,
        total_download_size: 0,
        image_files: 0,
        video_files: 0,
        document_files: 0,
        other_files: 0,
        unique_upload_months: 0,
        oldest_media: '',
        newest_media: ''
      },
      media_inventory: [],
      upload_structure: {
        base_path: '/wp-content/uploads/',
        directories: [],
        file_organization: {}
      },
      download_plan: {
        batch_size: 50,
        concurrent_downloads: 3,
        retry_attempts: 3,
        rate_limit_ms: 1000,
        estimated_duration: ''
      },
      download_stats: {
        total_files: 0,
        total_size: 0,
        downloaded_files: 0,
        downloaded_size: 0,
        failed_downloads: 0,
        skipped_files: 0,
        start_time: new Date().toISOString()
      }
    };
  }

  async initialize(): Promise<void> {
    console.log('📁 Starting WordPress Media Library Export - Session 4');
    console.log('═══════════════════════════════════════════════════');
    
    this.api = await createWordPressAPI();
    
    // Test connection
    const connectionTest = await this.api.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Failed to connect to WordPress API: ${connectionTest.error}`);
    }

    console.log(`✅ Connected to: ${connectionTest.data.site_name}`);
    console.log(`📍 Site URL: ${this.results.source_site}`);
    
    // Ensure media directory exists
    await this.ensureDirectoryExists(this.downloadDir);
    console.log(`📂 Download directory: ${this.downloadDir}`);
    console.log('');
  }

  /**
   * Export complete media library with pagination
   */
  async exportMediaLibrary(): Promise<void> {
    console.log('📸 Exporting WordPress Media Library...');
    
    try {
      let page = 1;
      let hasMore = true;
      const perPage = 100; // WordPress default max per page
      
      while (hasMore) {
        console.log(`   Fetching page ${page}...`);
        
        const response = await this.api.makeRequest(`/wp/v2/media?per_page=${perPage}&page=${page}&orderby=date&order=desc`);
        
        if (!response.success) {
          if (response.status === 400 && page > 1) {
            // Reached end of pagination
            hasMore = false;
            break;
          }
          throw new Error(`Failed to fetch media page ${page}: ${response.error}`);
        }

        const mediaItems: MediaItem[] = response.data;
        
        if (!mediaItems || mediaItems.length === 0) {
          hasMore = false;
          break;
        }

        // Process each media item
        for (const item of mediaItems) {
          await this.processMediaItem(item);
        }

        console.log(`   ✅ Processed page ${page} (${mediaItems.length} items)`);
        
        // Check if we have more pages
        if (mediaItems.length < perPage) {
          hasMore = false;
        } else {
          page++;
        }
      }

      this.results.summary.total_media_items = this.results.media_inventory.length;
      
      console.log(`   ✅ Media library export complete:`);
      console.log(`      - Total items: ${this.results.summary.total_media_items}`);
      console.log(`      - Total pages processed: ${page - 1}`);
      
    } catch (error) {
      console.error('❌ Media library export failed:', error);
      throw error;
    }
  }

  /**
   * Process individual media item and extract all variants
   */
  private async processMediaItem(item: MediaItem): Promise<void> {
    try {
      const inventory: MediaInventory = {
        id: item.id,
        title: item.title?.rendered || '',
        alt_text: item.alt_text || '',
        caption: item.caption?.rendered || '',
        description: item.description?.rendered || '',
        media_type: item.media_type || 'image',
        mime_type: item.mime_type || '',
        file_path: item.media_details?.file || '',
        source_url: item.source_url || '',
        filesize: item.media_details?.filesize || 0,
        dimensions: {
          width: item.media_details?.width || 0,
          height: item.media_details?.height || 0
        },
        image_sizes: [],
        upload_date: item.date || '',
        modified_date: item.modified || '',
        local_path: '',
        download_urls: []
      };

      // Process main file only (full-size original)
      if (inventory.source_url) {
        inventory.download_urls.push(inventory.source_url);
        inventory.local_path = this.getLocalFilePath(inventory.source_url, inventory.file_path);
        
        // Update stats by file type
        this.updateFileTypeStats(inventory.mime_type);
      }

      // Store image size metadata but don't download variants (Cloudflare will resize)
      if (item.media_details?.sizes) {
        const baseUrl = this.getBaseUrl(inventory.source_url);
        
        for (const [sizeName, sizeData] of Object.entries(item.media_details.sizes)) {
          const sizeUrl = `${baseUrl}${sizeData.file}`;
          
          inventory.image_sizes.push({
            name: sizeName,
            file: sizeData.file,
            url: sizeUrl,
            width: sizeData.width,
            height: sizeData.height,
            filesize: sizeData.filesize || 0
          });
          
          // Note: NOT adding to download_urls - Cloudflare will handle resizing
        }
      }

      // Track upload directory structure
      this.trackUploadStructure(inventory.file_path);
      
      // Update download statistics
      this.results.summary.total_files_to_download += inventory.download_urls.length;
      this.results.summary.total_download_size += inventory.filesize;
      
      // Track date range
      this.updateDateRange(inventory.upload_date);

      this.results.media_inventory.push(inventory);
      
    } catch (error) {
      console.error(`Failed to process media item ${item.id}:`, error);
    }
  }

  /**
   * Get base URL for constructing image size URLs
   */
  private getBaseUrl(sourceUrl: string): string {
    try {
      const url = new URL(sourceUrl);
      const pathParts = url.pathname.split('/');
      pathParts.pop(); // Remove filename
      return `${url.protocol}//${url.host}${pathParts.join('/')}/`;
    } catch (error) {
      console.error('Failed to parse base URL:', sourceUrl);
      return sourceUrl.substring(0, sourceUrl.lastIndexOf('/') + 1);
    }
  }

  /**
   * Generate local file path for downloaded files
   */
  private getLocalFilePath(url: string, filePath?: string): string {
    try {
      if (filePath) {
        return join(this.downloadDir, filePath);
      }
      
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract path after /wp-content/uploads/
      const uploadsIndex = pathname.indexOf('/wp-content/uploads/');
      if (uploadsIndex !== -1) {
        const relativePath = pathname.substring(uploadsIndex + '/wp-content/uploads/'.length);
        return join(this.downloadDir, relativePath);
      }
      
      // Fallback: use filename from URL
      const filename = pathname.split('/').pop() || 'unknown';
      return join(this.downloadDir, 'unknown', filename);
      
    } catch (error) {
      console.error('Failed to generate local path for:', url);
      return join(this.downloadDir, 'unknown', 'unknown');
    }
  }

  /**
   * Update file type statistics
   */
  private updateFileTypeStats(mimeType: string): void {
    if (mimeType.startsWith('image/')) {
      this.results.summary.image_files++;
    } else if (mimeType.startsWith('video/')) {
      this.results.summary.video_files++;
    } else if (mimeType.includes('pdf') || mimeType.includes('document') || 
               mimeType.includes('text') || mimeType.includes('application/')) {
      this.results.summary.document_files++;
    } else {
      this.results.summary.other_files++;
    }
  }

  /**
   * Track WordPress upload directory structure
   */
  private trackUploadStructure(filePath: string): void {
    if (!filePath) return;
    
    const parts = filePath.split('/');
    
    // Track directory structure (typically YYYY/MM format)
    if (parts.length > 1) {
      const directory = parts.slice(0, -1).join('/');
      if (!this.results.upload_structure.directories.includes(directory)) {
        this.results.upload_structure.directories.push(directory);
      }
      
      // Count files per directory
      this.results.upload_structure.file_organization[directory] = 
        (this.results.upload_structure.file_organization[directory] || 0) + 1;
    }
  }

  /**
   * Update date range tracking
   */
  private updateDateRange(dateString: string): void {
    if (!dateString) return;
    
    const date = new Date(dateString);
    const currentOldest = this.results.summary.oldest_media ? new Date(this.results.summary.oldest_media) : null;
    const currentNewest = this.results.summary.newest_media ? new Date(this.results.summary.newest_media) : null;
    
    if (!currentOldest || date < currentOldest) {
      this.results.summary.oldest_media = dateString;
    }
    
    if (!currentNewest || date > currentNewest) {
      this.results.summary.newest_media = dateString;
    }
  }

  /**
   * Analyze upload structure and create directory summary
   */
  analyzeUploadStructure(): void {
    console.log('📂 Analyzing Upload Structure...');

    try {
      this.results.upload_structure.directories.sort();
      this.results.summary.unique_upload_months = this.results.upload_structure.directories.length;

      // Calculate estimated download duration
      const totalSizeMB = this.results.summary.total_download_size / (1024 * 1024);
      const estimatedMinutes = Math.ceil(totalSizeMB / 10); // Assume 10MB/min average
      this.results.download_plan.estimated_duration = `${estimatedMinutes} minutes`;

      // Update download plan based on file count
      if (this.results.summary.total_files_to_download > 1000) {
        this.results.download_plan.concurrent_downloads = 5;
        this.results.download_plan.batch_size = 25;
      } else if (this.results.summary.total_files_to_download > 500) {
        this.results.download_plan.concurrent_downloads = 4;
        this.results.download_plan.batch_size = 30;
      }

      console.log(`   ✅ Upload structure analyzed:`);
      console.log(`      - Upload directories: ${this.results.summary.unique_upload_months}`);
      console.log(`      - Files to download: ${this.results.summary.total_files_to_download}`);
      console.log(`      - Total size: ${(totalSizeMB).toFixed(2)} MB`);
      console.log(`      - Estimated duration: ${this.results.download_plan.estimated_duration}`);
      
    } catch (error) {
      console.error('❌ Upload structure analysis failed:', error);
    }
  }

  /**
   * Create bulk download script
   */
  async createDownloadScript(): Promise<void> {
    console.log('⬇️ Creating Bulk Download Script...');

    try {
      const scriptContent = `#!/usr/bin/env node
/**
 * WordPress Media Bulk Download Script
 * Generated: ${this.results.timestamp}
 * Source: ${this.results.source_site}
 * 
 * Downloads ${this.results.summary.total_files_to_download} files from WordPress media library
 * with parallel processing, error handling, and progress tracking.
 */

import { promises as fs } from 'fs';
import { createWriteStream, existsSync } from 'fs';
import { dirname } from 'path';
import https from 'https';
import { URL } from 'url';

interface DownloadJob {
  url: string;
  localPath: string;
  size: number;
  mediaId: number;
  sizeName?: string;
}

class MediaDownloader {
  private stats = {
    totalFiles: ${this.results.summary.total_files_to_download},
    totalSize: ${this.results.summary.total_download_size},
    downloadedFiles: 0,
    downloadedSize: 0,
    failedFiles: 0,
    skippedFiles: 0,
    startTime: new Date(),
    errors: [] as string[]
  };

  private concurrentDownloads = ${this.results.download_plan.concurrent_downloads};
  private rateLimit = ${this.results.download_plan.rate_limit_ms};
  private retryAttempts = ${this.results.download_plan.retry_attempts};
  private activeDownloads = 0;
  private downloadQueue: DownloadJob[] = [];
  private completedJobs: DownloadJob[] = [];
  private failedJobs: DownloadJob[] = [];

  async run(): Promise<void> {
    console.log('🚀 Starting WordPress Media Download');
    console.log('═══════════════════════════════════════');
    console.log(\`📊 Files to download: \${this.stats.totalFiles}\`);
    console.log(\`📁 Total size: \${(this.stats.totalSize / 1024 / 1024).toFixed(2)} MB\`);
    console.log(\`🔄 Concurrent downloads: \${this.concurrentDownloads}\`);
    console.log('');

    try {
      // Load media inventory
      const mediaData = JSON.parse(await fs.readFile('./wp-components/media-library.json', 'utf8'));
      
      // Build download queue (original files only - Cloudflare handles resizing)
      for (const item of mediaData.media_inventory) {
        // Only download the original full-size file
        if (item.source_url && item.download_urls.length > 0) {
          const url = item.source_url; // Always use original source URL
          const localPath = this.getLocalPath(url, item.file_path);
          this.downloadQueue.push({
            url,
            localPath,
            size: item.filesize || 0,
            mediaId: item.id,
            sizeName: 'original'
          });
        }
      }

      // Start download processing
      await this.processDownloads();
      await this.generateReport();

    } catch (error) {
      console.error('❌ Download failed:', error);
      process.exit(1);
    }
  }

  private async processDownloads(): Promise<void> {
    const processingPromises: Promise<void>[] = [];

    while (this.downloadQueue.length > 0 || this.activeDownloads > 0) {
      // Start new downloads up to concurrent limit
      while (this.activeDownloads < this.concurrentDownloads && this.downloadQueue.length > 0) {
        const job = this.downloadQueue.shift()!;
        this.activeDownloads++;

        const downloadPromise = this.downloadFile(job)
          .finally(() => {
            this.activeDownloads--;
          });

        processingPromises.push(downloadPromise);
      }

      // Wait for at least one download to complete
      if (processingPromises.length > 0) {
        await Promise.race(processingPromises);
        // Remove completed promises
        for (let i = processingPromises.length - 1; i >= 0; i--) {
          if (await Promise.race([processingPromises[i], Promise.resolve('timeout')]) !== 'timeout') {
            processingPromises.splice(i, 1);
          }
        }
      }

      // Rate limiting
      await this.sleep(this.rateLimit);
      
      // Progress update
      if (this.stats.downloadedFiles % 10 === 0) {
        this.printProgress();
      }
    }

    // Wait for all remaining downloads
    await Promise.all(processingPromises);
  }

  private async downloadFile(job: DownloadJob, attempt = 1): Promise<void> {
    try {
      // Check if file already exists and skip if so
      if (existsSync(job.localPath)) {
        const stats = await fs.stat(job.localPath);
        if (stats.size > 0) {
          this.stats.skippedFiles++;
          this.stats.downloadedFiles++;
          return;
        }
      }

      // Ensure directory exists
      await this.ensureDir(dirname(job.localPath));

      // Download file
      await this.downloadFileFromUrl(job.url, job.localPath);
      
      this.stats.downloadedFiles++;
      this.stats.downloadedSize += job.size;
      this.completedJobs.push(job);

    } catch (error) {
      console.error(\`❌ Download failed (attempt \${attempt}): \${job.url}\`);
      
      if (attempt < this.retryAttempts) {
        await this.sleep(1000 * attempt); // Exponential backoff
        return this.downloadFile(job, attempt + 1);
      } else {
        this.stats.failedFiles++;
        this.failedJobs.push(job);
        this.stats.errors.push(\`\${job.url}: \${error}\`);
      }
    }
  }

  private downloadFileFromUrl(url: string, localPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = createWriteStream(localPath);
      
      https.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        } else {
          file.close();
          reject(new Error(\`HTTP \${response.statusCode}: \${response.statusMessage}\`));
        }
      }).on('error', (error) => {
        file.close();
        reject(error);
      });

      file.on('error', (error) => {
        reject(error);
      });
    });
  }

  private getLocalPath(url: string, filePath?: string): string {
    if (filePath) {
      return \`./wp-components/media/\${filePath}\`;
    }
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const uploadsIndex = pathname.indexOf('/wp-content/uploads/');
      
      if (uploadsIndex !== -1) {
        const relativePath = pathname.substring(uploadsIndex + '/wp-content/uploads/'.length);
        return \`./wp-components/media/\${relativePath}\`;
      }
      
      const filename = pathname.split('/').pop() || 'unknown';
      return \`./wp-components/media/unknown/\${filename}\`;
    } catch {
      return \`./wp-components/media/unknown/unknown\`;
    }
  }

  private getSizeName(url: string, item: any): string {
    // Always return 'original' since we only download full-size images
    return 'original';
  }

  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printProgress(): void {
    const progress = (this.stats.downloadedFiles / this.stats.totalFiles * 100).toFixed(1);
    const elapsed = Date.now() - this.stats.startTime.getTime();
    const elapsedMin = Math.floor(elapsed / 60000);
    const elapsedSec = Math.floor((elapsed % 60000) / 1000);
    
    console.log(\`📊 Progress: \${progress}% (\${this.stats.downloadedFiles}/\${this.stats.totalFiles}) | ⏱️  \${elapsedMin}:\${elapsedSec.toString().padStart(2, '0')} | ❌ \${this.stats.failedFiles} failed | ⏭️  \${this.stats.skippedFiles} skipped\`);
  }

  private async generateReport(): Promise<void> {
    const endTime = new Date();
    const duration = endTime.getTime() - this.stats.startTime.getTime();
    const durationMin = Math.floor(duration / 60000);
    const durationSec = Math.floor((duration % 60000) / 1000);

    const report = {
      timestamp: endTime.toISOString(),
      duration: {
        milliseconds: duration,
        formatted: \`\${durationMin}:\${durationSec.toString().padStart(2, '0')}\`
      },
      stats: this.stats,
      completed_jobs: this.completedJobs.length,
      failed_jobs: this.failedJobs.length,
      success_rate: ((this.stats.downloadedFiles / this.stats.totalFiles) * 100).toFixed(2) + '%'
    };

    await fs.writeFile('./wp-components/download-report.json', JSON.stringify(report, null, 2));
    
    console.log('');
    console.log('📊 Download Complete!');
    console.log('═══════════════════════════════════════');
    console.log(\`✅ Downloaded: \${this.stats.downloadedFiles} files\`);
    console.log(\`❌ Failed: \${this.stats.failedFiles} files\`);
    console.log(\`⏭️  Skipped: \${this.stats.skippedFiles} files\`);
    console.log(\`⏱️  Duration: \${report.duration.formatted}\`);
    console.log(\`📈 Success Rate: \${report.success_rate}\`);
    console.log(\`📋 Report saved: ./wp-components/download-report.json\`);

    if (this.stats.errors.length > 0) {
      console.log('\\n❌ Errors:');
      this.stats.errors.slice(0, 10).forEach(error => console.log(\`   \${error}\`));
      if (this.stats.errors.length > 10) {
        console.log(\`   ... and \${this.stats.errors.length - 10} more errors\`);
      }
    }
  }
}

// Run if called directly
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const downloader = new MediaDownloader();
  downloader.run().catch(console.error);
}

export { MediaDownloader };
`;

      await fs.writeFile('./scripts/download-media.ts', scriptContent, 'utf8');
      console.log('   ✅ Generated: scripts/download-media.ts (bulk download script)');
      console.log(`      - Concurrent downloads: ${this.results.download_plan.concurrent_downloads}`);
      console.log(`      - Retry attempts: ${this.results.download_plan.retry_attempts}`);
      console.log(`      - Rate limit: ${this.results.download_plan.rate_limit_ms}ms`);
      
    } catch (error) {
      console.error('❌ Download script creation failed:', error);
    }
  }

  /**
   * Create directory if it doesn't exist
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Save all export data to files
   */
  async saveExports(): Promise<void> {
    console.log('💾 Saving Media Export Data...');

    const exports = [
      {
        filename: 'media-library.json',
        data: {
          timestamp: this.results.timestamp,
          summary: this.results.summary,
          media_inventory: this.results.media_inventory,
          upload_structure: this.results.upload_structure
        },
        description: 'Complete media library inventory with metadata'
      },
      {
        filename: 'media-download-plan.json',
        data: {
          timestamp: this.results.timestamp,
          download_plan: this.results.download_plan,
          file_list: this.results.media_inventory.map(item => ({
            id: item.id,
            title: item.title,
            urls: item.download_urls,
            local_path: item.local_path,
            filesize: item.filesize
          }))
        },
        description: 'Download plan and file list for bulk operations'
      },
      {
        filename: 'media-structure.json',
        data: {
          timestamp: this.results.timestamp,
          upload_structure: this.results.upload_structure,
          file_organization: this.results.upload_structure.file_organization,
          date_range: {
            oldest: this.results.summary.oldest_media,
            newest: this.results.summary.newest_media
          }
        },
        description: 'WordPress upload directory structure and organization'
      },
      {
        filename: 'wp-media-export-complete.json',
        data: this.results,
        description: 'Complete media export results with all data'
      }
    ];

    for (const exportFile of exports) {
      try {
        const filePath = `./wp-components/${exportFile.filename}`;
        const jsonData = JSON.stringify(exportFile.data, null, 2);
        
        await fs.writeFile(filePath, jsonData, 'utf8');
        console.log(`   ✅ Saved: ${exportFile.filename} (${exportFile.description})`);
      } catch (error) {
        console.error(`   ❌ Failed to save ${exportFile.filename}:`, error);
      }
    }
  }

  /**
   * Print export summary
   */
  printSummary(): void {
    console.log('');
    console.log('📊 Media Export Summary - Session 4 Complete');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📅 Export Date: ${this.results.timestamp}`);
    console.log(`🌐 Source Site: ${this.results.source_site}`);
    console.log('');
    console.log('📁 Media Library Statistics:');
    console.log(`   Total Media Items: ${this.results.summary.total_media_items}`);
    console.log(`   ├── Images: ${this.results.summary.image_files}`);
    console.log(`   ├── Videos: ${this.results.summary.video_files}`);
    console.log(`   ├── Documents: ${this.results.summary.document_files}`);
    console.log(`   └── Other Files: ${this.results.summary.other_files}`);
    console.log('');
    console.log('⬇️ Download Planning:');
    console.log(`   Files to Download: ${this.results.summary.total_files_to_download}`);
    console.log(`   Total Download Size: ${(this.results.summary.total_download_size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Upload Directories: ${this.results.summary.unique_upload_months}`);
    console.log(`   Date Range: ${this.formatDate(this.results.summary.oldest_media)} - ${this.formatDate(this.results.summary.newest_media)}`);
    console.log('');
    console.log('🚀 Download Configuration:');
    console.log(`   Concurrent Downloads: ${this.results.download_plan.concurrent_downloads}`);
    console.log(`   Batch Size: ${this.results.download_plan.batch_size}`);
    console.log(`   Retry Attempts: ${this.results.download_plan.retry_attempts}`);
    console.log(`   Rate Limit: ${this.results.download_plan.rate_limit_ms}ms`);
    console.log(`   Estimated Duration: ${this.results.download_plan.estimated_duration}`);
    console.log('');
    console.log('🎯 Ready for Session 5: Block-to-React Component Generation');
    console.log('Media library inventory complete with download automation ready.');
  }

  /**
   * Format date string for display
   */
  private formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  /**
   * Run complete export process
   */
  async run(): Promise<void> {
    try {
      await this.initialize();
      await this.exportMediaLibrary();
      this.analyzeUploadStructure();
      await this.createDownloadScript();
      await this.saveExports();
      this.printSummary();
      
      console.log('\n✅ Session 4 Export Complete - Media library ready for download!');
      console.log('');
      console.log('📋 Next Steps:');
      console.log('   1. Review media inventory: wp-components/media-library.json');
      console.log('   2. Run download script: npx tsx scripts/download-media.ts');
      console.log('   3. Monitor progress in download-report.json');
      console.log('   4. Verify downloaded files in wp-components/media/');
      
    } catch (error) {
      console.error('\n❌ Media export failed:', error);
      process.exit(1);
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const exporter = new WordPressMediaExporter();
  exporter.run().catch(console.error);
}

export { WordPressMediaExporter };