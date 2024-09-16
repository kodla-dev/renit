#!/usr/bin/env node

/**
 * Executes a command based on the user's input from the command line.
 * @returns {Promise<void>} A promise that resolves when the command execution is complete.
 */
export async function runCommand() {
  const args = process.argv.slice(2); // Extract command line arguments
  const commands = ['dev', 'build', 'preview', 'clean']; // Supported commands
  const command = args[0]; // The command to execute

  // Check if the command is valid and execute it
  if (commands.includes(command)) {
    const mod = await import(`./commands/${command}/index.js`); // Dynamically import the module
    try {
      await mod.default(args); // Execute the default export from the module
    } catch (error) {
      console.error(error); // Log any errors that occur during execution
      process.exit(1);
    }
  } else {
    // Handle invalid or missing commands
    if (command) {
      console.error(`"${command}" is not set`);
    } else {
      console.error(`Command not found`);
    }
  }
}

runCommand();
