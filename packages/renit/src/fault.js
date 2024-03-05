/**
  Represents the custom error class named Renit.

  @class
  @extends {Error}
  @param {string} message - Error message.

  @example
  try {
    throw new Renit('This is a custom error!');
  } catch (error) {
    console.log(error instanceof Renit); // true
    console.log(error.message); // 'This is a custom error!'
  }
*/
export class Renit extends Error {
  /**
    The constructor function of the error class.
    @param {string} message - Error message.
  */
  constructor(message, name = 'Renit') {
    super(message);
    this.name = name;
  }
}
