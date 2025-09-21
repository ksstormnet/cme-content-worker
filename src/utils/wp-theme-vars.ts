/**
 * WordPress Theme Variables & Configuration
 * Generated from Session 3: Theme Settings & CSS Variables Export
 * Source: https://cruisemadeeasy.com
 * Generated: 2025-09-21T19:04:50.332Z
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
export const cssVariables = {
  "accent": "var(--accent)",
  "base": "var(--base)",
  "base-2": "var(--base-2)",
  "base-3": "var(--base-3)",
  "contrast": "var(--contrast)",
  "contrast-2": "var(--contrast-2)",
  "contrast-3": "var(--contrast-3)",
  "bodyFont": "var(--body-font)",
  "headingFont": "var(--heading-font)",
  "baseFontSize": "var(--base-font-size)",
  "headingFontWeight": "var(--heading-font-weight)",
  "bodyLineHeight": "var(--body-line-height)",
  "containerWidth": "var(--container-width)",
  "contentWidth": "var(--content-width)",
  "spacingUnit": "var(--spacing-unit)"
};

// Theme configuration object
export const themeConfig: ThemeConfig = {
  "colors": {
    "primary": "#1e73be",
    "secondary": "#f7f8f9",
    "accent": "#1e73be",
    "background": "#ffffff",
    "text": "#222222",
    "heading": "#222222",
    "link": "#1e73be",
    "button": "#1e73be"
  },
  "typography": {
    "body_font": "system-ui, sans-serif",
    "heading_font": "inherit",
    "font_sizes": {
      "base": "17px",
      "h1": "2.5rem",
      "h2": "2rem",
      "h3": "1.75rem",
      "h4": "1.5rem",
      "h5": "1.25rem",
      "h6": "1rem"
    },
    "line_heights": {
      "body": "1.6",
      "heading": "1.2"
    },
    "font_weights": {
      "normal": "400",
      "heading": "400",
      "bold": "700"
    }
  },
  "breakpoints": {
    "mobile": "768px",
    "tablet": "1024px",
    "desktop": "1200px",
    "mobile_menu": "1024px"
  },
  "spacing": {
    "unit": "20px",
    "containerWidth": "1200px"
  }
};

// CSS custom properties as CSS string for global styles
export const cssCustomProperties = `
  :root {
    --accent: #1e73be;
    --base: #ffffff;
    --base-2: #f7f8f9;
    --base-3: #efefef;
    --contrast: #222222;
    --contrast-2: #757575;
    --contrast-3: #999999;
    --body-font: system-ui, sans-serif;
    --heading-font: inherit;
    --base-font-size: 17px;
    --heading-font-weight: 400;
    --body-line-height: 1.6;
    --container-width: 1200px;
    --content-width: 1200px;
    --spacing-unit: 20px;
    --mobile-breakpoint: 768px;
    --tablet-breakpoint: 1024px;
    --desktop-breakpoint: 1200px;
  }
`;

// Utility functions
export const getBreakpointValue = (breakpoint: keyof Breakpoints): string => {
  return themeConfig.breakpoints[breakpoint];
};

export const getCSSVariable = (variable: string): string => {
  return `var(${variable})`;
};
