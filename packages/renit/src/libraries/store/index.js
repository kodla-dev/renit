import { DEV } from '../../core/env.js';
import { Renit } from '../../core/fault.js';
import { clone } from '../../helpers/index.js';
import { hasOwn } from '../collect/index.js';
import { isFunction, isNull, isObject, isUndefined } from '../is/index.js';

/**
 * Represents the function to be executed when a reactive dependency changes.
 */
let update = null;

/**
 * Represents a map of dependencies for each reactive object.
 */
const deps = new WeakMap();

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
class Ref {
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
    if (!isNull(update)) {
      let dep = deps.get(this);

      if (isUndefined(dep)) {
        dep = new Deps();
        deps.set(this, dep);
      }

      dep.a(update);
    }

    return this.v;
  }

  /**
   * Setter for updating the value of the reference and notifying dependencies.
   * @param {*} val - The new value to set for the reference.
   */
  set $(val) {
    this.v = val;
    const dep = deps.get(this);
    if (!isUndefined(dep)) {
      dep.n(this);
    }
  }
}

/**
 * Creates a reactive reference with the given initial value.
 * @param {*} initial - The initial value of the reference.
 * @returns {Ref} A reactive reference.
 */
export function ref(initial = null) {
  return new Ref(initial);
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
        const dep = deps.get(this);
        if (!isUndefined(dep)) {
          dep.n(this);
        }
      }
    };
  }

  /**
   * Gets the computed value.
   * @returns {*} The computed value.
   */
  get $() {
    if (!isNull(update)) {
      let dep = deps.get(this);

      if (isUndefined(dep)) {
        dep = new Deps();
        deps.set(this, dep);
      }

      dep.a(update);
    }

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
 * @param {Function} cb - The callback function used to derive the computed value.
 * @returns {Computed} A Computed instance.
 * @throws {Renit} Throws an error if the argument is not a function.
 */
export function computed(cb) {
  if (DEV) {
    if (!isFunction(cb)) throw new Renit(`Argument of computed() must be a function`);
  }
  return new Computed(cb);
}

/**
 * Handler object for reactive proxies.
 */
const reactiveHandler = {
  /**
   * Getter for reactive proxies.
   * @param {Object} obj - The target object.
   * @param {string} prop - The property being accessed.
   * @returns {*} The value of the property.
   */
  get(obj, prop) {
    if (!isNull(update)) {
      let dep = deps.get(obj);

      if (isUndefined(dep)) {
        dep = new Deps();
        deps.set(obj, dep);
      }

      dep.a(update);
    }

    return obj[prop];
  },

  /**
   * Setter for reactive proxies.
   * @param {Object} obj - The target object.
   * @param {string} prop - The property being set.
   * @param {*} value - The value to set.
   * @returns {boolean} True if successful.
   */
  set(obj, prop, value) {
    if (isObject(value)) {
      obj[prop] = reactive(value);
    } else {
      obj[prop] = value;
    }
    const dep = deps.get(obj);
    if (!isUndefined(dep)) {
      dep.n(obj);
    }
    return true;
  },

  /**
   * Handler for deleting properties from reactive proxies.
   * @param {Object} obj - The target object.
   * @param {string} prop - The property to delete.
   * @returns {boolean} True if successful.
   */
  deleteProperty(obj, prop) {
    if (hasOwn(obj, prop)) {
      delete obj[prop];
      const dep = deps.get(obj);
      if (!isUndefined(dep)) {
        dep.n(obj);
      }
    }
    return true;
  },
};

/**
 * Creates a reactive proxy for the given object.
 * @param {Object} obj - The object to make reactive.
 * @returns {Object} A reactive proxy for the object.
 */
export function reactive(obj) {
  const cln = clone(obj);
  for (const key in cln) {
    if (hasOwn(cln, key) && isObject(cln[key])) {
      cln[key] = reactive(cln[key]);
    }
  }
  return new Proxy(cln, reactiveHandler);
}

/**
 * Runs the given callback function and tracks its reactive dependencies.
 * @param {Function} cb - The callback function to run.
 */
export function effect(cb) {
  const oldUpdate = update;
  update = cb;
  cb();
  update = oldUpdate;
}

/**
 * Watches a reactive value or object for changes and invokes the callback function accordingly.
 * @param {Function} what - The function returning the value or object to watch.
 * @param {Function} cb - The callback function to invoke when the watched value changes.
 * @param {boolean} [deep=false] - Indicates whether to watch deeply for changes in nested objects.
 * @returns {Function} - A function to unsubscribe from the watch.
 */
export function watch(what, cb, deep = false) {
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
      cb(newVal, val); // Invoke the callback with the new and old values
      val = newVal; // Update the old value
      if (isObject(val) && deep) {
        // If the value is an object and deep watching is enabled
        deepWatch(val, what, cb); // Set up deep watching for nested objects
      }
    }
  };
  // Get the initial value
  let val = what();

  // If the value is an object and deep watching is enabled, set up deep watching
  if (isObject(val) && deep) {
    deepWatch(val, what, cb);
  }

  // Restore the original update function
  update = oldUpdate;

  return unsubscribe;
}

/**
 * Sets up deep watching for changes in nested objects.
 * @param {Object} obj - The object to watch.
 * @param {Function} what - The function returning the value or object to watch.
 * @param {Function} cb - The callback function to invoke when the watched value changes.
 */
function deepWatch(obj, what, cb) {
  const oldUpdate = update;

  // Override the update function to perform deep watch operations
  update = () => {
    if (what() === obj) {
      // If the watched object is still the same
      cb(obj, obj); // Invoke the callback with the object
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
