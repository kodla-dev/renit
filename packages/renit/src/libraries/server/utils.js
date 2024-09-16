import { isFunction, isObjects } from '../is/index.js';

const STATUS_CODES = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  103: 'Early Hints',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status',
  208: 'Already Reported',
  226: 'IM Used',
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a Teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  509: 'Bandwidth Limit Exceeded',
  510: 'Not Extended',
  511: 'Network Authentication Required',
};

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
  res.end(data || STATUS_CODES[code]);
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
export function sendType(res, code = 200, data = '', headers = {}, charset = 'utf-8') {
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
    type = type || `application/json;charset=${charset}`;
  } else {
    data = data || STATUS_CODES[code];
  }

  obj[TYPE] = type || `text/plain;charset=${charset}`;

  obj['content-length'] = Buffer.byteLength(data);

  res.writeHead(code, obj); // Set the status code and headers
  res.end(data); // Send the response data
}
