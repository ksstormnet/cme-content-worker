#!/usr/bin/env node
/**
 * WordPress Media Bulk Download Script
 * Generated: 2025-09-21T19:10:55.117Z
 * Source: https://cruisemadeeasy.com
 * 
 * Downloads 160 files from WordPress media library
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
    totalFiles: 160,
    totalSize: 332382281,
    downloadedFiles: 0,
    downloadedSize: 0,
    failedFiles: 0,
    skippedFiles: 0,
    startTime: new Date(),
    errors: [] as string[]
  };

  private concurrentDownloads = 3;
  private rateLimit = 1000;
  private retryAttempts = 3;
  private activeDownloads = 0;
  private downloadQueue: DownloadJob[] = [];
  private completedJobs: DownloadJob[] = [];
  private failedJobs: DownloadJob[] = [];

  async run(): Promise<void> {
    console.log('🚀 Starting WordPress Media Download');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Files to download: ${this.stats.totalFiles}`);
    console.log(`📁 Total size: ${(this.stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`🔄 Concurrent downloads: ${this.concurrentDownloads}`);
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
      console.error(`❌ Download failed (attempt ${attempt}): ${job.url}`);
      
      if (attempt < this.retryAttempts) {
        await this.sleep(1000 * attempt); // Exponential backoff
        return this.downloadFile(job, attempt + 1);
      } else {
        this.stats.failedFiles++;
        this.failedJobs.push(job);
        this.stats.errors.push(`${job.url}: ${error}`);
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
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
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
      return `./wp-components/media/${filePath}`;
    }
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const uploadsIndex = pathname.indexOf('/wp-content/uploads/');
      
      if (uploadsIndex !== -1) {
        const relativePath = pathname.substring(uploadsIndex + '/wp-content/uploads/'.length);
        return `./wp-components/media/${relativePath}`;
      }
      
      const filename = pathname.split('/').pop() || 'unknown';
      return `./wp-components/media/unknown/${filename}`;
    } catch {
      return `./wp-components/media/unknown/unknown`;
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
    
    console.log(`📊 Progress: ${progress}% (${this.stats.downloadedFiles}/${this.stats.totalFiles}) | ⏱️  ${elapsedMin}:${elapsedSec.toString().padStart(2, '0')} | ❌ ${this.stats.failedFiles} failed | ⏭️  ${this.stats.skippedFiles} skipped`);
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
        formatted: `${durationMin}:${durationSec.toString().padStart(2, '0')}`
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
    console.log(`✅ Downloaded: ${this.stats.downloadedFiles} files`);
    console.log(`❌ Failed: ${this.stats.failedFiles} files`);
    console.log(`⏭️  Skipped: ${this.stats.skippedFiles} files`);
    console.log(`⏱️  Duration: ${report.duration.formatted}`);
    console.log(`📈 Success Rate: ${report.success_rate}`);
    console.log(`📋 Report saved: ./wp-components/download-report.json`);

    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.stats.errors.slice(0, 10).forEach(error => console.log(`   ${error}`));
      if (this.stats.errors.length > 10) {
        console.log(`   ... and ${this.stats.errors.length - 10} more errors`);
      }
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const downloader = new MediaDownloader();
  downloader.run().catch(console.error);
}

export { MediaDownloader };
