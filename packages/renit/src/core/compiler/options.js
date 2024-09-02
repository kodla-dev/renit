import { generateStylePattern } from './utils/style.js';

const defaultOptions = {
  // Defines the default generation mode for the application.
  generate: 'csr',

  // Configuration settings for CSS.
  css: {
    // Function to generate style pattern based on options.
    pattern: options => generateStylePattern(options),

    // Specifies how CSS should be compiled.
    compile: 'external', // injected - external

    // Configuration for CSS hashing.
    hash: {
      min: 1, // Minimum length of the hash.
      max: 6, // Maximum length of the hash.
    },

    // Enables or disables CSS color support.
    colors: true,

    // Enables or disables CSS nesting support.
    nesting: true,

    // Enables or disables CSS media query support.
    mediaQueries: false,

    // Enables or disables custom CSS selector support.
    selectors: false,

    // Custom units.
    units: {
      nt: {
        multiplier: 0.25, // Multiplier for the custom unit.
        unit: 'rem', // Unit of measurement for the custom unit.
      },
    },

    // Configuration for responsive design.
    breakpoints: {
      unit: 'rem', // Unit for breakpoints.
      sizes: { sm: 40, md: 48, lg: 64, xl: 80, xxl: 96 }, // Breakpoint sizes.
    },
  },

  // Internal settings
  $: {
    kit: false,
    external: {
      style: false,
    },
  },
};

export default defaultOptions;
