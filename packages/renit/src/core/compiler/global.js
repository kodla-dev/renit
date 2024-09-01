class Global {
  constructor() {
    // Initializes an empty array to store global styles.
    this.styles = [];

    // Initializes an object to store global CSS variables.
    this.variables = {};

    // Initializes an object to store global at-rule variables.
    this.atVariables = {};

    // Initializes an object to store blocks of global styles.
    this.blocks = {};
  }
}

// Creates an instance of the Global class.
export const global = new Global();
