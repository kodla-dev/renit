import http from 'node:http';
import { isFunction, isObjects, isString } from '../is/index.js';
import { length } from '../math/index.js';

/**
 * Default error handler for the server.
 *
 * @param {Error|string|Buffer} err - The error to handle.
 * @param {http.IncomingMessage} req - The incoming request object.
 * @param {http.ServerResponse} res - The server response object.
 */
const onError = (err, req, res) => {
  const code = (res.statusCode = err.code || err.status || 500);
  if (isString(err) || Buffer.isBuffer(err)) {
    res.end(err);
  } else {
    res.end(err.message || http.STATUS_CODES[code]);
  }
};

/**
 * Creates and manages an HTTP server with middleware support.
 */
class CreateServer {
  /**
   * Initializes a new CreateServer instance.
   *
   * @param {Object} [opts={}] - Options for the server.
   * @param {Function} [opts.onError] - Custom error handler.
   */
  constructor(opts = {}) {
    this.wares = []; // Middleware stack
    this.server = opts.server;
    this.handler = this.handler.bind(this); // Bind handler method
    this.onError = opts.onError || onError; // Set custom error handler or default
  }

  /**
   * Adds middleware functions to the server.
   *
   * @param {string|Function} base - Base path or middleware function.
   * @param {...Function} fns - Middleware functions to add.
   * @returns {CreateServer} The current CreateServer instance for chaining.
   */
  use(base, ...fns) {
    if (isFunction(base)) {
      this.wares = [...this.wares, base, ...fns];
    } else if (base === '/') {
      this.wares = [...this.wares, ...fns];
    }
    return this;
  }

  /**
   * Starts the server and listens for incoming requests.
   *
   * @param {...*} args - Arguments to pass to `http.createServer.listen()`.
   * @returns {CreateServer} The current CreateServer instance for chaining.
   */
  listen(...args) {
    this.server = this.server || http.createServer(); // Create server if not provided
    this.server.on('request', this.handler); // Attach request handler
    this.server.listen(...args); // Start listening on the specified port
    return this;
  }

  /**
   * Handles incoming requests and applies middleware.
   *
   * @param {http.IncomingMessage} req - The incoming request object.
   * @param {http.ServerResponse} res - The server response object.
   */
  handler(req, res) {
    let wares = this.wares;
    let i = 0;
    const waresLen = length(wares); // Number of middleware functions
    const next = err => (err ? this.onError(err, req, res, next) : loop());
    const loop = () => !res.finished && i < waresLen && wares[i++](req, res, next);
    wares = [...wares];
    loop();
  }
}

/**
 * Creates a new CreateServer instance.
 *
 * @param {Object} [opts={}] - Options for the server.
 * @returns {CreateServer} A new CreateServer instance.
 */
export function createServer(opts = {}) {
  return new CreateServer(opts);
}

/**
 * Sends a response to the client.
 *
 * @param {http.ServerResponse} res - The server response object.
 * @param {number} [code=200] - The HTTP status code.
 * @param {string|Buffer} [data=''] - The response data.
 * @param {Object} [headers={}] - Additional headers to set.
 */
export function send(res, code = 200, data = '', headers = {}) {
  res.writeHead(code, headers);
  res.end(data || http.STATUS_CODES[code]);
}

const TYPE = 'content-type'; // Header key for content type
const OSTREAM = 'application/octet-stream'; // Default content type for binary data

/**
 * Sends a response with a specific content type.
 *
 * @param {http.ServerResponse} res - The server response object.
 * @param {number} [code=200] - The HTTP status code.
 * @param {string|Buffer|Object} [data=''] - The response data.
 * @param {Object} [headers={}] - Additional headers to set.
 */
export function sendType(res, code = 200, data = '', headers = {}) {
  let k,
    obj = {};
  for (k in headers) {
    obj[k.toLowerCase()] = headers[k];
  }

  let type = obj[TYPE] || res.getHeader(TYPE);

  if (!!data && isFunction(data.pipe)) {
    obj[TYPE] = type || OSTREAM;
    for (k in obj) {
      res.setHeader(k, obj[k]);
    }
    return data.pipe(res); // Pipe stream data to response
  }

  if (data instanceof Buffer) {
    type = type || OSTREAM;
  } else if (isObjects(data)) {
    data = JSON.stringify(data);
    type = type || 'application/json;charset=utf-8';
  } else {
    data = data || http.STATUS_CODES[code];
  }

  obj[TYPE] = type || 'text/plain';
  obj['content-length'] = Buffer.byteLength(data);

  res.writeHead(code, obj); // Set the status code and headers
  res.end(data); // Send the response data
}
