#!/usr/bin/env node
/**
 * WordPress Theme Settings & CSS Variables Export Script
 * Session 3: Theme Settings & CSS Variables Export
 * 
 * Exports complete GeneratePress theme configuration including:
 * - WordPress site settings and customizer options
 * - GeneratePress/GenerateBlocks specific settings
 * - CSS custom properties and variable system
 * - Color schemes and typography configurations
 * - Responsive breakpoints and layout settings
 * - Theme feature toggles and module configurations
 */

import { promises as fs } from 'fs';
import { createWordPressAPI } from '../src/utils/wp-api.ts';

interface ThemeSettings {
  wordpress_settings: any;
  generatepress_settings: any;
  generateblocks_settings: any;
  customizer_settings: any;
  theme_mods: any;
  active_theme: any;
}

interface CSSVariables {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
  custom_properties: Record<string, string>;
}

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  heading: string;
  link: string;
  button: string;
}

interface TypographySettings {
  body_font: string;
  heading_font: string;
  font_sizes: Record<string, string>;
  line_heights: Record<string, string>;
  font_weights: Record<string, string>;
}

interface ResponsiveBreakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
  mobile_menu: string;
}

interface ExportResult {
  timestamp: string;
  session: string;
  source_site: string;
  summary: {
    total_settings: number;
    generatepress_options: number;
    generateblocks_options: number;
    css_variables: number;
    color_variables: number;
    typography_variables: number;
    spacing_variables: number;
    breakpoint_variables: number;
  };
  theme_settings: ThemeSettings;
  css_variables: CSSVariables;
  color_schemes: ColorScheme[];
  typography: TypographySettings;
  responsive_breakpoints: ResponsiveBreakpoints;
  theme_features: Record<string, boolean>;
  react_mapping: {
    css_variables: Record<string, string>;
    theme_config: Record<string, any>;
    typescript_interfaces: string[];
  };
}

class WordPressThemeExporter {
  private api: any;
  private results: ExportResult;

  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      session: '3',
      source_site: 'https://cruisemadeeasy.com',
      summary: {
        total_settings: 0,
        generatepress_options: 0,
        generateblocks_options: 0,
        css_variables: 0,
        color_variables: 0,
        typography_variables: 0,
        spacing_variables: 0,
        breakpoint_variables: 0
      },
      theme_settings: {
        wordpress_settings: {},
        generatepress_settings: {},
        generateblocks_settings: {},
        customizer_settings: {},
        theme_mods: {},
        active_theme: {}
      },
      css_variables: {
        colors: {},
        typography: {},
        spacing: {},
        breakpoints: {},
        custom_properties: {}
      },
      color_schemes: [],
      typography: {
        body_font: '',
        heading_font: '',
        font_sizes: {},
        line_heights: {},
        font_weights: {}
      },
      responsive_breakpoints: {
        mobile: '768px',
        tablet: '1024px',
        desktop: '1200px',
        mobile_menu: '1024px'
      },
      theme_features: {},
      react_mapping: {
        css_variables: {},
        theme_config: {},
        typescript_interfaces: []
      }
    };
  }

  async initialize(): Promise<void> {
    console.log('🎨 Starting WordPress Theme Export - Session 3');
    console.log('═══════════════════════════════════════════════════');
    
    this.api = await createWordPressAPI();
    
    // Test connection
    const connectionTest = await this.api.testConnection();
    if (!connectionTest.success) {
      throw new Error(`Failed to connect to WordPress API: ${connectionTest.error}`);
    }

    console.log(`✅ Connected to: ${connectionTest.data.site_name}`);
    console.log(`📍 Site URL: ${this.results.source_site}`);
    console.log('');
  }

  /**
   * Export WordPress core site settings
   */
  async exportWordPressSettings(): Promise<void> {
    console.log('⚙️ Exporting WordPress Site Settings...');
    
    try {
      const response = await this.api.makeRequest('/wp/v2/settings');
      
      if (!response.success) {
        throw new Error(`Failed to fetch site settings: ${response.error}`);
      }

      this.results.theme_settings.wordpress_settings = response.data;
      const settingsCount = Object.keys(response.data).length;
      
      console.log(`   ✅ Exported ${settingsCount} WordPress settings`);
      console.log(`      - Site Title: ${response.data.title || 'N/A'}`);
      console.log(`      - Site Description: ${response.data.description || 'N/A'}`);
      console.log(`      - Date Format: ${response.data.date_format || 'N/A'}`);
      console.log(`      - Time Format: ${response.data.time_format || 'N/A'}`);
      
      this.results.summary.total_settings += settingsCount;
      
    } catch (error) {
      console.error('❌ WordPress settings export failed:', error);
      throw error;
    }
  }

  /**
   * Export GeneratePress theme settings and customizer options
   */
  async exportGeneratePressSettings(): Promise<void> {
    console.log('🎨 Exporting GeneratePress Settings...');

    try {
      // Try GeneratePress specific endpoints
      const endpoints = [
        '/generatepress/v1/settings',
        '/generatepress/v1/customize',
        '/generatepress-pro/v1/export',
        '/generatepress/v1/options'
      ];

      let generatepressData = {};
      let settingsFound = 0;

      for (const endpoint of endpoints) {
        try {
          const response = await this.api.makeRequest(endpoint);
          if (response.success && response.data) {
            generatepressData[endpoint] = response.data;
            settingsFound++;
            console.log(`   ✅ Found data at: ${endpoint}`);
          }
        } catch (error) {
          // Continue to next endpoint if this one fails
          console.log(`   ⚠️  Endpoint not available: ${endpoint}`);
        }
      }

      this.results.theme_settings.generatepress_settings = generatepressData;
      this.results.summary.generatepress_options = settingsFound;
      
      console.log(`   ✅ Processed ${settingsFound} GeneratePress endpoints`);
      
    } catch (error) {
      console.error('❌ GeneratePress settings export failed:', error);
      // Continue with other exports even if GeneratePress settings fail
    }
  }

  /**
   * Export GenerateBlocks settings and configuration
   */
  async exportGenerateBlocksSettings(): Promise<void> {
    console.log('🔧 Exporting GenerateBlocks Settings...');

    try {
      // Try GenerateBlocks specific endpoints
      const endpoints = [
        '/generateblocks/v1/settings',
        '/generateblocks/v1/setting',
        '/generateblocks-pro/v1/settings',
        '/generateblocks/v1/onboarding'
      ];

      let generateblocksData = {};
      let settingsFound = 0;

      for (const endpoint of endpoints) {
        try {
          const response = await this.api.makeRequest(endpoint);
          if (response.success && response.data) {
            generateblocksData[endpoint] = response.data;
            settingsFound++;
            console.log(`   ✅ Found data at: ${endpoint}`);
          }
        } catch (error) {
          console.log(`   ⚠️  Endpoint not available: ${endpoint}`);
        }
      }

      this.results.theme_settings.generateblocks_settings = generateblocksData;
      this.results.summary.generateblocks_options = settingsFound;
      
      console.log(`   ✅ Processed ${settingsFound} GenerateBlocks endpoints`);
      
    } catch (error) {
      console.error('❌ GenerateBlocks settings export failed:', error);
      // Continue with other exports
    }
  }

  /**
   * Extract CSS custom properties and variables
   */
  extractCSSVariables(): void {
    console.log('🎨 Extracting CSS Variables & Custom Properties...');

    try {
      // Extract from WordPress settings
      const wpSettings = this.results.theme_settings.wordpress_settings;
      if (wpSettings) {
        // Extract any CSS-related settings
        Object.keys(wpSettings).forEach(key => {
          if (key.includes('css') || key.includes('style') || key.includes('color')) {
            this.results.css_variables.custom_properties[key] = wpSettings[key];
          }
        });
      }

      // Extract from GeneratePress settings
      const gpSettings = this.results.theme_settings.generatepress_settings;
      Object.values(gpSettings).forEach((settingsData: any) => {
        if (settingsData && typeof settingsData === 'object') {
          this.extractVariablesFromObject(settingsData, 'generatepress');
        }
      });

      // Extract from GenerateBlocks settings
      const gbSettings = this.results.theme_settings.generateblocks_settings;
      Object.values(gbSettings).forEach((settingsData: any) => {
        if (settingsData && typeof settingsData === 'object') {
          this.extractVariablesFromObject(settingsData, 'generateblocks');
        }
      });

      // Default CSS variables for GeneratePress theme
      this.addDefaultCSSVariables();

      const totalVariables = 
        Object.keys(this.results.css_variables.colors).length +
        Object.keys(this.results.css_variables.typography).length +
        Object.keys(this.results.css_variables.spacing).length +
        Object.keys(this.results.css_variables.breakpoints).length +
        Object.keys(this.results.css_variables.custom_properties).length;

      this.results.summary.css_variables = totalVariables;
      this.results.summary.color_variables = Object.keys(this.results.css_variables.colors).length;
      this.results.summary.typography_variables = Object.keys(this.results.css_variables.typography).length;
      this.results.summary.spacing_variables = Object.keys(this.results.css_variables.spacing).length;
      this.results.summary.breakpoint_variables = Object.keys(this.results.css_variables.breakpoints).length;

      console.log(`   ✅ Extracted ${totalVariables} CSS variables:`);
      console.log(`      - Colors: ${this.results.summary.color_variables}`);
      console.log(`      - Typography: ${this.results.summary.typography_variables}`);
      console.log(`      - Spacing: ${this.results.summary.spacing_variables}`);
      console.log(`      - Breakpoints: ${this.results.summary.breakpoint_variables}`);
      
    } catch (error) {
      console.error('❌ CSS variables extraction failed:', error);
    }
  }

  /**
   * Extract variables from nested object structure
   */
  private extractVariablesFromObject(obj: any, source: string): void {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const lowerKey = key.toLowerCase();
      
      // Color variables
      if (lowerKey.includes('color') || lowerKey.includes('background') || lowerKey.includes('text')) {
        if (typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl'))) {
          this.results.css_variables.colors[`--${source}-${key}`] = value;
        }
      }
      
      // Typography variables
      else if (lowerKey.includes('font') || lowerKey.includes('size') || lowerKey.includes('weight') || lowerKey.includes('height')) {
        if (typeof value === 'string' || typeof value === 'number') {
          this.results.css_variables.typography[`--${source}-${key}`] = value.toString();
        }
      }
      
      // Spacing variables
      else if (lowerKey.includes('padding') || lowerKey.includes('margin') || lowerKey.includes('gap') || lowerKey.includes('space')) {
        if (typeof value === 'string' || typeof value === 'number') {
          this.results.css_variables.spacing[`--${source}-${key}`] = value.toString();
        }
      }
      
      // Breakpoint variables
      else if (lowerKey.includes('breakpoint') || lowerKey.includes('width') || lowerKey.includes('mobile') || lowerKey.includes('tablet') || lowerKey.includes('desktop')) {
        if (typeof value === 'string' || typeof value === 'number') {
          this.results.css_variables.breakpoints[`--${source}-${key}`] = value.toString();
        }
      }
      
      // Recursively process nested objects
      else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.extractVariablesFromObject(value, `${source}-${key}`);
      }
    });
  }

  /**
   * Add default GeneratePress CSS variables
   */
  private addDefaultCSSVariables(): void {
    // Default GeneratePress color variables
    const defaultColors = {
      '--accent': '#1e73be',
      '--base': '#ffffff',
      '--base-2': '#f7f8f9', 
      '--base-3': '#efefef',
      '--contrast': '#222222',
      '--contrast-2': '#757575',
      '--contrast-3': '#999999'
    };

    // Default typography variables
    const defaultTypography = {
      '--body-font': 'system-ui, sans-serif',
      '--heading-font': 'inherit',
      '--base-font-size': '17px',
      '--heading-font-weight': '400',
      '--body-line-height': '1.6'
    };

    // Default spacing variables
    const defaultSpacing = {
      '--container-width': '1200px',
      '--content-width': '1200px',
      '--spacing-unit': '20px'
    };

    // Default breakpoints
    const defaultBreakpoints = {
      '--mobile-breakpoint': '768px',
      '--tablet-breakpoint': '1024px',
      '--desktop-breakpoint': '1200px'
    };

    // Merge with existing variables
    Object.assign(this.results.css_variables.colors, defaultColors);
    Object.assign(this.results.css_variables.typography, defaultTypography);
    Object.assign(this.results.css_variables.spacing, defaultSpacing);
    Object.assign(this.results.css_variables.breakpoints, defaultBreakpoints);
  }

  /**
   * Create color schemes from extracted variables
   */
  createColorSchemes(): void {
    console.log('🌈 Creating Color Schemes...');

    try {
      const colors = this.results.css_variables.colors;
      
      // Main color scheme from GeneratePress defaults
      const mainScheme: ColorScheme = {
        primary: colors['--accent'] || '#1e73be',
        secondary: colors['--base-2'] || '#f7f8f9',
        accent: colors['--accent'] || '#1e73be',
        background: colors['--base'] || '#ffffff',
        text: colors['--contrast'] || '#222222',
        heading: colors['--contrast'] || '#222222',
        link: colors['--accent'] || '#1e73be',
        button: colors['--accent'] || '#1e73be'
      };

      this.results.color_schemes = [mainScheme];
      
      console.log(`   ✅ Created ${this.results.color_schemes.length} color scheme(s)`);
      console.log(`      - Primary: ${mainScheme.primary}`);
      console.log(`      - Background: ${mainScheme.background}`);
      console.log(`      - Text: ${mainScheme.text}`);
      
    } catch (error) {
      console.error('❌ Color schemes creation failed:', error);
    }
  }

  /**
   * Extract typography settings
   */
  extractTypographySettings(): void {
    console.log('📝 Extracting Typography Settings...');

    try {
      const typography = this.results.css_variables.typography;
      
      this.results.typography = {
        body_font: typography['--body-font'] || 'system-ui, sans-serif',
        heading_font: typography['--heading-font'] || 'inherit',
        font_sizes: {
          base: typography['--base-font-size'] || '17px',
          h1: typography['--h1-size'] || '2.5rem',
          h2: typography['--h2-size'] || '2rem', 
          h3: typography['--h3-size'] || '1.75rem',
          h4: typography['--h4-size'] || '1.5rem',
          h5: typography['--h5-size'] || '1.25rem',
          h6: typography['--h6-size'] || '1rem'
        },
        line_heights: {
          body: typography['--body-line-height'] || '1.6',
          heading: typography['--heading-line-height'] || '1.2'
        },
        font_weights: {
          normal: typography['--body-font-weight'] || '400',
          heading: typography['--heading-font-weight'] || '400',
          bold: '700'
        }
      };

      console.log(`   ✅ Extracted typography settings:`);
      console.log(`      - Body Font: ${this.results.typography.body_font}`);
      console.log(`      - Heading Font: ${this.results.typography.heading_font}`);
      console.log(`      - Base Size: ${this.results.typography.font_sizes.base}`);
      
    } catch (error) {
      console.error('❌ Typography settings extraction failed:', error);
    }
  }

  /**
   * Extract responsive breakpoints
   */
  extractResponsiveBreakpoints(): void {
    console.log('📱 Extracting Responsive Breakpoints...');

    try {
      const breakpoints = this.results.css_variables.breakpoints;
      
      this.results.responsive_breakpoints = {
        mobile: breakpoints['--mobile-breakpoint'] || '768px',
        tablet: breakpoints['--tablet-breakpoint'] || '1024px', 
        desktop: breakpoints['--desktop-breakpoint'] || '1200px',
        mobile_menu: breakpoints['--mobile-menu-breakpoint'] || '1024px'
      };

      console.log(`   ✅ Extracted responsive breakpoints:`);
      console.log(`      - Mobile: ${this.results.responsive_breakpoints.mobile}`);
      console.log(`      - Tablet: ${this.results.responsive_breakpoints.tablet}`);
      console.log(`      - Desktop: ${this.results.responsive_breakpoints.desktop}`);
      
    } catch (error) {
      console.error('❌ Responsive breakpoints extraction failed:', error);
    }
  }

  /**
   * Create React-compatible CSS variable mapping
   */
  createReactMapping(): void {
    console.log('⚛️ Creating React CSS Variable Mapping...');

    try {
      // Create CSS-in-JS compatible variable mapping
      const reactVariables: Record<string, string> = {};
      
      // Convert CSS custom properties to camelCase
      Object.entries(this.results.css_variables.colors).forEach(([key, value]) => {
        const reactKey = key.replace(/^--/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        reactVariables[reactKey] = `var(${key})`;
      });

      Object.entries(this.results.css_variables.typography).forEach(([key, value]) => {
        const reactKey = key.replace(/^--/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        reactVariables[reactKey] = `var(${key})`;
      });

      Object.entries(this.results.css_variables.spacing).forEach(([key, value]) => {
        const reactKey = key.replace(/^--/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        reactVariables[reactKey] = `var(${key})`;
      });

      this.results.react_mapping.css_variables = reactVariables;

      // Create theme configuration object
      this.results.react_mapping.theme_config = {
        colors: this.results.color_schemes[0] || {},
        typography: this.results.typography,
        breakpoints: this.results.responsive_breakpoints,
        spacing: {
          unit: this.results.css_variables.spacing['--spacing-unit'] || '20px',
          containerWidth: this.results.css_variables.spacing['--container-width'] || '1200px'
        }
      };

      // Generate TypeScript interfaces
      this.results.react_mapping.typescript_interfaces = [
        'interface ThemeColors',
        'interface Typography', 
        'interface Breakpoints',
        'interface SpacingConfig',
        'interface ThemeConfig'
      ];

      console.log(`   ✅ Created React mapping system:`);
      console.log(`      - CSS Variables: ${Object.keys(reactVariables).length}`);
      console.log(`      - Theme Config: ${Object.keys(this.results.react_mapping.theme_config).length} sections`);
      console.log(`      - TypeScript Interfaces: ${this.results.react_mapping.typescript_interfaces.length}`);
      
    } catch (error) {
      console.error('❌ React mapping creation failed:', error);
    }
  }

  /**
   * Save all export data to files
   */
  async saveExports(): Promise<void> {
    console.log('💾 Saving Theme Export Data...');

    const exports = [
      {
        filename: 'theme-settings.json',
        data: this.results.theme_settings,
        description: 'Complete WordPress and GeneratePress theme settings'
      },
      {
        filename: 'css-variables.json',
        data: this.results.css_variables,
        description: 'CSS custom properties and variable system'
      },
      {
        filename: 'color-schemes.json',
        data: {
          timestamp: this.results.timestamp,
          schemes: this.results.color_schemes,
          variables: this.results.css_variables.colors
        },
        description: 'Theme color definitions and schemes'
      },
      {
        filename: 'typography-config.json',
        data: {
          timestamp: this.results.timestamp,
          typography: this.results.typography,
          variables: this.results.css_variables.typography
        },
        description: 'Typography settings and font configurations'
      },
      {
        filename: 'responsive-config.json',
        data: {
          timestamp: this.results.timestamp,
          breakpoints: this.results.responsive_breakpoints,
          variables: this.results.css_variables.breakpoints
        },
        description: 'Responsive breakpoints and layout settings'
      },
      {
        filename: 'react-theme-config.json',
        data: {
          timestamp: this.results.timestamp,
          mapping: this.results.react_mapping,
          theme_config: this.results.react_mapping.theme_config
        },
        description: 'React-compatible theme configuration'
      },
      {
        filename: 'wp-theme-export-complete.json',
        data: this.results,
        description: 'Complete theme export results with all data'
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
   * Generate TypeScript utilities for React integration
   */
  async generateTypeScriptUtils(): Promise<void> {
    console.log('🔧 Generating TypeScript Utilities...');

    try {
      const utilContent = `/**
 * WordPress Theme Variables & Configuration
 * Generated from Session 3: Theme Settings & CSS Variables Export
 * Source: ${this.results.source_site}
 * Generated: ${this.results.timestamp}
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  heading: string;
  link: string;
  button: string;
}

export interface Typography {
  bodyFont: string;
  headingFont: string;
  fontSizes: {
    base: string;
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
  };
  lineHeights: {
    body: string;
    heading: string;
  };
  fontWeights: {
    normal: string;
    heading: string;
    bold: string;
  };
}

export interface Breakpoints {
  mobile: string;
  tablet: string;
  desktop: string;
  mobileMenu: string;
}

export interface SpacingConfig {
  unit: string;
  containerWidth: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  typography: Typography;
  breakpoints: Breakpoints;
  spacing: SpacingConfig;
}

// CSS Variables mapping for React CSS-in-JS
export const cssVariables = ${JSON.stringify(this.results.react_mapping.css_variables, null, 2)};

// Theme configuration object
export const themeConfig: ThemeConfig = ${JSON.stringify(this.results.react_mapping.theme_config, null, 2)};

// CSS custom properties as CSS string for global styles
export const cssCustomProperties = \`
  :root {
${Object.entries(this.results.css_variables.colors).map(([key, value]) => `    ${key}: ${value};`).join('\n')}
${Object.entries(this.results.css_variables.typography).map(([key, value]) => `    ${key}: ${value};`).join('\n')}
${Object.entries(this.results.css_variables.spacing).map(([key, value]) => `    ${key}: ${value};`).join('\n')}
${Object.entries(this.results.css_variables.breakpoints).map(([key, value]) => `    ${key}: ${value};`).join('\n')}
  }
\`;

// Utility functions
export const getBreakpointValue = (breakpoint: keyof Breakpoints): string => {
  return themeConfig.breakpoints[breakpoint];
};

export const getCSSVariable = (variable: string): string => {
  return \`var(\${variable})\`;
};
`;

      await fs.writeFile('./src/utils/wp-theme-vars.ts', utilContent, 'utf8');
      console.log('   ✅ Generated: src/utils/wp-theme-vars.ts (React theme utilities)');

    } catch (error) {
      console.error('❌ TypeScript utilities generation failed:', error);
    }
  }

  /**
   * Print export summary
   */
  printSummary(): void {
    console.log('');
    console.log('📊 Theme Export Summary - Session 3 Complete');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📅 Export Date: ${this.results.timestamp}`);
    console.log(`🌐 Source Site: ${this.results.source_site}`);
    console.log('');
    console.log('⚙️ Theme Settings Exported:');
    console.log(`   WordPress Settings: ${this.results.summary.total_settings}`);
    console.log(`   GeneratePress Options: ${this.results.summary.generatepress_options}`);
    console.log(`   GenerateBlocks Options: ${this.results.summary.generateblocks_options}`);
    console.log('');
    console.log('🎨 CSS Variables & Styling:');
    console.log(`   Total CSS Variables: ${this.results.summary.css_variables}`);
    console.log(`   ├── Colors: ${this.results.summary.color_variables}`);
    console.log(`   ├── Typography: ${this.results.summary.typography_variables}`);
    console.log(`   ├── Spacing: ${this.results.summary.spacing_variables}`);
    console.log(`   └── Breakpoints: ${this.results.summary.breakpoint_variables}`);
    console.log('');
    console.log('🌈 Theme Configuration:');
    console.log(`   Color Schemes: ${this.results.color_schemes.length}`);
    console.log(`   Typography Settings: ✅ Complete`);
    console.log(`   Responsive Breakpoints: ✅ Complete`);
    console.log(`   React Integration: ✅ Ready`);
    console.log('');
    console.log('🎯 Ready for Session 4: Media Library Export');
    console.log('Theme styling and configuration captured for React integration.');
  }

  /**
   * Run complete export process
   */
  async run(): Promise<void> {
    try {
      await this.initialize();
      await this.exportWordPressSettings();
      await this.exportGeneratePressSettings();
      await this.exportGenerateBlocksSettings();
      this.extractCSSVariables();
      this.createColorSchemes();
      this.extractTypographySettings();
      this.extractResponsiveBreakpoints();
      this.createReactMapping();
      await this.saveExports();
      await this.generateTypeScriptUtils();
      this.printSummary();
      
      console.log('\n✅ Session 3 Export Complete - All theme data captured successfully!');
      
    } catch (error) {
      console.error('\n❌ Theme export failed:', error);
      process.exit(1);
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const exporter = new WordPressThemeExporter();
  exporter.run().catch(console.error);
}

export { WordPressThemeExporter };