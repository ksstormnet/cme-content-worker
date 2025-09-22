// Database types for CME Content Worker

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
  last_login: string | null;
  active: boolean;
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  content: string; // JSON string with blocks
  excerpt: string | null;
  status: 'draft' | 'scheduled' | 'published';
  post_type: 'monday' | 'wednesday' | 'friday' | 'saturday' | 'newsletter';
  persona: 'easy_breezy' | 'thrill_seeker' | 'luxe_seafarer' | null;
  author_id: number | null;
  featured_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null; // JSON array
  category: string; // Single category for URL routing
  tags: string | null; // JSON array of tags
  scheduled_date: string | null;
  published_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentBlock {
  id: number;
  post_id: number;
  block_type: 'heading' | 'paragraph' | 'image' | 'accent_tip' | 'quote' | 'cta' | 'divider' | 'list' | 'table' | 'columns' | 'column' | 'section' | 'container' | 'cta-group' | 'figure';
  block_order: number;
  content: string; // JSON with block-specific data
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export interface AIGeneration {
  id: number;
  post_id: number | null;
  model_used: string;
  prompt: string;
  response: string;
  tokens_used: number | null;
  cost_cents: number | null;
  generation_time_ms: number | null;
  created_at: string;
}

export interface CSSVersion {
  id: number;
  file_url: string;
  file_hash: string;
  content: string | null;
  detected_at: string;
  active: boolean;
}

export interface ContentPlan {
  id: number;
  week_start_date: string;
  week_year: number;
  week_number: number;
  main_themes: string; // JSON array
  secondary_themes: string; // JSON array  
  tertiary_themes: string; // JSON array
  seasonal_hooks: string | null; // JSON array
  milestone_intersections: string | null; // JSON array
  created_at: string;
}

// Block content types
export interface HeadingBlockContent {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  anchor?: string;
}

export interface ParagraphBlockContent {
  text: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
}

export interface ImageBlockContent {
  url: string;
  alt: string;
  caption?: string;
  alignment?: 'left' | 'center' | 'right';
  size?: 'thumbnail' | 'medium' | 'large' | 'full';
}

export interface AccentTipBlockContent {
  text: string;
  type?: 'tip' | 'warning' | 'info' | 'success';
}

export interface QuoteBlockContent {
  text: string;
  citation?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface CTABlockContent {
  text: string;
  url: string;
  type: 'primary' | 'secondary';
  style?: 'button' | 'link';
  external?: boolean;
}

export interface ListBlockContent {
  ordered: boolean;
  items: string[];
}

export interface TableBlockContent {
  caption?: string;
  hasHeader?: boolean;
  rows: string[][];
}

export interface ColumnsBlockContent {
  columns: number;
  alignment?: 'left' | 'center' | 'right';
}

export interface ColumnBlockContent {
  width?: string;
  content: ContentBlock[];
}

export interface SectionBlockContent {
  headline?: string;
  style?: 'default' | 'accent' | 'highlight';
  backgroundColor?: string;
}

export interface ContainerBlockContent {
  elementId?: string; // gb-element-* ID
  className?: string;
  style?: Record<string, any>;
}

export interface CTAGroupBlockContent {
  alignment?: 'left' | 'center' | 'right';
  buttons: CTABlockContent[];
}

export interface FigureBlockContent {
  image: ImageBlockContent;
  alignment?: 'left' | 'center' | 'right';
  size?: 'thumbnail' | 'medium' | 'large' | 'full';
}

// Cloudflare Workers environment bindings
export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  
  // Environment variables
  ENVIRONMENT: string;
  SESSION_SECRET: string;
  ADMIN_EMAIL: string;
  
  // Secrets
  OPENAI_API_KEY: string;
  CLAUDE_API_KEY: string;
  DATAFORSEO_APIUSER: string;
  DATAFORSEO_APIKEY: string;
  JWT_SECRET: string;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Authentication
export interface JWTPayload {
  user_id: number;
  email: string;
  role: string;
  exp: number;
  [key: string]: any; // Add index signature for Hono compatibility
}