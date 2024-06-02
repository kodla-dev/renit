import { each, hasOwn } from '../collect/index.js';
import { isArray, isNull, isObject, isUndefined } from '../is/index.js';

/**
 * Represents the function to be executed when a reactive dependency changes.
 */
let update = null;

/**
 * Represents a map of dependencies for each reactive object.
 */
const deps = new WeakMap();

/**
 * Adds the current update function to the dependencies of the provided object.
 * @param {Object} self - The object to add dependencies to.
 */
function get(self) {
  if (!isNull(update)) {
    let dep = deps.get(self);

    if (isUndefined(dep)) {
      dep = new Deps();
      deps.set(self, dep);
    }

    dep.a(update);
  }
}

/**
 * Notifies the dependencies of the provided object.
 * @param {Object} self - The object whose dependencies need to be notified.
 */
function set(self) {
  const dep = deps.get(self);
  if (!isUndefined(dep)) {
    dep.n(self);
  }
}

/**
 * Represents a dependency tracking mechanism.
 */
class Deps {
  constructor() {
    this.d = new Set();
  }

  /**
   * Adds a new function to the dependency set.
   * @param {Function} f - The function to add to the dependency set.
   */
  a(f) {
    this.d.add(f);
  }

  /**
   * Notifies all functions in the dependency set with the provided object.
   * @param {*} obj - The object to notify all functions with.
   */
  n(obj) {
    this.d.forEach(func => {
      func(obj);
    });
  }
}

/**
 * Represents a reactive reference.
 */
class State {
  /**
   * Creates an instance of Ref.
   * @param {*} initial - The initial value of the reference.
   */
  constructor(initial = null) {
    this.v = initial;
  }

  /**
   * Getter for accessing the value of the reference.
   * @returns {*} The current value of the reference.
   */
  get $() {
    get(this);
    return this.v;
  }

  /**
   * Setter for updating the value of the reference and notifying dependencies.
   * @param {*} val - The new value to set for the reference.
   */
  set $(val) {
    this.v = val;
    set(this);
  }
}

/**
 * Creates a reactive reference with the given initial value.
 * @param {*} initial - The initial value of the reference.
 * @returns {Ref} A reactive reference.
 */
export function state(initial = null) {
  return new State(initial);
}

/**
 * Represents a computed value derived from a callback function.
 */
class Computed {
  /**
   * Creates a Computed instance with the given callback function.
   * @param {Function} cb - The callback function used to derive the computed value.
   */
  constructor(cb) {
    this.cb = cb;
    this.cv = null; // cached value
    this.c = null; // calculated
    // updater function
    this.u = () => {
      const value = this.cb();
      if (value !== this.cv) {
        this.cv = value;
        set(this);
      }
    };
  }

  /**
   * Gets the computed value.
   * @returns {*} The computed value.
   */
  get $() {
    get(this);

    if (!this.c) {
      const oldUpdate = update;
      update = this.u;
      this.cv = this.cb();
      this.c = true;
      update = oldUpdate;
    }

    return this.cv;
  }
}

/**
 * Creates a Computed instance with the given callback function.
 * @param {Function} callback - The callback function used to derive the computed value.
 * @returns {Computed} A Computed instance.
 */
export function computed(callback) {
  return new Computed(callback);
}

/**
 * Registers a property of an object for reactive updates.
 * @param {Object} obj - The object containing the property.
 * @param {string} key - The key of the property to register.
 */
function stateObjectRegister(obj, key) {
  let value = obj[key];
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: true,
    get() {
      get(obj);
      return value;
    },
    set(val) {
      value = val;
      set(obj);
    },
  });
}

/**
 * Handles the reactivity of an object by registering its properties for reactive updates.
 * @param {Object} obj - The object to handle reactivity for.
 * @returns {Object} - The same object with reactive properties.
 */
function stateObjectHandler(obj) {
  for (const key in obj) {
    if (hasOwn(key, obj)) {
      stateObjectRegister(obj, key);
    }
  }
  return obj;
}

/**
 * Creates a reactive state object from the provided object.
 * @param {Object} obj - The object to create a reactive state object from.
 * @returns {Object} - The reactive state object.
 */
function stateObjectCreate(obj) {
  for (const key in obj) {
    if (hasOwn(key, obj) && isObject(obj[key])) {
      obj[key] = stateObjectCreate(obj[key]);
    }
  }
  return stateObjectHandler(obj);
}

/**
 * Creates a reactive from the given object.
 * @param {Object} obj - The object to make reactive.
 * @returns {Object} A reactive object.
 */
export function stateObject(obj) {
  obj = { $: obj };
  return stateObjectCreate(obj);
}

/**
 * Represents a reactive array state.
 * Extends the State class.
 */
class StateArray extends State {}

/**
 * Adds array methods to the StateArray prototype.
 * These methods are delegated to the internal array value.
 */
each(name => {
  StateArray.prototype[name] = function () {
    const native = Array.prototype[name].apply(this.v, arguments);
    set(this);
    if (!isUndefined(native)) {
      return native;
    }
  };
}, Object.getOwnPropertyNames(Array.prototype));

/**
 * Creates a reactive reference with the given array.
 * @param {*} arr - The array of the reference.
 * @returns {StateArray} A reactive reference.
 */
export function stateArray(arr) {
  return new StateArray(arr);
}

/**
 * Runs the given callback function and tracks its reactive dependencies.
 * @param {Function} callback - The callback function to run.
 */
export function effect(callback) {
  const oldUpdate = update;
  update = callback;
  callback();
  update = oldUpdate;
}

/**
 * Watches a reactive value or object for changes and invokes the callback function accordingly.
 * @param {Function} what - The function returning the value or object to watch.
 * @param {Function} callback - The callback function to invoke when the watched value changes.
 * @param {boolean} [deep=false] - Indicates whether to watch deeply for changes in nested objects.
 * @returns {Function} - A function to unsubscribe from the watch.
 */
export function watch(what, callback, deep = false) {
  const oldUpdate = update;

  // Flag to track if the watch has been unsubscribed
  let unsubscribed = false;
  const unsubscribe = () => {
    unsubscribed = true;
  };

  // Override the update function to perform watch operations
  update = () => {
    if (unsubscribed) {
      return; // If unsubscribed, do nothing
    }

    const newVal = what(); // Get the current value
    if (newVal !== val) {
      // If the value has changed
      callback(newVal, val); // Invoke the callback with the new and old values
      val = newVal; // Update the old value
      if (isObject(val) && deep) {
        // If the value is an object and deep watching is enabled
        deepWatch(val, what, callback); // Set up deep watching for nested objects
      }
    }
  };
  // Get the initial value
  let val = what();

  // If the value is an object and deep watching is enabled, set up deep watching
  if (isObject(val) && deep) {
    deepWatch(val, what, callback);
  }

  // Restore the original update function
  update = oldUpdate;

  return unsubscribe;
}

/**
 * Sets up deep watching for changes in nested objects.
 * @param {Object} obj - The object to watch.
 * @param {Function} what - The function returning the value or object to watch.
 * @param {Function} callback - The callback function to invoke when the watched value changes.
 */
function deepWatch(obj, what, callback) {
  const oldUpdate = update;

  // Override the update function to perform deep watch operations
  update = () => {
    if (what() === obj) {
      // If the watched object is still the same
      callback(obj, obj); // Invoke the callback with the object
    }
  };

  // Recursively access all properties of the object and its child objects
  deepObject(obj);

  // Restore the original update function
  update = oldUpdate;
}

const dummy = Symbol('dummy');

/**
 * Recursively accesses all properties of the object and its child objects.
 * @param {Object} obj - The object to traverse.
 */
function deepObject(obj) {
  obj[dummy]; // Access a dummy property to ensure traversal
  for (const key in obj) {
    if (isObject(obj[key])) {
      deepObject(obj[key]); // Recursively traverse child objects
    }
  }
}

/**
 * Creates a new reactive store.
 * If the initial value is an array, it creates a StateArray.
 * If the initial value is an object, it creates a StateObject.
 * Otherwise, it creates a reactive state.
 * @param {any} initial - The initial value of the store.
 * @returns {StateArray|StateObject|State} - The reactive store.
 */
export function store(initial) {
  if (isArray(initial)) {
    return stateArray(initial);
  } else if (isObject(initial)) {
    return stateObject(initial);
  } else {
    return state(initial);
  }
}
