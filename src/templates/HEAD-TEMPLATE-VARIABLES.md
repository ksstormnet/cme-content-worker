# Head Template Variables Reference

This document explains all the dynamic placeholders used in `head-template.html` and their expected values.

## Basic Page Information

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{PAGE_TITLE}}` | "Weekend Wanderlust: Fall Foliage from the Sea (And Why 2026 Is Your Better Play) - Cruise Made Easy" | Full page title including site name |
| `{{META_DESCRIPTION}}` | "There's something magical about witnessing fall foliage unfold from the deck of a cruise ship..." | Page meta description (150-160 chars) |
| `{{PAGE_URL}}` | "https://cruisemadeeasy.com/weekend-wanderlust-fall-foliage-from-the-sea/" | Canonical URL of the page |
| `{{SITE_URL}}` | "https://cruisemadeeasy.com/" | Base site URL |
| `{{SITE_NAME}}` | "Cruise Made Easy" | Site name |
| `{{SITE_LANGUAGE}}` | "en_US" | Site language code |
| `{{SITE_LOCALE}}` | "en_US" | Site locale |

## SEO and Robots

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{ROBOTS_CONTENT}}` | "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" | Robots directive |
| `{{RSS_FEED_URL}}` | "https://cruisemadeeasy.com/feed/" | RSS feed URL |

## Article/Post Specific Variables

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{PUBLISHED_DATE}}` | "2025-09-06T07:00:00-05:00" | Article publication date |
| `{{MODIFIED_DATE}}` | "2025-09-06T07:38:02-05:00" | Article last modified date |
| `{{PUBLISHED_DATE_ISO}}` | "2025-09-06T07:00:00-05:00" | ISO format published date for schema |
| `{{MODIFIED_DATE_ISO}}` | "2025-09-06T07:38:02-05:00" | ISO format modified date for schema |
| `{{ARTICLE_CATEGORY}}` | "Weekend Wanderlust" | Article category/section |
| `{{ARTICLE_HEADLINE}}` | "Weekend Wanderlust: Fall Foliage from the Sea" | Schema headline (without site name) |

## Author Information

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{AUTHOR_NAME}}` | "Cruise Made EASY" | Author display name |
| `{{AUTHOR_URL}}` | "https://cruisemadeeasy.com/author/scott/" | Author profile URL |
| `{{AUTHOR_SOCIAL_URL}}` | "https://facebook.com/CruiseMadeEASY" | Author's social media URL |

## Publisher Information

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{PUBLISHER_NAME}}` | "Cruise Made EASY" | Publisher name |
| `{{PUBLISHER_SOCIAL_URL}}` | "https://facebook.com/CruiseMadeEASY" | Publisher social URL |
| `{{PUBLISHER_LOGO_URL}}` | "https://cruisemadeeasy.com/wp-content/uploads/2025/07/SEOPress-1200x630-1.webp" | Publisher logo URL |
| `{{PUBLISHER_LOGO_WIDTH}}` | "1200" | Publisher logo width |
| `{{PUBLISHER_LOGO_HEIGHT}}` | "630" | Publisher logo height |

## Featured Image Variables

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{FEATURED_IMAGE_URL}}` | "https://cruisemadeeasy.com/wp-content/uploads/2025/08/hubbard-glacier.jpg" | Featured image URL |
| `{{FEATURED_IMAGE_THUMBNAIL}}` | "https://cruisemadeeasy.com/wp-content/uploads/2025/08/hubbard-glacier-150x150.jpg" | Thumbnail version |
| `{{FEATURED_IMAGE_WIDTH}}` | "2310" | Image width in pixels |
| `{{FEATURED_IMAGE_HEIGHT}}` | "1733" | Image height in pixels |
| `{{FEATURED_IMAGE_ALT}}` | "Snow-capped mountains and glacier under blue sky." | Alt text for image |

## Open Graph Variables

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{OG_TYPE}}` | "article" | Open Graph content type |
| `{{OG_TITLE}}` | "Weekend Wanderlust: Fall Foliage from the Sea (And Why 2026 Is Your Better Play) - Cruise Made Easy" | OG title |
| `{{OG_DESCRIPTION}}` | "There's something magical about witnessing fall foliage..." | OG description |

## Twitter Card Variables

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{TWITTER_CARD_TYPE}}` | "summary_large_image" | Twitter card type |
| `{{TWITTER_SITE}}` | "@CruiseMadeEasy" | Twitter site handle |
| `{{TWITTER_CREATOR}}` | "@CruiseMadeEasy" | Twitter creator handle |
| `{{TWITTER_TITLE}}` | "Weekend Wanderlust: Fall Foliage from the Sea..." | Twitter title |
| `{{TWITTER_DESCRIPTION}}` | "There's something magical about witnessing..." | Twitter description |
| `{{TWITTER_IMAGE_URL}}` | "https://cruisemadeeasy.com/wp-content/uploads/2025/08/hubbard-glacier-1024x768.jpg" | Twitter image URL |

## Social Media URLs

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{FACEBOOK_PAGES}}` | "107480055526279, 109600461963155" | Facebook page IDs |
| `{{FACEBOOK_URL}}` | "https://facebook.com/CruiseMadeEASY" | Facebook page URL |
| `{{TWITTER_URL}}` | "https://twitter.com/@CruiseMadeEasy" | Twitter profile URL |
| `{{PINTEREST_URL}}` | "https://pinterest.com/CruiseMadeEasy" | Pinterest profile URL |
| `{{INSTAGRAM_URL}}` | "https://instagram.com/CruiseMadeEASY" | Instagram profile URL |
| `{{YOUTUBE_URL}}` | "https://youtube.com/@CruiseMadeEASY" | YouTube channel URL |
| `{{LINKEDIN_URL}}` | "https://linkedin.com.company/CruiseMadeEASY" | LinkedIn company URL |
| `{{ALIGNABLE_URL}}` | "https://www.alignable.com/wichita-ks/cruise-made-easy" | Alignable profile URL |

## Breadcrumb Variables

Breadcrumbs use a nested structure with these variables:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{#BREADCRUMB_ITEMS}}` | Array iterator | Start of breadcrumb items loop |
| `{{POSITION}}` | "1", "2", etc. | Position in breadcrumb |
| `{{URL}}` | "https://cruisemadeeasy.com/cruise-planning/" | Breadcrumb item URL |
| `{{NAME}}` | "Cruise Planning" | Breadcrumb item name |
| `{{#NOT_LAST}}` | Conditional | True if not the last breadcrumb item |

## Schema Structured Data

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{SCHEMA_DESCRIPTION}}` | "There's something magical about witnessing fall foliage..." | Description for schema.org |

## Conditional Blocks

| Variable | Description |
|----------|-------------|
| `{{#IS_ARTICLE}}...{{/IS_ARTICLE}}` | Only render if page is an article/blog post |
| `{{#HAS_FEATURED_IMAGE}}...{{/HAS_FEATURED_IMAGE}}` | Only render if page has featured image |
| `{{#HAS_TWITTER_IMAGE}}...{{/HAS_TWITTER_IMAGE}}` | Only render if Twitter image exists |
| `{{#HAS_BREADCRUMBS}}...{{/HAS_BREADCRUMBS}}` | Only render if breadcrumbs exist |
| `{{#HAS_SENTRY}}...{{/HAS_SENTRY}}` | Only render if Sentry monitoring is enabled |

## Optional/Monitoring Variables

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `{{SENTRY_TRACE}}` | "833d4db932ec4a7393f1c1d7bfb159b8-30936990e5f04f5f-0" | Sentry trace ID |
| `{{SENTRY_TRACEPARENT}}` | "" | Sentry trace parent |
| `{{SENTRY_BAGGAGE}}` | "sentry-trace_id=833d4db...,sentry-sample_rate=0.1..." | Sentry baggage |

## Implementation Notes

1. **Template Engine**: This template assumes a Mustache-style template engine with conditional blocks.
2. **Image Optimization**: Featured images should have multiple sizes available (original, thumbnail, Twitter-optimized).
3. **SEO Optimization**: Keep meta descriptions between 150-160 characters for best SEO results.
4. **Social Media**: Ensure all social media URLs are current and active.
5. **Schema.org**: The structured data follows BlogPosting schema for articles.
6. **Performance**: Consider lazy-loading non-critical meta tags for better performance.

## Usage Example

```php
// Example PHP implementation
$templateVars = [
    'PAGE_TITLE' => $post->title . ' - ' . get_site_name(),
    'META_DESCRIPTION' => wp_trim_words($post->excerpt, 25),
    'PAGE_URL' => get_permalink($post->id),
    'IS_ARTICLE' => is_single(),
    'HAS_FEATURED_IMAGE' => has_post_thumbnail($post->id),
    // ... etc
];

echo render_template('head-template.html', $templateVars);
```