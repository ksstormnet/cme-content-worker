#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Content directory paths
const CONTENT_BASE_PATH = '/data/Documents/Business/CruiseMadeEasy/Marketing/Content';
const CONTENT_PLANS_PATH = path.join(CONTENT_BASE_PATH, 'Weekly Content Cycle');
const ARTICLES_PATH = path.join(CONTENT_BASE_PATH, 'Weekly-Content');

/**
 * Parse a content plan markdown file
 */
function parseContentPlan(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const weekStartDate = fileName.replace('_content-plan.md', '');
    const year = parseInt(weekStartDate.split('-')[0]);
    
    const plan = {
      week_start_date: weekStartDate,
      year,
      monday: { main: '', secondary: '', tertiary: '' },
      wednesday: { main: '', secondary: '', tertiary: '' },
      friday: { main: '', secondary: '', tertiary: '' },
      saturday: { main: '', secondary: '', tertiary: '' },
      newsletter: { themes: [], milestone: '' }
    };

    // Parse content using regex patterns
    const sections = content.split('### ');
    
    for (const section of sections) {
      const lines = section.trim().split('\n');
      const header = lines[0]?.toLowerCase();
      
      if (header?.includes('monday')) {
        plan.monday = parseThemes(lines);
      } else if (header?.includes('wednesday')) {
        plan.wednesday = parseThemes(lines);
      } else if (header?.includes('friday')) {
        plan.friday = parseThemes(lines);
      } else if (header?.includes('saturday')) {
        plan.saturday = parseThemes(lines);
      } else if (header?.includes('newsletter') || header?.includes('sunday')) {
        plan.newsletter = parseNewsletterSection(lines);
      }
    }

    return plan;
  } catch (error) {
    console.error(`Error parsing content plan ${fileName}:`, error.message);
    return null;
  }
}

/**
 * Parse themes from content plan section
 */
function parseThemes(lines) {
  const themes = { main: '', secondary: '', tertiary: '' };
  
  for (const line of lines) {
    if (line.includes('Main:')) {
      themes.main = line.replace(/- \*\*Main:\*\*|- Main:/, '').trim();
    } else if (line.includes('Secondary:')) {
      themes.secondary = line.replace(/- \*\*Secondary:\*\*|- Secondary:/, '').trim();
    } else if (line.includes('Tertiary:')) {
      themes.tertiary = line.replace(/- \*\*Tertiary:\*\*|- Tertiary:/, '').trim();
    }
  }
  
  return themes;
}

/**
 * Parse newsletter section
 */
function parseNewsletterSection(lines) {
  const newsletter = { themes: [], milestone: '' };
  
  for (const line of lines) {
    if (line.includes('Milestone Highlight:')) {
      newsletter.milestone = line.replace(/.*Milestone Highlight:/, '').trim();
    } else if (line.includes("['") || line.includes('tie one of')) {
      // Extract theme list
      const themeMatch = line.match(/\[(.*?)\]/);
      if (themeMatch) {
        newsletter.themes = themeMatch[1].split("', '").map(t => t.replace(/'/g, '').trim());
      }
    }
  }
  
  return newsletter;
}

/**
 * Parse an article markdown file
 */
function parseArticle(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileNameParts = fileName.replace('.md', '').split('_');
    
    if (fileNameParts.length < 2) {
      console.warn(`Skipping file with unexpected format: ${fileName}`);
      return null;
    }
    
    const publishDate = fileNameParts[0];
    const postType = mapFileNameToPostType(fileNameParts[1]);
    const weekStartDate = getWeekStartDate(publishDate);
    
    // Extract title (first H1)
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : `Untitled Article - ${publishDate}`;
    
    // Extract SEO keywords from companion .seo.txt file
    const seoFilePath = filePath.replace('.md', '.seo.txt');
    let seoKeywords = [];
    if (fs.existsSync(seoFilePath)) {
      try {
        const seoContent = fs.readFileSync(seoFilePath, 'utf8');
        // Parse keywords from SEO file (assuming comma-separated or line-separated)
        seoKeywords = seoContent
          .split(/[,\n]/)
          .map(k => k.trim())
          .filter(k => k.length > 0)
          .slice(0, 10); // Limit to 10 keywords
      } catch (error) {
        console.warn(`Could not read SEO file for ${fileName}`);
      }
    }
    
    return {
      title,
      content,
      post_type: postType,
      publish_date: publishDate,
      week_start_date: weekStartDate,
      seo_keywords: seoKeywords,
      source_file: fileName
    };
  } catch (error) {
    console.error(`Error parsing article ${fileName}:`, error.message);
    return null;
  }
}

/**
 * Map filename day to post type
 */
function mapFileNameToPostType(dayName) {
  switch (dayName.toLowerCase()) {
    case 'monday': return 'awareness';
    case 'wednesday': return 'practical';
    case 'friday': return 'aspirational';
    case 'saturday': return 'inspirational';
    case 'sunday-compass':
    case 'sunday_compass': return 'newsletter';
    default: return 'awareness';
  }
}

/**
 * Get week start date (Monday) from any date
 */
function getWeekStartDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Scan and parse all content plans
 */
function scanContentPlans() {
  console.log('Scanning content plans...');
  const contentPlans = [];
  
  if (!fs.existsSync(CONTENT_PLANS_PATH)) {
    console.error(`Content plans directory not found: ${CONTENT_PLANS_PATH}`);
    return contentPlans;
  }
  
  const files = fs.readdirSync(CONTENT_PLANS_PATH)
    .filter(f => f.endsWith('_content-plan.md'))
    .sort();
  
  console.log(`Found ${files.length} content plan files`);
  
  for (const fileName of files) {
    const filePath = path.join(CONTENT_PLANS_PATH, fileName);
    const plan = parseContentPlan(filePath, fileName);
    if (plan) {
      contentPlans.push(plan);
    }
  }
  
  console.log(`Successfully parsed ${contentPlans.length} content plans`);
  return contentPlans;
}

/**
 * Scan and parse all articles
 */
function scanArticles() {
  console.log('Scanning articles...');
  const articles = [];
  
  if (!fs.existsSync(ARTICLES_PATH)) {
    console.error(`Articles directory not found: ${ARTICLES_PATH}`);
    return articles;
  }
  
  const weekDirs = fs.readdirSync(ARTICLES_PATH, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort();
  
  console.log(`Found ${weekDirs.length} week directories`);
  
  for (const weekDir of weekDirs) {
    const weekPath = path.join(ARTICLES_PATH, weekDir);
    const files = fs.readdirSync(weekPath)
      .filter(f => f.endsWith('.md') && !f.includes('.seo.'))
      .sort();
    
    console.log(`  Week ${weekDir}: ${files.length} articles`);
    
    for (const fileName of files) {
      const filePath = path.join(weekPath, fileName);
      const article = parseArticle(filePath, fileName);
      if (article) {
        articles.push(article);
      }
    }
  }
  
  console.log(`Successfully parsed ${articles.length} articles`);
  return articles;
}

/**
 * Main function
 */
async function main() {
  console.log('Content Import Scanner');
  console.log('====================');
  console.log(`Content base path: ${CONTENT_BASE_PATH}`);
  console.log('');
  
  // Scan content plans
  const contentPlans = scanContentPlans();
  console.log('');
  
  // Scan articles
  const articles = scanArticles();
  console.log('');
  
  // Generate summary
  console.log('Summary:');
  console.log(`- Content Plans: ${contentPlans.length}`);
  console.log(`- Articles: ${articles.length}`);
  
  // Sample data for verification
  if (contentPlans.length > 0) {
    console.log('\nSample Content Plan:');
    console.log(JSON.stringify(contentPlans[0], null, 2));
  }
  
  if (articles.length > 0) {
    console.log('\nSample Article:');
    const sampleArticle = { ...articles[0] };
    sampleArticle.content = sampleArticle.content.substring(0, 200) + '...'; // Truncate for display
    console.log(JSON.stringify(sampleArticle, null, 2));
  }
  
  // Save to JSON files for import
  const outputDir = path.join(__dirname, 'import-data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'content-plans.json'),
    JSON.stringify(contentPlans, null, 2)
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'articles.json'),
    JSON.stringify(articles, null, 2)
  );
  
  console.log(`\nData saved to:`);
  console.log(`- ${path.join(outputDir, 'content-plans.json')}`);
  console.log(`- ${path.join(outputDir, 'articles.json')}`);
  console.log('\nReady to import into system!');
}

// Run the scanner
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { scanContentPlans, scanArticles, parseContentPlan, parseArticle };