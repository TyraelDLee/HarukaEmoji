/*!
 * protobuf.js v6.11.3 (c) 2016, daniel wirtz
 * compiled tue, 24 may 2022 07:42:16 utc
 * licensed under the bsd-3-clause license
 * see: https://github.com/dcodeio/protobuf.js for details
 */
(function(undefined){"use strict";(function prelude(modules, cache, entries) {

    // This is the prelude used to bundle protobuf.js for the browser. Wraps up the CommonJS
    // sources through a conflict-free require shim and is again wrapped within an iife that
    // provides a minification-friendly `undefined` var plus a global "use strict" directive
    // so that minification can remove the directives of each module.

    function $require(name) {
        var $module = cache[name];
        if (!$module)
            modules[name][0].call($module = cache[name] = { exports: {} }, $require, $module, $module.exports);
        return $module.exports;
    }

    var protobuf = $require(entries[0]);

    // Expose globally
    protobuf.util.global.protobuf = protobuf;

    // Be nice to AMD
    if (typeof define === "function" && define.amd)
        define(["long"], function(Long) {
            if (Long && Long.isLong) {
                protobuf.util.Long = Long;
                protobuf.configure();
            }
            return protobuf;
        });

    // Be nice to CommonJS
    if (typeof module === "object" && module && module.exports)
        module.exports = protobuf;

})/* end of prelude */({1:[function(require,module,exports){
"use strict";
module.exports = asPromise;

/**
 * Callback as used by {@link util.asPromise}.
 * @typedef asPromiseCallback
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {...*} params Additional arguments
 * @returns {undefined}
 */

/**
 * Returns a promise from a node-style callback function.
 * @memberof util
 * @param {asPromiseCallback} fn Function to call
 * @param {*} ctx Function context
 * @param {...*} params Function arguments
 * @returns {Promise<*>} Promisified function
 */
function asPromise(fn, ctx/*, varargs */) {
    var params  = new Array(arguments.length - 1),
        offset  = 0,
        index   = 2,
        pending = true;
    while (index < arguments.length)
        params[offset++] = arguments[index++];
    return new Promise(function executor(resolve, reject) {
        params[offset] = function callback(err/*, varargs */) {
            if (pending) {
                pending = false;
                if (err)
                    reject(err);
                else {
                    var params = new Array(arguments.length - 1),
                        offset = 0;
                    while (offset < params.length)
                        params[offset++] = arguments[offset];
                    resolve.apply(null, params);
                }
            }
        };
        try {
            fn.apply(ctx || null, params);
        } catch (err) {
            if (pending) {
                pending = false;
                reject(err);
            }
        }
    });
}

},{}],2:[function(require,module,exports){
"use strict";

/**
 * A minimal base64 implementation for number arrays.
 * @memberof util
 * @namespace
 */
var base64 = exports;

/**
 * Calculates the byte length of a base64 encoded string.
 * @param {string} string Base64 encoded string
 * @returns {number} Byte length
 */
base64.length = function length(string) {
    var p = string.length;
    if (!p)
        return 0;
    var n = 0;
    while (--p % 4 > 1 && string.charAt(p) === "=")
        ++n;
    return Math.ceil(string.length * 3) / 4 - n;
};

// Base64 encoding table
var b64 = new Array(64);

// Base64 decoding table
var s64 = new Array(123);

// 65..90, 97..122, 48..57, 43, 47
for (var i = 0; i < 64;)
    s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;

/**
 * Encodes a buffer to a base64 encoded string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} Base64 encoded string
 */
base64.encode = function encode(buffer, start, end) {
    var parts = null,
        chunk = [];
    var i = 0, // output index
        j = 0, // goto index
        t;     // temporary
    while (start < end) {
        var b = buffer[start++];
        switch (j) {
            case 0:
                chunk[i++] = b64[b >> 2];
                t = (b & 3) << 4;
                j = 1;
                break;
            case 1:
                chunk[i++] = b64[t | b >> 4];
                t = (b & 15) << 2;
                j = 2;
                break;
            case 2:
                chunk[i++] = b64[t | b >> 6];
                chunk[i++] = b64[b & 63];
                j = 0;
                break;
        }
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (j) {
        chunk[i++] = b64[t];
        chunk[i++] = 61;
        if (j === 1)
            chunk[i++] = 61;
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};

var invalidEncoding = "invalid encoding";

/**
 * Decodes a base64 encoded string to a buffer.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Number of bytes written
 * @throws {Error} If encoding is invalid
 */
base64.decode = function decode(string, buffer, offset) {
    var start = offset;
    var j = 0, // goto index
        t;     // temporary
    for (var i = 0; i < string.length;) {
        var c = string.charCodeAt(i++);
        if (c === 61 && j > 1)
            break;
        if ((c = s64[c]) === undefined)
            throw Error(invalidEncoding);
        switch (j) {
            case 0:
                t = c;
                j = 1;
                break;
            case 1:
                buffer[offset++] = t << 2 | (c & 48) >> 4;
                t = c;
                j = 2;
                break;
            case 2:
                buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
                t = c;
                j = 3;
                break;
            case 3:
                buffer[offset++] = (t & 3) << 6 | c;
                j = 0;
                break;
        }
    }
    if (j === 1)
        throw Error(invalidEncoding);
    return offset - start;
};

/**
 * Tests if the specified string appears to be base64 encoded.
 * @param {string} string String to test
 * @returns {boolean} `true` if probably base64 encoded, otherwise false
 */
base64.test = function test(string) {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
};

},{}],3:[function(require,module,exports){
"use strict";
module.exports = EventEmitter;

/**
 * Constructs a new event emitter instance.
 * @classdesc A minimal event emitter.
 * @memberof util
 * @constructor
 */
function EventEmitter() {

    /**
     * Registered listeners.
     * @type {Object.<string,*>}
     * @private
     */
    this._listeners = {};
}

/**
 * Registers an event listener.
 * @param {string} evt Event name
 * @param {function} fn Listener
 * @param {*} [ctx] Listener context
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.on = function on(evt, fn, ctx) {
    (this._listeners[evt] || (this._listeners[evt] = [])).push({
        fn  : fn,
        ctx : ctx || this
    });
    return this;
};

/**
 * Removes an event listener or any matching listeners if arguments are omitted.
 * @param {string} [evt] Event name. Removes all listeners if omitted.
 * @param {function} [fn] Listener to remove. Removes all listeners of `evt` if omitted.
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.off = function off(evt, fn) {
    if (evt === undefined)
        this._listeners = {};
    else {
        if (fn === undefined)
            this._listeners[evt] = [];
        else {
            var listeners = this._listeners[evt];
            for (var i = 0; i < listeners.length;)
                if (listeners[i].fn === fn)
                    listeners.splice(i, 1);
                else
                    ++i;
        }
    }
    return this;
};

/**
 * Emits an event by calling its listeners with the specified arguments.
 * @param {string} evt Event name
 * @param {...*} args Arguments
 * @returns {util.EventEmitter} `this`
 */
EventEmitter.prototype.emit = function emit(evt) {
    var listeners = this._listeners[evt];
    if (listeners) {
        var args = [],
            i = 1;
        for (; i < arguments.length;)
            args.push(arguments[i++]);
        for (i = 0; i < listeners.length;)
            listeners[i].fn.apply(listeners[i++].ctx, args);
    }
    return this;
};

},{}],4:[function(require,module,exports){
"use strict";

module.exports = factory(factory);

/**
 * Reads / writes floats / doubles from / to buffers.
 * @name util.float
 * @namespace
 */

/**
 * Writes a 32 bit float to a buffer using little endian byte order.
 * @name util.float.writeFloatLE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Writes a 32 bit float to a buffer using big endian byte order.
 * @name util.float.writeFloatBE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Reads a 32 bit float from a buffer using little endian byte order.
 * @name util.float.readFloatLE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Reads a 32 bit float from a buffer using big endian byte order.
 * @name util.float.readFloatBE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Writes a 64 bit double to a buffer using little endian byte order.
 * @name util.float.writeDoubleLE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Writes a 64 bit double to a buffer using big endian byte order.
 * @name util.float.writeDoubleBE
 * @function
 * @param {number} val Value to write
 * @param {Uint8Array} buf Target buffer
 * @param {number} pos Target buffer offset
 * @returns {undefined}
 */

/**
 * Reads a 64 bit double from a buffer using little endian byte order.
 * @name util.float.readDoubleLE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

/**
 * Reads a 64 bit double from a buffer using big endian byte order.
 * @name util.float.readDoubleBE
 * @function
 * @param {Uint8Array} buf Source buffer
 * @param {number} pos Source buffer offset
 * @returns {number} Value read
 */

// Factory function for the purpose of node-based testing in modified global environments
function factory(exports) {

    // float: typed array
    if (typeof Float32Array !== "undefined") (function() {

        var f32 = new Float32Array([ -0 ]),
            f8b = new Uint8Array(f32.buffer),
            le  = f8b[3] === 128;

        function writeFloat_f32_cpy(val, buf, pos) {
            f32[0] = val;
            buf[pos    ] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
        }

        function writeFloat_f32_rev(val, buf, pos) {
            f32[0] = val;
            buf[pos    ] = f8b[3];
            buf[pos + 1] = f8b[2];
            buf[pos + 2] = f8b[1];
            buf[pos + 3] = f8b[0];
        }

        /* istanbul ignore next */
        exports.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
        /* istanbul ignore next */
        exports.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;

        function readFloat_f32_cpy(buf, pos) {
            f8b[0] = buf[pos    ];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            return f32[0];
        }

        function readFloat_f32_rev(buf, pos) {
            f8b[3] = buf[pos    ];
            f8b[2] = buf[pos + 1];
            f8b[1] = buf[pos + 2];
            f8b[0] = buf[pos + 3];
            return f32[0];
        }

        /* istanbul ignore next */
        exports.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
        /* istanbul ignore next */
        exports.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;

    // float: ieee754
    })(); else (function() {

        function writeFloat_ieee754(writeUint, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
                val = -val;
            if (val === 0)
                writeUint(1 / val > 0 ? /* positive */ 0 : /* negative 0 */ 2147483648, buf, pos);
            else if (isNaN(val))
                writeUint(2143289344, buf, pos);
            else if (val > 3.4028234663852886e+38) // +-Infinity
                writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
            else if (val < 1.1754943508222875e-38) // denormal
                writeUint((sign << 31 | Math.round(val / 1.401298464324817e-45)) >>> 0, buf, pos);
            else {
                var exponent = Math.floor(Math.log(val) / Math.LN2),
                    mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
                writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
            }
        }

        exports.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
        exports.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);

        function readFloat_ieee754(readUint, buf, pos) {
            var uint = readUint(buf, pos),
                sign = (uint >> 31) * 2 + 1,
                exponent = uint >>> 23 & 255,
                mantissa = uint & 8388607;
            return exponent === 255
                ? mantissa
                ? NaN
                : sign * Infinity
                : exponent === 0 // denormal
                ? sign * 1.401298464324817e-45 * mantissa
                : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
        }

        exports.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
        exports.readFloatBE = readFloat_ieee754.bind(null, readUintBE);

    })();

    // double: typed array
    if (typeof Float64Array !== "undefined") (function() {

        var f64 = new Float64Array([-0]),
            f8b = new Uint8Array(f64.buffer),
            le  = f8b[7] === 128;

        function writeDouble_f64_cpy(val, buf, pos) {
            f64[0] = val;
            buf[pos    ] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
            buf[pos + 4] = f8b[4];
            buf[pos + 5] = f8b[5];
            buf[pos + 6] = f8b[6];
            buf[pos + 7] = f8b[7];
        }

        function writeDouble_f64_rev(val, buf, pos) {
            f64[0] = val;
            buf[pos    ] = f8b[7];
            buf[pos + 1] = f8b[6];
            buf[pos + 2] = f8b[5];
            buf[pos + 3] = f8b[4];
            buf[pos + 4] = f8b[3];
            buf[pos + 5] = f8b[2];
            buf[pos + 6] = f8b[1];
            buf[pos + 7] = f8b[0];
        }

        /* istanbul ignore next */
        exports.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
        /* istanbul ignore next */
        exports.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;

        function readDouble_f64_cpy(buf, pos) {
            f8b[0] = buf[pos    ];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            f8b[4] = buf[pos + 4];
            f8b[5] = buf[pos + 5];
            f8b[6] = buf[pos + 6];
            f8b[7] = buf[pos + 7];
            return f64[0];
        }

        function readDouble_f64_rev(buf, pos) {
            f8b[7] = buf[pos    ];
            f8b[6] = buf[pos + 1];
            f8b[5] = buf[pos + 2];
            f8b[4] = buf[pos + 3];
            f8b[3] = buf[pos + 4];
            f8b[2] = buf[pos + 5];
            f8b[1] = buf[pos + 6];
            f8b[0] = buf[pos + 7];
            return f64[0];
        }

        /* istanbul ignore next */
        exports.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
        /* istanbul ignore next */
        exports.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;

    // double: ieee754
    })(); else (function() {

        function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
                val = -val;
            if (val === 0) {
                writeUint(0, buf, pos + off0);
                writeUint(1 / val > 0 ? /* positive */ 0 : /* negative 0 */ 2147483648, buf, pos + off1);
            } else if (isNaN(val)) {
                writeUint(0, buf, pos + off0);
                writeUint(2146959360, buf, pos + off1);
            } else if (val > 1.7976931348623157e+308) { // +-Infinity
                writeUint(0, buf, pos + off0);
                writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
            } else {
                var mantissa;
                if (val < 2.2250738585072014e-308) { // denormal
                    mantissa = val / 5e-324;
                    writeUint(mantissa >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
                } else {
                    var exponent = Math.floor(Math.log(val) / Math.LN2);
                    if (exponent === 1024)
                        exponent = 1023;
                    mantissa = val * Math.pow(2, -exponent);
                    writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
                    writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
                }
            }
        }

        exports.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
        exports.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);

        function readDouble_ieee754(readUint, off0, off1, buf, pos) {
            var lo = readUint(buf, pos + off0),
                hi = readUint(buf, pos + off1);
            var sign = (hi >> 31) * 2 + 1,
                exponent = hi >>> 20 & 2047,
                mantissa = 4294967296 * (hi & 1048575) + lo;
            return exponent === 2047
                ? mantissa
                ? NaN
                : sign * Infinity
                : exponent === 0 // denormal
                ? sign * 5e-324 * mantissa
                : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
        }

        exports.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
        exports.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);

    })();

    return exports;
}

// uint helpers

function writeUintLE(val, buf, pos) {
    buf[pos    ] =  val        & 255;
    buf[pos + 1] =  val >>> 8  & 255;
    buf[pos + 2] =  val >>> 16 & 255;
    buf[pos + 3] =  val >>> 24;
}

function writeUintBE(val, buf, pos) {
    buf[pos    ] =  val >>> 24;
    buf[pos + 1] =  val >>> 16 & 255;
    buf[pos + 2] =  val >>> 8  & 255;
    buf[pos + 3] =  val        & 255;
}

function readUintLE(buf, pos) {
    return (buf[pos    ]
          | buf[pos + 1] << 8
          | buf[pos + 2] << 16
          | buf[pos + 3] << 24) >>> 0;
}

function readUintBE(buf, pos) {
    return (buf[pos    ] << 24
          | buf[pos + 1] << 16
          | buf[pos + 2] << 8
          | buf[pos + 3]) >>> 0;
}

},{}],5:[function(require,module,exports){
"use strict";
module.exports = inquire;

/**
 * Requires a module only if available.
 * @memberof util
 * @param {string} moduleName Module to require
 * @returns {?Object} Required module if available and not empty, otherwise `null`
 */
function inquire(moduleName) {
    try {
        var mod = require(moduleName); // eslint-disable-line no-eval
        if (mod && (mod.length || Object.keys(mod).length))
            return mod;
    } catch (e) {} // eslint-disable-line no-empty
    return null;
}

},{}],6:[function(require,module,exports){
"use strict";
module.exports = pool;

/**
 * An allocator as used by {@link util.pool}.
 * @typedef PoolAllocator
 * @type {function}
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */

/**
 * A slicer as used by {@link util.pool}.
 * @typedef PoolSlicer
 * @type {function}
 * @param {number} start Start offset
 * @param {number} end End offset
 * @returns {Uint8Array} Buffer slice
 * @this {Uint8Array}
 */

/**
 * A general purpose buffer pool.
 * @memberof util
 * @function
 * @param {PoolAllocator} alloc Allocator
 * @param {PoolSlicer} slice Slicer
 * @param {number} [size=8192] Slab size
 * @returns {PoolAllocator} Pooled allocator
 */
function pool(alloc, slice, size) {
    var SIZE   = size || 8192;
    var MAX    = SIZE >>> 1;
    var slab   = null;
    var offset = SIZE;
    return function pool_alloc(size) {
        if (size < 1 || size > MAX)
            return alloc(size);
        if (offset + size > SIZE) {
            slab = alloc(SIZE);
            offset = 0;
        }
        var buf = slice.call(slab, offset, offset += size);
        if (offset & 7) // align to 32 bit
            offset = (offset | 7) + 1;
        return buf;
    };
}

},{}],7:[function(require,module,exports){
"use strict";

/**
 * A minimal UTF8 implementation for number arrays.
 * @memberof util
 * @namespace
 */
var utf8 = exports;

/**
 * Calculates the UTF8 byte length of a string.
 * @param {string} string String
 * @returns {number} Byte length
 */
utf8.length = function utf8_length(string) {
    var len = 0,
        c = 0;
    for (var i = 0; i < string.length; ++i) {
        c = string.charCodeAt(i);
        if (c < 128)
            len += 1;
        else if (c < 2048)
            len += 2;
        else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
            ++i;
            len += 4;
        } else
            len += 3;
    }
    return len;
};

/**
 * Reads UTF8 bytes as a string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
utf8.read = function utf8_read(buffer, start, end) {
    var len = end - start;
    if (len < 1)
        return "";
    var parts = null,
        chunk = [],
        i = 0, // char offset
        t;     // temporary
    while (start < end) {
        t = buffer[start++];
        if (t < 128)
            chunk[i++] = t;
        else if (t > 191 && t < 224)
            chunk[i++] = (t & 31) << 6 | buffer[start++] & 63;
        else if (t > 239 && t < 365) {
            t = ((t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 0x10000;
            chunk[i++] = 0xD800 + (t >> 10);
            chunk[i++] = 0xDC00 + (t & 1023);
        } else
            chunk[i++] = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};

/**
 * Writes a string as UTF8 bytes.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
utf8.write = function utf8_write(string, buffer, offset) {
    var start = offset,
        c1, // character 1
        c2; // character 2
    for (var i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
            buffer[offset++] = c1;
        } else if (c1 < 2048) {
            buffer[offset++] = c1 >> 6       | 192;
            buffer[offset++] = c1       & 63 | 128;
        } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
            c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
            ++i;
            buffer[offset++] = c1 >> 18      | 240;
            buffer[offset++] = c1 >> 12 & 63 | 128;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        } else {
            buffer[offset++] = c1 >> 12      | 224;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        }
    }
    return offset - start;
};

},{}],8:[function(require,module,exports){
"use strict";
var protobuf = exports;

/**
 * Build type, one of `"full"`, `"light"` or `"minimal"`.
 * @name build
 * @type {string}
 * @const
 */
protobuf.build = "minimal";

// Serialization
protobuf.Writer       = require(16);
protobuf.BufferWriter = require(17);
protobuf.Reader       = require(9);
protobuf.BufferReader = require(10);

// Utility
protobuf.util         = require(15);
protobuf.rpc          = require(12);
protobuf.roots        = require(11);
protobuf.configure    = configure;

/* istanbul ignore next */
/**
 * Reconfigures the library according to the environment.
 * @returns {undefined}
 */
function configure() {
    protobuf.util._configure();
    protobuf.Writer._configure(protobuf.BufferWriter);
    protobuf.Reader._configure(protobuf.BufferReader);
}

// Set up buffer utility according to the environment
configure();

},{"10":10,"11":11,"12":12,"15":15,"16":16,"17":17,"9":9}],9:[function(require,module,exports){
"use strict";
module.exports = Reader;

var util      = require(15);

var BufferReader; // cyclic

var LongBits  = util.LongBits,
    utf8      = util.utf8;

/* istanbul ignore next */
function indexOutOfRange(reader, writeLength) {
    return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
}

/**
 * Constructs a new reader instance using the specified buffer.
 * @classdesc Wire format reader using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 * @param {Uint8Array} buffer Buffer to read from
 */
function Reader(buffer) {

    /**
     * Read buffer.
     * @type {Uint8Array}
     */
    this.buf = buffer;

    /**
     * Read buffer position.
     * @type {number}
     */
    this.pos = 0;

    /**
     * Read buffer length.
     * @type {number}
     */
    this.len = buffer.length;
}

var create_array = typeof Uint8Array !== "undefined"
    ? function create_typed_array(buffer) {
        if (buffer instanceof Uint8Array || Array.isArray(buffer))
            return new Reader(buffer);
        throw Error("illegal buffer");
    }
    /* istanbul ignore next */
    : function create_array(buffer) {
        if (Array.isArray(buffer))
            return new Reader(buffer);
        throw Error("illegal buffer");
    };

var create = function create() {
    return util.Buffer
        ? function create_buffer_setup(buffer) {
            return (Reader.create = function create_buffer(buffer) {
                return util.Buffer.isBuffer(buffer)
                    ? new BufferReader(buffer)
                    /* istanbul ignore next */
                    : create_array(buffer);
            })(buffer);
        }
        /* istanbul ignore next */
        : create_array;
};

/**
 * Creates a new reader using the specified buffer.
 * @function
 * @param {Uint8Array|Buffer} buffer Buffer to read from
 * @returns {Reader|BufferReader} A {@link BufferReader} if `buffer` is a Buffer, otherwise a {@link Reader}
 * @throws {Error} If `buffer` is not a valid buffer
 */
Reader.create = create();

Reader.prototype._slice = util.Array.prototype.subarray || /* istanbul ignore next */ util.Array.prototype.slice;

/**
 * Reads a varint as an unsigned 32 bit value.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.uint32 = (function read_uint32_setup() {
    var value = 4294967295; // optimizer type-hint, tends to deopt otherwise (?!)
    return function read_uint32() {
        value = (         this.buf[this.pos] & 127       ) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) <<  7) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 14) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] & 127) << 21) >>> 0; if (this.buf[this.pos++] < 128) return value;
        value = (value | (this.buf[this.pos] &  15) << 28) >>> 0; if (this.buf[this.pos++] < 128) return value;

        /* istanbul ignore if */
        if ((this.pos += 5) > this.len) {
            this.pos = this.len;
            throw indexOutOfRange(this, 10);
        }
        return value;
    };
})();

/**
 * Reads a varint as a signed 32 bit value.
 * @returns {number} Value read
 */
Reader.prototype.int32 = function read_int32() {
    return this.uint32() | 0;
};

/**
 * Reads a zig-zag encoded varint as a signed 32 bit value.
 * @returns {number} Value read
 */
Reader.prototype.sint32 = function read_sint32() {
    var value = this.uint32();
    return value >>> 1 ^ -(value & 1) | 0;
};

/* eslint-disable no-invalid-this */

function readLongVarint() {
    // tends to deopt with local vars for octet etc.
    var bits = new LongBits(0, 0);
    var i = 0;
    if (this.len - this.pos > 4) { // fast route (lo)
        for (; i < 4; ++i) {
            // 1st..4th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        // 5th
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) >>  4) >>> 0;
        if (this.buf[this.pos++] < 128)
            return bits;
        i = 0;
    } else {
        for (; i < 3; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            // 1st..3th
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
        // 4th
        bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
        return bits;
    }
    if (this.len - this.pos > 4) { // fast route (hi)
        for (; i < 5; ++i) {
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    } else {
        for (; i < 5; ++i) {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
            // 6th..10th
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
                return bits;
        }
    }
    /* istanbul ignore next */
    throw Error("invalid varint encoding");
}

/* eslint-enable no-invalid-this */

/**
 * Reads a varint as a signed 64 bit value.
 * @name Reader#int64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as an unsigned 64 bit value.
 * @name Reader#uint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a zig-zag encoded varint as a signed 64 bit value.
 * @name Reader#sint64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a varint as a boolean.
 * @returns {boolean} Value read
 */
Reader.prototype.bool = function read_bool() {
    return this.uint32() !== 0;
};

function readFixed32_end(buf, end) { // note that this uses `end`, not `pos`
    return (buf[end - 4]
          | buf[end - 3] << 8
          | buf[end - 2] << 16
          | buf[end - 1] << 24) >>> 0;
}

/**
 * Reads fixed 32 bits as an unsigned 32 bit integer.
 * @returns {number} Value read
 */
Reader.prototype.fixed32 = function read_fixed32() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    return readFixed32_end(this.buf, this.pos += 4);
};

/**
 * Reads fixed 32 bits as a signed 32 bit integer.
 * @returns {number} Value read
 */
Reader.prototype.sfixed32 = function read_sfixed32() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    return readFixed32_end(this.buf, this.pos += 4) | 0;
};

/* eslint-disable no-invalid-this */

function readFixed64(/* this: Reader */) {

    /* istanbul ignore if */
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 8);

    return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
}

/* eslint-enable no-invalid-this */

/**
 * Reads fixed 64 bits.
 * @name Reader#fixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads zig-zag encoded fixed 64 bits.
 * @name Reader#sfixed64
 * @function
 * @returns {Long} Value read
 */

/**
 * Reads a float (32 bit) as a number.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.float = function read_float() {

    /* istanbul ignore if */
    if (this.pos + 4 > this.len)
        throw indexOutOfRange(this, 4);

    var value = util.float.readFloatLE(this.buf, this.pos);
    this.pos += 4;
    return value;
};

/**
 * Reads a double (64 bit float) as a number.
 * @function
 * @returns {number} Value read
 */
Reader.prototype.double = function read_double() {

    /* istanbul ignore if */
    if (this.pos + 8 > this.len)
        throw indexOutOfRange(this, 4);

    var value = util.float.readDoubleLE(this.buf, this.pos);
    this.pos += 8;
    return value;
};

/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @returns {Uint8Array} Value read
 */
Reader.prototype.bytes = function read_bytes() {
    var length = this.uint32(),
        start  = this.pos,
        end    = this.pos + length;

    /* istanbul ignore if */
    if (end > this.len)
        throw indexOutOfRange(this, length);

    this.pos += length;
    if (Array.isArray(this.buf)) // plain array
        return this.buf.slice(start, end);
    return start === end // fix for IE 10/Win8 and others' subarray returning array of size 1
        ? new this.buf.constructor(0)
        : this._slice.call(this.buf, start, end);
};

/**
 * Reads a string preceeded by its byte length as a varint.
 * @returns {string} Value read
 */
Reader.prototype.string = function read_string() {
    var bytes = this.bytes();
    return utf8.read(bytes, 0, bytes.length);
};

/**
 * Skips the specified number of bytes if specified, otherwise skips a varint.
 * @param {number} [length] Length if known, otherwise a varint is assumed
 * @returns {Reader} `this`
 */
Reader.prototype.skip = function skip(length) {
    if (typeof length === "number") {
        /* istanbul ignore if */
        if (this.pos + length > this.len)
            throw indexOutOfRange(this, length);
        this.pos += length;
    } else {
        do {
            /* istanbul ignore if */
            if (this.pos >= this.len)
                throw indexOutOfRange(this);
        } while (this.buf[this.pos++] & 128);
    }
    return this;
};

/**
 * Skips the next element of the specified wire type.
 * @param {number} wireType Wire type received
 * @returns {Reader} `this`
 */
Reader.prototype.skipType = function(wireType) {
    switch (wireType) {
        case 0:
            this.skip();
            break;
        case 1:
            this.skip(8);
            break;
        case 2:
            this.skip(this.uint32());
            break;
        case 3:
            while ((wireType = this.uint32() & 7) !== 4) {
                this.skipType(wireType);
            }
            break;
        case 5:
            this.skip(4);
            break;

        /* istanbul ignore next */
        default:
            throw Error("invalid wire type " + wireType + " at offset " + this.pos);
    }
    return this;
};

Reader._configure = function(BufferReader_) {
    BufferReader = BufferReader_;
    Reader.create = create();
    BufferReader._configure();

    var fn = util.Long ? "toLong" : /* istanbul ignore next */ "toNumber";
    util.merge(Reader.prototype, {

        int64: function read_int64() {
            return readLongVarint.call(this)[fn](false);
        },

        uint64: function read_uint64() {
            return readLongVarint.call(this)[fn](true);
        },

        sint64: function read_sint64() {
            return readLongVarint.call(this).zzDecode()[fn](false);
        },

        fixed64: function read_fixed64() {
            return readFixed64.call(this)[fn](true);
        },

        sfixed64: function read_sfixed64() {
            return readFixed64.call(this)[fn](false);
        }

    });
};

},{"15":15}],10:[function(require,module,exports){
"use strict";
module.exports = BufferReader;

// extends Reader
var Reader = require(9);
(BufferReader.prototype = Object.create(Reader.prototype)).constructor = BufferReader;

var util = require(15);

/**
 * Constructs a new buffer reader instance.
 * @classdesc Wire format reader using node buffers.
 * @extends Reader
 * @constructor
 * @param {Buffer} buffer Buffer to read from
 */
function BufferReader(buffer) {
    Reader.call(this, buffer);

    /**
     * Read buffer.
     * @name BufferReader#buf
     * @type {Buffer}
     */
}

BufferReader._configure = function () {
    /* istanbul ignore else */
    if (util.Buffer)
        BufferReader.prototype._slice = util.Buffer.prototype.slice;
};


/**
 * @override
 */
BufferReader.prototype.string = function read_string_buffer() {
    var len = this.uint32(); // modifies pos
    return this.buf.utf8Slice
        ? this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len))
        : this.buf.toString("utf-8", this.pos, this.pos = Math.min(this.pos + len, this.len));
};

/**
 * Reads a sequence of bytes preceeded by its length as a varint.
 * @name BufferReader#bytes
 * @function
 * @returns {Buffer} Value read
 */

BufferReader._configure();

},{"15":15,"9":9}],11:[function(require,module,exports){
"use strict";
module.exports = {};

/**
 * Named roots.
 * This is where pbjs stores generated structures (the option `-r, --root` specifies a name).
 * Can also be used manually to make roots available accross modules.
 * @name roots
 * @type {Object.<string,Root>}
 * @example
 * // pbjs -r myroot -o compiled.js ...
 *
 * // in another module:
 * require("./compiled.js");
 *
 * // in any subsequent module:
 * var root = protobuf.roots["myroot"];
 */

},{}],12:[function(require,module,exports){
"use strict";

/**
 * Streaming RPC helpers.
 * @namespace
 */
var rpc = exports;

/**
 * RPC implementation passed to {@link Service#create} performing a service request on network level, i.e. by utilizing http requests or websockets.
 * @typedef RPCImpl
 * @type {function}
 * @param {Method|rpc.ServiceMethod<Message<{}>,Message<{}>>} method Reflected or static method being called
 * @param {Uint8Array} requestData Request data
 * @param {RPCImplCallback} callback Callback function
 * @returns {undefined}
 * @example
 * function rpcImpl(method, requestData, callback) {
 *     if (protobuf.util.lcFirst(method.name) !== "myMethod") // compatible with static code
 *         throw Error("no such method");
 *     asynchronouslyObtainAResponse(requestData, function(err, responseData) {
 *         callback(err, responseData);
 *     });
 * }
 */

/**
 * Node-style callback as used by {@link RPCImpl}.
 * @typedef RPCImplCallback
 * @type {function}
 * @param {Error|null} error Error, if any, otherwise `null`
 * @param {Uint8Array|null} [response] Response data or `null` to signal end of stream, if there hasn't been an error
 * @returns {undefined}
 */

rpc.Service = require(13);

},{"13":13}],13:[function(require,module,exports){
"use strict";
module.exports = Service;

var util = require(15);

// Extends EventEmitter
(Service.prototype = Object.create(util.EventEmitter.prototype)).constructor = Service;

/**
 * A service method callback as used by {@link rpc.ServiceMethod|ServiceMethod}.
 *
 * Differs from {@link RPCImplCallback} in that it is an actual callback of a service method which may not return `response = null`.
 * @typedef rpc.ServiceMethodCallback
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {Error|null} error Error, if any
 * @param {TRes} [response] Response message
 * @returns {undefined}
 */

/**
 * A service method part of a {@link rpc.Service} as created by {@link Service.create}.
 * @typedef rpc.ServiceMethod
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 * @type {function}
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} [callback] Node-style callback called with the error, if any, and the response message
 * @returns {Promise<Message<TRes>>} Promise if `callback` has been omitted, otherwise `undefined`
 */

/**
 * Constructs a new RPC service instance.
 * @classdesc An RPC service as returned by {@link Service#create}.
 * @exports rpc.Service
 * @extends util.EventEmitter
 * @constructor
 * @param {RPCImpl} rpcImpl RPC implementation
 * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
 * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
 */
function Service(rpcImpl, requestDelimited, responseDelimited) {

    if (typeof rpcImpl !== "function")
        throw TypeError("rpcImpl must be a function");

    util.EventEmitter.call(this);

    /**
     * RPC implementation. Becomes `null` once the service is ended.
     * @type {RPCImpl|null}
     */
    this.rpcImpl = rpcImpl;

    /**
     * Whether requests are length-delimited.
     * @type {boolean}
     */
    this.requestDelimited = Boolean(requestDelimited);

    /**
     * Whether responses are length-delimited.
     * @type {boolean}
     */
    this.responseDelimited = Boolean(responseDelimited);
}

/**
 * Calls a service method through {@link rpc.Service#rpcImpl|rpcImpl}.
 * @param {Method|rpc.ServiceMethod<TReq,TRes>} method Reflected or static method
 * @param {Constructor<TReq>} requestCtor Request constructor
 * @param {Constructor<TRes>} responseCtor Response constructor
 * @param {TReq|Properties<TReq>} request Request message or plain object
 * @param {rpc.ServiceMethodCallback<TRes>} callback Service callback
 * @returns {undefined}
 * @template TReq extends Message<TReq>
 * @template TRes extends Message<TRes>
 */
Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {

    if (!request)
        throw TypeError("request must be specified");

    var self = this;
    if (!callback)
        return util.asPromise(rpcCall, self, method, requestCtor, responseCtor, request);

    if (!self.rpcImpl) {
        setTimeout(function() { callback(Error("already ended")); }, 0);
        return undefined;
    }

    try {
        return self.rpcImpl(
            method,
            requestCtor[self.requestDelimited ? "encodeDelimited" : "encode"](request).finish(),
            function rpcCallback(err, response) {

                if (err) {
                    self.emit("error", err, method);
                    return callback(err);
                }

                if (response === null) {
                    self.end(/* endedByRPC */ true);
                    return undefined;
                }

                if (!(response instanceof responseCtor)) {
                    try {
                        response = responseCtor[self.responseDelimited ? "decodeDelimited" : "decode"](response);
                    } catch (err) {
                        self.emit("error", err, method);
                        return callback(err);
                    }
                }

                self.emit("data", response, method);
                return callback(null, response);
            }
        );
    } catch (err) {
        self.emit("error", err, method);
        setTimeout(function() { callback(err); }, 0);
        return undefined;
    }
};

/**
 * Ends this service and emits the `end` event.
 * @param {boolean} [endedByRPC=false] Whether the service has been ended by the RPC implementation.
 * @returns {rpc.Service} `this`
 */
Service.prototype.end = function end(endedByRPC) {
    if (this.rpcImpl) {
        if (!endedByRPC) // signal end to rpcImpl
            this.rpcImpl(null, null, null);
        this.rpcImpl = null;
        this.emit("end").off();
    }
    return this;
};

},{"15":15}],14:[function(require,module,exports){
"use strict";
module.exports = LongBits;

var util = require(15);

/**
 * Constructs new long bits.
 * @classdesc Helper class for working with the low and high bits of a 64 bit value.
 * @memberof util
 * @constructor
 * @param {number} lo Low 32 bits, unsigned
 * @param {number} hi High 32 bits, unsigned
 */
function LongBits(lo, hi) {

    // note that the casts below are theoretically unnecessary as of today, but older statically
    // generated converter code might still call the ctor with signed 32bits. kept for compat.

    /**
     * Low bits.
     * @type {number}
     */
    this.lo = lo >>> 0;

    /**
     * High bits.
     * @type {number}
     */
    this.hi = hi >>> 0;
}

/**
 * Zero bits.
 * @memberof util.LongBits
 * @type {util.LongBits}
 */
var zero = LongBits.zero = new LongBits(0, 0);

zero.toNumber = function() { return 0; };
zero.zzEncode = zero.zzDecode = function() { return this; };
zero.length = function() { return 1; };

/**
 * Zero hash.
 * @memberof util.LongBits
 * @type {string}
 */
var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";

/**
 * Constructs new long bits from the specified number.
 * @param {number} value Value
 * @returns {util.LongBits} Instance
 */
LongBits.fromNumber = function fromNumber(value) {
    if (value === 0)
        return zero;
    var sign = value < 0;
    if (sign)
        value = -value;
    var lo = value >>> 0,
        hi = (value - lo) / 4294967296 >>> 0;
    if (sign) {
        hi = ~hi >>> 0;
        lo = ~lo >>> 0;
        if (++lo > 4294967295) {
            lo = 0;
            if (++hi > 4294967295)
                hi = 0;
        }
    }
    return new LongBits(lo, hi);
};

/**
 * Constructs new long bits from a number, long or string.
 * @param {Long|number|string} value Value
 * @returns {util.LongBits} Instance
 */
LongBits.from = function from(value) {
    if (typeof value === "number")
        return LongBits.fromNumber(value);
    if (util.isString(value)) {
        /* istanbul ignore else */
        if (util.Long)
            value = util.Long.fromString(value);
        else
            return LongBits.fromNumber(parseInt(value, 10));
    }
    return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
};

/**
 * Converts this long bits to a possibly unsafe JavaScript number.
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {number} Possibly unsafe number
 */
LongBits.prototype.toNumber = function toNumber(unsigned) {
    if (!unsigned && this.hi >>> 31) {
        var lo = ~this.lo + 1 >>> 0,
            hi = ~this.hi     >>> 0;
        if (!lo)
            hi = hi + 1 >>> 0;
        return -(lo + hi * 4294967296);
    }
    return this.lo + this.hi * 4294967296;
};

/**
 * Converts this long bits to a long.
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {Long} Long
 */
LongBits.prototype.toLong = function toLong(unsigned) {
    return util.Long
        ? new util.Long(this.lo | 0, this.hi | 0, Boolean(unsigned))
        /* istanbul ignore next */
        : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
};

var charCodeAt = String.prototype.charCodeAt;

/**
 * Constructs new long bits from the specified 8 characters long hash.
 * @param {string} hash Hash
 * @returns {util.LongBits} Bits
 */
LongBits.fromHash = function fromHash(hash) {
    if (hash === zeroHash)
        return zero;
    return new LongBits(
        ( charCodeAt.call(hash, 0)
        | charCodeAt.call(hash, 1) << 8
        | charCodeAt.call(hash, 2) << 16
        | charCodeAt.call(hash, 3) << 24) >>> 0
    ,
        ( charCodeAt.call(hash, 4)
        | charCodeAt.call(hash, 5) << 8
        | charCodeAt.call(hash, 6) << 16
        | charCodeAt.call(hash, 7) << 24) >>> 0
    );
};

/**
 * Converts this long bits to a 8 characters long hash.
 * @returns {string} Hash
 */
LongBits.prototype.toHash = function toHash() {
    return String.fromCharCode(
        this.lo        & 255,
        this.lo >>> 8  & 255,
        this.lo >>> 16 & 255,
        this.lo >>> 24      ,
        this.hi        & 255,
        this.hi >>> 8  & 255,
        this.hi >>> 16 & 255,
        this.hi >>> 24
    );
};

/**
 * Zig-zag encodes this long bits.
 * @returns {util.LongBits} `this`
 */
LongBits.prototype.zzEncode = function zzEncode() {
    var mask =   this.hi >> 31;
    this.hi  = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
    this.lo  = ( this.lo << 1                   ^ mask) >>> 0;
    return this;
};

/**
 * Zig-zag decodes this long bits.
 * @returns {util.LongBits} `this`
 */
LongBits.prototype.zzDecode = function zzDecode() {
    var mask = -(this.lo & 1);
    this.lo  = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
    this.hi  = ( this.hi >>> 1                  ^ mask) >>> 0;
    return this;
};

/**
 * Calculates the length of this longbits when encoded as a varint.
 * @returns {number} Length
 */
LongBits.prototype.length = function length() {
    var part0 =  this.lo,
        part1 = (this.lo >>> 28 | this.hi << 4) >>> 0,
        part2 =  this.hi >>> 24;
    return part2 === 0
         ? part1 === 0
           ? part0 < 16384
             ? part0 < 128 ? 1 : 2
             : part0 < 2097152 ? 3 : 4
           : part1 < 16384
             ? part1 < 128 ? 5 : 6
             : part1 < 2097152 ? 7 : 8
         : part2 < 128 ? 9 : 10;
};

},{"15":15}],15:[function(require,module,exports){
"use strict";
var util = exports;

// used to return a Promise where callback is omitted
util.asPromise = require(1);

// converts to / from base64 encoded strings
util.base64 = require(2);

// base class of rpc.Service
util.EventEmitter = require(3);

// float handling accross browsers
util.float = require(4);

// requires modules optionally and hides the call from bundlers
util.inquire = require(5);

// converts to / from utf8 encoded strings
util.utf8 = require(7);

// provides a node-like buffer pool in the browser
util.pool = require(6);

// utility to work with the low and high bits of a 64 bit value
util.LongBits = require(14);

/**
 * Whether running within node or not.
 * @memberof util
 * @type {boolean}
 */
util.isNode = Boolean(typeof global !== "undefined"
                   && global
                   && global.process
                   && global.process.versions
                   && global.process.versions.node);

/**
 * Global object reference.
 * @memberof util
 * @type {Object}
 */
util.global = util.isNode && global
           || typeof window !== "undefined" && window
           || typeof self   !== "undefined" && self
           || this; // eslint-disable-line no-invalid-this

/**
 * An immuable empty array.
 * @memberof util
 * @type {Array.<*>}
 * @const
 */
util.emptyArray = Object.freeze ? Object.freeze([]) : /* istanbul ignore next */ []; // used on prototypes

/**
 * An immutable empty object.
 * @type {Object}
 * @const
 */
util.emptyObject = Object.freeze ? Object.freeze({}) : /* istanbul ignore next */ {}; // used on prototypes

/**
 * Tests if the specified value is an integer.
 * @function
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is an integer
 */
util.isInteger = Number.isInteger || /* istanbul ignore next */ function isInteger(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
};

/**
 * Tests if the specified value is a string.
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is a string
 */
util.isString = function isString(value) {
    return typeof value === "string" || value instanceof String;
};

/**
 * Tests if the specified value is a non-null object.
 * @param {*} value Value to test
 * @returns {boolean} `true` if the value is a non-null object
 */
util.isObject = function isObject(value) {
    return value && typeof value === "object";
};

/**
 * Checks if a property on a message is considered to be present.
 * This is an alias of {@link util.isSet}.
 * @function
 * @param {Object} obj Plain object or message instance
 * @param {string} prop Property name
 * @returns {boolean} `true` if considered to be present, otherwise `false`
 */
util.isset =

/**
 * Checks if a property on a message is considered to be present.
 * @param {Object} obj Plain object or message instance
 * @param {string} prop Property name
 * @returns {boolean} `true` if considered to be present, otherwise `false`
 */
util.isSet = function isSet(obj, prop) {
    var value = obj[prop];
    if (value != null && obj.hasOwnProperty(prop)) // eslint-disable-line eqeqeq, no-prototype-builtins
        return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
    return false;
};

/**
 * Any compatible Buffer instance.
 * This is a minimal stand-alone definition of a Buffer instance. The actual type is that exported by node's typings.
 * @interface Buffer
 * @extends Uint8Array
 */

/**
 * Node's Buffer class if available.
 * @type {Constructor<Buffer>}
 */
util.Buffer = (function() {
    try {
        var Buffer = util.inquire("buffer").Buffer;
        // refuse to use non-node buffers if not explicitly assigned (perf reasons):
        return Buffer.prototype.utf8Write ? Buffer : /* istanbul ignore next */ null;
    } catch (e) {
        /* istanbul ignore next */
        return null;
    }
})();

// Internal alias of or polyfull for Buffer.from.
util._Buffer_from = null;

// Internal alias of or polyfill for Buffer.allocUnsafe.
util._Buffer_allocUnsafe = null;

/**
 * Creates a new buffer of whatever type supported by the environment.
 * @param {number|number[]} [sizeOrArray=0] Buffer size or number array
 * @returns {Uint8Array|Buffer} Buffer
 */
util.newBuffer = function newBuffer(sizeOrArray) {
    /* istanbul ignore next */
    return typeof sizeOrArray === "number"
        ? util.Buffer
            ? util._Buffer_allocUnsafe(sizeOrArray)
            : new util.Array(sizeOrArray)
        : util.Buffer
            ? util._Buffer_from(sizeOrArray)
            : typeof Uint8Array === "undefined"
                ? sizeOrArray
                : new Uint8Array(sizeOrArray);
};

/**
 * Array implementation used in the browser. `Uint8Array` if supported, otherwise `Array`.
 * @type {Constructor<Uint8Array>}
 */
util.Array = typeof Uint8Array !== "undefined" ? Uint8Array /* istanbul ignore next */ : Array;

/**
 * Any compatible Long instance.
 * This is a minimal stand-alone definition of a Long instance. The actual type is that exported by long.js.
 * @interface Long
 * @property {number} low Low bits
 * @property {number} high High bits
 * @property {boolean} unsigned Whether unsigned or not
 */

/**
 * Long.js's Long class if available.
 * @type {Constructor<Long>}
 */
util.Long = /* istanbul ignore next */ util.global.dcodeIO && /* istanbul ignore next */ util.global.dcodeIO.Long
         || /* istanbul ignore next */ util.global.Long
         || util.inquire("long");

/**
 * Regular expression used to verify 2 bit (`bool`) map keys.
 * @type {RegExp}
 * @const
 */
util.key2Re = /^true|false|0|1$/;

/**
 * Regular expression used to verify 32 bit (`int32` etc.) map keys.
 * @type {RegExp}
 * @const
 */
util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;

/**
 * Regular expression used to verify 64 bit (`int64` etc.) map keys.
 * @type {RegExp}
 * @const
 */
util.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;

/**
 * Converts a number or long to an 8 characters long hash string.
 * @param {Long|number} value Value to convert
 * @returns {string} Hash
 */
util.longToHash = function longToHash(value) {
    return value
        ? util.LongBits.from(value).toHash()
        : util.LongBits.zeroHash;
};

/**
 * Converts an 8 characters long hash string to a long or number.
 * @param {string} hash Hash
 * @param {boolean} [unsigned=false] Whether unsigned or not
 * @returns {Long|number} Original value
 */
util.longFromHash = function longFromHash(hash, unsigned) {
    var bits = util.LongBits.fromHash(hash);
    if (util.Long)
        return util.Long.fromBits(bits.lo, bits.hi, unsigned);
    return bits.toNumber(Boolean(unsigned));
};

/**
 * Merges the properties of the source object into the destination object.
 * @memberof util
 * @param {Object.<string,*>} dst Destination object
 * @param {Object.<string,*>} src Source object
 * @param {boolean} [ifNotSet=false] Merges only if the key is not already set
 * @returns {Object.<string,*>} Destination object
 */
function merge(dst, src, ifNotSet) { // used by converters
    for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
        if (dst[keys[i]] === undefined || !ifNotSet)
            dst[keys[i]] = src[keys[i]];
    return dst;
}

util.merge = merge;

/**
 * Converts the first character of a string to lower case.
 * @param {string} str String to convert
 * @returns {string} Converted string
 */
util.lcFirst = function lcFirst(str) {
    return str.charAt(0).toLowerCase() + str.substring(1);
};

/**
 * Creates a custom error constructor.
 * @memberof util
 * @param {string} name Error name
 * @returns {Constructor<Error>} Custom error constructor
 */
function newError(name) {

    function CustomError(message, properties) {

        if (!(this instanceof CustomError))
            return new CustomError(message, properties);

        // Error.call(this, message);
        // ^ just returns a new error instance because the ctor can be called as a function

        Object.defineProperty(this, "message", { get: function() { return message; } });

        /* istanbul ignore next */
        if (Error.captureStackTrace) // node
            Error.captureStackTrace(this, CustomError);
        else
            Object.defineProperty(this, "stack", { value: new Error().stack || "" });

        if (properties)
            merge(this, properties);
    }

    (CustomError.prototype = Object.create(Error.prototype)).constructor = CustomError;

    Object.defineProperty(CustomError.prototype, "name", { get: function() { return name; } });

    CustomError.prototype.toString = function toString() {
        return this.name + ": " + this.message;
    };

    return CustomError;
}

util.newError = newError;

/**
 * Constructs a new protocol error.
 * @classdesc Error subclass indicating a protocol specifc error.
 * @memberof util
 * @extends Error
 * @template T extends Message<T>
 * @constructor
 * @param {string} message Error message
 * @param {Object.<string,*>} [properties] Additional properties
 * @example
 * try {
 *     MyMessage.decode(someBuffer); // throws if required fields are missing
 * } catch (e) {
 *     if (e instanceof ProtocolError && e.instance)
 *         console.log("decoded so far: " + JSON.stringify(e.instance));
 * }
 */
util.ProtocolError = newError("ProtocolError");

/**
 * So far decoded message instance.
 * @name util.ProtocolError#instance
 * @type {Message<T>}
 */

/**
 * A OneOf getter as returned by {@link util.oneOfGetter}.
 * @typedef OneOfGetter
 * @type {function}
 * @returns {string|undefined} Set field name, if any
 */

/**
 * Builds a getter for a oneof's present field name.
 * @param {string[]} fieldNames Field names
 * @returns {OneOfGetter} Unbound getter
 */
util.oneOfGetter = function getOneOf(fieldNames) {
    var fieldMap = {};
    for (var i = 0; i < fieldNames.length; ++i)
        fieldMap[fieldNames[i]] = 1;

    /**
     * @returns {string|undefined} Set field name, if any
     * @this Object
     * @ignore
     */
    return function() { // eslint-disable-line consistent-return
        for (var keys = Object.keys(this), i = keys.length - 1; i > -1; --i)
            if (fieldMap[keys[i]] === 1 && this[keys[i]] !== undefined && this[keys[i]] !== null)
                return keys[i];
    };
};

/**
 * A OneOf setter as returned by {@link util.oneOfSetter}.
 * @typedef OneOfSetter
 * @type {function}
 * @param {string|undefined} value Field name
 * @returns {undefined}
 */

/**
 * Builds a setter for a oneof's present field name.
 * @param {string[]} fieldNames Field names
 * @returns {OneOfSetter} Unbound setter
 */
util.oneOfSetter = function setOneOf(fieldNames) {

    /**
     * @param {string} name Field name
     * @returns {undefined}
     * @this Object
     * @ignore
     */
    return function(name) {
        for (var i = 0; i < fieldNames.length; ++i)
            if (fieldNames[i] !== name)
                delete this[fieldNames[i]];
    };
};

/**
 * Default conversion options used for {@link Message#toJSON} implementations.
 *
 * These options are close to proto3's JSON mapping with the exception that internal types like Any are handled just like messages. More precisely:
 *
 * - Longs become strings
 * - Enums become string keys
 * - Bytes become base64 encoded strings
 * - (Sub-)Messages become plain objects
 * - Maps become plain objects with all string keys
 * - Repeated fields become arrays
 * - NaN and Infinity for float and double fields become strings
 *
 * @type {IConversionOptions}
 * @see https://developers.google.com/protocol-buffers/docs/proto3?hl=en#json
 */
util.toJSONOptions = {
    longs: String,
    enums: String,
    bytes: String,
    json: true
};

// Sets up buffer utility according to the environment (called in index-minimal)
util._configure = function() {
    var Buffer = util.Buffer;
    /* istanbul ignore if */
    if (!Buffer) {
        util._Buffer_from = util._Buffer_allocUnsafe = null;
        return;
    }
    // because node 4.x buffers are incompatible & immutable
    // see: https://github.com/dcodeIO/protobuf.js/pull/665
    util._Buffer_from = Buffer.from !== Uint8Array.from && Buffer.from ||
        /* istanbul ignore next */
        function Buffer_from(value, encoding) {
            return new Buffer(value, encoding);
        };
    util._Buffer_allocUnsafe = Buffer.allocUnsafe ||
        /* istanbul ignore next */
        function Buffer_allocUnsafe(size) {
            return new Buffer(size);
        };
};

},{"1":1,"14":14,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7}],16:[function(require,module,exports){
"use strict";
module.exports = Writer;

var util      = require(15);

var BufferWriter; // cyclic

var LongBits  = util.LongBits,
    base64    = util.base64,
    utf8      = util.utf8;

/**
 * Constructs a new writer operation instance.
 * @classdesc Scheduled writer operation.
 * @constructor
 * @param {function(*, Uint8Array, number)} fn Function to call
 * @param {number} len Value byte length
 * @param {*} val Value to write
 * @ignore
 */
function Op(fn, len, val) {

    /**
     * Function to call.
     * @type {function(Uint8Array, number, *)}
     */
    this.fn = fn;

    /**
     * Value byte length.
     * @type {number}
     */
    this.len = len;

    /**
     * Next operation.
     * @type {Writer.Op|undefined}
     */
    this.next = undefined;

    /**
     * Value to write.
     * @type {*}
     */
    this.val = val; // type varies
}

/* istanbul ignore next */
function noop() {} // eslint-disable-line no-empty-function

/**
 * Constructs a new writer state instance.
 * @classdesc Copied writer state.
 * @memberof Writer
 * @constructor
 * @param {Writer} writer Writer to copy state from
 * @ignore
 */
function State(writer) {

    /**
     * Current head.
     * @type {Writer.Op}
     */
    this.head = writer.head;

    /**
     * Current tail.
     * @type {Writer.Op}
     */
    this.tail = writer.tail;

    /**
     * Current buffer length.
     * @type {number}
     */
    this.len = writer.len;

    /**
     * Next state.
     * @type {State|null}
     */
    this.next = writer.states;
}

/**
 * Constructs a new writer instance.
 * @classdesc Wire format writer using `Uint8Array` if available, otherwise `Array`.
 * @constructor
 */
function Writer() {

    /**
     * Current length.
     * @type {number}
     */
    this.len = 0;

    /**
     * Operations head.
     * @type {Object}
     */
    this.head = new Op(noop, 0, 0);

    /**
     * Operations tail
     * @type {Object}
     */
    this.tail = this.head;

    /**
     * Linked forked states.
     * @type {Object|null}
     */
    this.states = null;

    // When a value is written, the writer calculates its byte length and puts it into a linked
    // list of operations to perform when finish() is called. This both allows us to allocate
    // buffers of the exact required size and reduces the amount of work we have to do compared
    // to first calculating over objects and then encoding over objects. In our case, the encoding
    // part is just a linked list walk calling operations with already prepared values.
}

var create = function create() {
    return util.Buffer
        ? function create_buffer_setup() {
            return (Writer.create = function create_buffer() {
                return new BufferWriter();
            })();
        }
        /* istanbul ignore next */
        : function create_array() {
            return new Writer();
        };
};

/**
 * Creates a new writer.
 * @function
 * @returns {BufferWriter|Writer} A {@link BufferWriter} when Buffers are supported, otherwise a {@link Writer}
 */
Writer.create = create();

/**
 * Allocates a buffer of the specified size.
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */
Writer.alloc = function alloc(size) {
    return new util.Array(size);
};

// Use Uint8Array buffer pool in the browser, just like node does with buffers
/* istanbul ignore else */
if (util.Array !== Array)
    Writer.alloc = util.pool(Writer.alloc, util.Array.prototype.subarray);

/**
 * Pushes a new operation to the queue.
 * @param {function(Uint8Array, number, *)} fn Function to call
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @returns {Writer} `this`
 * @private
 */
Writer.prototype._push = function push(fn, len, val) {
    this.tail = this.tail.next = new Op(fn, len, val);
    this.len += len;
    return this;
};

function writeByte(val, buf, pos) {
    buf[pos] = val & 255;
}

function writeVarint32(val, buf, pos) {
    while (val > 127) {
        buf[pos++] = val & 127 | 128;
        val >>>= 7;
    }
    buf[pos] = val;
}

/**
 * Constructs a new varint writer operation instance.
 * @classdesc Scheduled varint writer operation.
 * @extends Op
 * @constructor
 * @param {number} len Value byte length
 * @param {number} val Value to write
 * @ignore
 */
function VarintOp(len, val) {
    this.len = len;
    this.next = undefined;
    this.val = val;
}

VarintOp.prototype = Object.create(Op.prototype);
VarintOp.prototype.fn = writeVarint32;

/**
 * Writes an unsigned 32 bit value as a varint.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.uint32 = function write_uint32(value) {
    // here, the call to this.push has been inlined and a varint specific Op subclass is used.
    // uint32 is by far the most frequently used operation and benefits significantly from this.
    this.len += (this.tail = this.tail.next = new VarintOp(
        (value = value >>> 0)
                < 128       ? 1
        : value < 16384     ? 2
        : value < 2097152   ? 3
        : value < 268435456 ? 4
        :                     5,
    value)).len;
    return this;
};

/**
 * Writes a signed 32 bit value as a varint.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.int32 = function write_int32(value) {
    return value < 0
        ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) // 10 bytes per spec
        : this.uint32(value);
};

/**
 * Writes a 32 bit value as a varint, zig-zag encoded.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.sint32 = function write_sint32(value) {
    return this.uint32((value << 1 ^ value >> 31) >>> 0);
};

function writeVarint64(val, buf, pos) {
    while (val.hi) {
        buf[pos++] = val.lo & 127 | 128;
        val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0;
        val.hi >>>= 7;
    }
    while (val.lo > 127) {
        buf[pos++] = val.lo & 127 | 128;
        val.lo = val.lo >>> 7;
    }
    buf[pos++] = val.lo;
}

/**
 * Writes an unsigned 64 bit value as a varint.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.uint64 = function write_uint64(value) {
    var bits = LongBits.from(value);
    return this._push(writeVarint64, bits.length(), bits);
};

/**
 * Writes a signed 64 bit value as a varint.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.int64 = Writer.prototype.uint64;

/**
 * Writes a signed 64 bit value as a varint, zig-zag encoded.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.sint64 = function write_sint64(value) {
    var bits = LongBits.from(value).zzEncode();
    return this._push(writeVarint64, bits.length(), bits);
};

/**
 * Writes a boolish value as a varint.
 * @param {boolean} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.bool = function write_bool(value) {
    return this._push(writeByte, 1, value ? 1 : 0);
};

function writeFixed32(val, buf, pos) {
    buf[pos    ] =  val         & 255;
    buf[pos + 1] =  val >>> 8   & 255;
    buf[pos + 2] =  val >>> 16  & 255;
    buf[pos + 3] =  val >>> 24;
}

/**
 * Writes an unsigned 32 bit value as fixed 32 bits.
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.fixed32 = function write_fixed32(value) {
    return this._push(writeFixed32, 4, value >>> 0);
};

/**
 * Writes a signed 32 bit value as fixed 32 bits.
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.sfixed32 = Writer.prototype.fixed32;

/**
 * Writes an unsigned 64 bit value as fixed 64 bits.
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.fixed64 = function write_fixed64(value) {
    var bits = LongBits.from(value);
    return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
};

/**
 * Writes a signed 64 bit value as fixed 64 bits.
 * @function
 * @param {Long|number|string} value Value to write
 * @returns {Writer} `this`
 * @throws {TypeError} If `value` is a string and no long library is present.
 */
Writer.prototype.sfixed64 = Writer.prototype.fixed64;

/**
 * Writes a float (32 bit).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.float = function write_float(value) {
    return this._push(util.float.writeFloatLE, 4, value);
};

/**
 * Writes a double (64 bit float).
 * @function
 * @param {number} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.double = function write_double(value) {
    return this._push(util.float.writeDoubleLE, 8, value);
};

var writeBytes = util.Array.prototype.set
    ? function writeBytes_set(val, buf, pos) {
        buf.set(val, pos); // also works for plain array values
    }
    /* istanbul ignore next */
    : function writeBytes_for(val, buf, pos) {
        for (var i = 0; i < val.length; ++i)
            buf[pos + i] = val[i];
    };

/**
 * Writes a sequence of bytes.
 * @param {Uint8Array|string} value Buffer or base64 encoded string to write
 * @returns {Writer} `this`
 */
Writer.prototype.bytes = function write_bytes(value) {
    var len = value.length >>> 0;
    if (!len)
        return this._push(writeByte, 1, 0);
    if (util.isString(value)) {
        var buf = Writer.alloc(len = base64.length(value));
        base64.decode(value, buf, 0);
        value = buf;
    }
    return this.uint32(len)._push(writeBytes, len, value);
};

/**
 * Writes a string.
 * @param {string} value Value to write
 * @returns {Writer} `this`
 */
Writer.prototype.string = function write_string(value) {
    var len = utf8.length(value);
    return len
        ? this.uint32(len)._push(utf8.write, len, value)
        : this._push(writeByte, 1, 0);
};

/**
 * Forks this writer's state by pushing it to a stack.
 * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
 * @returns {Writer} `this`
 */
Writer.prototype.fork = function fork() {
    this.states = new State(this);
    this.head = this.tail = new Op(noop, 0, 0);
    this.len = 0;
    return this;
};

/**
 * Resets this instance to the last state.
 * @returns {Writer} `this`
 */
Writer.prototype.reset = function reset() {
    if (this.states) {
        this.head   = this.states.head;
        this.tail   = this.states.tail;
        this.len    = this.states.len;
        this.states = this.states.next;
    } else {
        this.head = this.tail = new Op(noop, 0, 0);
        this.len  = 0;
    }
    return this;
};

/**
 * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
 * @returns {Writer} `this`
 */
Writer.prototype.ldelim = function ldelim() {
    var head = this.head,
        tail = this.tail,
        len  = this.len;
    this.reset().uint32(len);
    if (len) {
        this.tail.next = head.next; // skip noop
        this.tail = tail;
        this.len += len;
    }
    return this;
};

/**
 * Finishes the write operation.
 * @returns {Uint8Array} Finished buffer
 */
Writer.prototype.finish = function finish() {
    var head = this.head.next, // skip noop
        buf  = this.constructor.alloc(this.len),
        pos  = 0;
    while (head) {
        head.fn(head.val, buf, pos);
        pos += head.len;
        head = head.next;
    }
    // this.head = this.tail = null;
    return buf;
};

Writer._configure = function(BufferWriter_) {
    BufferWriter = BufferWriter_;
    Writer.create = create();
    BufferWriter._configure();
};

},{"15":15}],17:[function(require,module,exports){
"use strict";
module.exports = BufferWriter;

// extends Writer
var Writer = require(16);
(BufferWriter.prototype = Object.create(Writer.prototype)).constructor = BufferWriter;

var util = require(15);

/**
 * Constructs a new buffer writer instance.
 * @classdesc Wire format writer using node buffers.
 * @extends Writer
 * @constructor
 */
function BufferWriter() {
    Writer.call(this);
}

BufferWriter._configure = function () {
    /**
     * Allocates a buffer of the specified size.
     * @function
     * @param {number} size Buffer size
     * @returns {Buffer} Buffer
     */
    BufferWriter.alloc = util._Buffer_allocUnsafe;

    BufferWriter.writeBytesBuffer = util.Buffer && util.Buffer.prototype instanceof Uint8Array && util.Buffer.prototype.set.name === "set"
        ? function writeBytesBuffer_set(val, buf, pos) {
          buf.set(val, pos); // faster than copy (requires node >= 4 where Buffers extend Uint8Array and set is properly inherited)
          // also works for plain array values
        }
        /* istanbul ignore next */
        : function writeBytesBuffer_copy(val, buf, pos) {
          if (val.copy) // Buffer values
            val.copy(buf, pos, 0, val.length);
          else for (var i = 0; i < val.length;) // plain array values
            buf[pos++] = val[i++];
        };
};


/**
 * @override
 */
BufferWriter.prototype.bytes = function write_bytes_buffer(value) {
    if (util.isString(value))
        value = util._Buffer_from(value, "base64");
    var len = value.length >>> 0;
    this.uint32(len);
    if (len)
        this._push(BufferWriter.writeBytesBuffer, len, value);
    return this;
};

function writeStringBuffer(val, buf, pos) {
    if (val.length < 40) // plain js is faster for short strings (probably due to redundant assertions)
        util.utf8.write(val, buf, pos);
    else if (buf.utf8Write)
        buf.utf8Write(val, pos);
    else
        buf.write(val, pos);
}

/**
 * @override
 */
BufferWriter.prototype.string = function write_string_buffer(value) {
    var len = util.Buffer.byteLength(value);
    this.uint32(len);
    if (len)
        this._push(writeStringBuffer, len, value);
    return this;
};


/**
 * Finishes the write operation.
 * @name BufferWriter#finish
 * @function
 * @returns {Buffer} Finished buffer
 */

BufferWriter._configure();

},{"15":15,"16":16}]},{},[8])

})();
//# sourceMappingURL=protobuf.js.map

// Common aliases
var $protobuf = protobuf;
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.bilibili = (function() {

    /**
     * Namespace bilibili.
     * @exports bilibili
     * @namespace
     */
    var bilibili = {};

    bilibili.community = (function() {

        /**
         * Namespace community.
         * @memberof bilibili
         * @namespace
         */
        var community = {};

        community.service = (function() {

            /**
             * Namespace service.
             * @memberof bilibili.community
             * @namespace
             */
            var service = {};

            service.dm = (function() {

                /**
                 * Namespace dm.
                 * @memberof bilibili.community.service
                 * @namespace
                 */
                var dm = {};

                dm.v1 = (function() {

                    /**
                     * Namespace v1.
                     * @memberof bilibili.community.service.dm
                     * @namespace
                     */
                    var v1 = {};

                    v1.DM = (function() {

                        /**
                         * Constructs a new DM service.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DM
                         * @extends $protobuf.rpc.Service
                         * @constructor
                         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
                         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
                         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
                         */
                        function DM(rpcImpl, requestDelimited, responseDelimited) {
                            $protobuf.rpc.Service.call(this, rpcImpl, requestDelimited, responseDelimited);
                        }

                        (DM.prototype = Object.create($protobuf.rpc.Service.prototype)).constructor = DM;

                        /**
                         * Creates new DM service using the specified rpc implementation.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @static
                         * @param {$protobuf.RPCImpl} rpcImpl RPC implementation
                         * @param {boolean} [requestDelimited=false] Whether requests are length-delimited
                         * @param {boolean} [responseDelimited=false] Whether responses are length-delimited
                         * @returns {DM} RPC service. Useful where requests and/or responses are streamed.
                         */
                        DM.create = function create(rpcImpl, requestDelimited, responseDelimited) {
                            return new this(rpcImpl, requestDelimited, responseDelimited);
                        };

                        /**
                         * Callback as used by {@link bilibili.community.service.dm.v1.DM#dmSegMobile}.
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @typedef DmSegMobileCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {bilibili.community.service.dm.v1.DmSegMobileReply} [response] DmSegMobileReply
                         */

                        /**
                         * Calls DmSegMobile.
                         * @function dmSegMobile
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @instance
                         * @param {bilibili.community.service.dm.v1.IDmSegMobileReq} request DmSegMobileReq message or plain object
                         * @param {bilibili.community.service.dm.v1.DM.DmSegMobileCallback} callback Node-style callback called with the error, if any, and DmSegMobileReply
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(DM.prototype.dmSegMobile = function dmSegMobile(request, callback) {
                            return this.rpcCall(dmSegMobile, $root.bilibili.community.service.dm.v1.DmSegMobileReq, $root.bilibili.community.service.dm.v1.DmSegMobileReply, request, callback);
                        }, "name", { value: "DmSegMobile" });

                        /**
                         * Calls DmSegMobile.
                         * @function dmSegMobile
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @instance
                         * @param {bilibili.community.service.dm.v1.IDmSegMobileReq} request DmSegMobileReq message or plain object
                         * @returns {Promise<bilibili.community.service.dm.v1.DmSegMobileReply>} Promise
                         * @variation 2
                         */

                        /**
                         * Callback as used by {@link bilibili.community.service.dm.v1.DM#dmView}.
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @typedef DmViewCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {bilibili.community.service.dm.v1.DmViewReply} [response] DmViewReply
                         */

                        /**
                         * Calls DmView.
                         * @function dmView
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @instance
                         * @param {bilibili.community.service.dm.v1.IDmViewReq} request DmViewReq message or plain object
                         * @param {bilibili.community.service.dm.v1.DM.DmViewCallback} callback Node-style callback called with the error, if any, and DmViewReply
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(DM.prototype.dmView = function dmView(request, callback) {
                            return this.rpcCall(dmView, $root.bilibili.community.service.dm.v1.DmViewReq, $root.bilibili.community.service.dm.v1.DmViewReply, request, callback);
                        }, "name", { value: "DmView" });

                        /**
                         * Calls DmView.
                         * @function dmView
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @instance
                         * @param {bilibili.community.service.dm.v1.IDmViewReq} request DmViewReq message or plain object
                         * @returns {Promise<bilibili.community.service.dm.v1.DmViewReply>} Promise
                         * @variation 2
                         */

                        /**
                         * Callback as used by {@link bilibili.community.service.dm.v1.DM#dmPlayerConfig}.
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @typedef DmPlayerConfigCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {bilibili.community.service.dm.v1.Response} [response] Response
                         */

                        /**
                         * Calls DmPlayerConfig.
                         * @function dmPlayerConfig
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @instance
                         * @param {bilibili.community.service.dm.v1.IDmPlayerConfigReq} request DmPlayerConfigReq message or plain object
                         * @param {bilibili.community.service.dm.v1.DM.DmPlayerConfigCallback} callback Node-style callback called with the error, if any, and Response
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(DM.prototype.dmPlayerConfig = function dmPlayerConfig(request, callback) {
                            return this.rpcCall(dmPlayerConfig, $root.bilibili.community.service.dm.v1.DmPlayerConfigReq, $root.bilibili.community.service.dm.v1.Response, request, callback);
                        }, "name", { value: "DmPlayerConfig" });

                        /**
                         * Calls DmPlayerConfig.
                         * @function dmPlayerConfig
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @instance
                         * @param {bilibili.community.service.dm.v1.IDmPlayerConfigReq} request DmPlayerConfigReq message or plain object
                         * @returns {Promise<bilibili.community.service.dm.v1.Response>} Promise
                         * @variation 2
                         */

                        /**
                         * Callback as used by {@link bilibili.community.service.dm.v1.DM#dmSegOtt}.
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @typedef DmSegOttCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {bilibili.community.service.dm.v1.DmSegOttReply} [response] DmSegOttReply
                         */

                        /**
                         * Calls DmSegOtt.
                         * @function dmSegOtt
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @instance
                         * @param {bilibili.community.service.dm.v1.IDmSegOttReq} request DmSegOttReq message or plain object
                         * @param {bilibili.community.service.dm.v1.DM.DmSegOttCallback} callback Node-style callback called with the error, if any, and DmSegOttReply
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(DM.prototype.dmSegOtt = function dmSegOtt(request, callback) {
                            return this.rpcCall(dmSegOtt, $root.bilibili.community.service.dm.v1.DmSegOttReq, $root.bilibili.community.service.dm.v1.DmSegOttReply, request, callback);
                        }, "name", { value: "DmSegOtt" });

                        /**
                         * Calls DmSegOtt.
                         * @function dmSegOtt
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @instance
                         * @param {bilibili.community.service.dm.v1.IDmSegOttReq} request DmSegOttReq message or plain object
                         * @returns {Promise<bilibili.community.service.dm.v1.DmSegOttReply>} Promise
                         * @variation 2
                         */

                        /**
                         * Callback as used by {@link bilibili.community.service.dm.v1.DM#dmSegSDK}.
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @typedef DmSegSDKCallback
                         * @type {function}
                         * @param {Error|null} error Error, if any
                         * @param {bilibili.community.service.dm.v1.DmSegSDKReply} [response] DmSegSDKReply
                         */

                        /**
                         * Calls DmSegSDK.
                         * @function dmSegSDK
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @instance
                         * @param {bilibili.community.service.dm.v1.IDmSegSDKReq} request DmSegSDKReq message or plain object
                         * @param {bilibili.community.service.dm.v1.DM.DmSegSDKCallback} callback Node-style callback called with the error, if any, and DmSegSDKReply
                         * @returns {undefined}
                         * @variation 1
                         */
                        Object.defineProperty(DM.prototype.dmSegSDK = function dmSegSDK(request, callback) {
                            return this.rpcCall(dmSegSDK, $root.bilibili.community.service.dm.v1.DmSegSDKReq, $root.bilibili.community.service.dm.v1.DmSegSDKReply, request, callback);
                        }, "name", { value: "DmSegSDK" });

                        /**
                         * Calls DmSegSDK.
                         * @function dmSegSDK
                         * @memberof bilibili.community.service.dm.v1.DM
                         * @instance
                         * @param {bilibili.community.service.dm.v1.IDmSegSDKReq} request DmSegSDKReq message or plain object
                         * @returns {Promise<bilibili.community.service.dm.v1.DmSegSDKReply>} Promise
                         * @variation 2
                         */

                        return DM;
                    })();

                    v1.DmSegSDKReq = (function() {

                        /**
                         * Properties of a DmSegSDKReq.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDmSegSDKReq
                         * @property {number|Long|null} [pid] DmSegSDKReq pid
                         * @property {number|Long|null} [oid] DmSegSDKReq oid
                         * @property {number|null} [type] DmSegSDKReq type
                         * @property {number|Long|null} [segmentIndex] DmSegSDKReq segmentIndex
                         */

                        /**
                         * Constructs a new DmSegSDKReq.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DmSegSDKReq.
                         * @implements IDmSegSDKReq
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDmSegSDKReq=} [properties] Properties to set
                         */
                        function DmSegSDKReq(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DmSegSDKReq pid.
                         * @member {number|Long} pid
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @instance
                         */
                        DmSegSDKReq.prototype.pid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DmSegSDKReq oid.
                         * @member {number|Long} oid
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @instance
                         */
                        DmSegSDKReq.prototype.oid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DmSegSDKReq type.
                         * @member {number} type
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @instance
                         */
                        DmSegSDKReq.prototype.type = 0;

                        /**
                         * DmSegSDKReq segmentIndex.
                         * @member {number|Long} segmentIndex
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @instance
                         */
                        DmSegSDKReq.prototype.segmentIndex = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * Creates a new DmSegSDKReq instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegSDKReq=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DmSegSDKReq} DmSegSDKReq instance
                         */
                        DmSegSDKReq.create = function create(properties) {
                            return new DmSegSDKReq(properties);
                        };

                        /**
                         * Encodes the specified DmSegSDKReq message. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegSDKReq.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegSDKReq} message DmSegSDKReq message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegSDKReq.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.pid);
                            if (message.oid != null && Object.hasOwnProperty.call(message, "oid"))
                                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.oid);
                            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.type);
                            if (message.segmentIndex != null && Object.hasOwnProperty.call(message, "segmentIndex"))
                                writer.uint32(/* id 4, wireType 0 =*/32).int64(message.segmentIndex);
                            return writer;
                        };

                        /**
                         * Encodes the specified DmSegSDKReq message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegSDKReq.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegSDKReq} message DmSegSDKReq message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegSDKReq.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DmSegSDKReq message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DmSegSDKReq} DmSegSDKReq
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegSDKReq.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DmSegSDKReq();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.pid = reader.int64();
                                        break;
                                    case 2:
                                        message.oid = reader.int64();
                                        break;
                                    case 3:
                                        message.type = reader.int32();
                                        break;
                                    case 4:
                                        message.segmentIndex = reader.int64();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DmSegSDKReq message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DmSegSDKReq} DmSegSDKReq
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegSDKReq.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DmSegSDKReq message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DmSegSDKReq.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.pid != null && message.hasOwnProperty("pid"))
                                if (!$util.isInteger(message.pid) && !(message.pid && $util.isInteger(message.pid.low) && $util.isInteger(message.pid.high)))
                                    return "pid: integer|Long expected";
                            if (message.oid != null && message.hasOwnProperty("oid"))
                                if (!$util.isInteger(message.oid) && !(message.oid && $util.isInteger(message.oid.low) && $util.isInteger(message.oid.high)))
                                    return "oid: integer|Long expected";
                            if (message.type != null && message.hasOwnProperty("type"))
                                if (!$util.isInteger(message.type))
                                    return "type: integer expected";
                            if (message.segmentIndex != null && message.hasOwnProperty("segmentIndex"))
                                if (!$util.isInteger(message.segmentIndex) && !(message.segmentIndex && $util.isInteger(message.segmentIndex.low) && $util.isInteger(message.segmentIndex.high)))
                                    return "segmentIndex: integer|Long expected";
                            return null;
                        };

                        /**
                         * Creates a DmSegSDKReq message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DmSegSDKReq} DmSegSDKReq
                         */
                        DmSegSDKReq.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DmSegSDKReq)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DmSegSDKReq();
                            if (object.pid != null)
                                if ($util.Long)
                                    (message.pid = $util.Long.fromValue(object.pid)).unsigned = false;
                                else if (typeof object.pid === "string")
                                    message.pid = parseInt(object.pid, 10);
                                else if (typeof object.pid === "number")
                                    message.pid = object.pid;
                                else if (typeof object.pid === "object")
                                    message.pid = new $util.LongBits(object.pid.low >>> 0, object.pid.high >>> 0).toNumber();
                            if (object.oid != null)
                                if ($util.Long)
                                    (message.oid = $util.Long.fromValue(object.oid)).unsigned = false;
                                else if (typeof object.oid === "string")
                                    message.oid = parseInt(object.oid, 10);
                                else if (typeof object.oid === "number")
                                    message.oid = object.oid;
                                else if (typeof object.oid === "object")
                                    message.oid = new $util.LongBits(object.oid.low >>> 0, object.oid.high >>> 0).toNumber();
                            if (object.type != null)
                                message.type = object.type | 0;
                            if (object.segmentIndex != null)
                                if ($util.Long)
                                    (message.segmentIndex = $util.Long.fromValue(object.segmentIndex)).unsigned = false;
                                else if (typeof object.segmentIndex === "string")
                                    message.segmentIndex = parseInt(object.segmentIndex, 10);
                                else if (typeof object.segmentIndex === "number")
                                    message.segmentIndex = object.segmentIndex;
                                else if (typeof object.segmentIndex === "object")
                                    message.segmentIndex = new $util.LongBits(object.segmentIndex.low >>> 0, object.segmentIndex.high >>> 0).toNumber();
                            return message;
                        };

                        /**
                         * Creates a plain object from a DmSegSDKReq message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.DmSegSDKReq} message DmSegSDKReq
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DmSegSDKReq.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.pid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.pid = options.longs === String ? "0" : 0;
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.oid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.oid = options.longs === String ? "0" : 0;
                                object.type = 0;
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.segmentIndex = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.segmentIndex = options.longs === String ? "0" : 0;
                            }
                            if (message.pid != null && message.hasOwnProperty("pid"))
                                if (typeof message.pid === "number")
                                    object.pid = options.longs === String ? String(message.pid) : message.pid;
                                else
                                    object.pid = options.longs === String ? $util.Long.prototype.toString.call(message.pid) : options.longs === Number ? new $util.LongBits(message.pid.low >>> 0, message.pid.high >>> 0).toNumber() : message.pid;
                            if (message.oid != null && message.hasOwnProperty("oid"))
                                if (typeof message.oid === "number")
                                    object.oid = options.longs === String ? String(message.oid) : message.oid;
                                else
                                    object.oid = options.longs === String ? $util.Long.prototype.toString.call(message.oid) : options.longs === Number ? new $util.LongBits(message.oid.low >>> 0, message.oid.high >>> 0).toNumber() : message.oid;
                            if (message.type != null && message.hasOwnProperty("type"))
                                object.type = message.type;
                            if (message.segmentIndex != null && message.hasOwnProperty("segmentIndex"))
                                if (typeof message.segmentIndex === "number")
                                    object.segmentIndex = options.longs === String ? String(message.segmentIndex) : message.segmentIndex;
                                else
                                    object.segmentIndex = options.longs === String ? $util.Long.prototype.toString.call(message.segmentIndex) : options.longs === Number ? new $util.LongBits(message.segmentIndex.low >>> 0, message.segmentIndex.high >>> 0).toNumber() : message.segmentIndex;
                            return object;
                        };

                        /**
                         * Converts this DmSegSDKReq to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReq
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DmSegSDKReq.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DmSegSDKReq;
                    })();

                    v1.DmSegSDKReply = (function() {

                        /**
                         * Properties of a DmSegSDKReply.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDmSegSDKReply
                         * @property {boolean|null} [closed] DmSegSDKReply closed
                         * @property {Array.<bilibili.community.service.dm.v1.IDanmakuElem>|null} [elems] DmSegSDKReply elems
                         */

                        /**
                         * Constructs a new DmSegSDKReply.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DmSegSDKReply.
                         * @implements IDmSegSDKReply
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDmSegSDKReply=} [properties] Properties to set
                         */
                        function DmSegSDKReply(properties) {
                            this.elems = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DmSegSDKReply closed.
                         * @member {boolean} closed
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReply
                         * @instance
                         */
                        DmSegSDKReply.prototype.closed = false;

                        /**
                         * DmSegSDKReply elems.
                         * @member {Array.<bilibili.community.service.dm.v1.IDanmakuElem>} elems
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReply
                         * @instance
                         */
                        DmSegSDKReply.prototype.elems = $util.emptyArray;

                        /**
                         * Creates a new DmSegSDKReply instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegSDKReply=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DmSegSDKReply} DmSegSDKReply instance
                         */
                        DmSegSDKReply.create = function create(properties) {
                            return new DmSegSDKReply(properties);
                        };

                        /**
                         * Encodes the specified DmSegSDKReply message. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegSDKReply.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegSDKReply} message DmSegSDKReply message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegSDKReply.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.closed != null && Object.hasOwnProperty.call(message, "closed"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.closed);
                            if (message.elems != null && message.elems.length)
                                for (var i = 0; i < message.elems.length; ++i)
                                    $root.bilibili.community.service.dm.v1.DanmakuElem.encode(message.elems[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified DmSegSDKReply message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegSDKReply.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegSDKReply} message DmSegSDKReply message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegSDKReply.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DmSegSDKReply message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReply
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DmSegSDKReply} DmSegSDKReply
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegSDKReply.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DmSegSDKReply();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.closed = reader.bool();
                                        break;
                                    case 2:
                                        if (!(message.elems && message.elems.length))
                                            message.elems = [];
                                        message.elems.push($root.bilibili.community.service.dm.v1.DanmakuElem.decode(reader, reader.uint32()));
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DmSegSDKReply message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReply
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DmSegSDKReply} DmSegSDKReply
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegSDKReply.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DmSegSDKReply message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReply
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DmSegSDKReply.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.closed != null && message.hasOwnProperty("closed"))
                                if (typeof message.closed !== "boolean")
                                    return "closed: boolean expected";
                            if (message.elems != null && message.hasOwnProperty("elems")) {
                                if (!Array.isArray(message.elems))
                                    return "elems: array expected";
                                for (var i = 0; i < message.elems.length; ++i) {
                                    var error = $root.bilibili.community.service.dm.v1.DanmakuElem.verify(message.elems[i]);
                                    if (error)
                                        return "elems." + error;
                                }
                            }
                            return null;
                        };

                        /**
                         * Creates a DmSegSDKReply message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReply
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DmSegSDKReply} DmSegSDKReply
                         */
                        DmSegSDKReply.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DmSegSDKReply)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DmSegSDKReply();
                            if (object.closed != null)
                                message.closed = Boolean(object.closed);
                            if (object.elems) {
                                if (!Array.isArray(object.elems))
                                    throw TypeError(".bilibili.community.service.dm.v1.DmSegSDKReply.elems: array expected");
                                message.elems = [];
                                for (var i = 0; i < object.elems.length; ++i) {
                                    if (typeof object.elems[i] !== "object")
                                        throw TypeError(".bilibili.community.service.dm.v1.DmSegSDKReply.elems: object expected");
                                    message.elems[i] = $root.bilibili.community.service.dm.v1.DanmakuElem.fromObject(object.elems[i]);
                                }
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a DmSegSDKReply message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.DmSegSDKReply} message DmSegSDKReply
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DmSegSDKReply.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.elems = [];
                            if (options.defaults)
                                object.closed = false;
                            if (message.closed != null && message.hasOwnProperty("closed"))
                                object.closed = message.closed;
                            if (message.elems && message.elems.length) {
                                object.elems = [];
                                for (var j = 0; j < message.elems.length; ++j)
                                    object.elems[j] = $root.bilibili.community.service.dm.v1.DanmakuElem.toObject(message.elems[j], options);
                            }
                            return object;
                        };

                        /**
                         * Converts this DmSegSDKReply to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DmSegSDKReply
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DmSegSDKReply.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DmSegSDKReply;
                    })();

                    v1.DmSegOttReq = (function() {

                        /**
                         * Properties of a DmSegOttReq.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDmSegOttReq
                         * @property {number|Long|null} [pid] DmSegOttReq pid
                         * @property {number|Long|null} [oid] DmSegOttReq oid
                         * @property {number|null} [type] DmSegOttReq type
                         * @property {number|Long|null} [segmentIndex] DmSegOttReq segmentIndex
                         */

                        /**
                         * Constructs a new DmSegOttReq.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DmSegOttReq.
                         * @implements IDmSegOttReq
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDmSegOttReq=} [properties] Properties to set
                         */
                        function DmSegOttReq(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DmSegOttReq pid.
                         * @member {number|Long} pid
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @instance
                         */
                        DmSegOttReq.prototype.pid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DmSegOttReq oid.
                         * @member {number|Long} oid
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @instance
                         */
                        DmSegOttReq.prototype.oid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DmSegOttReq type.
                         * @member {number} type
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @instance
                         */
                        DmSegOttReq.prototype.type = 0;

                        /**
                         * DmSegOttReq segmentIndex.
                         * @member {number|Long} segmentIndex
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @instance
                         */
                        DmSegOttReq.prototype.segmentIndex = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * Creates a new DmSegOttReq instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegOttReq=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DmSegOttReq} DmSegOttReq instance
                         */
                        DmSegOttReq.create = function create(properties) {
                            return new DmSegOttReq(properties);
                        };

                        /**
                         * Encodes the specified DmSegOttReq message. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegOttReq.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegOttReq} message DmSegOttReq message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegOttReq.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.pid);
                            if (message.oid != null && Object.hasOwnProperty.call(message, "oid"))
                                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.oid);
                            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.type);
                            if (message.segmentIndex != null && Object.hasOwnProperty.call(message, "segmentIndex"))
                                writer.uint32(/* id 4, wireType 0 =*/32).int64(message.segmentIndex);
                            return writer;
                        };

                        /**
                         * Encodes the specified DmSegOttReq message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegOttReq.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegOttReq} message DmSegOttReq message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegOttReq.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DmSegOttReq message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DmSegOttReq} DmSegOttReq
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegOttReq.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DmSegOttReq();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.pid = reader.int64();
                                        break;
                                    case 2:
                                        message.oid = reader.int64();
                                        break;
                                    case 3:
                                        message.type = reader.int32();
                                        break;
                                    case 4:
                                        message.segmentIndex = reader.int64();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DmSegOttReq message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DmSegOttReq} DmSegOttReq
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegOttReq.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DmSegOttReq message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DmSegOttReq.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.pid != null && message.hasOwnProperty("pid"))
                                if (!$util.isInteger(message.pid) && !(message.pid && $util.isInteger(message.pid.low) && $util.isInteger(message.pid.high)))
                                    return "pid: integer|Long expected";
                            if (message.oid != null && message.hasOwnProperty("oid"))
                                if (!$util.isInteger(message.oid) && !(message.oid && $util.isInteger(message.oid.low) && $util.isInteger(message.oid.high)))
                                    return "oid: integer|Long expected";
                            if (message.type != null && message.hasOwnProperty("type"))
                                if (!$util.isInteger(message.type))
                                    return "type: integer expected";
                            if (message.segmentIndex != null && message.hasOwnProperty("segmentIndex"))
                                if (!$util.isInteger(message.segmentIndex) && !(message.segmentIndex && $util.isInteger(message.segmentIndex.low) && $util.isInteger(message.segmentIndex.high)))
                                    return "segmentIndex: integer|Long expected";
                            return null;
                        };

                        /**
                         * Creates a DmSegOttReq message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DmSegOttReq} DmSegOttReq
                         */
                        DmSegOttReq.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DmSegOttReq)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DmSegOttReq();
                            if (object.pid != null)
                                if ($util.Long)
                                    (message.pid = $util.Long.fromValue(object.pid)).unsigned = false;
                                else if (typeof object.pid === "string")
                                    message.pid = parseInt(object.pid, 10);
                                else if (typeof object.pid === "number")
                                    message.pid = object.pid;
                                else if (typeof object.pid === "object")
                                    message.pid = new $util.LongBits(object.pid.low >>> 0, object.pid.high >>> 0).toNumber();
                            if (object.oid != null)
                                if ($util.Long)
                                    (message.oid = $util.Long.fromValue(object.oid)).unsigned = false;
                                else if (typeof object.oid === "string")
                                    message.oid = parseInt(object.oid, 10);
                                else if (typeof object.oid === "number")
                                    message.oid = object.oid;
                                else if (typeof object.oid === "object")
                                    message.oid = new $util.LongBits(object.oid.low >>> 0, object.oid.high >>> 0).toNumber();
                            if (object.type != null)
                                message.type = object.type | 0;
                            if (object.segmentIndex != null)
                                if ($util.Long)
                                    (message.segmentIndex = $util.Long.fromValue(object.segmentIndex)).unsigned = false;
                                else if (typeof object.segmentIndex === "string")
                                    message.segmentIndex = parseInt(object.segmentIndex, 10);
                                else if (typeof object.segmentIndex === "number")
                                    message.segmentIndex = object.segmentIndex;
                                else if (typeof object.segmentIndex === "object")
                                    message.segmentIndex = new $util.LongBits(object.segmentIndex.low >>> 0, object.segmentIndex.high >>> 0).toNumber();
                            return message;
                        };

                        /**
                         * Creates a plain object from a DmSegOttReq message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.DmSegOttReq} message DmSegOttReq
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DmSegOttReq.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.pid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.pid = options.longs === String ? "0" : 0;
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.oid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.oid = options.longs === String ? "0" : 0;
                                object.type = 0;
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.segmentIndex = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.segmentIndex = options.longs === String ? "0" : 0;
                            }
                            if (message.pid != null && message.hasOwnProperty("pid"))
                                if (typeof message.pid === "number")
                                    object.pid = options.longs === String ? String(message.pid) : message.pid;
                                else
                                    object.pid = options.longs === String ? $util.Long.prototype.toString.call(message.pid) : options.longs === Number ? new $util.LongBits(message.pid.low >>> 0, message.pid.high >>> 0).toNumber() : message.pid;
                            if (message.oid != null && message.hasOwnProperty("oid"))
                                if (typeof message.oid === "number")
                                    object.oid = options.longs === String ? String(message.oid) : message.oid;
                                else
                                    object.oid = options.longs === String ? $util.Long.prototype.toString.call(message.oid) : options.longs === Number ? new $util.LongBits(message.oid.low >>> 0, message.oid.high >>> 0).toNumber() : message.oid;
                            if (message.type != null && message.hasOwnProperty("type"))
                                object.type = message.type;
                            if (message.segmentIndex != null && message.hasOwnProperty("segmentIndex"))
                                if (typeof message.segmentIndex === "number")
                                    object.segmentIndex = options.longs === String ? String(message.segmentIndex) : message.segmentIndex;
                                else
                                    object.segmentIndex = options.longs === String ? $util.Long.prototype.toString.call(message.segmentIndex) : options.longs === Number ? new $util.LongBits(message.segmentIndex.low >>> 0, message.segmentIndex.high >>> 0).toNumber() : message.segmentIndex;
                            return object;
                        };

                        /**
                         * Converts this DmSegOttReq to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReq
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DmSegOttReq.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DmSegOttReq;
                    })();

                    v1.DmSegOttReply = (function() {

                        /**
                         * Properties of a DmSegOttReply.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDmSegOttReply
                         * @property {boolean|null} [closed] DmSegOttReply closed
                         * @property {Array.<bilibili.community.service.dm.v1.IDanmakuElem>|null} [elems] DmSegOttReply elems
                         */

                        /**
                         * Constructs a new DmSegOttReply.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DmSegOttReply.
                         * @implements IDmSegOttReply
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDmSegOttReply=} [properties] Properties to set
                         */
                        function DmSegOttReply(properties) {
                            this.elems = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DmSegOttReply closed.
                         * @member {boolean} closed
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReply
                         * @instance
                         */
                        DmSegOttReply.prototype.closed = false;

                        /**
                         * DmSegOttReply elems.
                         * @member {Array.<bilibili.community.service.dm.v1.IDanmakuElem>} elems
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReply
                         * @instance
                         */
                        DmSegOttReply.prototype.elems = $util.emptyArray;

                        /**
                         * Creates a new DmSegOttReply instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegOttReply=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DmSegOttReply} DmSegOttReply instance
                         */
                        DmSegOttReply.create = function create(properties) {
                            return new DmSegOttReply(properties);
                        };

                        /**
                         * Encodes the specified DmSegOttReply message. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegOttReply.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegOttReply} message DmSegOttReply message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegOttReply.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.closed != null && Object.hasOwnProperty.call(message, "closed"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.closed);
                            if (message.elems != null && message.elems.length)
                                for (var i = 0; i < message.elems.length; ++i)
                                    $root.bilibili.community.service.dm.v1.DanmakuElem.encode(message.elems[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified DmSegOttReply message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegOttReply.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegOttReply} message DmSegOttReply message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegOttReply.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DmSegOttReply message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReply
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DmSegOttReply} DmSegOttReply
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegOttReply.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DmSegOttReply();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.closed = reader.bool();
                                        break;
                                    case 2:
                                        if (!(message.elems && message.elems.length))
                                            message.elems = [];
                                        message.elems.push($root.bilibili.community.service.dm.v1.DanmakuElem.decode(reader, reader.uint32()));
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DmSegOttReply message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReply
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DmSegOttReply} DmSegOttReply
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegOttReply.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DmSegOttReply message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReply
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DmSegOttReply.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.closed != null && message.hasOwnProperty("closed"))
                                if (typeof message.closed !== "boolean")
                                    return "closed: boolean expected";
                            if (message.elems != null && message.hasOwnProperty("elems")) {
                                if (!Array.isArray(message.elems))
                                    return "elems: array expected";
                                for (var i = 0; i < message.elems.length; ++i) {
                                    var error = $root.bilibili.community.service.dm.v1.DanmakuElem.verify(message.elems[i]);
                                    if (error)
                                        return "elems." + error;
                                }
                            }
                            return null;
                        };

                        /**
                         * Creates a DmSegOttReply message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReply
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DmSegOttReply} DmSegOttReply
                         */
                        DmSegOttReply.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DmSegOttReply)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DmSegOttReply();
                            if (object.closed != null)
                                message.closed = Boolean(object.closed);
                            if (object.elems) {
                                if (!Array.isArray(object.elems))
                                    throw TypeError(".bilibili.community.service.dm.v1.DmSegOttReply.elems: array expected");
                                message.elems = [];
                                for (var i = 0; i < object.elems.length; ++i) {
                                    if (typeof object.elems[i] !== "object")
                                        throw TypeError(".bilibili.community.service.dm.v1.DmSegOttReply.elems: object expected");
                                    message.elems[i] = $root.bilibili.community.service.dm.v1.DanmakuElem.fromObject(object.elems[i]);
                                }
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a DmSegOttReply message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.DmSegOttReply} message DmSegOttReply
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DmSegOttReply.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.elems = [];
                            if (options.defaults)
                                object.closed = false;
                            if (message.closed != null && message.hasOwnProperty("closed"))
                                object.closed = message.closed;
                            if (message.elems && message.elems.length) {
                                object.elems = [];
                                for (var j = 0; j < message.elems.length; ++j)
                                    object.elems[j] = $root.bilibili.community.service.dm.v1.DanmakuElem.toObject(message.elems[j], options);
                            }
                            return object;
                        };

                        /**
                         * Converts this DmSegOttReply to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DmSegOttReply
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DmSegOttReply.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DmSegOttReply;
                    })();

                    v1.DmSegMobileReq = (function() {

                        /**
                         * Properties of a DmSegMobileReq.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDmSegMobileReq
                         * @property {number|Long|null} [pid] DmSegMobileReq pid
                         * @property {number|Long|null} [oid] DmSegMobileReq oid
                         * @property {number|null} [type] DmSegMobileReq type
                         * @property {number|Long|null} [segmentIndex] DmSegMobileReq segmentIndex
                         * @property {number|null} [teenagersMode] DmSegMobileReq teenagersMode
                         */

                        /**
                         * Constructs a new DmSegMobileReq.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DmSegMobileReq.
                         * @implements IDmSegMobileReq
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDmSegMobileReq=} [properties] Properties to set
                         */
                        function DmSegMobileReq(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DmSegMobileReq pid.
                         * @member {number|Long} pid
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @instance
                         */
                        DmSegMobileReq.prototype.pid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DmSegMobileReq oid.
                         * @member {number|Long} oid
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @instance
                         */
                        DmSegMobileReq.prototype.oid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DmSegMobileReq type.
                         * @member {number} type
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @instance
                         */
                        DmSegMobileReq.prototype.type = 0;

                        /**
                         * DmSegMobileReq segmentIndex.
                         * @member {number|Long} segmentIndex
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @instance
                         */
                        DmSegMobileReq.prototype.segmentIndex = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DmSegMobileReq teenagersMode.
                         * @member {number} teenagersMode
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @instance
                         */
                        DmSegMobileReq.prototype.teenagersMode = 0;

                        /**
                         * Creates a new DmSegMobileReq instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegMobileReq=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DmSegMobileReq} DmSegMobileReq instance
                         */
                        DmSegMobileReq.create = function create(properties) {
                            return new DmSegMobileReq(properties);
                        };

                        /**
                         * Encodes the specified DmSegMobileReq message. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegMobileReq.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegMobileReq} message DmSegMobileReq message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegMobileReq.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.pid);
                            if (message.oid != null && Object.hasOwnProperty.call(message, "oid"))
                                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.oid);
                            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.type);
                            if (message.segmentIndex != null && Object.hasOwnProperty.call(message, "segmentIndex"))
                                writer.uint32(/* id 4, wireType 0 =*/32).int64(message.segmentIndex);
                            if (message.teenagersMode != null && Object.hasOwnProperty.call(message, "teenagersMode"))
                                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.teenagersMode);
                            return writer;
                        };

                        /**
                         * Encodes the specified DmSegMobileReq message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegMobileReq.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegMobileReq} message DmSegMobileReq message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegMobileReq.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DmSegMobileReq message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DmSegMobileReq} DmSegMobileReq
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegMobileReq.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DmSegMobileReq();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.pid = reader.int64();
                                        break;
                                    case 2:
                                        message.oid = reader.int64();
                                        break;
                                    case 3:
                                        message.type = reader.int32();
                                        break;
                                    case 4:
                                        message.segmentIndex = reader.int64();
                                        break;
                                    case 5:
                                        message.teenagersMode = reader.int32();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DmSegMobileReq message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DmSegMobileReq} DmSegMobileReq
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegMobileReq.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DmSegMobileReq message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DmSegMobileReq.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.pid != null && message.hasOwnProperty("pid"))
                                if (!$util.isInteger(message.pid) && !(message.pid && $util.isInteger(message.pid.low) && $util.isInteger(message.pid.high)))
                                    return "pid: integer|Long expected";
                            if (message.oid != null && message.hasOwnProperty("oid"))
                                if (!$util.isInteger(message.oid) && !(message.oid && $util.isInteger(message.oid.low) && $util.isInteger(message.oid.high)))
                                    return "oid: integer|Long expected";
                            if (message.type != null && message.hasOwnProperty("type"))
                                if (!$util.isInteger(message.type))
                                    return "type: integer expected";
                            if (message.segmentIndex != null && message.hasOwnProperty("segmentIndex"))
                                if (!$util.isInteger(message.segmentIndex) && !(message.segmentIndex && $util.isInteger(message.segmentIndex.low) && $util.isInteger(message.segmentIndex.high)))
                                    return "segmentIndex: integer|Long expected";
                            if (message.teenagersMode != null && message.hasOwnProperty("teenagersMode"))
                                if (!$util.isInteger(message.teenagersMode))
                                    return "teenagersMode: integer expected";
                            return null;
                        };

                        /**
                         * Creates a DmSegMobileReq message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DmSegMobileReq} DmSegMobileReq
                         */
                        DmSegMobileReq.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DmSegMobileReq)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DmSegMobileReq();
                            if (object.pid != null)
                                if ($util.Long)
                                    (message.pid = $util.Long.fromValue(object.pid)).unsigned = false;
                                else if (typeof object.pid === "string")
                                    message.pid = parseInt(object.pid, 10);
                                else if (typeof object.pid === "number")
                                    message.pid = object.pid;
                                else if (typeof object.pid === "object")
                                    message.pid = new $util.LongBits(object.pid.low >>> 0, object.pid.high >>> 0).toNumber();
                            if (object.oid != null)
                                if ($util.Long)
                                    (message.oid = $util.Long.fromValue(object.oid)).unsigned = false;
                                else if (typeof object.oid === "string")
                                    message.oid = parseInt(object.oid, 10);
                                else if (typeof object.oid === "number")
                                    message.oid = object.oid;
                                else if (typeof object.oid === "object")
                                    message.oid = new $util.LongBits(object.oid.low >>> 0, object.oid.high >>> 0).toNumber();
                            if (object.type != null)
                                message.type = object.type | 0;
                            if (object.segmentIndex != null)
                                if ($util.Long)
                                    (message.segmentIndex = $util.Long.fromValue(object.segmentIndex)).unsigned = false;
                                else if (typeof object.segmentIndex === "string")
                                    message.segmentIndex = parseInt(object.segmentIndex, 10);
                                else if (typeof object.segmentIndex === "number")
                                    message.segmentIndex = object.segmentIndex;
                                else if (typeof object.segmentIndex === "object")
                                    message.segmentIndex = new $util.LongBits(object.segmentIndex.low >>> 0, object.segmentIndex.high >>> 0).toNumber();
                            if (object.teenagersMode != null)
                                message.teenagersMode = object.teenagersMode | 0;
                            return message;
                        };

                        /**
                         * Creates a plain object from a DmSegMobileReq message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.DmSegMobileReq} message DmSegMobileReq
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DmSegMobileReq.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.pid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.pid = options.longs === String ? "0" : 0;
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.oid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.oid = options.longs === String ? "0" : 0;
                                object.type = 0;
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.segmentIndex = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.segmentIndex = options.longs === String ? "0" : 0;
                                object.teenagersMode = 0;
                            }
                            if (message.pid != null && message.hasOwnProperty("pid"))
                                if (typeof message.pid === "number")
                                    object.pid = options.longs === String ? String(message.pid) : message.pid;
                                else
                                    object.pid = options.longs === String ? $util.Long.prototype.toString.call(message.pid) : options.longs === Number ? new $util.LongBits(message.pid.low >>> 0, message.pid.high >>> 0).toNumber() : message.pid;
                            if (message.oid != null && message.hasOwnProperty("oid"))
                                if (typeof message.oid === "number")
                                    object.oid = options.longs === String ? String(message.oid) : message.oid;
                                else
                                    object.oid = options.longs === String ? $util.Long.prototype.toString.call(message.oid) : options.longs === Number ? new $util.LongBits(message.oid.low >>> 0, message.oid.high >>> 0).toNumber() : message.oid;
                            if (message.type != null && message.hasOwnProperty("type"))
                                object.type = message.type;
                            if (message.segmentIndex != null && message.hasOwnProperty("segmentIndex"))
                                if (typeof message.segmentIndex === "number")
                                    object.segmentIndex = options.longs === String ? String(message.segmentIndex) : message.segmentIndex;
                                else
                                    object.segmentIndex = options.longs === String ? $util.Long.prototype.toString.call(message.segmentIndex) : options.longs === Number ? new $util.LongBits(message.segmentIndex.low >>> 0, message.segmentIndex.high >>> 0).toNumber() : message.segmentIndex;
                            if (message.teenagersMode != null && message.hasOwnProperty("teenagersMode"))
                                object.teenagersMode = message.teenagersMode;
                            return object;
                        };

                        /**
                         * Converts this DmSegMobileReq to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReq
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DmSegMobileReq.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DmSegMobileReq;
                    })();

                    v1.DmSegMobileReply = (function() {

                        /**
                         * Properties of a DmSegMobileReply.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDmSegMobileReply
                         * @property {Array.<bilibili.community.service.dm.v1.IDanmakuElem>|null} [elems] DmSegMobileReply elems
                         * @property {number|null} [state] DmSegMobileReply state
                         * @property {bilibili.community.service.dm.v1.IDanmakuAIFlag|null} [aiFlag] DmSegMobileReply aiFlag
                         */

                        /**
                         * Constructs a new DmSegMobileReply.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DmSegMobileReply.
                         * @implements IDmSegMobileReply
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDmSegMobileReply=} [properties] Properties to set
                         */
                        function DmSegMobileReply(properties) {
                            this.elems = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DmSegMobileReply elems.
                         * @member {Array.<bilibili.community.service.dm.v1.IDanmakuElem>} elems
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReply
                         * @instance
                         */
                        DmSegMobileReply.prototype.elems = $util.emptyArray;

                        /**
                         * DmSegMobileReply state.
                         * @member {number} state
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReply
                         * @instance
                         */
                        DmSegMobileReply.prototype.state = 0;

                        /**
                         * DmSegMobileReply aiFlag.
                         * @member {bilibili.community.service.dm.v1.IDanmakuAIFlag|null|undefined} aiFlag
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReply
                         * @instance
                         */
                        DmSegMobileReply.prototype.aiFlag = null;

                        /**
                         * Creates a new DmSegMobileReply instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegMobileReply=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DmSegMobileReply} DmSegMobileReply instance
                         */
                        DmSegMobileReply.create = function create(properties) {
                            return new DmSegMobileReply(properties);
                        };

                        /**
                         * Encodes the specified DmSegMobileReply message. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegMobileReply.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegMobileReply} message DmSegMobileReply message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegMobileReply.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.elems != null && message.elems.length)
                                for (var i = 0; i < message.elems.length; ++i)
                                    $root.bilibili.community.service.dm.v1.DanmakuElem.encode(message.elems[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                            if (message.state != null && Object.hasOwnProperty.call(message, "state"))
                                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.state);
                            if (message.aiFlag != null && Object.hasOwnProperty.call(message, "aiFlag"))
                                $root.bilibili.community.service.dm.v1.DanmakuAIFlag.encode(message.aiFlag, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified DmSegMobileReply message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegMobileReply.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegMobileReply} message DmSegMobileReply message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegMobileReply.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DmSegMobileReply message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReply
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DmSegMobileReply} DmSegMobileReply
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegMobileReply.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DmSegMobileReply();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        if (!(message.elems && message.elems.length))
                                            message.elems = [];
                                        message.elems.push($root.bilibili.community.service.dm.v1.DanmakuElem.decode(reader, reader.uint32()));
                                        break;
                                    case 2:
                                        message.state = reader.int32();
                                        break;
                                    case 3:
                                        message.aiFlag = $root.bilibili.community.service.dm.v1.DanmakuAIFlag.decode(reader, reader.uint32());
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DmSegMobileReply message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReply
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DmSegMobileReply} DmSegMobileReply
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegMobileReply.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DmSegMobileReply message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReply
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DmSegMobileReply.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.elems != null && message.hasOwnProperty("elems")) {
                                if (!Array.isArray(message.elems))
                                    return "elems: array expected";
                                for (var i = 0; i < message.elems.length; ++i) {
                                    var error = $root.bilibili.community.service.dm.v1.DanmakuElem.verify(message.elems[i]);
                                    if (error)
                                        return "elems." + error;
                                }
                            }
                            if (message.state != null && message.hasOwnProperty("state"))
                                if (!$util.isInteger(message.state))
                                    return "state: integer expected";
                            if (message.aiFlag != null && message.hasOwnProperty("aiFlag")) {
                                var error = $root.bilibili.community.service.dm.v1.DanmakuAIFlag.verify(message.aiFlag);
                                if (error)
                                    return "aiFlag." + error;
                            }
                            return null;
                        };

                        /**
                         * Creates a DmSegMobileReply message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReply
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DmSegMobileReply} DmSegMobileReply
                         */
                        DmSegMobileReply.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DmSegMobileReply)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DmSegMobileReply();
                            if (object.elems) {
                                if (!Array.isArray(object.elems))
                                    throw TypeError(".bilibili.community.service.dm.v1.DmSegMobileReply.elems: array expected");
                                message.elems = [];
                                for (var i = 0; i < object.elems.length; ++i) {
                                    if (typeof object.elems[i] !== "object")
                                        throw TypeError(".bilibili.community.service.dm.v1.DmSegMobileReply.elems: object expected");
                                    message.elems[i] = $root.bilibili.community.service.dm.v1.DanmakuElem.fromObject(object.elems[i]);
                                }
                            }
                            if (object.state != null)
                                message.state = object.state | 0;
                            if (object.aiFlag != null) {
                                if (typeof object.aiFlag !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmSegMobileReply.aiFlag: object expected");
                                message.aiFlag = $root.bilibili.community.service.dm.v1.DanmakuAIFlag.fromObject(object.aiFlag);
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a DmSegMobileReply message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.DmSegMobileReply} message DmSegMobileReply
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DmSegMobileReply.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.elems = [];
                            if (options.defaults) {
                                object.state = 0;
                                object.aiFlag = null;
                            }
                            if (message.elems && message.elems.length) {
                                object.elems = [];
                                for (var j = 0; j < message.elems.length; ++j)
                                    object.elems[j] = $root.bilibili.community.service.dm.v1.DanmakuElem.toObject(message.elems[j], options);
                            }
                            if (message.state != null && message.hasOwnProperty("state"))
                                object.state = message.state;
                            if (message.aiFlag != null && message.hasOwnProperty("aiFlag"))
                                object.aiFlag = $root.bilibili.community.service.dm.v1.DanmakuAIFlag.toObject(message.aiFlag, options);
                            return object;
                        };

                        /**
                         * Converts this DmSegMobileReply to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DmSegMobileReply
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DmSegMobileReply.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DmSegMobileReply;
                    })();

                    v1.DmViewReq = (function() {

                        /**
                         * Properties of a DmViewReq.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDmViewReq
                         * @property {number|Long|null} [pid] DmViewReq pid
                         * @property {number|Long|null} [oid] DmViewReq oid
                         * @property {number|null} [type] DmViewReq type
                         * @property {string|null} [spmid] DmViewReq spmid
                         * @property {number|null} [isHardBoot] DmViewReq isHardBoot
                         */

                        /**
                         * Constructs a new DmViewReq.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DmViewReq.
                         * @implements IDmViewReq
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDmViewReq=} [properties] Properties to set
                         */
                        function DmViewReq(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DmViewReq pid.
                         * @member {number|Long} pid
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @instance
                         */
                        DmViewReq.prototype.pid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DmViewReq oid.
                         * @member {number|Long} oid
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @instance
                         */
                        DmViewReq.prototype.oid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DmViewReq type.
                         * @member {number} type
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @instance
                         */
                        DmViewReq.prototype.type = 0;

                        /**
                         * DmViewReq spmid.
                         * @member {string} spmid
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @instance
                         */
                        DmViewReq.prototype.spmid = "";

                        /**
                         * DmViewReq isHardBoot.
                         * @member {number} isHardBoot
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @instance
                         */
                        DmViewReq.prototype.isHardBoot = 0;

                        /**
                         * Creates a new DmViewReq instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmViewReq=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DmViewReq} DmViewReq instance
                         */
                        DmViewReq.create = function create(properties) {
                            return new DmViewReq(properties);
                        };

                        /**
                         * Encodes the specified DmViewReq message. Does not implicitly {@link bilibili.community.service.dm.v1.DmViewReq.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmViewReq} message DmViewReq message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmViewReq.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.pid != null && Object.hasOwnProperty.call(message, "pid"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.pid);
                            if (message.oid != null && Object.hasOwnProperty.call(message, "oid"))
                                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.oid);
                            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.type);
                            if (message.spmid != null && Object.hasOwnProperty.call(message, "spmid"))
                                writer.uint32(/* id 4, wireType 2 =*/34).string(message.spmid);
                            if (message.isHardBoot != null && Object.hasOwnProperty.call(message, "isHardBoot"))
                                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.isHardBoot);
                            return writer;
                        };

                        /**
                         * Encodes the specified DmViewReq message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DmViewReq.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmViewReq} message DmViewReq message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmViewReq.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DmViewReq message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DmViewReq} DmViewReq
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmViewReq.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DmViewReq();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.pid = reader.int64();
                                        break;
                                    case 2:
                                        message.oid = reader.int64();
                                        break;
                                    case 3:
                                        message.type = reader.int32();
                                        break;
                                    case 4:
                                        message.spmid = reader.string();
                                        break;
                                    case 5:
                                        message.isHardBoot = reader.int32();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DmViewReq message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DmViewReq} DmViewReq
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmViewReq.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DmViewReq message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DmViewReq.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.pid != null && message.hasOwnProperty("pid"))
                                if (!$util.isInteger(message.pid) && !(message.pid && $util.isInteger(message.pid.low) && $util.isInteger(message.pid.high)))
                                    return "pid: integer|Long expected";
                            if (message.oid != null && message.hasOwnProperty("oid"))
                                if (!$util.isInteger(message.oid) && !(message.oid && $util.isInteger(message.oid.low) && $util.isInteger(message.oid.high)))
                                    return "oid: integer|Long expected";
                            if (message.type != null && message.hasOwnProperty("type"))
                                if (!$util.isInteger(message.type))
                                    return "type: integer expected";
                            if (message.spmid != null && message.hasOwnProperty("spmid"))
                                if (!$util.isString(message.spmid))
                                    return "spmid: string expected";
                            if (message.isHardBoot != null && message.hasOwnProperty("isHardBoot"))
                                if (!$util.isInteger(message.isHardBoot))
                                    return "isHardBoot: integer expected";
                            return null;
                        };

                        /**
                         * Creates a DmViewReq message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DmViewReq} DmViewReq
                         */
                        DmViewReq.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DmViewReq)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DmViewReq();
                            if (object.pid != null)
                                if ($util.Long)
                                    (message.pid = $util.Long.fromValue(object.pid)).unsigned = false;
                                else if (typeof object.pid === "string")
                                    message.pid = parseInt(object.pid, 10);
                                else if (typeof object.pid === "number")
                                    message.pid = object.pid;
                                else if (typeof object.pid === "object")
                                    message.pid = new $util.LongBits(object.pid.low >>> 0, object.pid.high >>> 0).toNumber();
                            if (object.oid != null)
                                if ($util.Long)
                                    (message.oid = $util.Long.fromValue(object.oid)).unsigned = false;
                                else if (typeof object.oid === "string")
                                    message.oid = parseInt(object.oid, 10);
                                else if (typeof object.oid === "number")
                                    message.oid = object.oid;
                                else if (typeof object.oid === "object")
                                    message.oid = new $util.LongBits(object.oid.low >>> 0, object.oid.high >>> 0).toNumber();
                            if (object.type != null)
                                message.type = object.type | 0;
                            if (object.spmid != null)
                                message.spmid = String(object.spmid);
                            if (object.isHardBoot != null)
                                message.isHardBoot = object.isHardBoot | 0;
                            return message;
                        };

                        /**
                         * Creates a plain object from a DmViewReq message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.DmViewReq} message DmViewReq
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DmViewReq.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.pid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.pid = options.longs === String ? "0" : 0;
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.oid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.oid = options.longs === String ? "0" : 0;
                                object.type = 0;
                                object.spmid = "";
                                object.isHardBoot = 0;
                            }
                            if (message.pid != null && message.hasOwnProperty("pid"))
                                if (typeof message.pid === "number")
                                    object.pid = options.longs === String ? String(message.pid) : message.pid;
                                else
                                    object.pid = options.longs === String ? $util.Long.prototype.toString.call(message.pid) : options.longs === Number ? new $util.LongBits(message.pid.low >>> 0, message.pid.high >>> 0).toNumber() : message.pid;
                            if (message.oid != null && message.hasOwnProperty("oid"))
                                if (typeof message.oid === "number")
                                    object.oid = options.longs === String ? String(message.oid) : message.oid;
                                else
                                    object.oid = options.longs === String ? $util.Long.prototype.toString.call(message.oid) : options.longs === Number ? new $util.LongBits(message.oid.low >>> 0, message.oid.high >>> 0).toNumber() : message.oid;
                            if (message.type != null && message.hasOwnProperty("type"))
                                object.type = message.type;
                            if (message.spmid != null && message.hasOwnProperty("spmid"))
                                object.spmid = message.spmid;
                            if (message.isHardBoot != null && message.hasOwnProperty("isHardBoot"))
                                object.isHardBoot = message.isHardBoot;
                            return object;
                        };

                        /**
                         * Converts this DmViewReq to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DmViewReq
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DmViewReq.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DmViewReq;
                    })();

                    v1.DmViewReply = (function() {

                        /**
                         * Properties of a DmViewReply.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDmViewReply
                         * @property {boolean|null} [closed] DmViewReply closed
                         * @property {bilibili.community.service.dm.v1.IVideoMask|null} [mask] DmViewReply mask
                         * @property {bilibili.community.service.dm.v1.IVideoSubtitle|null} [subtitle] DmViewReply subtitle
                         * @property {Array.<string>|null} [specialDms] DmViewReply specialDms
                         * @property {bilibili.community.service.dm.v1.IDanmakuFlagConfig|null} [aiFlag] DmViewReply aiFlag
                         * @property {bilibili.community.service.dm.v1.IDanmuPlayerViewConfig|null} [playerConfig] DmViewReply playerConfig
                         * @property {number|null} [sendBoxStyle] DmViewReply sendBoxStyle
                         * @property {boolean|null} [allow] DmViewReply allow
                         * @property {string|null} [checkBox] DmViewReply checkBox
                         * @property {string|null} [checkBoxShowMsg] DmViewReply checkBoxShowMsg
                         * @property {string|null} [textPlaceholder] DmViewReply textPlaceholder
                         * @property {string|null} [inputPlaceholder] DmViewReply inputPlaceholder
                         * @property {Array.<string>|null} [reportFilterContent] DmViewReply reportFilterContent
                         */

                        /**
                         * Constructs a new DmViewReply.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DmViewReply.
                         * @implements IDmViewReply
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDmViewReply=} [properties] Properties to set
                         */
                        function DmViewReply(properties) {
                            this.specialDms = [];
                            this.reportFilterContent = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DmViewReply closed.
                         * @member {boolean} closed
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.closed = false;

                        /**
                         * DmViewReply mask.
                         * @member {bilibili.community.service.dm.v1.IVideoMask|null|undefined} mask
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.mask = null;

                        /**
                         * DmViewReply subtitle.
                         * @member {bilibili.community.service.dm.v1.IVideoSubtitle|null|undefined} subtitle
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.subtitle = null;

                        /**
                         * DmViewReply specialDms.
                         * @member {Array.<string>} specialDms
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.specialDms = $util.emptyArray;

                        /**
                         * DmViewReply aiFlag.
                         * @member {bilibili.community.service.dm.v1.IDanmakuFlagConfig|null|undefined} aiFlag
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.aiFlag = null;

                        /**
                         * DmViewReply playerConfig.
                         * @member {bilibili.community.service.dm.v1.IDanmuPlayerViewConfig|null|undefined} playerConfig
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.playerConfig = null;

                        /**
                         * DmViewReply sendBoxStyle.
                         * @member {number} sendBoxStyle
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.sendBoxStyle = 0;

                        /**
                         * DmViewReply allow.
                         * @member {boolean} allow
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.allow = false;

                        /**
                         * DmViewReply checkBox.
                         * @member {string} checkBox
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.checkBox = "";

                        /**
                         * DmViewReply checkBoxShowMsg.
                         * @member {string} checkBoxShowMsg
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.checkBoxShowMsg = "";

                        /**
                         * DmViewReply textPlaceholder.
                         * @member {string} textPlaceholder
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.textPlaceholder = "";

                        /**
                         * DmViewReply inputPlaceholder.
                         * @member {string} inputPlaceholder
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.inputPlaceholder = "";

                        /**
                         * DmViewReply reportFilterContent.
                         * @member {Array.<string>} reportFilterContent
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         */
                        DmViewReply.prototype.reportFilterContent = $util.emptyArray;

                        /**
                         * Creates a new DmViewReply instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmViewReply=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DmViewReply} DmViewReply instance
                         */
                        DmViewReply.create = function create(properties) {
                            return new DmViewReply(properties);
                        };

                        /**
                         * Encodes the specified DmViewReply message. Does not implicitly {@link bilibili.community.service.dm.v1.DmViewReply.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmViewReply} message DmViewReply message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmViewReply.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.closed != null && Object.hasOwnProperty.call(message, "closed"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.closed);
                            if (message.mask != null && Object.hasOwnProperty.call(message, "mask"))
                                $root.bilibili.community.service.dm.v1.VideoMask.encode(message.mask, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                            if (message.subtitle != null && Object.hasOwnProperty.call(message, "subtitle"))
                                $root.bilibili.community.service.dm.v1.VideoSubtitle.encode(message.subtitle, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                            if (message.specialDms != null && message.specialDms.length)
                                for (var i = 0; i < message.specialDms.length; ++i)
                                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.specialDms[i]);
                            if (message.aiFlag != null && Object.hasOwnProperty.call(message, "aiFlag"))
                                $root.bilibili.community.service.dm.v1.DanmakuFlagConfig.encode(message.aiFlag, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                            if (message.playerConfig != null && Object.hasOwnProperty.call(message, "playerConfig"))
                                $root.bilibili.community.service.dm.v1.DanmuPlayerViewConfig.encode(message.playerConfig, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                            if (message.sendBoxStyle != null && Object.hasOwnProperty.call(message, "sendBoxStyle"))
                                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.sendBoxStyle);
                            if (message.allow != null && Object.hasOwnProperty.call(message, "allow"))
                                writer.uint32(/* id 8, wireType 0 =*/64).bool(message.allow);
                            if (message.checkBox != null && Object.hasOwnProperty.call(message, "checkBox"))
                                writer.uint32(/* id 9, wireType 2 =*/74).string(message.checkBox);
                            if (message.checkBoxShowMsg != null && Object.hasOwnProperty.call(message, "checkBoxShowMsg"))
                                writer.uint32(/* id 10, wireType 2 =*/82).string(message.checkBoxShowMsg);
                            if (message.textPlaceholder != null && Object.hasOwnProperty.call(message, "textPlaceholder"))
                                writer.uint32(/* id 11, wireType 2 =*/90).string(message.textPlaceholder);
                            if (message.inputPlaceholder != null && Object.hasOwnProperty.call(message, "inputPlaceholder"))
                                writer.uint32(/* id 12, wireType 2 =*/98).string(message.inputPlaceholder);
                            if (message.reportFilterContent != null && message.reportFilterContent.length)
                                for (var i = 0; i < message.reportFilterContent.length; ++i)
                                    writer.uint32(/* id 13, wireType 2 =*/106).string(message.reportFilterContent[i]);
                            return writer;
                        };

                        /**
                         * Encodes the specified DmViewReply message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DmViewReply.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmViewReply} message DmViewReply message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmViewReply.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DmViewReply message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DmViewReply} DmViewReply
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmViewReply.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DmViewReply();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.closed = reader.bool();
                                        break;
                                    case 2:
                                        message.mask = $root.bilibili.community.service.dm.v1.VideoMask.decode(reader, reader.uint32());
                                        break;
                                    case 3:
                                        message.subtitle = $root.bilibili.community.service.dm.v1.VideoSubtitle.decode(reader, reader.uint32());
                                        break;
                                    case 4:
                                        if (!(message.specialDms && message.specialDms.length))
                                            message.specialDms = [];
                                        message.specialDms.push(reader.string());
                                        break;
                                    case 5:
                                        message.aiFlag = $root.bilibili.community.service.dm.v1.DanmakuFlagConfig.decode(reader, reader.uint32());
                                        break;
                                    case 6:
                                        message.playerConfig = $root.bilibili.community.service.dm.v1.DanmuPlayerViewConfig.decode(reader, reader.uint32());
                                        break;
                                    case 7:
                                        message.sendBoxStyle = reader.int32();
                                        break;
                                    case 8:
                                        message.allow = reader.bool();
                                        break;
                                    case 9:
                                        message.checkBox = reader.string();
                                        break;
                                    case 10:
                                        message.checkBoxShowMsg = reader.string();
                                        break;
                                    case 11:
                                        message.textPlaceholder = reader.string();
                                        break;
                                    case 12:
                                        message.inputPlaceholder = reader.string();
                                        break;
                                    case 13:
                                        if (!(message.reportFilterContent && message.reportFilterContent.length))
                                            message.reportFilterContent = [];
                                        message.reportFilterContent.push(reader.string());
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DmViewReply message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DmViewReply} DmViewReply
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmViewReply.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DmViewReply message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DmViewReply.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.closed != null && message.hasOwnProperty("closed"))
                                if (typeof message.closed !== "boolean")
                                    return "closed: boolean expected";
                            if (message.mask != null && message.hasOwnProperty("mask")) {
                                var error = $root.bilibili.community.service.dm.v1.VideoMask.verify(message.mask);
                                if (error)
                                    return "mask." + error;
                            }
                            if (message.subtitle != null && message.hasOwnProperty("subtitle")) {
                                var error = $root.bilibili.community.service.dm.v1.VideoSubtitle.verify(message.subtitle);
                                if (error)
                                    return "subtitle." + error;
                            }
                            if (message.specialDms != null && message.hasOwnProperty("specialDms")) {
                                if (!Array.isArray(message.specialDms))
                                    return "specialDms: array expected";
                                for (var i = 0; i < message.specialDms.length; ++i)
                                    if (!$util.isString(message.specialDms[i]))
                                        return "specialDms: string[] expected";
                            }
                            if (message.aiFlag != null && message.hasOwnProperty("aiFlag")) {
                                var error = $root.bilibili.community.service.dm.v1.DanmakuFlagConfig.verify(message.aiFlag);
                                if (error)
                                    return "aiFlag." + error;
                            }
                            if (message.playerConfig != null && message.hasOwnProperty("playerConfig")) {
                                var error = $root.bilibili.community.service.dm.v1.DanmuPlayerViewConfig.verify(message.playerConfig);
                                if (error)
                                    return "playerConfig." + error;
                            }
                            if (message.sendBoxStyle != null && message.hasOwnProperty("sendBoxStyle"))
                                if (!$util.isInteger(message.sendBoxStyle))
                                    return "sendBoxStyle: integer expected";
                            if (message.allow != null && message.hasOwnProperty("allow"))
                                if (typeof message.allow !== "boolean")
                                    return "allow: boolean expected";
                            if (message.checkBox != null && message.hasOwnProperty("checkBox"))
                                if (!$util.isString(message.checkBox))
                                    return "checkBox: string expected";
                            if (message.checkBoxShowMsg != null && message.hasOwnProperty("checkBoxShowMsg"))
                                if (!$util.isString(message.checkBoxShowMsg))
                                    return "checkBoxShowMsg: string expected";
                            if (message.textPlaceholder != null && message.hasOwnProperty("textPlaceholder"))
                                if (!$util.isString(message.textPlaceholder))
                                    return "textPlaceholder: string expected";
                            if (message.inputPlaceholder != null && message.hasOwnProperty("inputPlaceholder"))
                                if (!$util.isString(message.inputPlaceholder))
                                    return "inputPlaceholder: string expected";
                            if (message.reportFilterContent != null && message.hasOwnProperty("reportFilterContent")) {
                                if (!Array.isArray(message.reportFilterContent))
                                    return "reportFilterContent: array expected";
                                for (var i = 0; i < message.reportFilterContent.length; ++i)
                                    if (!$util.isString(message.reportFilterContent[i]))
                                        return "reportFilterContent: string[] expected";
                            }
                            return null;
                        };

                        /**
                         * Creates a DmViewReply message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DmViewReply} DmViewReply
                         */
                        DmViewReply.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DmViewReply)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DmViewReply();
                            if (object.closed != null)
                                message.closed = Boolean(object.closed);
                            if (object.mask != null) {
                                if (typeof object.mask !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmViewReply.mask: object expected");
                                message.mask = $root.bilibili.community.service.dm.v1.VideoMask.fromObject(object.mask);
                            }
                            if (object.subtitle != null) {
                                if (typeof object.subtitle !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmViewReply.subtitle: object expected");
                                message.subtitle = $root.bilibili.community.service.dm.v1.VideoSubtitle.fromObject(object.subtitle);
                            }
                            if (object.specialDms) {
                                if (!Array.isArray(object.specialDms))
                                    throw TypeError(".bilibili.community.service.dm.v1.DmViewReply.specialDms: array expected");
                                message.specialDms = [];
                                for (var i = 0; i < object.specialDms.length; ++i)
                                    message.specialDms[i] = String(object.specialDms[i]);
                            }
                            if (object.aiFlag != null) {
                                if (typeof object.aiFlag !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmViewReply.aiFlag: object expected");
                                message.aiFlag = $root.bilibili.community.service.dm.v1.DanmakuFlagConfig.fromObject(object.aiFlag);
                            }
                            if (object.playerConfig != null) {
                                if (typeof object.playerConfig !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmViewReply.playerConfig: object expected");
                                message.playerConfig = $root.bilibili.community.service.dm.v1.DanmuPlayerViewConfig.fromObject(object.playerConfig);
                            }
                            if (object.sendBoxStyle != null)
                                message.sendBoxStyle = object.sendBoxStyle | 0;
                            if (object.allow != null)
                                message.allow = Boolean(object.allow);
                            if (object.checkBox != null)
                                message.checkBox = String(object.checkBox);
                            if (object.checkBoxShowMsg != null)
                                message.checkBoxShowMsg = String(object.checkBoxShowMsg);
                            if (object.textPlaceholder != null)
                                message.textPlaceholder = String(object.textPlaceholder);
                            if (object.inputPlaceholder != null)
                                message.inputPlaceholder = String(object.inputPlaceholder);
                            if (object.reportFilterContent) {
                                if (!Array.isArray(object.reportFilterContent))
                                    throw TypeError(".bilibili.community.service.dm.v1.DmViewReply.reportFilterContent: array expected");
                                message.reportFilterContent = [];
                                for (var i = 0; i < object.reportFilterContent.length; ++i)
                                    message.reportFilterContent[i] = String(object.reportFilterContent[i]);
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a DmViewReply message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.DmViewReply} message DmViewReply
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DmViewReply.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults) {
                                object.specialDms = [];
                                object.reportFilterContent = [];
                            }
                            if (options.defaults) {
                                object.closed = false;
                                object.mask = null;
                                object.subtitle = null;
                                object.aiFlag = null;
                                object.playerConfig = null;
                                object.sendBoxStyle = 0;
                                object.allow = false;
                                object.checkBox = "";
                                object.checkBoxShowMsg = "";
                                object.textPlaceholder = "";
                                object.inputPlaceholder = "";
                            }
                            if (message.closed != null && message.hasOwnProperty("closed"))
                                object.closed = message.closed;
                            if (message.mask != null && message.hasOwnProperty("mask"))
                                object.mask = $root.bilibili.community.service.dm.v1.VideoMask.toObject(message.mask, options);
                            if (message.subtitle != null && message.hasOwnProperty("subtitle"))
                                object.subtitle = $root.bilibili.community.service.dm.v1.VideoSubtitle.toObject(message.subtitle, options);
                            if (message.specialDms && message.specialDms.length) {
                                object.specialDms = [];
                                for (var j = 0; j < message.specialDms.length; ++j)
                                    object.specialDms[j] = message.specialDms[j];
                            }
                            if (message.aiFlag != null && message.hasOwnProperty("aiFlag"))
                                object.aiFlag = $root.bilibili.community.service.dm.v1.DanmakuFlagConfig.toObject(message.aiFlag, options);
                            if (message.playerConfig != null && message.hasOwnProperty("playerConfig"))
                                object.playerConfig = $root.bilibili.community.service.dm.v1.DanmuPlayerViewConfig.toObject(message.playerConfig, options);
                            if (message.sendBoxStyle != null && message.hasOwnProperty("sendBoxStyle"))
                                object.sendBoxStyle = message.sendBoxStyle;
                            if (message.allow != null && message.hasOwnProperty("allow"))
                                object.allow = message.allow;
                            if (message.checkBox != null && message.hasOwnProperty("checkBox"))
                                object.checkBox = message.checkBox;
                            if (message.checkBoxShowMsg != null && message.hasOwnProperty("checkBoxShowMsg"))
                                object.checkBoxShowMsg = message.checkBoxShowMsg;
                            if (message.textPlaceholder != null && message.hasOwnProperty("textPlaceholder"))
                                object.textPlaceholder = message.textPlaceholder;
                            if (message.inputPlaceholder != null && message.hasOwnProperty("inputPlaceholder"))
                                object.inputPlaceholder = message.inputPlaceholder;
                            if (message.reportFilterContent && message.reportFilterContent.length) {
                                object.reportFilterContent = [];
                                for (var j = 0; j < message.reportFilterContent.length; ++j)
                                    object.reportFilterContent[j] = message.reportFilterContent[j];
                            }
                            return object;
                        };

                        /**
                         * Converts this DmViewReply to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DmViewReply
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DmViewReply.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DmViewReply;
                    })();

                    v1.DmWebViewReply = (function() {

                        /**
                         * Properties of a DmWebViewReply.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDmWebViewReply
                         * @property {number|null} [state] DmWebViewReply state
                         * @property {string|null} [text] DmWebViewReply text
                         * @property {string|null} [textSide] DmWebViewReply textSide
                         * @property {bilibili.community.service.dm.v1.IDmSegConfig|null} [dmSge] DmWebViewReply dmSge
                         * @property {bilibili.community.service.dm.v1.IDanmakuFlagConfig|null} [flag] DmWebViewReply flag
                         * @property {Array.<string>|null} [specialDms] DmWebViewReply specialDms
                         * @property {boolean|null} [checkBox] DmWebViewReply checkBox
                         * @property {number|Long|null} [count] DmWebViewReply count
                         * @property {Array.<bilibili.community.service.dm.v1.ICommandDm>|null} [commandDms] DmWebViewReply commandDms
                         * @property {bilibili.community.service.dm.v1.IDanmuWebPlayerConfig|null} [playerConfig] DmWebViewReply playerConfig
                         * @property {Array.<string>|null} [reportFilterContent] DmWebViewReply reportFilterContent
                         */

                        /**
                         * Constructs a new DmWebViewReply.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DmWebViewReply.
                         * @implements IDmWebViewReply
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDmWebViewReply=} [properties] Properties to set
                         */
                        function DmWebViewReply(properties) {
                            this.specialDms = [];
                            this.commandDms = [];
                            this.reportFilterContent = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DmWebViewReply state.
                         * @member {number} state
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @instance
                         */
                        DmWebViewReply.prototype.state = 0;

                        /**
                         * DmWebViewReply text.
                         * @member {string} text
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @instance
                         */
                        DmWebViewReply.prototype.text = "";

                        /**
                         * DmWebViewReply textSide.
                         * @member {string} textSide
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @instance
                         */
                        DmWebViewReply.prototype.textSide = "";

                        /**
                         * DmWebViewReply dmSge.
                         * @member {bilibili.community.service.dm.v1.IDmSegConfig|null|undefined} dmSge
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @instance
                         */
                        DmWebViewReply.prototype.dmSge = null;

                        /**
                         * DmWebViewReply flag.
                         * @member {bilibili.community.service.dm.v1.IDanmakuFlagConfig|null|undefined} flag
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @instance
                         */
                        DmWebViewReply.prototype.flag = null;

                        /**
                         * DmWebViewReply specialDms.
                         * @member {Array.<string>} specialDms
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @instance
                         */
                        DmWebViewReply.prototype.specialDms = $util.emptyArray;

                        /**
                         * DmWebViewReply checkBox.
                         * @member {boolean} checkBox
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @instance
                         */
                        DmWebViewReply.prototype.checkBox = false;

                        /**
                         * DmWebViewReply count.
                         * @member {number|Long} count
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @instance
                         */
                        DmWebViewReply.prototype.count = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DmWebViewReply commandDms.
                         * @member {Array.<bilibili.community.service.dm.v1.ICommandDm>} commandDms
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @instance
                         */
                        DmWebViewReply.prototype.commandDms = $util.emptyArray;

                        /**
                         * DmWebViewReply playerConfig.
                         * @member {bilibili.community.service.dm.v1.IDanmuWebPlayerConfig|null|undefined} playerConfig
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @instance
                         */
                        DmWebViewReply.prototype.playerConfig = null;

                        /**
                         * DmWebViewReply reportFilterContent.
                         * @member {Array.<string>} reportFilterContent
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @instance
                         */
                        DmWebViewReply.prototype.reportFilterContent = $util.emptyArray;

                        /**
                         * Creates a new DmWebViewReply instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmWebViewReply=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DmWebViewReply} DmWebViewReply instance
                         */
                        DmWebViewReply.create = function create(properties) {
                            return new DmWebViewReply(properties);
                        };

                        /**
                         * Encodes the specified DmWebViewReply message. Does not implicitly {@link bilibili.community.service.dm.v1.DmWebViewReply.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmWebViewReply} message DmWebViewReply message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmWebViewReply.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.state != null && Object.hasOwnProperty.call(message, "state"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.state);
                            if (message.text != null && Object.hasOwnProperty.call(message, "text"))
                                writer.uint32(/* id 2, wireType 2 =*/18).string(message.text);
                            if (message.textSide != null && Object.hasOwnProperty.call(message, "textSide"))
                                writer.uint32(/* id 3, wireType 2 =*/26).string(message.textSide);
                            if (message.dmSge != null && Object.hasOwnProperty.call(message, "dmSge"))
                                $root.bilibili.community.service.dm.v1.DmSegConfig.encode(message.dmSge, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                            if (message.flag != null && Object.hasOwnProperty.call(message, "flag"))
                                $root.bilibili.community.service.dm.v1.DanmakuFlagConfig.encode(message.flag, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                            if (message.specialDms != null && message.specialDms.length)
                                for (var i = 0; i < message.specialDms.length; ++i)
                                    writer.uint32(/* id 6, wireType 2 =*/50).string(message.specialDms[i]);
                            if (message.checkBox != null && Object.hasOwnProperty.call(message, "checkBox"))
                                writer.uint32(/* id 7, wireType 0 =*/56).bool(message.checkBox);
                            if (message.count != null && Object.hasOwnProperty.call(message, "count"))
                                writer.uint32(/* id 8, wireType 0 =*/64).int64(message.count);
                            if (message.commandDms != null && message.commandDms.length)
                                for (var i = 0; i < message.commandDms.length; ++i)
                                    $root.bilibili.community.service.dm.v1.CommandDm.encode(message.commandDms[i], writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
                            if (message.playerConfig != null && Object.hasOwnProperty.call(message, "playerConfig"))
                                $root.bilibili.community.service.dm.v1.DanmuWebPlayerConfig.encode(message.playerConfig, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
                            if (message.reportFilterContent != null && message.reportFilterContent.length)
                                for (var i = 0; i < message.reportFilterContent.length; ++i)
                                    writer.uint32(/* id 11, wireType 2 =*/90).string(message.reportFilterContent[i]);
                            return writer;
                        };

                        /**
                         * Encodes the specified DmWebViewReply message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DmWebViewReply.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmWebViewReply} message DmWebViewReply message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmWebViewReply.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DmWebViewReply message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DmWebViewReply} DmWebViewReply
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmWebViewReply.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DmWebViewReply();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.state = reader.int32();
                                        break;
                                    case 2:
                                        message.text = reader.string();
                                        break;
                                    case 3:
                                        message.textSide = reader.string();
                                        break;
                                    case 4:
                                        message.dmSge = $root.bilibili.community.service.dm.v1.DmSegConfig.decode(reader, reader.uint32());
                                        break;
                                    case 5:
                                        message.flag = $root.bilibili.community.service.dm.v1.DanmakuFlagConfig.decode(reader, reader.uint32());
                                        break;
                                    case 6:
                                        if (!(message.specialDms && message.specialDms.length))
                                            message.specialDms = [];
                                        message.specialDms.push(reader.string());
                                        break;
                                    case 7:
                                        message.checkBox = reader.bool();
                                        break;
                                    case 8:
                                        message.count = reader.int64();
                                        break;
                                    case 9:
                                        if (!(message.commandDms && message.commandDms.length))
                                            message.commandDms = [];
                                        message.commandDms.push($root.bilibili.community.service.dm.v1.CommandDm.decode(reader, reader.uint32()));
                                        break;
                                    case 10:
                                        message.playerConfig = $root.bilibili.community.service.dm.v1.DanmuWebPlayerConfig.decode(reader, reader.uint32());
                                        break;
                                    case 11:
                                        if (!(message.reportFilterContent && message.reportFilterContent.length))
                                            message.reportFilterContent = [];
                                        message.reportFilterContent.push(reader.string());
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DmWebViewReply message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DmWebViewReply} DmWebViewReply
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmWebViewReply.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DmWebViewReply message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DmWebViewReply.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.state != null && message.hasOwnProperty("state"))
                                if (!$util.isInteger(message.state))
                                    return "state: integer expected";
                            if (message.text != null && message.hasOwnProperty("text"))
                                if (!$util.isString(message.text))
                                    return "text: string expected";
                            if (message.textSide != null && message.hasOwnProperty("textSide"))
                                if (!$util.isString(message.textSide))
                                    return "textSide: string expected";
                            if (message.dmSge != null && message.hasOwnProperty("dmSge")) {
                                var error = $root.bilibili.community.service.dm.v1.DmSegConfig.verify(message.dmSge);
                                if (error)
                                    return "dmSge." + error;
                            }
                            if (message.flag != null && message.hasOwnProperty("flag")) {
                                var error = $root.bilibili.community.service.dm.v1.DanmakuFlagConfig.verify(message.flag);
                                if (error)
                                    return "flag." + error;
                            }
                            if (message.specialDms != null && message.hasOwnProperty("specialDms")) {
                                if (!Array.isArray(message.specialDms))
                                    return "specialDms: array expected";
                                for (var i = 0; i < message.specialDms.length; ++i)
                                    if (!$util.isString(message.specialDms[i]))
                                        return "specialDms: string[] expected";
                            }
                            if (message.checkBox != null && message.hasOwnProperty("checkBox"))
                                if (typeof message.checkBox !== "boolean")
                                    return "checkBox: boolean expected";
                            if (message.count != null && message.hasOwnProperty("count"))
                                if (!$util.isInteger(message.count) && !(message.count && $util.isInteger(message.count.low) && $util.isInteger(message.count.high)))
                                    return "count: integer|Long expected";
                            if (message.commandDms != null && message.hasOwnProperty("commandDms")) {
                                if (!Array.isArray(message.commandDms))
                                    return "commandDms: array expected";
                                for (var i = 0; i < message.commandDms.length; ++i) {
                                    var error = $root.bilibili.community.service.dm.v1.CommandDm.verify(message.commandDms[i]);
                                    if (error)
                                        return "commandDms." + error;
                                }
                            }
                            if (message.playerConfig != null && message.hasOwnProperty("playerConfig")) {
                                var error = $root.bilibili.community.service.dm.v1.DanmuWebPlayerConfig.verify(message.playerConfig);
                                if (error)
                                    return "playerConfig." + error;
                            }
                            if (message.reportFilterContent != null && message.hasOwnProperty("reportFilterContent")) {
                                if (!Array.isArray(message.reportFilterContent))
                                    return "reportFilterContent: array expected";
                                for (var i = 0; i < message.reportFilterContent.length; ++i)
                                    if (!$util.isString(message.reportFilterContent[i]))
                                        return "reportFilterContent: string[] expected";
                            }
                            return null;
                        };

                        /**
                         * Creates a DmWebViewReply message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DmWebViewReply} DmWebViewReply
                         */
                        DmWebViewReply.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DmWebViewReply)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DmWebViewReply();
                            if (object.state != null)
                                message.state = object.state | 0;
                            if (object.text != null)
                                message.text = String(object.text);
                            if (object.textSide != null)
                                message.textSide = String(object.textSide);
                            if (object.dmSge != null) {
                                if (typeof object.dmSge !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmWebViewReply.dmSge: object expected");
                                message.dmSge = $root.bilibili.community.service.dm.v1.DmSegConfig.fromObject(object.dmSge);
                            }
                            if (object.flag != null) {
                                if (typeof object.flag !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmWebViewReply.flag: object expected");
                                message.flag = $root.bilibili.community.service.dm.v1.DanmakuFlagConfig.fromObject(object.flag);
                            }
                            if (object.specialDms) {
                                if (!Array.isArray(object.specialDms))
                                    throw TypeError(".bilibili.community.service.dm.v1.DmWebViewReply.specialDms: array expected");
                                message.specialDms = [];
                                for (var i = 0; i < object.specialDms.length; ++i)
                                    message.specialDms[i] = String(object.specialDms[i]);
                            }
                            if (object.checkBox != null)
                                message.checkBox = Boolean(object.checkBox);
                            if (object.count != null)
                                if ($util.Long)
                                    (message.count = $util.Long.fromValue(object.count)).unsigned = false;
                                else if (typeof object.count === "string")
                                    message.count = parseInt(object.count, 10);
                                else if (typeof object.count === "number")
                                    message.count = object.count;
                                else if (typeof object.count === "object")
                                    message.count = new $util.LongBits(object.count.low >>> 0, object.count.high >>> 0).toNumber();
                            if (object.commandDms) {
                                if (!Array.isArray(object.commandDms))
                                    throw TypeError(".bilibili.community.service.dm.v1.DmWebViewReply.commandDms: array expected");
                                message.commandDms = [];
                                for (var i = 0; i < object.commandDms.length; ++i) {
                                    if (typeof object.commandDms[i] !== "object")
                                        throw TypeError(".bilibili.community.service.dm.v1.DmWebViewReply.commandDms: object expected");
                                    message.commandDms[i] = $root.bilibili.community.service.dm.v1.CommandDm.fromObject(object.commandDms[i]);
                                }
                            }
                            if (object.playerConfig != null) {
                                if (typeof object.playerConfig !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmWebViewReply.playerConfig: object expected");
                                message.playerConfig = $root.bilibili.community.service.dm.v1.DanmuWebPlayerConfig.fromObject(object.playerConfig);
                            }
                            if (object.reportFilterContent) {
                                if (!Array.isArray(object.reportFilterContent))
                                    throw TypeError(".bilibili.community.service.dm.v1.DmWebViewReply.reportFilterContent: array expected");
                                message.reportFilterContent = [];
                                for (var i = 0; i < object.reportFilterContent.length; ++i)
                                    message.reportFilterContent[i] = String(object.reportFilterContent[i]);
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a DmWebViewReply message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @static
                         * @param {bilibili.community.service.dm.v1.DmWebViewReply} message DmWebViewReply
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DmWebViewReply.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults) {
                                object.specialDms = [];
                                object.commandDms = [];
                                object.reportFilterContent = [];
                            }
                            if (options.defaults) {
                                object.state = 0;
                                object.text = "";
                                object.textSide = "";
                                object.dmSge = null;
                                object.flag = null;
                                object.checkBox = false;
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.count = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.count = options.longs === String ? "0" : 0;
                                object.playerConfig = null;
                            }
                            if (message.state != null && message.hasOwnProperty("state"))
                                object.state = message.state;
                            if (message.text != null && message.hasOwnProperty("text"))
                                object.text = message.text;
                            if (message.textSide != null && message.hasOwnProperty("textSide"))
                                object.textSide = message.textSide;
                            if (message.dmSge != null && message.hasOwnProperty("dmSge"))
                                object.dmSge = $root.bilibili.community.service.dm.v1.DmSegConfig.toObject(message.dmSge, options);
                            if (message.flag != null && message.hasOwnProperty("flag"))
                                object.flag = $root.bilibili.community.service.dm.v1.DanmakuFlagConfig.toObject(message.flag, options);
                            if (message.specialDms && message.specialDms.length) {
                                object.specialDms = [];
                                for (var j = 0; j < message.specialDms.length; ++j)
                                    object.specialDms[j] = message.specialDms[j];
                            }
                            if (message.checkBox != null && message.hasOwnProperty("checkBox"))
                                object.checkBox = message.checkBox;
                            if (message.count != null && message.hasOwnProperty("count"))
                                if (typeof message.count === "number")
                                    object.count = options.longs === String ? String(message.count) : message.count;
                                else
                                    object.count = options.longs === String ? $util.Long.prototype.toString.call(message.count) : options.longs === Number ? new $util.LongBits(message.count.low >>> 0, message.count.high >>> 0).toNumber() : message.count;
                            if (message.commandDms && message.commandDms.length) {
                                object.commandDms = [];
                                for (var j = 0; j < message.commandDms.length; ++j)
                                    object.commandDms[j] = $root.bilibili.community.service.dm.v1.CommandDm.toObject(message.commandDms[j], options);
                            }
                            if (message.playerConfig != null && message.hasOwnProperty("playerConfig"))
                                object.playerConfig = $root.bilibili.community.service.dm.v1.DanmuWebPlayerConfig.toObject(message.playerConfig, options);
                            if (message.reportFilterContent && message.reportFilterContent.length) {
                                object.reportFilterContent = [];
                                for (var j = 0; j < message.reportFilterContent.length; ++j)
                                    object.reportFilterContent[j] = message.reportFilterContent[j];
                            }
                            return object;
                        };

                        /**
                         * Converts this DmWebViewReply to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DmWebViewReply
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DmWebViewReply.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DmWebViewReply;
                    })();

                    v1.CommandDm = (function() {

                        /**
                         * Properties of a CommandDm.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface ICommandDm
                         * @property {number|Long|null} [id] CommandDm id
                         * @property {number|Long|null} [oid] CommandDm oid
                         * @property {string|null} [mid] CommandDm mid
                         * @property {string|null} [command] CommandDm command
                         * @property {string|null} [content] CommandDm content
                         * @property {number|null} [progress] CommandDm progress
                         * @property {string|null} [ctime] CommandDm ctime
                         * @property {string|null} [mtime] CommandDm mtime
                         * @property {string|null} [extra] CommandDm extra
                         * @property {string|null} [idStr] CommandDm idStr
                         */

                        /**
                         * Constructs a new CommandDm.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a CommandDm.
                         * @implements ICommandDm
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.ICommandDm=} [properties] Properties to set
                         */
                        function CommandDm(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * CommandDm id.
                         * @member {number|Long} id
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @instance
                         */
                        CommandDm.prototype.id = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * CommandDm oid.
                         * @member {number|Long} oid
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @instance
                         */
                        CommandDm.prototype.oid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * CommandDm mid.
                         * @member {string} mid
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @instance
                         */
                        CommandDm.prototype.mid = "";

                        /**
                         * CommandDm command.
                         * @member {string} command
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @instance
                         */
                        CommandDm.prototype.command = "";

                        /**
                         * CommandDm content.
                         * @member {string} content
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @instance
                         */
                        CommandDm.prototype.content = "";

                        /**
                         * CommandDm progress.
                         * @member {number} progress
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @instance
                         */
                        CommandDm.prototype.progress = 0;

                        /**
                         * CommandDm ctime.
                         * @member {string} ctime
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @instance
                         */
                        CommandDm.prototype.ctime = "";

                        /**
                         * CommandDm mtime.
                         * @member {string} mtime
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @instance
                         */
                        CommandDm.prototype.mtime = "";

                        /**
                         * CommandDm extra.
                         * @member {string} extra
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @instance
                         */
                        CommandDm.prototype.extra = "";

                        /**
                         * CommandDm idStr.
                         * @member {string} idStr
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @instance
                         */
                        CommandDm.prototype.idStr = "";

                        /**
                         * Creates a new CommandDm instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @static
                         * @param {bilibili.community.service.dm.v1.ICommandDm=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.CommandDm} CommandDm instance
                         */
                        CommandDm.create = function create(properties) {
                            return new CommandDm(properties);
                        };

                        /**
                         * Encodes the specified CommandDm message. Does not implicitly {@link bilibili.community.service.dm.v1.CommandDm.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @static
                         * @param {bilibili.community.service.dm.v1.ICommandDm} message CommandDm message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        CommandDm.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.id);
                            if (message.oid != null && Object.hasOwnProperty.call(message, "oid"))
                                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.oid);
                            if (message.mid != null && Object.hasOwnProperty.call(message, "mid"))
                                writer.uint32(/* id 3, wireType 2 =*/26).string(message.mid);
                            if (message.command != null && Object.hasOwnProperty.call(message, "command"))
                                writer.uint32(/* id 4, wireType 2 =*/34).string(message.command);
                            if (message.content != null && Object.hasOwnProperty.call(message, "content"))
                                writer.uint32(/* id 5, wireType 2 =*/42).string(message.content);
                            if (message.progress != null && Object.hasOwnProperty.call(message, "progress"))
                                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.progress);
                            if (message.ctime != null && Object.hasOwnProperty.call(message, "ctime"))
                                writer.uint32(/* id 7, wireType 2 =*/58).string(message.ctime);
                            if (message.mtime != null && Object.hasOwnProperty.call(message, "mtime"))
                                writer.uint32(/* id 8, wireType 2 =*/66).string(message.mtime);
                            if (message.extra != null && Object.hasOwnProperty.call(message, "extra"))
                                writer.uint32(/* id 9, wireType 2 =*/74).string(message.extra);
                            if (message.idStr != null && Object.hasOwnProperty.call(message, "idStr"))
                                writer.uint32(/* id 10, wireType 2 =*/82).string(message.idStr);
                            return writer;
                        };

                        /**
                         * Encodes the specified CommandDm message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.CommandDm.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @static
                         * @param {bilibili.community.service.dm.v1.ICommandDm} message CommandDm message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        CommandDm.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a CommandDm message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.CommandDm} CommandDm
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        CommandDm.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.CommandDm();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.id = reader.int64();
                                        break;
                                    case 2:
                                        message.oid = reader.int64();
                                        break;
                                    case 3:
                                        message.mid = reader.string();
                                        break;
                                    case 4:
                                        message.command = reader.string();
                                        break;
                                    case 5:
                                        message.content = reader.string();
                                        break;
                                    case 6:
                                        message.progress = reader.int32();
                                        break;
                                    case 7:
                                        message.ctime = reader.string();
                                        break;
                                    case 8:
                                        message.mtime = reader.string();
                                        break;
                                    case 9:
                                        message.extra = reader.string();
                                        break;
                                    case 10:
                                        message.idStr = reader.string();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a CommandDm message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.CommandDm} CommandDm
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        CommandDm.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a CommandDm message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        CommandDm.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.id != null && message.hasOwnProperty("id"))
                                if (!$util.isInteger(message.id) && !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high)))
                                    return "id: integer|Long expected";
                            if (message.oid != null && message.hasOwnProperty("oid"))
                                if (!$util.isInteger(message.oid) && !(message.oid && $util.isInteger(message.oid.low) && $util.isInteger(message.oid.high)))
                                    return "oid: integer|Long expected";
                            if (message.mid != null && message.hasOwnProperty("mid"))
                                if (!$util.isString(message.mid))
                                    return "mid: string expected";
                            if (message.command != null && message.hasOwnProperty("command"))
                                if (!$util.isString(message.command))
                                    return "command: string expected";
                            if (message.content != null && message.hasOwnProperty("content"))
                                if (!$util.isString(message.content))
                                    return "content: string expected";
                            if (message.progress != null && message.hasOwnProperty("progress"))
                                if (!$util.isInteger(message.progress))
                                    return "progress: integer expected";
                            if (message.ctime != null && message.hasOwnProperty("ctime"))
                                if (!$util.isString(message.ctime))
                                    return "ctime: string expected";
                            if (message.mtime != null && message.hasOwnProperty("mtime"))
                                if (!$util.isString(message.mtime))
                                    return "mtime: string expected";
                            if (message.extra != null && message.hasOwnProperty("extra"))
                                if (!$util.isString(message.extra))
                                    return "extra: string expected";
                            if (message.idStr != null && message.hasOwnProperty("idStr"))
                                if (!$util.isString(message.idStr))
                                    return "idStr: string expected";
                            return null;
                        };

                        /**
                         * Creates a CommandDm message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.CommandDm} CommandDm
                         */
                        CommandDm.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.CommandDm)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.CommandDm();
                            if (object.id != null)
                                if ($util.Long)
                                    (message.id = $util.Long.fromValue(object.id)).unsigned = false;
                                else if (typeof object.id === "string")
                                    message.id = parseInt(object.id, 10);
                                else if (typeof object.id === "number")
                                    message.id = object.id;
                                else if (typeof object.id === "object")
                                    message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber();
                            if (object.oid != null)
                                if ($util.Long)
                                    (message.oid = $util.Long.fromValue(object.oid)).unsigned = false;
                                else if (typeof object.oid === "string")
                                    message.oid = parseInt(object.oid, 10);
                                else if (typeof object.oid === "number")
                                    message.oid = object.oid;
                                else if (typeof object.oid === "object")
                                    message.oid = new $util.LongBits(object.oid.low >>> 0, object.oid.high >>> 0).toNumber();
                            if (object.mid != null)
                                message.mid = String(object.mid);
                            if (object.command != null)
                                message.command = String(object.command);
                            if (object.content != null)
                                message.content = String(object.content);
                            if (object.progress != null)
                                message.progress = object.progress | 0;
                            if (object.ctime != null)
                                message.ctime = String(object.ctime);
                            if (object.mtime != null)
                                message.mtime = String(object.mtime);
                            if (object.extra != null)
                                message.extra = String(object.extra);
                            if (object.idStr != null)
                                message.idStr = String(object.idStr);
                            return message;
                        };

                        /**
                         * Creates a plain object from a CommandDm message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @static
                         * @param {bilibili.community.service.dm.v1.CommandDm} message CommandDm
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        CommandDm.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.id = options.longs === String ? "0" : 0;
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.oid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.oid = options.longs === String ? "0" : 0;
                                object.mid = "";
                                object.command = "";
                                object.content = "";
                                object.progress = 0;
                                object.ctime = "";
                                object.mtime = "";
                                object.extra = "";
                                object.idStr = "";
                            }
                            if (message.id != null && message.hasOwnProperty("id"))
                                if (typeof message.id === "number")
                                    object.id = options.longs === String ? String(message.id) : message.id;
                                else
                                    object.id = options.longs === String ? $util.Long.prototype.toString.call(message.id) : options.longs === Number ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber() : message.id;
                            if (message.oid != null && message.hasOwnProperty("oid"))
                                if (typeof message.oid === "number")
                                    object.oid = options.longs === String ? String(message.oid) : message.oid;
                                else
                                    object.oid = options.longs === String ? $util.Long.prototype.toString.call(message.oid) : options.longs === Number ? new $util.LongBits(message.oid.low >>> 0, message.oid.high >>> 0).toNumber() : message.oid;
                            if (message.mid != null && message.hasOwnProperty("mid"))
                                object.mid = message.mid;
                            if (message.command != null && message.hasOwnProperty("command"))
                                object.command = message.command;
                            if (message.content != null && message.hasOwnProperty("content"))
                                object.content = message.content;
                            if (message.progress != null && message.hasOwnProperty("progress"))
                                object.progress = message.progress;
                            if (message.ctime != null && message.hasOwnProperty("ctime"))
                                object.ctime = message.ctime;
                            if (message.mtime != null && message.hasOwnProperty("mtime"))
                                object.mtime = message.mtime;
                            if (message.extra != null && message.hasOwnProperty("extra"))
                                object.extra = message.extra;
                            if (message.idStr != null && message.hasOwnProperty("idStr"))
                                object.idStr = message.idStr;
                            return object;
                        };

                        /**
                         * Converts this CommandDm to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.CommandDm
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        CommandDm.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return CommandDm;
                    })();

                    v1.DmSegConfig = (function() {

                        /**
                         * Properties of a DmSegConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDmSegConfig
                         * @property {number|Long|null} [pageSize] DmSegConfig pageSize
                         * @property {number|Long|null} [total] DmSegConfig total
                         */

                        /**
                         * Constructs a new DmSegConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DmSegConfig.
                         * @implements IDmSegConfig
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDmSegConfig=} [properties] Properties to set
                         */
                        function DmSegConfig(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DmSegConfig pageSize.
                         * @member {number|Long} pageSize
                         * @memberof bilibili.community.service.dm.v1.DmSegConfig
                         * @instance
                         */
                        DmSegConfig.prototype.pageSize = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DmSegConfig total.
                         * @member {number|Long} total
                         * @memberof bilibili.community.service.dm.v1.DmSegConfig
                         * @instance
                         */
                        DmSegConfig.prototype.total = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * Creates a new DmSegConfig instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DmSegConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegConfig=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DmSegConfig} DmSegConfig instance
                         */
                        DmSegConfig.create = function create(properties) {
                            return new DmSegConfig(properties);
                        };

                        /**
                         * Encodes the specified DmSegConfig message. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegConfig.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DmSegConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegConfig} message DmSegConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegConfig.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.pageSize != null && Object.hasOwnProperty.call(message, "pageSize"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.pageSize);
                            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.total);
                            return writer;
                        };

                        /**
                         * Encodes the specified DmSegConfig message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DmSegConfig.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmSegConfig} message DmSegConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmSegConfig.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DmSegConfig message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DmSegConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DmSegConfig} DmSegConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegConfig.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DmSegConfig();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.pageSize = reader.int64();
                                        break;
                                    case 2:
                                        message.total = reader.int64();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DmSegConfig message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmSegConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DmSegConfig} DmSegConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmSegConfig.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DmSegConfig message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DmSegConfig
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DmSegConfig.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.pageSize != null && message.hasOwnProperty("pageSize"))
                                if (!$util.isInteger(message.pageSize) && !(message.pageSize && $util.isInteger(message.pageSize.low) && $util.isInteger(message.pageSize.high)))
                                    return "pageSize: integer|Long expected";
                            if (message.total != null && message.hasOwnProperty("total"))
                                if (!$util.isInteger(message.total) && !(message.total && $util.isInteger(message.total.low) && $util.isInteger(message.total.high)))
                                    return "total: integer|Long expected";
                            return null;
                        };

                        /**
                         * Creates a DmSegConfig message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DmSegConfig
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DmSegConfig} DmSegConfig
                         */
                        DmSegConfig.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DmSegConfig)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DmSegConfig();
                            if (object.pageSize != null)
                                if ($util.Long)
                                    (message.pageSize = $util.Long.fromValue(object.pageSize)).unsigned = false;
                                else if (typeof object.pageSize === "string")
                                    message.pageSize = parseInt(object.pageSize, 10);
                                else if (typeof object.pageSize === "number")
                                    message.pageSize = object.pageSize;
                                else if (typeof object.pageSize === "object")
                                    message.pageSize = new $util.LongBits(object.pageSize.low >>> 0, object.pageSize.high >>> 0).toNumber();
                            if (object.total != null)
                                if ($util.Long)
                                    (message.total = $util.Long.fromValue(object.total)).unsigned = false;
                                else if (typeof object.total === "string")
                                    message.total = parseInt(object.total, 10);
                                else if (typeof object.total === "number")
                                    message.total = object.total;
                                else if (typeof object.total === "object")
                                    message.total = new $util.LongBits(object.total.low >>> 0, object.total.high >>> 0).toNumber();
                            return message;
                        };

                        /**
                         * Creates a plain object from a DmSegConfig message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DmSegConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.DmSegConfig} message DmSegConfig
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DmSegConfig.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.pageSize = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.pageSize = options.longs === String ? "0" : 0;
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.total = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.total = options.longs === String ? "0" : 0;
                            }
                            if (message.pageSize != null && message.hasOwnProperty("pageSize"))
                                if (typeof message.pageSize === "number")
                                    object.pageSize = options.longs === String ? String(message.pageSize) : message.pageSize;
                                else
                                    object.pageSize = options.longs === String ? $util.Long.prototype.toString.call(message.pageSize) : options.longs === Number ? new $util.LongBits(message.pageSize.low >>> 0, message.pageSize.high >>> 0).toNumber() : message.pageSize;
                            if (message.total != null && message.hasOwnProperty("total"))
                                if (typeof message.total === "number")
                                    object.total = options.longs === String ? String(message.total) : message.total;
                                else
                                    object.total = options.longs === String ? $util.Long.prototype.toString.call(message.total) : options.longs === Number ? new $util.LongBits(message.total.low >>> 0, message.total.high >>> 0).toNumber() : message.total;
                            return object;
                        };

                        /**
                         * Converts this DmSegConfig to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DmSegConfig
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DmSegConfig.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DmSegConfig;
                    })();

                    v1.VideoMask = (function() {

                        /**
                         * Properties of a VideoMask.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IVideoMask
                         * @property {number|Long|null} [cid] VideoMask cid
                         * @property {number|null} [plat] VideoMask plat
                         * @property {number|null} [fps] VideoMask fps
                         * @property {number|Long|null} [time] VideoMask time
                         * @property {string|null} [maskUrl] VideoMask maskUrl
                         */

                        /**
                         * Constructs a new VideoMask.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a VideoMask.
                         * @implements IVideoMask
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IVideoMask=} [properties] Properties to set
                         */
                        function VideoMask(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * VideoMask cid.
                         * @member {number|Long} cid
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @instance
                         */
                        VideoMask.prototype.cid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * VideoMask plat.
                         * @member {number} plat
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @instance
                         */
                        VideoMask.prototype.plat = 0;

                        /**
                         * VideoMask fps.
                         * @member {number} fps
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @instance
                         */
                        VideoMask.prototype.fps = 0;

                        /**
                         * VideoMask time.
                         * @member {number|Long} time
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @instance
                         */
                        VideoMask.prototype.time = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * VideoMask maskUrl.
                         * @member {string} maskUrl
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @instance
                         */
                        VideoMask.prototype.maskUrl = "";

                        /**
                         * Creates a new VideoMask instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @static
                         * @param {bilibili.community.service.dm.v1.IVideoMask=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.VideoMask} VideoMask instance
                         */
                        VideoMask.create = function create(properties) {
                            return new VideoMask(properties);
                        };

                        /**
                         * Encodes the specified VideoMask message. Does not implicitly {@link bilibili.community.service.dm.v1.VideoMask.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @static
                         * @param {bilibili.community.service.dm.v1.IVideoMask} message VideoMask message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        VideoMask.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.cid != null && Object.hasOwnProperty.call(message, "cid"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.cid);
                            if (message.plat != null && Object.hasOwnProperty.call(message, "plat"))
                                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.plat);
                            if (message.fps != null && Object.hasOwnProperty.call(message, "fps"))
                                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.fps);
                            if (message.time != null && Object.hasOwnProperty.call(message, "time"))
                                writer.uint32(/* id 4, wireType 0 =*/32).int64(message.time);
                            if (message.maskUrl != null && Object.hasOwnProperty.call(message, "maskUrl"))
                                writer.uint32(/* id 5, wireType 2 =*/42).string(message.maskUrl);
                            return writer;
                        };

                        /**
                         * Encodes the specified VideoMask message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.VideoMask.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @static
                         * @param {bilibili.community.service.dm.v1.IVideoMask} message VideoMask message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        VideoMask.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a VideoMask message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.VideoMask} VideoMask
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        VideoMask.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.VideoMask();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.cid = reader.int64();
                                        break;
                                    case 2:
                                        message.plat = reader.int32();
                                        break;
                                    case 3:
                                        message.fps = reader.int32();
                                        break;
                                    case 4:
                                        message.time = reader.int64();
                                        break;
                                    case 5:
                                        message.maskUrl = reader.string();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a VideoMask message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.VideoMask} VideoMask
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        VideoMask.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a VideoMask message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        VideoMask.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.cid != null && message.hasOwnProperty("cid"))
                                if (!$util.isInteger(message.cid) && !(message.cid && $util.isInteger(message.cid.low) && $util.isInteger(message.cid.high)))
                                    return "cid: integer|Long expected";
                            if (message.plat != null && message.hasOwnProperty("plat"))
                                if (!$util.isInteger(message.plat))
                                    return "plat: integer expected";
                            if (message.fps != null && message.hasOwnProperty("fps"))
                                if (!$util.isInteger(message.fps))
                                    return "fps: integer expected";
                            if (message.time != null && message.hasOwnProperty("time"))
                                if (!$util.isInteger(message.time) && !(message.time && $util.isInteger(message.time.low) && $util.isInteger(message.time.high)))
                                    return "time: integer|Long expected";
                            if (message.maskUrl != null && message.hasOwnProperty("maskUrl"))
                                if (!$util.isString(message.maskUrl))
                                    return "maskUrl: string expected";
                            return null;
                        };

                        /**
                         * Creates a VideoMask message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.VideoMask} VideoMask
                         */
                        VideoMask.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.VideoMask)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.VideoMask();
                            if (object.cid != null)
                                if ($util.Long)
                                    (message.cid = $util.Long.fromValue(object.cid)).unsigned = false;
                                else if (typeof object.cid === "string")
                                    message.cid = parseInt(object.cid, 10);
                                else if (typeof object.cid === "number")
                                    message.cid = object.cid;
                                else if (typeof object.cid === "object")
                                    message.cid = new $util.LongBits(object.cid.low >>> 0, object.cid.high >>> 0).toNumber();
                            if (object.plat != null)
                                message.plat = object.plat | 0;
                            if (object.fps != null)
                                message.fps = object.fps | 0;
                            if (object.time != null)
                                if ($util.Long)
                                    (message.time = $util.Long.fromValue(object.time)).unsigned = false;
                                else if (typeof object.time === "string")
                                    message.time = parseInt(object.time, 10);
                                else if (typeof object.time === "number")
                                    message.time = object.time;
                                else if (typeof object.time === "object")
                                    message.time = new $util.LongBits(object.time.low >>> 0, object.time.high >>> 0).toNumber();
                            if (object.maskUrl != null)
                                message.maskUrl = String(object.maskUrl);
                            return message;
                        };

                        /**
                         * Creates a plain object from a VideoMask message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @static
                         * @param {bilibili.community.service.dm.v1.VideoMask} message VideoMask
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        VideoMask.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.cid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.cid = options.longs === String ? "0" : 0;
                                object.plat = 0;
                                object.fps = 0;
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.time = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.time = options.longs === String ? "0" : 0;
                                object.maskUrl = "";
                            }
                            if (message.cid != null && message.hasOwnProperty("cid"))
                                if (typeof message.cid === "number")
                                    object.cid = options.longs === String ? String(message.cid) : message.cid;
                                else
                                    object.cid = options.longs === String ? $util.Long.prototype.toString.call(message.cid) : options.longs === Number ? new $util.LongBits(message.cid.low >>> 0, message.cid.high >>> 0).toNumber() : message.cid;
                            if (message.plat != null && message.hasOwnProperty("plat"))
                                object.plat = message.plat;
                            if (message.fps != null && message.hasOwnProperty("fps"))
                                object.fps = message.fps;
                            if (message.time != null && message.hasOwnProperty("time"))
                                if (typeof message.time === "number")
                                    object.time = options.longs === String ? String(message.time) : message.time;
                                else
                                    object.time = options.longs === String ? $util.Long.prototype.toString.call(message.time) : options.longs === Number ? new $util.LongBits(message.time.low >>> 0, message.time.high >>> 0).toNumber() : message.time;
                            if (message.maskUrl != null && message.hasOwnProperty("maskUrl"))
                                object.maskUrl = message.maskUrl;
                            return object;
                        };

                        /**
                         * Converts this VideoMask to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.VideoMask
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        VideoMask.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return VideoMask;
                    })();

                    v1.VideoSubtitle = (function() {

                        /**
                         * Properties of a VideoSubtitle.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IVideoSubtitle
                         * @property {string|null} [lan] VideoSubtitle lan
                         * @property {string|null} [lanDoc] VideoSubtitle lanDoc
                         * @property {Array.<bilibili.community.service.dm.v1.ISubtitleItem>|null} [subtitles] VideoSubtitle subtitles
                         */

                        /**
                         * Constructs a new VideoSubtitle.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a VideoSubtitle.
                         * @implements IVideoSubtitle
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IVideoSubtitle=} [properties] Properties to set
                         */
                        function VideoSubtitle(properties) {
                            this.subtitles = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * VideoSubtitle lan.
                         * @member {string} lan
                         * @memberof bilibili.community.service.dm.v1.VideoSubtitle
                         * @instance
                         */
                        VideoSubtitle.prototype.lan = "";

                        /**
                         * VideoSubtitle lanDoc.
                         * @member {string} lanDoc
                         * @memberof bilibili.community.service.dm.v1.VideoSubtitle
                         * @instance
                         */
                        VideoSubtitle.prototype.lanDoc = "";

                        /**
                         * VideoSubtitle subtitles.
                         * @member {Array.<bilibili.community.service.dm.v1.ISubtitleItem>} subtitles
                         * @memberof bilibili.community.service.dm.v1.VideoSubtitle
                         * @instance
                         */
                        VideoSubtitle.prototype.subtitles = $util.emptyArray;

                        /**
                         * Creates a new VideoSubtitle instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.VideoSubtitle
                         * @static
                         * @param {bilibili.community.service.dm.v1.IVideoSubtitle=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.VideoSubtitle} VideoSubtitle instance
                         */
                        VideoSubtitle.create = function create(properties) {
                            return new VideoSubtitle(properties);
                        };

                        /**
                         * Encodes the specified VideoSubtitle message. Does not implicitly {@link bilibili.community.service.dm.v1.VideoSubtitle.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.VideoSubtitle
                         * @static
                         * @param {bilibili.community.service.dm.v1.IVideoSubtitle} message VideoSubtitle message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        VideoSubtitle.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.lan != null && Object.hasOwnProperty.call(message, "lan"))
                                writer.uint32(/* id 1, wireType 2 =*/10).string(message.lan);
                            if (message.lanDoc != null && Object.hasOwnProperty.call(message, "lanDoc"))
                                writer.uint32(/* id 2, wireType 2 =*/18).string(message.lanDoc);
                            if (message.subtitles != null && message.subtitles.length)
                                for (var i = 0; i < message.subtitles.length; ++i)
                                    $root.bilibili.community.service.dm.v1.SubtitleItem.encode(message.subtitles[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified VideoSubtitle message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.VideoSubtitle.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.VideoSubtitle
                         * @static
                         * @param {bilibili.community.service.dm.v1.IVideoSubtitle} message VideoSubtitle message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        VideoSubtitle.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a VideoSubtitle message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.VideoSubtitle
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.VideoSubtitle} VideoSubtitle
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        VideoSubtitle.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.VideoSubtitle();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.lan = reader.string();
                                        break;
                                    case 2:
                                        message.lanDoc = reader.string();
                                        break;
                                    case 3:
                                        if (!(message.subtitles && message.subtitles.length))
                                            message.subtitles = [];
                                        message.subtitles.push($root.bilibili.community.service.dm.v1.SubtitleItem.decode(reader, reader.uint32()));
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a VideoSubtitle message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.VideoSubtitle
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.VideoSubtitle} VideoSubtitle
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        VideoSubtitle.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a VideoSubtitle message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.VideoSubtitle
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        VideoSubtitle.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.lan != null && message.hasOwnProperty("lan"))
                                if (!$util.isString(message.lan))
                                    return "lan: string expected";
                            if (message.lanDoc != null && message.hasOwnProperty("lanDoc"))
                                if (!$util.isString(message.lanDoc))
                                    return "lanDoc: string expected";
                            if (message.subtitles != null && message.hasOwnProperty("subtitles")) {
                                if (!Array.isArray(message.subtitles))
                                    return "subtitles: array expected";
                                for (var i = 0; i < message.subtitles.length; ++i) {
                                    var error = $root.bilibili.community.service.dm.v1.SubtitleItem.verify(message.subtitles[i]);
                                    if (error)
                                        return "subtitles." + error;
                                }
                            }
                            return null;
                        };

                        /**
                         * Creates a VideoSubtitle message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.VideoSubtitle
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.VideoSubtitle} VideoSubtitle
                         */
                        VideoSubtitle.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.VideoSubtitle)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.VideoSubtitle();
                            if (object.lan != null)
                                message.lan = String(object.lan);
                            if (object.lanDoc != null)
                                message.lanDoc = String(object.lanDoc);
                            if (object.subtitles) {
                                if (!Array.isArray(object.subtitles))
                                    throw TypeError(".bilibili.community.service.dm.v1.VideoSubtitle.subtitles: array expected");
                                message.subtitles = [];
                                for (var i = 0; i < object.subtitles.length; ++i) {
                                    if (typeof object.subtitles[i] !== "object")
                                        throw TypeError(".bilibili.community.service.dm.v1.VideoSubtitle.subtitles: object expected");
                                    message.subtitles[i] = $root.bilibili.community.service.dm.v1.SubtitleItem.fromObject(object.subtitles[i]);
                                }
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a VideoSubtitle message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.VideoSubtitle
                         * @static
                         * @param {bilibili.community.service.dm.v1.VideoSubtitle} message VideoSubtitle
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        VideoSubtitle.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.subtitles = [];
                            if (options.defaults) {
                                object.lan = "";
                                object.lanDoc = "";
                            }
                            if (message.lan != null && message.hasOwnProperty("lan"))
                                object.lan = message.lan;
                            if (message.lanDoc != null && message.hasOwnProperty("lanDoc"))
                                object.lanDoc = message.lanDoc;
                            if (message.subtitles && message.subtitles.length) {
                                object.subtitles = [];
                                for (var j = 0; j < message.subtitles.length; ++j)
                                    object.subtitles[j] = $root.bilibili.community.service.dm.v1.SubtitleItem.toObject(message.subtitles[j], options);
                            }
                            return object;
                        };

                        /**
                         * Converts this VideoSubtitle to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.VideoSubtitle
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        VideoSubtitle.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return VideoSubtitle;
                    })();

                    v1.DanmuWebPlayerConfig = (function() {

                        /**
                         * Properties of a DanmuWebPlayerConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDanmuWebPlayerConfig
                         * @property {boolean|null} [dmSwitch] DanmuWebPlayerConfig dmSwitch
                         * @property {boolean|null} [aiSwitch] DanmuWebPlayerConfig aiSwitch
                         * @property {number|null} [aiLevel] DanmuWebPlayerConfig aiLevel
                         * @property {boolean|null} [blocktop] DanmuWebPlayerConfig blocktop
                         * @property {boolean|null} [blockscroll] DanmuWebPlayerConfig blockscroll
                         * @property {boolean|null} [blockbottom] DanmuWebPlayerConfig blockbottom
                         * @property {boolean|null} [blockcolor] DanmuWebPlayerConfig blockcolor
                         * @property {boolean|null} [blockspecial] DanmuWebPlayerConfig blockspecial
                         * @property {boolean|null} [preventshade] DanmuWebPlayerConfig preventshade
                         * @property {boolean|null} [dmask] DanmuWebPlayerConfig dmask
                         * @property {number|null} [opacity] DanmuWebPlayerConfig opacity
                         * @property {number|null} [dmarea] DanmuWebPlayerConfig dmarea
                         * @property {number|null} [speedplus] DanmuWebPlayerConfig speedplus
                         * @property {number|null} [fontsize] DanmuWebPlayerConfig fontsize
                         * @property {boolean|null} [screensync] DanmuWebPlayerConfig screensync
                         * @property {boolean|null} [speedsync] DanmuWebPlayerConfig speedsync
                         * @property {string|null} [fontfamily] DanmuWebPlayerConfig fontfamily
                         * @property {boolean|null} [bold] DanmuWebPlayerConfig bold
                         * @property {number|null} [fontborder] DanmuWebPlayerConfig fontborder
                         * @property {string|null} [drawType] DanmuWebPlayerConfig drawType
                         */

                        /**
                         * Constructs a new DanmuWebPlayerConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DanmuWebPlayerConfig.
                         * @implements IDanmuWebPlayerConfig
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDanmuWebPlayerConfig=} [properties] Properties to set
                         */
                        function DanmuWebPlayerConfig(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DanmuWebPlayerConfig dmSwitch.
                         * @member {boolean} dmSwitch
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.dmSwitch = false;

                        /**
                         * DanmuWebPlayerConfig aiSwitch.
                         * @member {boolean} aiSwitch
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.aiSwitch = false;

                        /**
                         * DanmuWebPlayerConfig aiLevel.
                         * @member {number} aiLevel
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.aiLevel = 0;

                        /**
                         * DanmuWebPlayerConfig blocktop.
                         * @member {boolean} blocktop
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.blocktop = false;

                        /**
                         * DanmuWebPlayerConfig blockscroll.
                         * @member {boolean} blockscroll
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.blockscroll = false;

                        /**
                         * DanmuWebPlayerConfig blockbottom.
                         * @member {boolean} blockbottom
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.blockbottom = false;

                        /**
                         * DanmuWebPlayerConfig blockcolor.
                         * @member {boolean} blockcolor
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.blockcolor = false;

                        /**
                         * DanmuWebPlayerConfig blockspecial.
                         * @member {boolean} blockspecial
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.blockspecial = false;

                        /**
                         * DanmuWebPlayerConfig preventshade.
                         * @member {boolean} preventshade
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.preventshade = false;

                        /**
                         * DanmuWebPlayerConfig dmask.
                         * @member {boolean} dmask
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.dmask = false;

                        /**
                         * DanmuWebPlayerConfig opacity.
                         * @member {number} opacity
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.opacity = 0;

                        /**
                         * DanmuWebPlayerConfig dmarea.
                         * @member {number} dmarea
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.dmarea = 0;

                        /**
                         * DanmuWebPlayerConfig speedplus.
                         * @member {number} speedplus
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.speedplus = 0;

                        /**
                         * DanmuWebPlayerConfig fontsize.
                         * @member {number} fontsize
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.fontsize = 0;

                        /**
                         * DanmuWebPlayerConfig screensync.
                         * @member {boolean} screensync
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.screensync = false;

                        /**
                         * DanmuWebPlayerConfig speedsync.
                         * @member {boolean} speedsync
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.speedsync = false;

                        /**
                         * DanmuWebPlayerConfig fontfamily.
                         * @member {string} fontfamily
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.fontfamily = "";

                        /**
                         * DanmuWebPlayerConfig bold.
                         * @member {boolean} bold
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.bold = false;

                        /**
                         * DanmuWebPlayerConfig fontborder.
                         * @member {number} fontborder
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.fontborder = 0;

                        /**
                         * DanmuWebPlayerConfig drawType.
                         * @member {string} drawType
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         */
                        DanmuWebPlayerConfig.prototype.drawType = "";

                        /**
                         * Creates a new DanmuWebPlayerConfig instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuWebPlayerConfig=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DanmuWebPlayerConfig} DanmuWebPlayerConfig instance
                         */
                        DanmuWebPlayerConfig.create = function create(properties) {
                            return new DanmuWebPlayerConfig(properties);
                        };

                        /**
                         * Encodes the specified DanmuWebPlayerConfig message. Does not implicitly {@link bilibili.community.service.dm.v1.DanmuWebPlayerConfig.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuWebPlayerConfig} message DanmuWebPlayerConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmuWebPlayerConfig.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.dmSwitch != null && Object.hasOwnProperty.call(message, "dmSwitch"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.dmSwitch);
                            if (message.aiSwitch != null && Object.hasOwnProperty.call(message, "aiSwitch"))
                                writer.uint32(/* id 2, wireType 0 =*/16).bool(message.aiSwitch);
                            if (message.aiLevel != null && Object.hasOwnProperty.call(message, "aiLevel"))
                                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.aiLevel);
                            if (message.blocktop != null && Object.hasOwnProperty.call(message, "blocktop"))
                                writer.uint32(/* id 4, wireType 0 =*/32).bool(message.blocktop);
                            if (message.blockscroll != null && Object.hasOwnProperty.call(message, "blockscroll"))
                                writer.uint32(/* id 5, wireType 0 =*/40).bool(message.blockscroll);
                            if (message.blockbottom != null && Object.hasOwnProperty.call(message, "blockbottom"))
                                writer.uint32(/* id 6, wireType 0 =*/48).bool(message.blockbottom);
                            if (message.blockcolor != null && Object.hasOwnProperty.call(message, "blockcolor"))
                                writer.uint32(/* id 7, wireType 0 =*/56).bool(message.blockcolor);
                            if (message.blockspecial != null && Object.hasOwnProperty.call(message, "blockspecial"))
                                writer.uint32(/* id 8, wireType 0 =*/64).bool(message.blockspecial);
                            if (message.preventshade != null && Object.hasOwnProperty.call(message, "preventshade"))
                                writer.uint32(/* id 9, wireType 0 =*/72).bool(message.preventshade);
                            if (message.dmask != null && Object.hasOwnProperty.call(message, "dmask"))
                                writer.uint32(/* id 10, wireType 0 =*/80).bool(message.dmask);
                            if (message.opacity != null && Object.hasOwnProperty.call(message, "opacity"))
                                writer.uint32(/* id 11, wireType 5 =*/93).float(message.opacity);
                            if (message.dmarea != null && Object.hasOwnProperty.call(message, "dmarea"))
                                writer.uint32(/* id 12, wireType 0 =*/96).int32(message.dmarea);
                            if (message.speedplus != null && Object.hasOwnProperty.call(message, "speedplus"))
                                writer.uint32(/* id 13, wireType 5 =*/109).float(message.speedplus);
                            if (message.fontsize != null && Object.hasOwnProperty.call(message, "fontsize"))
                                writer.uint32(/* id 14, wireType 5 =*/117).float(message.fontsize);
                            if (message.screensync != null && Object.hasOwnProperty.call(message, "screensync"))
                                writer.uint32(/* id 15, wireType 0 =*/120).bool(message.screensync);
                            if (message.speedsync != null && Object.hasOwnProperty.call(message, "speedsync"))
                                writer.uint32(/* id 16, wireType 0 =*/128).bool(message.speedsync);
                            if (message.fontfamily != null && Object.hasOwnProperty.call(message, "fontfamily"))
                                writer.uint32(/* id 17, wireType 2 =*/138).string(message.fontfamily);
                            if (message.bold != null && Object.hasOwnProperty.call(message, "bold"))
                                writer.uint32(/* id 18, wireType 0 =*/144).bool(message.bold);
                            if (message.fontborder != null && Object.hasOwnProperty.call(message, "fontborder"))
                                writer.uint32(/* id 19, wireType 0 =*/152).int32(message.fontborder);
                            if (message.drawType != null && Object.hasOwnProperty.call(message, "drawType"))
                                writer.uint32(/* id 20, wireType 2 =*/162).string(message.drawType);
                            return writer;
                        };

                        /**
                         * Encodes the specified DanmuWebPlayerConfig message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DanmuWebPlayerConfig.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuWebPlayerConfig} message DanmuWebPlayerConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmuWebPlayerConfig.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DanmuWebPlayerConfig message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DanmuWebPlayerConfig} DanmuWebPlayerConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmuWebPlayerConfig.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DanmuWebPlayerConfig();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.dmSwitch = reader.bool();
                                        break;
                                    case 2:
                                        message.aiSwitch = reader.bool();
                                        break;
                                    case 3:
                                        message.aiLevel = reader.int32();
                                        break;
                                    case 4:
                                        message.blocktop = reader.bool();
                                        break;
                                    case 5:
                                        message.blockscroll = reader.bool();
                                        break;
                                    case 6:
                                        message.blockbottom = reader.bool();
                                        break;
                                    case 7:
                                        message.blockcolor = reader.bool();
                                        break;
                                    case 8:
                                        message.blockspecial = reader.bool();
                                        break;
                                    case 9:
                                        message.preventshade = reader.bool();
                                        break;
                                    case 10:
                                        message.dmask = reader.bool();
                                        break;
                                    case 11:
                                        message.opacity = reader.float();
                                        break;
                                    case 12:
                                        message.dmarea = reader.int32();
                                        break;
                                    case 13:
                                        message.speedplus = reader.float();
                                        break;
                                    case 14:
                                        message.fontsize = reader.float();
                                        break;
                                    case 15:
                                        message.screensync = reader.bool();
                                        break;
                                    case 16:
                                        message.speedsync = reader.bool();
                                        break;
                                    case 17:
                                        message.fontfamily = reader.string();
                                        break;
                                    case 18:
                                        message.bold = reader.bool();
                                        break;
                                    case 19:
                                        message.fontborder = reader.int32();
                                        break;
                                    case 20:
                                        message.drawType = reader.string();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DanmuWebPlayerConfig message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DanmuWebPlayerConfig} DanmuWebPlayerConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmuWebPlayerConfig.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DanmuWebPlayerConfig message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DanmuWebPlayerConfig.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.dmSwitch != null && message.hasOwnProperty("dmSwitch"))
                                if (typeof message.dmSwitch !== "boolean")
                                    return "dmSwitch: boolean expected";
                            if (message.aiSwitch != null && message.hasOwnProperty("aiSwitch"))
                                if (typeof message.aiSwitch !== "boolean")
                                    return "aiSwitch: boolean expected";
                            if (message.aiLevel != null && message.hasOwnProperty("aiLevel"))
                                if (!$util.isInteger(message.aiLevel))
                                    return "aiLevel: integer expected";
                            if (message.blocktop != null && message.hasOwnProperty("blocktop"))
                                if (typeof message.blocktop !== "boolean")
                                    return "blocktop: boolean expected";
                            if (message.blockscroll != null && message.hasOwnProperty("blockscroll"))
                                if (typeof message.blockscroll !== "boolean")
                                    return "blockscroll: boolean expected";
                            if (message.blockbottom != null && message.hasOwnProperty("blockbottom"))
                                if (typeof message.blockbottom !== "boolean")
                                    return "blockbottom: boolean expected";
                            if (message.blockcolor != null && message.hasOwnProperty("blockcolor"))
                                if (typeof message.blockcolor !== "boolean")
                                    return "blockcolor: boolean expected";
                            if (message.blockspecial != null && message.hasOwnProperty("blockspecial"))
                                if (typeof message.blockspecial !== "boolean")
                                    return "blockspecial: boolean expected";
                            if (message.preventshade != null && message.hasOwnProperty("preventshade"))
                                if (typeof message.preventshade !== "boolean")
                                    return "preventshade: boolean expected";
                            if (message.dmask != null && message.hasOwnProperty("dmask"))
                                if (typeof message.dmask !== "boolean")
                                    return "dmask: boolean expected";
                            if (message.opacity != null && message.hasOwnProperty("opacity"))
                                if (typeof message.opacity !== "number")
                                    return "opacity: number expected";
                            if (message.dmarea != null && message.hasOwnProperty("dmarea"))
                                if (!$util.isInteger(message.dmarea))
                                    return "dmarea: integer expected";
                            if (message.speedplus != null && message.hasOwnProperty("speedplus"))
                                if (typeof message.speedplus !== "number")
                                    return "speedplus: number expected";
                            if (message.fontsize != null && message.hasOwnProperty("fontsize"))
                                if (typeof message.fontsize !== "number")
                                    return "fontsize: number expected";
                            if (message.screensync != null && message.hasOwnProperty("screensync"))
                                if (typeof message.screensync !== "boolean")
                                    return "screensync: boolean expected";
                            if (message.speedsync != null && message.hasOwnProperty("speedsync"))
                                if (typeof message.speedsync !== "boolean")
                                    return "speedsync: boolean expected";
                            if (message.fontfamily != null && message.hasOwnProperty("fontfamily"))
                                if (!$util.isString(message.fontfamily))
                                    return "fontfamily: string expected";
                            if (message.bold != null && message.hasOwnProperty("bold"))
                                if (typeof message.bold !== "boolean")
                                    return "bold: boolean expected";
                            if (message.fontborder != null && message.hasOwnProperty("fontborder"))
                                if (!$util.isInteger(message.fontborder))
                                    return "fontborder: integer expected";
                            if (message.drawType != null && message.hasOwnProperty("drawType"))
                                if (!$util.isString(message.drawType))
                                    return "drawType: string expected";
                            return null;
                        };

                        /**
                         * Creates a DanmuWebPlayerConfig message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DanmuWebPlayerConfig} DanmuWebPlayerConfig
                         */
                        DanmuWebPlayerConfig.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DanmuWebPlayerConfig)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DanmuWebPlayerConfig();
                            if (object.dmSwitch != null)
                                message.dmSwitch = Boolean(object.dmSwitch);
                            if (object.aiSwitch != null)
                                message.aiSwitch = Boolean(object.aiSwitch);
                            if (object.aiLevel != null)
                                message.aiLevel = object.aiLevel | 0;
                            if (object.blocktop != null)
                                message.blocktop = Boolean(object.blocktop);
                            if (object.blockscroll != null)
                                message.blockscroll = Boolean(object.blockscroll);
                            if (object.blockbottom != null)
                                message.blockbottom = Boolean(object.blockbottom);
                            if (object.blockcolor != null)
                                message.blockcolor = Boolean(object.blockcolor);
                            if (object.blockspecial != null)
                                message.blockspecial = Boolean(object.blockspecial);
                            if (object.preventshade != null)
                                message.preventshade = Boolean(object.preventshade);
                            if (object.dmask != null)
                                message.dmask = Boolean(object.dmask);
                            if (object.opacity != null)
                                message.opacity = Number(object.opacity);
                            if (object.dmarea != null)
                                message.dmarea = object.dmarea | 0;
                            if (object.speedplus != null)
                                message.speedplus = Number(object.speedplus);
                            if (object.fontsize != null)
                                message.fontsize = Number(object.fontsize);
                            if (object.screensync != null)
                                message.screensync = Boolean(object.screensync);
                            if (object.speedsync != null)
                                message.speedsync = Boolean(object.speedsync);
                            if (object.fontfamily != null)
                                message.fontfamily = String(object.fontfamily);
                            if (object.bold != null)
                                message.bold = Boolean(object.bold);
                            if (object.fontborder != null)
                                message.fontborder = object.fontborder | 0;
                            if (object.drawType != null)
                                message.drawType = String(object.drawType);
                            return message;
                        };

                        /**
                         * Creates a plain object from a DanmuWebPlayerConfig message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.DanmuWebPlayerConfig} message DanmuWebPlayerConfig
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DanmuWebPlayerConfig.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.dmSwitch = false;
                                object.aiSwitch = false;
                                object.aiLevel = 0;
                                object.blocktop = false;
                                object.blockscroll = false;
                                object.blockbottom = false;
                                object.blockcolor = false;
                                object.blockspecial = false;
                                object.preventshade = false;
                                object.dmask = false;
                                object.opacity = 0;
                                object.dmarea = 0;
                                object.speedplus = 0;
                                object.fontsize = 0;
                                object.screensync = false;
                                object.speedsync = false;
                                object.fontfamily = "";
                                object.bold = false;
                                object.fontborder = 0;
                                object.drawType = "";
                            }
                            if (message.dmSwitch != null && message.hasOwnProperty("dmSwitch"))
                                object.dmSwitch = message.dmSwitch;
                            if (message.aiSwitch != null && message.hasOwnProperty("aiSwitch"))
                                object.aiSwitch = message.aiSwitch;
                            if (message.aiLevel != null && message.hasOwnProperty("aiLevel"))
                                object.aiLevel = message.aiLevel;
                            if (message.blocktop != null && message.hasOwnProperty("blocktop"))
                                object.blocktop = message.blocktop;
                            if (message.blockscroll != null && message.hasOwnProperty("blockscroll"))
                                object.blockscroll = message.blockscroll;
                            if (message.blockbottom != null && message.hasOwnProperty("blockbottom"))
                                object.blockbottom = message.blockbottom;
                            if (message.blockcolor != null && message.hasOwnProperty("blockcolor"))
                                object.blockcolor = message.blockcolor;
                            if (message.blockspecial != null && message.hasOwnProperty("blockspecial"))
                                object.blockspecial = message.blockspecial;
                            if (message.preventshade != null && message.hasOwnProperty("preventshade"))
                                object.preventshade = message.preventshade;
                            if (message.dmask != null && message.hasOwnProperty("dmask"))
                                object.dmask = message.dmask;
                            if (message.opacity != null && message.hasOwnProperty("opacity"))
                                object.opacity = options.json && !isFinite(message.opacity) ? String(message.opacity) : message.opacity;
                            if (message.dmarea != null && message.hasOwnProperty("dmarea"))
                                object.dmarea = message.dmarea;
                            if (message.speedplus != null && message.hasOwnProperty("speedplus"))
                                object.speedplus = options.json && !isFinite(message.speedplus) ? String(message.speedplus) : message.speedplus;
                            if (message.fontsize != null && message.hasOwnProperty("fontsize"))
                                object.fontsize = options.json && !isFinite(message.fontsize) ? String(message.fontsize) : message.fontsize;
                            if (message.screensync != null && message.hasOwnProperty("screensync"))
                                object.screensync = message.screensync;
                            if (message.speedsync != null && message.hasOwnProperty("speedsync"))
                                object.speedsync = message.speedsync;
                            if (message.fontfamily != null && message.hasOwnProperty("fontfamily"))
                                object.fontfamily = message.fontfamily;
                            if (message.bold != null && message.hasOwnProperty("bold"))
                                object.bold = message.bold;
                            if (message.fontborder != null && message.hasOwnProperty("fontborder"))
                                object.fontborder = message.fontborder;
                            if (message.drawType != null && message.hasOwnProperty("drawType"))
                                object.drawType = message.drawType;
                            return object;
                        };

                        /**
                         * Converts this DanmuWebPlayerConfig to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DanmuWebPlayerConfig
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DanmuWebPlayerConfig.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DanmuWebPlayerConfig;
                    })();

                    v1.SubtitleItem = (function() {

                        /**
                         * Properties of a SubtitleItem.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface ISubtitleItem
                         * @property {number|Long|null} [id] SubtitleItem id
                         * @property {string|null} [idStr] SubtitleItem idStr
                         * @property {string|null} [lan] SubtitleItem lan
                         * @property {string|null} [lanDoc] SubtitleItem lanDoc
                         * @property {string|null} [subtitleUrl] SubtitleItem subtitleUrl
                         * @property {bilibili.community.service.dm.v1.IUserInfo|null} [author] SubtitleItem author
                         */

                        /**
                         * Constructs a new SubtitleItem.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a SubtitleItem.
                         * @implements ISubtitleItem
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.ISubtitleItem=} [properties] Properties to set
                         */
                        function SubtitleItem(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * SubtitleItem id.
                         * @member {number|Long} id
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @instance
                         */
                        SubtitleItem.prototype.id = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * SubtitleItem idStr.
                         * @member {string} idStr
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @instance
                         */
                        SubtitleItem.prototype.idStr = "";

                        /**
                         * SubtitleItem lan.
                         * @member {string} lan
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @instance
                         */
                        SubtitleItem.prototype.lan = "";

                        /**
                         * SubtitleItem lanDoc.
                         * @member {string} lanDoc
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @instance
                         */
                        SubtitleItem.prototype.lanDoc = "";

                        /**
                         * SubtitleItem subtitleUrl.
                         * @member {string} subtitleUrl
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @instance
                         */
                        SubtitleItem.prototype.subtitleUrl = "";

                        /**
                         * SubtitleItem author.
                         * @member {bilibili.community.service.dm.v1.IUserInfo|null|undefined} author
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @instance
                         */
                        SubtitleItem.prototype.author = null;

                        /**
                         * Creates a new SubtitleItem instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @static
                         * @param {bilibili.community.service.dm.v1.ISubtitleItem=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.SubtitleItem} SubtitleItem instance
                         */
                        SubtitleItem.create = function create(properties) {
                            return new SubtitleItem(properties);
                        };

                        /**
                         * Encodes the specified SubtitleItem message. Does not implicitly {@link bilibili.community.service.dm.v1.SubtitleItem.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @static
                         * @param {bilibili.community.service.dm.v1.ISubtitleItem} message SubtitleItem message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        SubtitleItem.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.id);
                            if (message.idStr != null && Object.hasOwnProperty.call(message, "idStr"))
                                writer.uint32(/* id 2, wireType 2 =*/18).string(message.idStr);
                            if (message.lan != null && Object.hasOwnProperty.call(message, "lan"))
                                writer.uint32(/* id 3, wireType 2 =*/26).string(message.lan);
                            if (message.lanDoc != null && Object.hasOwnProperty.call(message, "lanDoc"))
                                writer.uint32(/* id 4, wireType 2 =*/34).string(message.lanDoc);
                            if (message.subtitleUrl != null && Object.hasOwnProperty.call(message, "subtitleUrl"))
                                writer.uint32(/* id 5, wireType 2 =*/42).string(message.subtitleUrl);
                            if (message.author != null && Object.hasOwnProperty.call(message, "author"))
                                $root.bilibili.community.service.dm.v1.UserInfo.encode(message.author, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified SubtitleItem message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.SubtitleItem.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @static
                         * @param {bilibili.community.service.dm.v1.ISubtitleItem} message SubtitleItem message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        SubtitleItem.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a SubtitleItem message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.SubtitleItem} SubtitleItem
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        SubtitleItem.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.SubtitleItem();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.id = reader.int64();
                                        break;
                                    case 2:
                                        message.idStr = reader.string();
                                        break;
                                    case 3:
                                        message.lan = reader.string();
                                        break;
                                    case 4:
                                        message.lanDoc = reader.string();
                                        break;
                                    case 5:
                                        message.subtitleUrl = reader.string();
                                        break;
                                    case 6:
                                        message.author = $root.bilibili.community.service.dm.v1.UserInfo.decode(reader, reader.uint32());
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a SubtitleItem message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.SubtitleItem} SubtitleItem
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        SubtitleItem.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a SubtitleItem message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        SubtitleItem.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.id != null && message.hasOwnProperty("id"))
                                if (!$util.isInteger(message.id) && !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high)))
                                    return "id: integer|Long expected";
                            if (message.idStr != null && message.hasOwnProperty("idStr"))
                                if (!$util.isString(message.idStr))
                                    return "idStr: string expected";
                            if (message.lan != null && message.hasOwnProperty("lan"))
                                if (!$util.isString(message.lan))
                                    return "lan: string expected";
                            if (message.lanDoc != null && message.hasOwnProperty("lanDoc"))
                                if (!$util.isString(message.lanDoc))
                                    return "lanDoc: string expected";
                            if (message.subtitleUrl != null && message.hasOwnProperty("subtitleUrl"))
                                if (!$util.isString(message.subtitleUrl))
                                    return "subtitleUrl: string expected";
                            if (message.author != null && message.hasOwnProperty("author")) {
                                var error = $root.bilibili.community.service.dm.v1.UserInfo.verify(message.author);
                                if (error)
                                    return "author." + error;
                            }
                            return null;
                        };

                        /**
                         * Creates a SubtitleItem message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.SubtitleItem} SubtitleItem
                         */
                        SubtitleItem.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.SubtitleItem)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.SubtitleItem();
                            if (object.id != null)
                                if ($util.Long)
                                    (message.id = $util.Long.fromValue(object.id)).unsigned = false;
                                else if (typeof object.id === "string")
                                    message.id = parseInt(object.id, 10);
                                else if (typeof object.id === "number")
                                    message.id = object.id;
                                else if (typeof object.id === "object")
                                    message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber();
                            if (object.idStr != null)
                                message.idStr = String(object.idStr);
                            if (object.lan != null)
                                message.lan = String(object.lan);
                            if (object.lanDoc != null)
                                message.lanDoc = String(object.lanDoc);
                            if (object.subtitleUrl != null)
                                message.subtitleUrl = String(object.subtitleUrl);
                            if (object.author != null) {
                                if (typeof object.author !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.SubtitleItem.author: object expected");
                                message.author = $root.bilibili.community.service.dm.v1.UserInfo.fromObject(object.author);
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a SubtitleItem message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @static
                         * @param {bilibili.community.service.dm.v1.SubtitleItem} message SubtitleItem
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        SubtitleItem.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.id = options.longs === String ? "0" : 0;
                                object.idStr = "";
                                object.lan = "";
                                object.lanDoc = "";
                                object.subtitleUrl = "";
                                object.author = null;
                            }
                            if (message.id != null && message.hasOwnProperty("id"))
                                if (typeof message.id === "number")
                                    object.id = options.longs === String ? String(message.id) : message.id;
                                else
                                    object.id = options.longs === String ? $util.Long.prototype.toString.call(message.id) : options.longs === Number ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber() : message.id;
                            if (message.idStr != null && message.hasOwnProperty("idStr"))
                                object.idStr = message.idStr;
                            if (message.lan != null && message.hasOwnProperty("lan"))
                                object.lan = message.lan;
                            if (message.lanDoc != null && message.hasOwnProperty("lanDoc"))
                                object.lanDoc = message.lanDoc;
                            if (message.subtitleUrl != null && message.hasOwnProperty("subtitleUrl"))
                                object.subtitleUrl = message.subtitleUrl;
                            if (message.author != null && message.hasOwnProperty("author"))
                                object.author = $root.bilibili.community.service.dm.v1.UserInfo.toObject(message.author, options);
                            return object;
                        };

                        /**
                         * Converts this SubtitleItem to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.SubtitleItem
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        SubtitleItem.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return SubtitleItem;
                    })();

                    v1.UserInfo = (function() {

                        /**
                         * Properties of a UserInfo.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IUserInfo
                         * @property {number|Long|null} [mid] UserInfo mid
                         * @property {string|null} [name] UserInfo name
                         * @property {string|null} [sex] UserInfo sex
                         * @property {string|null} [face] UserInfo face
                         * @property {string|null} [sign] UserInfo sign
                         * @property {number|null} [rank] UserInfo rank
                         */

                        /**
                         * Constructs a new UserInfo.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a UserInfo.
                         * @implements IUserInfo
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IUserInfo=} [properties] Properties to set
                         */
                        function UserInfo(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * UserInfo mid.
                         * @member {number|Long} mid
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @instance
                         */
                        UserInfo.prototype.mid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * UserInfo name.
                         * @member {string} name
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @instance
                         */
                        UserInfo.prototype.name = "";

                        /**
                         * UserInfo sex.
                         * @member {string} sex
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @instance
                         */
                        UserInfo.prototype.sex = "";

                        /**
                         * UserInfo face.
                         * @member {string} face
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @instance
                         */
                        UserInfo.prototype.face = "";

                        /**
                         * UserInfo sign.
                         * @member {string} sign
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @instance
                         */
                        UserInfo.prototype.sign = "";

                        /**
                         * UserInfo rank.
                         * @member {number} rank
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @instance
                         */
                        UserInfo.prototype.rank = 0;

                        /**
                         * Creates a new UserInfo instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @static
                         * @param {bilibili.community.service.dm.v1.IUserInfo=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.UserInfo} UserInfo instance
                         */
                        UserInfo.create = function create(properties) {
                            return new UserInfo(properties);
                        };

                        /**
                         * Encodes the specified UserInfo message. Does not implicitly {@link bilibili.community.service.dm.v1.UserInfo.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @static
                         * @param {bilibili.community.service.dm.v1.IUserInfo} message UserInfo message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        UserInfo.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.mid != null && Object.hasOwnProperty.call(message, "mid"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.mid);
                            if (message.name != null && Object.hasOwnProperty.call(message, "name"))
                                writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
                            if (message.sex != null && Object.hasOwnProperty.call(message, "sex"))
                                writer.uint32(/* id 3, wireType 2 =*/26).string(message.sex);
                            if (message.face != null && Object.hasOwnProperty.call(message, "face"))
                                writer.uint32(/* id 4, wireType 2 =*/34).string(message.face);
                            if (message.sign != null && Object.hasOwnProperty.call(message, "sign"))
                                writer.uint32(/* id 5, wireType 2 =*/42).string(message.sign);
                            if (message.rank != null && Object.hasOwnProperty.call(message, "rank"))
                                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.rank);
                            return writer;
                        };

                        /**
                         * Encodes the specified UserInfo message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.UserInfo.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @static
                         * @param {bilibili.community.service.dm.v1.IUserInfo} message UserInfo message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        UserInfo.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a UserInfo message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.UserInfo} UserInfo
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        UserInfo.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.UserInfo();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.mid = reader.int64();
                                        break;
                                    case 2:
                                        message.name = reader.string();
                                        break;
                                    case 3:
                                        message.sex = reader.string();
                                        break;
                                    case 4:
                                        message.face = reader.string();
                                        break;
                                    case 5:
                                        message.sign = reader.string();
                                        break;
                                    case 6:
                                        message.rank = reader.int32();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a UserInfo message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.UserInfo} UserInfo
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        UserInfo.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a UserInfo message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        UserInfo.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.mid != null && message.hasOwnProperty("mid"))
                                if (!$util.isInteger(message.mid) && !(message.mid && $util.isInteger(message.mid.low) && $util.isInteger(message.mid.high)))
                                    return "mid: integer|Long expected";
                            if (message.name != null && message.hasOwnProperty("name"))
                                if (!$util.isString(message.name))
                                    return "name: string expected";
                            if (message.sex != null && message.hasOwnProperty("sex"))
                                if (!$util.isString(message.sex))
                                    return "sex: string expected";
                            if (message.face != null && message.hasOwnProperty("face"))
                                if (!$util.isString(message.face))
                                    return "face: string expected";
                            if (message.sign != null && message.hasOwnProperty("sign"))
                                if (!$util.isString(message.sign))
                                    return "sign: string expected";
                            if (message.rank != null && message.hasOwnProperty("rank"))
                                if (!$util.isInteger(message.rank))
                                    return "rank: integer expected";
                            return null;
                        };

                        /**
                         * Creates a UserInfo message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.UserInfo} UserInfo
                         */
                        UserInfo.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.UserInfo)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.UserInfo();
                            if (object.mid != null)
                                if ($util.Long)
                                    (message.mid = $util.Long.fromValue(object.mid)).unsigned = false;
                                else if (typeof object.mid === "string")
                                    message.mid = parseInt(object.mid, 10);
                                else if (typeof object.mid === "number")
                                    message.mid = object.mid;
                                else if (typeof object.mid === "object")
                                    message.mid = new $util.LongBits(object.mid.low >>> 0, object.mid.high >>> 0).toNumber();
                            if (object.name != null)
                                message.name = String(object.name);
                            if (object.sex != null)
                                message.sex = String(object.sex);
                            if (object.face != null)
                                message.face = String(object.face);
                            if (object.sign != null)
                                message.sign = String(object.sign);
                            if (object.rank != null)
                                message.rank = object.rank | 0;
                            return message;
                        };

                        /**
                         * Creates a plain object from a UserInfo message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @static
                         * @param {bilibili.community.service.dm.v1.UserInfo} message UserInfo
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        UserInfo.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.mid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.mid = options.longs === String ? "0" : 0;
                                object.name = "";
                                object.sex = "";
                                object.face = "";
                                object.sign = "";
                                object.rank = 0;
                            }
                            if (message.mid != null && message.hasOwnProperty("mid"))
                                if (typeof message.mid === "number")
                                    object.mid = options.longs === String ? String(message.mid) : message.mid;
                                else
                                    object.mid = options.longs === String ? $util.Long.prototype.toString.call(message.mid) : options.longs === Number ? new $util.LongBits(message.mid.low >>> 0, message.mid.high >>> 0).toNumber() : message.mid;
                            if (message.name != null && message.hasOwnProperty("name"))
                                object.name = message.name;
                            if (message.sex != null && message.hasOwnProperty("sex"))
                                object.sex = message.sex;
                            if (message.face != null && message.hasOwnProperty("face"))
                                object.face = message.face;
                            if (message.sign != null && message.hasOwnProperty("sign"))
                                object.sign = message.sign;
                            if (message.rank != null && message.hasOwnProperty("rank"))
                                object.rank = message.rank;
                            return object;
                        };

                        /**
                         * Converts this UserInfo to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.UserInfo
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        UserInfo.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return UserInfo;
                    })();

                    v1.DanmakuElem = (function() {

                        /**
                         * Properties of a DanmakuElem.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDanmakuElem
                         * @property {number|Long|null} [id] DanmakuElem id
                         * @property {number|null} [progress] DanmakuElem progress
                         * @property {number|null} [mode] DanmakuElem mode
                         * @property {number|null} [fontsize] DanmakuElem fontsize
                         * @property {number|null} [color] DanmakuElem color
                         * @property {string|null} [midHash] DanmakuElem midHash
                         * @property {string|null} [content] DanmakuElem content
                         * @property {number|Long|null} [ctime] DanmakuElem ctime
                         * @property {number|null} [weight] DanmakuElem weight
                         * @property {string|null} [action] DanmakuElem action
                         * @property {number|null} [pool] DanmakuElem pool
                         * @property {string|null} [idStr] DanmakuElem idStr
                         * @property {number|null} [attr] DanmakuElem attr
                         */

                        /**
                         * Constructs a new DanmakuElem.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DanmakuElem.
                         * @implements IDanmakuElem
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDanmakuElem=} [properties] Properties to set
                         */
                        function DanmakuElem(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DanmakuElem id.
                         * @member {number|Long} id
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.id = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DanmakuElem progress.
                         * @member {number} progress
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.progress = 0;

                        /**
                         * DanmakuElem mode.
                         * @member {number} mode
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.mode = 0;

                        /**
                         * DanmakuElem fontsize.
                         * @member {number} fontsize
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.fontsize = 0;

                        /**
                         * DanmakuElem color.
                         * @member {number} color
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.color = 0;

                        /**
                         * DanmakuElem midHash.
                         * @member {string} midHash
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.midHash = "";

                        /**
                         * DanmakuElem content.
                         * @member {string} content
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.content = "";

                        /**
                         * DanmakuElem ctime.
                         * @member {number|Long} ctime
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.ctime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DanmakuElem weight.
                         * @member {number} weight
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.weight = 0;

                        /**
                         * DanmakuElem action.
                         * @member {string} action
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.action = "";

                        /**
                         * DanmakuElem pool.
                         * @member {number} pool
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.pool = 0;

                        /**
                         * DanmakuElem idStr.
                         * @member {string} idStr
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.idStr = "";

                        /**
                         * DanmakuElem attr.
                         * @member {number} attr
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         */
                        DanmakuElem.prototype.attr = 0;

                        /**
                         * Creates a new DanmakuElem instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmakuElem=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DanmakuElem} DanmakuElem instance
                         */
                        DanmakuElem.create = function create(properties) {
                            return new DanmakuElem(properties);
                        };

                        /**
                         * Encodes the specified DanmakuElem message. Does not implicitly {@link bilibili.community.service.dm.v1.DanmakuElem.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmakuElem} message DanmakuElem message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmakuElem.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.id != null && Object.hasOwnProperty.call(message, "id"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.id);
                            if (message.progress != null && Object.hasOwnProperty.call(message, "progress"))
                                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.progress);
                            if (message.mode != null && Object.hasOwnProperty.call(message, "mode"))
                                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.mode);
                            if (message.fontsize != null && Object.hasOwnProperty.call(message, "fontsize"))
                                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.fontsize);
                            if (message.color != null && Object.hasOwnProperty.call(message, "color"))
                                writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.color);
                            if (message.midHash != null && Object.hasOwnProperty.call(message, "midHash"))
                                writer.uint32(/* id 6, wireType 2 =*/50).string(message.midHash);
                            if (message.content != null && Object.hasOwnProperty.call(message, "content"))
                                writer.uint32(/* id 7, wireType 2 =*/58).string(message.content);
                            if (message.ctime != null && Object.hasOwnProperty.call(message, "ctime"))
                                writer.uint32(/* id 8, wireType 0 =*/64).int64(message.ctime);
                            if (message.weight != null && Object.hasOwnProperty.call(message, "weight"))
                                writer.uint32(/* id 9, wireType 0 =*/72).int32(message.weight);
                            if (message.action != null && Object.hasOwnProperty.call(message, "action"))
                                writer.uint32(/* id 10, wireType 2 =*/82).string(message.action);
                            if (message.pool != null && Object.hasOwnProperty.call(message, "pool"))
                                writer.uint32(/* id 11, wireType 0 =*/88).int32(message.pool);
                            if (message.idStr != null && Object.hasOwnProperty.call(message, "idStr"))
                                writer.uint32(/* id 12, wireType 2 =*/98).string(message.idStr);
                            if (message.attr != null && Object.hasOwnProperty.call(message, "attr"))
                                writer.uint32(/* id 13, wireType 0 =*/104).int32(message.attr);
                            return writer;
                        };

                        /**
                         * Encodes the specified DanmakuElem message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DanmakuElem.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmakuElem} message DanmakuElem message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmakuElem.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DanmakuElem message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DanmakuElem} DanmakuElem
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmakuElem.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DanmakuElem();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.id = reader.int64();
                                        break;
                                    case 2:
                                        message.progress = reader.int32();
                                        break;
                                    case 3:
                                        message.mode = reader.int32();
                                        break;
                                    case 4:
                                        message.fontsize = reader.int32();
                                        break;
                                    case 5:
                                        message.color = reader.uint32();
                                        break;
                                    case 6:
                                        message.midHash = reader.string();
                                        break;
                                    case 7:
                                        message.content = reader.string();
                                        break;
                                    case 8:
                                        message.ctime = reader.int64();
                                        break;
                                    case 9:
                                        message.weight = reader.int32();
                                        break;
                                    case 10:
                                        message.action = reader.string();
                                        break;
                                    case 11:
                                        message.pool = reader.int32();
                                        break;
                                    case 12:
                                        message.idStr = reader.string();
                                        break;
                                    case 13:
                                        message.attr = reader.int32();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DanmakuElem message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DanmakuElem} DanmakuElem
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmakuElem.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DanmakuElem message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DanmakuElem.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.id != null && message.hasOwnProperty("id"))
                                if (!$util.isInteger(message.id) && !(message.id && $util.isInteger(message.id.low) && $util.isInteger(message.id.high)))
                                    return "id: integer|Long expected";
                            if (message.progress != null && message.hasOwnProperty("progress"))
                                if (!$util.isInteger(message.progress))
                                    return "progress: integer expected";
                            if (message.mode != null && message.hasOwnProperty("mode"))
                                if (!$util.isInteger(message.mode))
                                    return "mode: integer expected";
                            if (message.fontsize != null && message.hasOwnProperty("fontsize"))
                                if (!$util.isInteger(message.fontsize))
                                    return "fontsize: integer expected";
                            if (message.color != null && message.hasOwnProperty("color"))
                                if (!$util.isInteger(message.color))
                                    return "color: integer expected";
                            if (message.midHash != null && message.hasOwnProperty("midHash"))
                                if (!$util.isString(message.midHash))
                                    return "midHash: string expected";
                            if (message.content != null && message.hasOwnProperty("content"))
                                if (!$util.isString(message.content))
                                    return "content: string expected";
                            if (message.ctime != null && message.hasOwnProperty("ctime"))
                                if (!$util.isInteger(message.ctime) && !(message.ctime && $util.isInteger(message.ctime.low) && $util.isInteger(message.ctime.high)))
                                    return "ctime: integer|Long expected";
                            if (message.weight != null && message.hasOwnProperty("weight"))
                                if (!$util.isInteger(message.weight))
                                    return "weight: integer expected";
                            if (message.action != null && message.hasOwnProperty("action"))
                                if (!$util.isString(message.action))
                                    return "action: string expected";
                            if (message.pool != null && message.hasOwnProperty("pool"))
                                if (!$util.isInteger(message.pool))
                                    return "pool: integer expected";
                            if (message.idStr != null && message.hasOwnProperty("idStr"))
                                if (!$util.isString(message.idStr))
                                    return "idStr: string expected";
                            if (message.attr != null && message.hasOwnProperty("attr"))
                                if (!$util.isInteger(message.attr))
                                    return "attr: integer expected";
                            return null;
                        };

                        /**
                         * Creates a DanmakuElem message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DanmakuElem} DanmakuElem
                         */
                        DanmakuElem.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DanmakuElem)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DanmakuElem();
                            if (object.id != null)
                                if ($util.Long)
                                    (message.id = $util.Long.fromValue(object.id)).unsigned = false;
                                else if (typeof object.id === "string")
                                    message.id = parseInt(object.id, 10);
                                else if (typeof object.id === "number")
                                    message.id = object.id;
                                else if (typeof object.id === "object")
                                    message.id = new $util.LongBits(object.id.low >>> 0, object.id.high >>> 0).toNumber();
                            if (object.progress != null)
                                message.progress = object.progress | 0;
                            if (object.mode != null)
                                message.mode = object.mode | 0;
                            if (object.fontsize != null)
                                message.fontsize = object.fontsize | 0;
                            if (object.color != null)
                                message.color = object.color >>> 0;
                            if (object.midHash != null)
                                message.midHash = String(object.midHash);
                            if (object.content != null)
                                message.content = String(object.content);
                            if (object.ctime != null)
                                if ($util.Long)
                                    (message.ctime = $util.Long.fromValue(object.ctime)).unsigned = false;
                                else if (typeof object.ctime === "string")
                                    message.ctime = parseInt(object.ctime, 10);
                                else if (typeof object.ctime === "number")
                                    message.ctime = object.ctime;
                                else if (typeof object.ctime === "object")
                                    message.ctime = new $util.LongBits(object.ctime.low >>> 0, object.ctime.high >>> 0).toNumber();
                            if (object.weight != null)
                                message.weight = object.weight | 0;
                            if (object.action != null)
                                message.action = String(object.action);
                            if (object.pool != null)
                                message.pool = object.pool | 0;
                            if (object.idStr != null)
                                message.idStr = String(object.idStr);
                            if (object.attr != null)
                                message.attr = object.attr | 0;
                            return message;
                        };

                        /**
                         * Creates a plain object from a DanmakuElem message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @static
                         * @param {bilibili.community.service.dm.v1.DanmakuElem} message DanmakuElem
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DanmakuElem.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.id = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.id = options.longs === String ? "0" : 0;
                                object.progress = 0;
                                object.mode = 0;
                                object.fontsize = 0;
                                object.color = 0;
                                object.midHash = "";
                                object.content = "";
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.ctime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.ctime = options.longs === String ? "0" : 0;
                                object.weight = 0;
                                object.action = "";
                                object.pool = 0;
                                object.idStr = "";
                                object.attr = 0;
                            }
                            if (message.id != null && message.hasOwnProperty("id"))
                                if (typeof message.id === "number")
                                    object.id = options.longs === String ? String(message.id) : message.id;
                                else
                                    object.id = options.longs === String ? $util.Long.prototype.toString.call(message.id) : options.longs === Number ? new $util.LongBits(message.id.low >>> 0, message.id.high >>> 0).toNumber() : message.id;
                            if (message.progress != null && message.hasOwnProperty("progress"))
                                object.progress = message.progress;
                            if (message.mode != null && message.hasOwnProperty("mode"))
                                object.mode = message.mode;
                            if (message.fontsize != null && message.hasOwnProperty("fontsize"))
                                object.fontsize = message.fontsize;
                            if (message.color != null && message.hasOwnProperty("color"))
                                object.color = message.color;
                            if (message.midHash != null && message.hasOwnProperty("midHash"))
                                object.midHash = message.midHash;
                            if (message.content != null && message.hasOwnProperty("content"))
                                object.content = message.content;
                            if (message.ctime != null && message.hasOwnProperty("ctime"))
                                if (typeof message.ctime === "number")
                                    object.ctime = options.longs === String ? String(message.ctime) : message.ctime;
                                else
                                    object.ctime = options.longs === String ? $util.Long.prototype.toString.call(message.ctime) : options.longs === Number ? new $util.LongBits(message.ctime.low >>> 0, message.ctime.high >>> 0).toNumber() : message.ctime;
                            if (message.weight != null && message.hasOwnProperty("weight"))
                                object.weight = message.weight;
                            if (message.action != null && message.hasOwnProperty("action"))
                                object.action = message.action;
                            if (message.pool != null && message.hasOwnProperty("pool"))
                                object.pool = message.pool;
                            if (message.idStr != null && message.hasOwnProperty("idStr"))
                                object.idStr = message.idStr;
                            if (message.attr != null && message.hasOwnProperty("attr"))
                                object.attr = message.attr;
                            return object;
                        };

                        /**
                         * Converts this DanmakuElem to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DanmakuElem
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DanmakuElem.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DanmakuElem;
                    })();

                    /**
                     * DMAttrBit enum.
                     * @name bilibili.community.service.dm.v1.DMAttrBit
                     * @enum {number}
                     * @property {number} DMAttrBitProtect=0 DMAttrBitProtect value
                     * @property {number} DMAttrBitFromLive=1 DMAttrBitFromLive value
                     * @property {number} DMAttrHighLike=2 DMAttrHighLike value
                     */
                    v1.DMAttrBit = (function() {
                        var valuesById = {}, values = Object.create(valuesById);
                        values[valuesById[0] = "DMAttrBitProtect"] = 0;
                        values[valuesById[1] = "DMAttrBitFromLive"] = 1;
                        values[valuesById[2] = "DMAttrHighLike"] = 2;
                        return values;
                    })();

                    v1.DmPlayerConfigReq = (function() {

                        /**
                         * Properties of a DmPlayerConfigReq.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDmPlayerConfigReq
                         * @property {number|Long|null} [ts] DmPlayerConfigReq ts
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuSwitch|null} ["switch"] DmPlayerConfigReq switch
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuSwitchSave|null} [switchSave] DmPlayerConfigReq switchSave
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuUseDefaultConfig|null} [useDefaultConfig] DmPlayerConfigReq useDefaultConfig
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuAiRecommendedSwitch|null} [aiRecommendedSwitch] DmPlayerConfigReq aiRecommendedSwitch
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuAiRecommendedLevel|null} [aiRecommendedLevel] DmPlayerConfigReq aiRecommendedLevel
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuBlocktop|null} [blocktop] DmPlayerConfigReq blocktop
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuBlockscroll|null} [blockscroll] DmPlayerConfigReq blockscroll
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuBlockbottom|null} [blockbottom] DmPlayerConfigReq blockbottom
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuBlockcolorful|null} [blockcolorful] DmPlayerConfigReq blockcolorful
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuBlockrepeat|null} [blockrepeat] DmPlayerConfigReq blockrepeat
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuBlockspecial|null} [blockspecial] DmPlayerConfigReq blockspecial
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuOpacity|null} [opacity] DmPlayerConfigReq opacity
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuScalingfactor|null} [scalingfactor] DmPlayerConfigReq scalingfactor
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuDomain|null} [domain] DmPlayerConfigReq domain
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuSpeed|null} [speed] DmPlayerConfigReq speed
                         * @property {bilibili.community.service.dm.v1.IPlayerDanmakuEnableblocklist|null} [enableblocklist] DmPlayerConfigReq enableblocklist
                         * @property {bilibili.community.service.dm.v1.IInlinePlayerDanmakuSwitch|null} [inlinePlayerDanmakuSwitch] DmPlayerConfigReq inlinePlayerDanmakuSwitch
                         */

                        /**
                         * Constructs a new DmPlayerConfigReq.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DmPlayerConfigReq.
                         * @implements IDmPlayerConfigReq
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDmPlayerConfigReq=} [properties] Properties to set
                         */
                        function DmPlayerConfigReq(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DmPlayerConfigReq ts.
                         * @member {number|Long} ts
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.ts = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DmPlayerConfigReq switch.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuSwitch|null|undefined} switch
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype["switch"] = null;

                        /**
                         * DmPlayerConfigReq switchSave.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuSwitchSave|null|undefined} switchSave
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.switchSave = null;

                        /**
                         * DmPlayerConfigReq useDefaultConfig.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuUseDefaultConfig|null|undefined} useDefaultConfig
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.useDefaultConfig = null;

                        /**
                         * DmPlayerConfigReq aiRecommendedSwitch.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuAiRecommendedSwitch|null|undefined} aiRecommendedSwitch
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.aiRecommendedSwitch = null;

                        /**
                         * DmPlayerConfigReq aiRecommendedLevel.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuAiRecommendedLevel|null|undefined} aiRecommendedLevel
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.aiRecommendedLevel = null;

                        /**
                         * DmPlayerConfigReq blocktop.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuBlocktop|null|undefined} blocktop
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.blocktop = null;

                        /**
                         * DmPlayerConfigReq blockscroll.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuBlockscroll|null|undefined} blockscroll
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.blockscroll = null;

                        /**
                         * DmPlayerConfigReq blockbottom.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuBlockbottom|null|undefined} blockbottom
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.blockbottom = null;

                        /**
                         * DmPlayerConfigReq blockcolorful.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuBlockcolorful|null|undefined} blockcolorful
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.blockcolorful = null;

                        /**
                         * DmPlayerConfigReq blockrepeat.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuBlockrepeat|null|undefined} blockrepeat
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.blockrepeat = null;

                        /**
                         * DmPlayerConfigReq blockspecial.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuBlockspecial|null|undefined} blockspecial
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.blockspecial = null;

                        /**
                         * DmPlayerConfigReq opacity.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuOpacity|null|undefined} opacity
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.opacity = null;

                        /**
                         * DmPlayerConfigReq scalingfactor.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuScalingfactor|null|undefined} scalingfactor
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.scalingfactor = null;

                        /**
                         * DmPlayerConfigReq domain.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuDomain|null|undefined} domain
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.domain = null;

                        /**
                         * DmPlayerConfigReq speed.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuSpeed|null|undefined} speed
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.speed = null;

                        /**
                         * DmPlayerConfigReq enableblocklist.
                         * @member {bilibili.community.service.dm.v1.IPlayerDanmakuEnableblocklist|null|undefined} enableblocklist
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.enableblocklist = null;

                        /**
                         * DmPlayerConfigReq inlinePlayerDanmakuSwitch.
                         * @member {bilibili.community.service.dm.v1.IInlinePlayerDanmakuSwitch|null|undefined} inlinePlayerDanmakuSwitch
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         */
                        DmPlayerConfigReq.prototype.inlinePlayerDanmakuSwitch = null;

                        /**
                         * Creates a new DmPlayerConfigReq instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmPlayerConfigReq=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DmPlayerConfigReq} DmPlayerConfigReq instance
                         */
                        DmPlayerConfigReq.create = function create(properties) {
                            return new DmPlayerConfigReq(properties);
                        };

                        /**
                         * Encodes the specified DmPlayerConfigReq message. Does not implicitly {@link bilibili.community.service.dm.v1.DmPlayerConfigReq.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmPlayerConfigReq} message DmPlayerConfigReq message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmPlayerConfigReq.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.ts != null && Object.hasOwnProperty.call(message, "ts"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.ts);
                            if (message["switch"] != null && Object.hasOwnProperty.call(message, "switch"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitch.encode(message["switch"], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                            if (message.switchSave != null && Object.hasOwnProperty.call(message, "switchSave"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave.encode(message.switchSave, writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                            if (message.useDefaultConfig != null && Object.hasOwnProperty.call(message, "useDefaultConfig"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig.encode(message.useDefaultConfig, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
                            if (message.aiRecommendedSwitch != null && Object.hasOwnProperty.call(message, "aiRecommendedSwitch"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch.encode(message.aiRecommendedSwitch, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
                            if (message.aiRecommendedLevel != null && Object.hasOwnProperty.call(message, "aiRecommendedLevel"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel.encode(message.aiRecommendedLevel, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
                            if (message.blocktop != null && Object.hasOwnProperty.call(message, "blocktop"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuBlocktop.encode(message.blocktop, writer.uint32(/* id 7, wireType 2 =*/58).fork()).ldelim();
                            if (message.blockscroll != null && Object.hasOwnProperty.call(message, "blockscroll"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll.encode(message.blockscroll, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
                            if (message.blockbottom != null && Object.hasOwnProperty.call(message, "blockbottom"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom.encode(message.blockbottom, writer.uint32(/* id 9, wireType 2 =*/74).fork()).ldelim();
                            if (message.blockcolorful != null && Object.hasOwnProperty.call(message, "blockcolorful"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful.encode(message.blockcolorful, writer.uint32(/* id 10, wireType 2 =*/82).fork()).ldelim();
                            if (message.blockrepeat != null && Object.hasOwnProperty.call(message, "blockrepeat"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat.encode(message.blockrepeat, writer.uint32(/* id 11, wireType 2 =*/90).fork()).ldelim();
                            if (message.blockspecial != null && Object.hasOwnProperty.call(message, "blockspecial"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial.encode(message.blockspecial, writer.uint32(/* id 12, wireType 2 =*/98).fork()).ldelim();
                            if (message.opacity != null && Object.hasOwnProperty.call(message, "opacity"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuOpacity.encode(message.opacity, writer.uint32(/* id 13, wireType 2 =*/106).fork()).ldelim();
                            if (message.scalingfactor != null && Object.hasOwnProperty.call(message, "scalingfactor"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor.encode(message.scalingfactor, writer.uint32(/* id 14, wireType 2 =*/114).fork()).ldelim();
                            if (message.domain != null && Object.hasOwnProperty.call(message, "domain"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuDomain.encode(message.domain, writer.uint32(/* id 15, wireType 2 =*/122).fork()).ldelim();
                            if (message.speed != null && Object.hasOwnProperty.call(message, "speed"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuSpeed.encode(message.speed, writer.uint32(/* id 16, wireType 2 =*/130).fork()).ldelim();
                            if (message.enableblocklist != null && Object.hasOwnProperty.call(message, "enableblocklist"))
                                $root.bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist.encode(message.enableblocklist, writer.uint32(/* id 17, wireType 2 =*/138).fork()).ldelim();
                            if (message.inlinePlayerDanmakuSwitch != null && Object.hasOwnProperty.call(message, "inlinePlayerDanmakuSwitch"))
                                $root.bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch.encode(message.inlinePlayerDanmakuSwitch, writer.uint32(/* id 18, wireType 2 =*/146).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified DmPlayerConfigReq message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DmPlayerConfigReq.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDmPlayerConfigReq} message DmPlayerConfigReq message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DmPlayerConfigReq.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DmPlayerConfigReq message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DmPlayerConfigReq} DmPlayerConfigReq
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmPlayerConfigReq.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DmPlayerConfigReq();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.ts = reader.int64();
                                        break;
                                    case 2:
                                        message["switch"] = $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitch.decode(reader, reader.uint32());
                                        break;
                                    case 3:
                                        message.switchSave = $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave.decode(reader, reader.uint32());
                                        break;
                                    case 4:
                                        message.useDefaultConfig = $root.bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig.decode(reader, reader.uint32());
                                        break;
                                    case 5:
                                        message.aiRecommendedSwitch = $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch.decode(reader, reader.uint32());
                                        break;
                                    case 6:
                                        message.aiRecommendedLevel = $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel.decode(reader, reader.uint32());
                                        break;
                                    case 7:
                                        message.blocktop = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlocktop.decode(reader, reader.uint32());
                                        break;
                                    case 8:
                                        message.blockscroll = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll.decode(reader, reader.uint32());
                                        break;
                                    case 9:
                                        message.blockbottom = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom.decode(reader, reader.uint32());
                                        break;
                                    case 10:
                                        message.blockcolorful = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful.decode(reader, reader.uint32());
                                        break;
                                    case 11:
                                        message.blockrepeat = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat.decode(reader, reader.uint32());
                                        break;
                                    case 12:
                                        message.blockspecial = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial.decode(reader, reader.uint32());
                                        break;
                                    case 13:
                                        message.opacity = $root.bilibili.community.service.dm.v1.PlayerDanmakuOpacity.decode(reader, reader.uint32());
                                        break;
                                    case 14:
                                        message.scalingfactor = $root.bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor.decode(reader, reader.uint32());
                                        break;
                                    case 15:
                                        message.domain = $root.bilibili.community.service.dm.v1.PlayerDanmakuDomain.decode(reader, reader.uint32());
                                        break;
                                    case 16:
                                        message.speed = $root.bilibili.community.service.dm.v1.PlayerDanmakuSpeed.decode(reader, reader.uint32());
                                        break;
                                    case 17:
                                        message.enableblocklist = $root.bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist.decode(reader, reader.uint32());
                                        break;
                                    case 18:
                                        message.inlinePlayerDanmakuSwitch = $root.bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch.decode(reader, reader.uint32());
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DmPlayerConfigReq message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DmPlayerConfigReq} DmPlayerConfigReq
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DmPlayerConfigReq.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DmPlayerConfigReq message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DmPlayerConfigReq.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.ts != null && message.hasOwnProperty("ts"))
                                if (!$util.isInteger(message.ts) && !(message.ts && $util.isInteger(message.ts.low) && $util.isInteger(message.ts.high)))
                                    return "ts: integer|Long expected";
                            if (message["switch"] != null && message.hasOwnProperty("switch")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitch.verify(message["switch"]);
                                if (error)
                                    return "switch." + error;
                            }
                            if (message.switchSave != null && message.hasOwnProperty("switchSave")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave.verify(message.switchSave);
                                if (error)
                                    return "switchSave." + error;
                            }
                            if (message.useDefaultConfig != null && message.hasOwnProperty("useDefaultConfig")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig.verify(message.useDefaultConfig);
                                if (error)
                                    return "useDefaultConfig." + error;
                            }
                            if (message.aiRecommendedSwitch != null && message.hasOwnProperty("aiRecommendedSwitch")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch.verify(message.aiRecommendedSwitch);
                                if (error)
                                    return "aiRecommendedSwitch." + error;
                            }
                            if (message.aiRecommendedLevel != null && message.hasOwnProperty("aiRecommendedLevel")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel.verify(message.aiRecommendedLevel);
                                if (error)
                                    return "aiRecommendedLevel." + error;
                            }
                            if (message.blocktop != null && message.hasOwnProperty("blocktop")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlocktop.verify(message.blocktop);
                                if (error)
                                    return "blocktop." + error;
                            }
                            if (message.blockscroll != null && message.hasOwnProperty("blockscroll")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll.verify(message.blockscroll);
                                if (error)
                                    return "blockscroll." + error;
                            }
                            if (message.blockbottom != null && message.hasOwnProperty("blockbottom")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom.verify(message.blockbottom);
                                if (error)
                                    return "blockbottom." + error;
                            }
                            if (message.blockcolorful != null && message.hasOwnProperty("blockcolorful")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful.verify(message.blockcolorful);
                                if (error)
                                    return "blockcolorful." + error;
                            }
                            if (message.blockrepeat != null && message.hasOwnProperty("blockrepeat")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat.verify(message.blockrepeat);
                                if (error)
                                    return "blockrepeat." + error;
                            }
                            if (message.blockspecial != null && message.hasOwnProperty("blockspecial")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial.verify(message.blockspecial);
                                if (error)
                                    return "blockspecial." + error;
                            }
                            if (message.opacity != null && message.hasOwnProperty("opacity")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuOpacity.verify(message.opacity);
                                if (error)
                                    return "opacity." + error;
                            }
                            if (message.scalingfactor != null && message.hasOwnProperty("scalingfactor")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor.verify(message.scalingfactor);
                                if (error)
                                    return "scalingfactor." + error;
                            }
                            if (message.domain != null && message.hasOwnProperty("domain")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuDomain.verify(message.domain);
                                if (error)
                                    return "domain." + error;
                            }
                            if (message.speed != null && message.hasOwnProperty("speed")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuSpeed.verify(message.speed);
                                if (error)
                                    return "speed." + error;
                            }
                            if (message.enableblocklist != null && message.hasOwnProperty("enableblocklist")) {
                                var error = $root.bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist.verify(message.enableblocklist);
                                if (error)
                                    return "enableblocklist." + error;
                            }
                            if (message.inlinePlayerDanmakuSwitch != null && message.hasOwnProperty("inlinePlayerDanmakuSwitch")) {
                                var error = $root.bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch.verify(message.inlinePlayerDanmakuSwitch);
                                if (error)
                                    return "inlinePlayerDanmakuSwitch." + error;
                            }
                            return null;
                        };

                        /**
                         * Creates a DmPlayerConfigReq message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DmPlayerConfigReq} DmPlayerConfigReq
                         */
                        DmPlayerConfigReq.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DmPlayerConfigReq)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DmPlayerConfigReq();
                            if (object.ts != null)
                                if ($util.Long)
                                    (message.ts = $util.Long.fromValue(object.ts)).unsigned = false;
                                else if (typeof object.ts === "string")
                                    message.ts = parseInt(object.ts, 10);
                                else if (typeof object.ts === "number")
                                    message.ts = object.ts;
                                else if (typeof object.ts === "object")
                                    message.ts = new $util.LongBits(object.ts.low >>> 0, object.ts.high >>> 0).toNumber();
                            if (object["switch"] != null) {
                                if (typeof object["switch"] !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.switch: object expected");
                                message["switch"] = $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitch.fromObject(object["switch"]);
                            }
                            if (object.switchSave != null) {
                                if (typeof object.switchSave !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.switchSave: object expected");
                                message.switchSave = $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave.fromObject(object.switchSave);
                            }
                            if (object.useDefaultConfig != null) {
                                if (typeof object.useDefaultConfig !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.useDefaultConfig: object expected");
                                message.useDefaultConfig = $root.bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig.fromObject(object.useDefaultConfig);
                            }
                            if (object.aiRecommendedSwitch != null) {
                                if (typeof object.aiRecommendedSwitch !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.aiRecommendedSwitch: object expected");
                                message.aiRecommendedSwitch = $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch.fromObject(object.aiRecommendedSwitch);
                            }
                            if (object.aiRecommendedLevel != null) {
                                if (typeof object.aiRecommendedLevel !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.aiRecommendedLevel: object expected");
                                message.aiRecommendedLevel = $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel.fromObject(object.aiRecommendedLevel);
                            }
                            if (object.blocktop != null) {
                                if (typeof object.blocktop !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.blocktop: object expected");
                                message.blocktop = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlocktop.fromObject(object.blocktop);
                            }
                            if (object.blockscroll != null) {
                                if (typeof object.blockscroll !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.blockscroll: object expected");
                                message.blockscroll = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll.fromObject(object.blockscroll);
                            }
                            if (object.blockbottom != null) {
                                if (typeof object.blockbottom !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.blockbottom: object expected");
                                message.blockbottom = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom.fromObject(object.blockbottom);
                            }
                            if (object.blockcolorful != null) {
                                if (typeof object.blockcolorful !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.blockcolorful: object expected");
                                message.blockcolorful = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful.fromObject(object.blockcolorful);
                            }
                            if (object.blockrepeat != null) {
                                if (typeof object.blockrepeat !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.blockrepeat: object expected");
                                message.blockrepeat = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat.fromObject(object.blockrepeat);
                            }
                            if (object.blockspecial != null) {
                                if (typeof object.blockspecial !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.blockspecial: object expected");
                                message.blockspecial = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial.fromObject(object.blockspecial);
                            }
                            if (object.opacity != null) {
                                if (typeof object.opacity !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.opacity: object expected");
                                message.opacity = $root.bilibili.community.service.dm.v1.PlayerDanmakuOpacity.fromObject(object.opacity);
                            }
                            if (object.scalingfactor != null) {
                                if (typeof object.scalingfactor !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.scalingfactor: object expected");
                                message.scalingfactor = $root.bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor.fromObject(object.scalingfactor);
                            }
                            if (object.domain != null) {
                                if (typeof object.domain !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.domain: object expected");
                                message.domain = $root.bilibili.community.service.dm.v1.PlayerDanmakuDomain.fromObject(object.domain);
                            }
                            if (object.speed != null) {
                                if (typeof object.speed !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.speed: object expected");
                                message.speed = $root.bilibili.community.service.dm.v1.PlayerDanmakuSpeed.fromObject(object.speed);
                            }
                            if (object.enableblocklist != null) {
                                if (typeof object.enableblocklist !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.enableblocklist: object expected");
                                message.enableblocklist = $root.bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist.fromObject(object.enableblocklist);
                            }
                            if (object.inlinePlayerDanmakuSwitch != null) {
                                if (typeof object.inlinePlayerDanmakuSwitch !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DmPlayerConfigReq.inlinePlayerDanmakuSwitch: object expected");
                                message.inlinePlayerDanmakuSwitch = $root.bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch.fromObject(object.inlinePlayerDanmakuSwitch);
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a DmPlayerConfigReq message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @static
                         * @param {bilibili.community.service.dm.v1.DmPlayerConfigReq} message DmPlayerConfigReq
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DmPlayerConfigReq.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.ts = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.ts = options.longs === String ? "0" : 0;
                                object["switch"] = null;
                                object.switchSave = null;
                                object.useDefaultConfig = null;
                                object.aiRecommendedSwitch = null;
                                object.aiRecommendedLevel = null;
                                object.blocktop = null;
                                object.blockscroll = null;
                                object.blockbottom = null;
                                object.blockcolorful = null;
                                object.blockrepeat = null;
                                object.blockspecial = null;
                                object.opacity = null;
                                object.scalingfactor = null;
                                object.domain = null;
                                object.speed = null;
                                object.enableblocklist = null;
                                object.inlinePlayerDanmakuSwitch = null;
                            }
                            if (message.ts != null && message.hasOwnProperty("ts"))
                                if (typeof message.ts === "number")
                                    object.ts = options.longs === String ? String(message.ts) : message.ts;
                                else
                                    object.ts = options.longs === String ? $util.Long.prototype.toString.call(message.ts) : options.longs === Number ? new $util.LongBits(message.ts.low >>> 0, message.ts.high >>> 0).toNumber() : message.ts;
                            if (message["switch"] != null && message.hasOwnProperty("switch"))
                                object["switch"] = $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitch.toObject(message["switch"], options);
                            if (message.switchSave != null && message.hasOwnProperty("switchSave"))
                                object.switchSave = $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave.toObject(message.switchSave, options);
                            if (message.useDefaultConfig != null && message.hasOwnProperty("useDefaultConfig"))
                                object.useDefaultConfig = $root.bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig.toObject(message.useDefaultConfig, options);
                            if (message.aiRecommendedSwitch != null && message.hasOwnProperty("aiRecommendedSwitch"))
                                object.aiRecommendedSwitch = $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch.toObject(message.aiRecommendedSwitch, options);
                            if (message.aiRecommendedLevel != null && message.hasOwnProperty("aiRecommendedLevel"))
                                object.aiRecommendedLevel = $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel.toObject(message.aiRecommendedLevel, options);
                            if (message.blocktop != null && message.hasOwnProperty("blocktop"))
                                object.blocktop = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlocktop.toObject(message.blocktop, options);
                            if (message.blockscroll != null && message.hasOwnProperty("blockscroll"))
                                object.blockscroll = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll.toObject(message.blockscroll, options);
                            if (message.blockbottom != null && message.hasOwnProperty("blockbottom"))
                                object.blockbottom = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom.toObject(message.blockbottom, options);
                            if (message.blockcolorful != null && message.hasOwnProperty("blockcolorful"))
                                object.blockcolorful = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful.toObject(message.blockcolorful, options);
                            if (message.blockrepeat != null && message.hasOwnProperty("blockrepeat"))
                                object.blockrepeat = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat.toObject(message.blockrepeat, options);
                            if (message.blockspecial != null && message.hasOwnProperty("blockspecial"))
                                object.blockspecial = $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial.toObject(message.blockspecial, options);
                            if (message.opacity != null && message.hasOwnProperty("opacity"))
                                object.opacity = $root.bilibili.community.service.dm.v1.PlayerDanmakuOpacity.toObject(message.opacity, options);
                            if (message.scalingfactor != null && message.hasOwnProperty("scalingfactor"))
                                object.scalingfactor = $root.bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor.toObject(message.scalingfactor, options);
                            if (message.domain != null && message.hasOwnProperty("domain"))
                                object.domain = $root.bilibili.community.service.dm.v1.PlayerDanmakuDomain.toObject(message.domain, options);
                            if (message.speed != null && message.hasOwnProperty("speed"))
                                object.speed = $root.bilibili.community.service.dm.v1.PlayerDanmakuSpeed.toObject(message.speed, options);
                            if (message.enableblocklist != null && message.hasOwnProperty("enableblocklist"))
                                object.enableblocklist = $root.bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist.toObject(message.enableblocklist, options);
                            if (message.inlinePlayerDanmakuSwitch != null && message.hasOwnProperty("inlinePlayerDanmakuSwitch"))
                                object.inlinePlayerDanmakuSwitch = $root.bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch.toObject(message.inlinePlayerDanmakuSwitch, options);
                            return object;
                        };

                        /**
                         * Converts this DmPlayerConfigReq to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DmPlayerConfigReq
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DmPlayerConfigReq.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DmPlayerConfigReq;
                    })();

                    v1.Response = (function() {

                        /**
                         * Properties of a Response.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IResponse
                         * @property {number|null} [code] Response code
                         * @property {string|null} [message] Response message
                         */

                        /**
                         * Constructs a new Response.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a Response.
                         * @implements IResponse
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IResponse=} [properties] Properties to set
                         */
                        function Response(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * Response code.
                         * @member {number} code
                         * @memberof bilibili.community.service.dm.v1.Response
                         * @instance
                         */
                        Response.prototype.code = 0;

                        /**
                         * Response message.
                         * @member {string} message
                         * @memberof bilibili.community.service.dm.v1.Response
                         * @instance
                         */
                        Response.prototype.message = "";

                        /**
                         * Creates a new Response instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.Response
                         * @static
                         * @param {bilibili.community.service.dm.v1.IResponse=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.Response} Response instance
                         */
                        Response.create = function create(properties) {
                            return new Response(properties);
                        };

                        /**
                         * Encodes the specified Response message. Does not implicitly {@link bilibili.community.service.dm.v1.Response.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.Response
                         * @static
                         * @param {bilibili.community.service.dm.v1.IResponse} message Response message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        Response.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.code != null && Object.hasOwnProperty.call(message, "code"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.code);
                            if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                                writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                            return writer;
                        };

                        /**
                         * Encodes the specified Response message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.Response.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.Response
                         * @static
                         * @param {bilibili.community.service.dm.v1.IResponse} message Response message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        Response.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a Response message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.Response
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.Response} Response
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        Response.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.Response();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.code = reader.int32();
                                        break;
                                    case 2:
                                        message.message = reader.string();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a Response message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.Response
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.Response} Response
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        Response.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a Response message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.Response
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        Response.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.code != null && message.hasOwnProperty("code"))
                                if (!$util.isInteger(message.code))
                                    return "code: integer expected";
                            if (message.message != null && message.hasOwnProperty("message"))
                                if (!$util.isString(message.message))
                                    return "message: string expected";
                            return null;
                        };

                        /**
                         * Creates a Response message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.Response
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.Response} Response
                         */
                        Response.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.Response)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.Response();
                            if (object.code != null)
                                message.code = object.code | 0;
                            if (object.message != null)
                                message.message = String(object.message);
                            return message;
                        };

                        /**
                         * Creates a plain object from a Response message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.Response
                         * @static
                         * @param {bilibili.community.service.dm.v1.Response} message Response
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        Response.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.code = 0;
                                object.message = "";
                            }
                            if (message.code != null && message.hasOwnProperty("code"))
                                object.code = message.code;
                            if (message.message != null && message.hasOwnProperty("message"))
                                object.message = message.message;
                            return object;
                        };

                        /**
                         * Converts this Response to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.Response
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        Response.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return Response;
                    })();

                    v1.DanmakuFlag = (function() {

                        /**
                         * Properties of a DanmakuFlag.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDanmakuFlag
                         * @property {number|Long|null} [dmid] DanmakuFlag dmid
                         * @property {number|null} [flag] DanmakuFlag flag
                         */

                        /**
                         * Constructs a new DanmakuFlag.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DanmakuFlag.
                         * @implements IDanmakuFlag
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDanmakuFlag=} [properties] Properties to set
                         */
                        function DanmakuFlag(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DanmakuFlag dmid.
                         * @member {number|Long} dmid
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlag
                         * @instance
                         */
                        DanmakuFlag.prototype.dmid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

                        /**
                         * DanmakuFlag flag.
                         * @member {number} flag
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlag
                         * @instance
                         */
                        DanmakuFlag.prototype.flag = 0;

                        /**
                         * Creates a new DanmakuFlag instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlag
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmakuFlag=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DanmakuFlag} DanmakuFlag instance
                         */
                        DanmakuFlag.create = function create(properties) {
                            return new DanmakuFlag(properties);
                        };

                        /**
                         * Encodes the specified DanmakuFlag message. Does not implicitly {@link bilibili.community.service.dm.v1.DanmakuFlag.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlag
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmakuFlag} message DanmakuFlag message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmakuFlag.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.dmid != null && Object.hasOwnProperty.call(message, "dmid"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int64(message.dmid);
                            if (message.flag != null && Object.hasOwnProperty.call(message, "flag"))
                                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.flag);
                            return writer;
                        };

                        /**
                         * Encodes the specified DanmakuFlag message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DanmakuFlag.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlag
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmakuFlag} message DanmakuFlag message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmakuFlag.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DanmakuFlag message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlag
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DanmakuFlag} DanmakuFlag
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmakuFlag.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DanmakuFlag();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.dmid = reader.int64();
                                        break;
                                    case 2:
                                        message.flag = reader.uint32();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DanmakuFlag message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlag
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DanmakuFlag} DanmakuFlag
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmakuFlag.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DanmakuFlag message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlag
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DanmakuFlag.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.dmid != null && message.hasOwnProperty("dmid"))
                                if (!$util.isInteger(message.dmid) && !(message.dmid && $util.isInteger(message.dmid.low) && $util.isInteger(message.dmid.high)))
                                    return "dmid: integer|Long expected";
                            if (message.flag != null && message.hasOwnProperty("flag"))
                                if (!$util.isInteger(message.flag))
                                    return "flag: integer expected";
                            return null;
                        };

                        /**
                         * Creates a DanmakuFlag message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlag
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DanmakuFlag} DanmakuFlag
                         */
                        DanmakuFlag.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DanmakuFlag)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DanmakuFlag();
                            if (object.dmid != null)
                                if ($util.Long)
                                    (message.dmid = $util.Long.fromValue(object.dmid)).unsigned = false;
                                else if (typeof object.dmid === "string")
                                    message.dmid = parseInt(object.dmid, 10);
                                else if (typeof object.dmid === "number")
                                    message.dmid = object.dmid;
                                else if (typeof object.dmid === "object")
                                    message.dmid = new $util.LongBits(object.dmid.low >>> 0, object.dmid.high >>> 0).toNumber();
                            if (object.flag != null)
                                message.flag = object.flag >>> 0;
                            return message;
                        };

                        /**
                         * Creates a plain object from a DanmakuFlag message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlag
                         * @static
                         * @param {bilibili.community.service.dm.v1.DanmakuFlag} message DanmakuFlag
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DanmakuFlag.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                if ($util.Long) {
                                    var long = new $util.Long(0, 0, false);
                                    object.dmid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
                                } else
                                    object.dmid = options.longs === String ? "0" : 0;
                                object.flag = 0;
                            }
                            if (message.dmid != null && message.hasOwnProperty("dmid"))
                                if (typeof message.dmid === "number")
                                    object.dmid = options.longs === String ? String(message.dmid) : message.dmid;
                                else
                                    object.dmid = options.longs === String ? $util.Long.prototype.toString.call(message.dmid) : options.longs === Number ? new $util.LongBits(message.dmid.low >>> 0, message.dmid.high >>> 0).toNumber() : message.dmid;
                            if (message.flag != null && message.hasOwnProperty("flag"))
                                object.flag = message.flag;
                            return object;
                        };

                        /**
                         * Converts this DanmakuFlag to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlag
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DanmakuFlag.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DanmakuFlag;
                    })();

                    v1.DanmakuFlagConfig = (function() {

                        /**
                         * Properties of a DanmakuFlagConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDanmakuFlagConfig
                         * @property {number|null} [recFlag] DanmakuFlagConfig recFlag
                         * @property {string|null} [recText] DanmakuFlagConfig recText
                         * @property {number|null} [recSwitch] DanmakuFlagConfig recSwitch
                         */

                        /**
                         * Constructs a new DanmakuFlagConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DanmakuFlagConfig.
                         * @implements IDanmakuFlagConfig
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDanmakuFlagConfig=} [properties] Properties to set
                         */
                        function DanmakuFlagConfig(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DanmakuFlagConfig recFlag.
                         * @member {number} recFlag
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlagConfig
                         * @instance
                         */
                        DanmakuFlagConfig.prototype.recFlag = 0;

                        /**
                         * DanmakuFlagConfig recText.
                         * @member {string} recText
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlagConfig
                         * @instance
                         */
                        DanmakuFlagConfig.prototype.recText = "";

                        /**
                         * DanmakuFlagConfig recSwitch.
                         * @member {number} recSwitch
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlagConfig
                         * @instance
                         */
                        DanmakuFlagConfig.prototype.recSwitch = 0;

                        /**
                         * Creates a new DanmakuFlagConfig instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlagConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmakuFlagConfig=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DanmakuFlagConfig} DanmakuFlagConfig instance
                         */
                        DanmakuFlagConfig.create = function create(properties) {
                            return new DanmakuFlagConfig(properties);
                        };

                        /**
                         * Encodes the specified DanmakuFlagConfig message. Does not implicitly {@link bilibili.community.service.dm.v1.DanmakuFlagConfig.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlagConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmakuFlagConfig} message DanmakuFlagConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmakuFlagConfig.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.recFlag != null && Object.hasOwnProperty.call(message, "recFlag"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.recFlag);
                            if (message.recText != null && Object.hasOwnProperty.call(message, "recText"))
                                writer.uint32(/* id 2, wireType 2 =*/18).string(message.recText);
                            if (message.recSwitch != null && Object.hasOwnProperty.call(message, "recSwitch"))
                                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.recSwitch);
                            return writer;
                        };

                        /**
                         * Encodes the specified DanmakuFlagConfig message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DanmakuFlagConfig.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlagConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmakuFlagConfig} message DanmakuFlagConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmakuFlagConfig.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DanmakuFlagConfig message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlagConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DanmakuFlagConfig} DanmakuFlagConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmakuFlagConfig.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DanmakuFlagConfig();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.recFlag = reader.int32();
                                        break;
                                    case 2:
                                        message.recText = reader.string();
                                        break;
                                    case 3:
                                        message.recSwitch = reader.int32();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DanmakuFlagConfig message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlagConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DanmakuFlagConfig} DanmakuFlagConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmakuFlagConfig.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DanmakuFlagConfig message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlagConfig
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DanmakuFlagConfig.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.recFlag != null && message.hasOwnProperty("recFlag"))
                                if (!$util.isInteger(message.recFlag))
                                    return "recFlag: integer expected";
                            if (message.recText != null && message.hasOwnProperty("recText"))
                                if (!$util.isString(message.recText))
                                    return "recText: string expected";
                            if (message.recSwitch != null && message.hasOwnProperty("recSwitch"))
                                if (!$util.isInteger(message.recSwitch))
                                    return "recSwitch: integer expected";
                            return null;
                        };

                        /**
                         * Creates a DanmakuFlagConfig message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlagConfig
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DanmakuFlagConfig} DanmakuFlagConfig
                         */
                        DanmakuFlagConfig.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DanmakuFlagConfig)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DanmakuFlagConfig();
                            if (object.recFlag != null)
                                message.recFlag = object.recFlag | 0;
                            if (object.recText != null)
                                message.recText = String(object.recText);
                            if (object.recSwitch != null)
                                message.recSwitch = object.recSwitch | 0;
                            return message;
                        };

                        /**
                         * Creates a plain object from a DanmakuFlagConfig message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlagConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.DanmakuFlagConfig} message DanmakuFlagConfig
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DanmakuFlagConfig.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.recFlag = 0;
                                object.recText = "";
                                object.recSwitch = 0;
                            }
                            if (message.recFlag != null && message.hasOwnProperty("recFlag"))
                                object.recFlag = message.recFlag;
                            if (message.recText != null && message.hasOwnProperty("recText"))
                                object.recText = message.recText;
                            if (message.recSwitch != null && message.hasOwnProperty("recSwitch"))
                                object.recSwitch = message.recSwitch;
                            return object;
                        };

                        /**
                         * Converts this DanmakuFlagConfig to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DanmakuFlagConfig
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DanmakuFlagConfig.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DanmakuFlagConfig;
                    })();

                    v1.DanmakuAIFlag = (function() {

                        /**
                         * Properties of a DanmakuAIFlag.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDanmakuAIFlag
                         * @property {Array.<bilibili.community.service.dm.v1.IDanmakuFlag>|null} [dmFlags] DanmakuAIFlag dmFlags
                         */

                        /**
                         * Constructs a new DanmakuAIFlag.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DanmakuAIFlag.
                         * @implements IDanmakuAIFlag
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDanmakuAIFlag=} [properties] Properties to set
                         */
                        function DanmakuAIFlag(properties) {
                            this.dmFlags = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DanmakuAIFlag dmFlags.
                         * @member {Array.<bilibili.community.service.dm.v1.IDanmakuFlag>} dmFlags
                         * @memberof bilibili.community.service.dm.v1.DanmakuAIFlag
                         * @instance
                         */
                        DanmakuAIFlag.prototype.dmFlags = $util.emptyArray;

                        /**
                         * Creates a new DanmakuAIFlag instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DanmakuAIFlag
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmakuAIFlag=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DanmakuAIFlag} DanmakuAIFlag instance
                         */
                        DanmakuAIFlag.create = function create(properties) {
                            return new DanmakuAIFlag(properties);
                        };

                        /**
                         * Encodes the specified DanmakuAIFlag message. Does not implicitly {@link bilibili.community.service.dm.v1.DanmakuAIFlag.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DanmakuAIFlag
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmakuAIFlag} message DanmakuAIFlag message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmakuAIFlag.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.dmFlags != null && message.dmFlags.length)
                                for (var i = 0; i < message.dmFlags.length; ++i)
                                    $root.bilibili.community.service.dm.v1.DanmakuFlag.encode(message.dmFlags[i], writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified DanmakuAIFlag message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DanmakuAIFlag.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmakuAIFlag
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmakuAIFlag} message DanmakuAIFlag message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmakuAIFlag.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DanmakuAIFlag message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DanmakuAIFlag
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DanmakuAIFlag} DanmakuAIFlag
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmakuAIFlag.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DanmakuAIFlag();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        if (!(message.dmFlags && message.dmFlags.length))
                                            message.dmFlags = [];
                                        message.dmFlags.push($root.bilibili.community.service.dm.v1.DanmakuFlag.decode(reader, reader.uint32()));
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DanmakuAIFlag message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmakuAIFlag
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DanmakuAIFlag} DanmakuAIFlag
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmakuAIFlag.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DanmakuAIFlag message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DanmakuAIFlag
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DanmakuAIFlag.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.dmFlags != null && message.hasOwnProperty("dmFlags")) {
                                if (!Array.isArray(message.dmFlags))
                                    return "dmFlags: array expected";
                                for (var i = 0; i < message.dmFlags.length; ++i) {
                                    var error = $root.bilibili.community.service.dm.v1.DanmakuFlag.verify(message.dmFlags[i]);
                                    if (error)
                                        return "dmFlags." + error;
                                }
                            }
                            return null;
                        };

                        /**
                         * Creates a DanmakuAIFlag message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DanmakuAIFlag
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DanmakuAIFlag} DanmakuAIFlag
                         */
                        DanmakuAIFlag.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DanmakuAIFlag)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DanmakuAIFlag();
                            if (object.dmFlags) {
                                if (!Array.isArray(object.dmFlags))
                                    throw TypeError(".bilibili.community.service.dm.v1.DanmakuAIFlag.dmFlags: array expected");
                                message.dmFlags = [];
                                for (var i = 0; i < object.dmFlags.length; ++i) {
                                    if (typeof object.dmFlags[i] !== "object")
                                        throw TypeError(".bilibili.community.service.dm.v1.DanmakuAIFlag.dmFlags: object expected");
                                    message.dmFlags[i] = $root.bilibili.community.service.dm.v1.DanmakuFlag.fromObject(object.dmFlags[i]);
                                }
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a DanmakuAIFlag message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DanmakuAIFlag
                         * @static
                         * @param {bilibili.community.service.dm.v1.DanmakuAIFlag} message DanmakuAIFlag
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DanmakuAIFlag.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.dmFlags = [];
                            if (message.dmFlags && message.dmFlags.length) {
                                object.dmFlags = [];
                                for (var j = 0; j < message.dmFlags.length; ++j)
                                    object.dmFlags[j] = $root.bilibili.community.service.dm.v1.DanmakuFlag.toObject(message.dmFlags[j], options);
                            }
                            return object;
                        };

                        /**
                         * Converts this DanmakuAIFlag to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DanmakuAIFlag
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DanmakuAIFlag.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DanmakuAIFlag;
                    })();

                    v1.DanmuPlayerViewConfig = (function() {

                        /**
                         * Properties of a DanmuPlayerViewConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDanmuPlayerViewConfig
                         * @property {bilibili.community.service.dm.v1.IDanmuDefaultPlayerConfig|null} [danmukuDefaultPlayerConfig] DanmuPlayerViewConfig danmukuDefaultPlayerConfig
                         * @property {bilibili.community.service.dm.v1.IDanmuPlayerConfig|null} [danmukuPlayerConfig] DanmuPlayerViewConfig danmukuPlayerConfig
                         * @property {Array.<bilibili.community.service.dm.v1.IDanmuPlayerDynamicConfig>|null} [danmukuPlayerDynamicConfig] DanmuPlayerViewConfig danmukuPlayerDynamicConfig
                         */

                        /**
                         * Constructs a new DanmuPlayerViewConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DanmuPlayerViewConfig.
                         * @implements IDanmuPlayerViewConfig
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDanmuPlayerViewConfig=} [properties] Properties to set
                         */
                        function DanmuPlayerViewConfig(properties) {
                            this.danmukuPlayerDynamicConfig = [];
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DanmuPlayerViewConfig danmukuDefaultPlayerConfig.
                         * @member {bilibili.community.service.dm.v1.IDanmuDefaultPlayerConfig|null|undefined} danmukuDefaultPlayerConfig
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerViewConfig
                         * @instance
                         */
                        DanmuPlayerViewConfig.prototype.danmukuDefaultPlayerConfig = null;

                        /**
                         * DanmuPlayerViewConfig danmukuPlayerConfig.
                         * @member {bilibili.community.service.dm.v1.IDanmuPlayerConfig|null|undefined} danmukuPlayerConfig
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerViewConfig
                         * @instance
                         */
                        DanmuPlayerViewConfig.prototype.danmukuPlayerConfig = null;

                        /**
                         * DanmuPlayerViewConfig danmukuPlayerDynamicConfig.
                         * @member {Array.<bilibili.community.service.dm.v1.IDanmuPlayerDynamicConfig>} danmukuPlayerDynamicConfig
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerViewConfig
                         * @instance
                         */
                        DanmuPlayerViewConfig.prototype.danmukuPlayerDynamicConfig = $util.emptyArray;

                        /**
                         * Creates a new DanmuPlayerViewConfig instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerViewConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuPlayerViewConfig=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DanmuPlayerViewConfig} DanmuPlayerViewConfig instance
                         */
                        DanmuPlayerViewConfig.create = function create(properties) {
                            return new DanmuPlayerViewConfig(properties);
                        };

                        /**
                         * Encodes the specified DanmuPlayerViewConfig message. Does not implicitly {@link bilibili.community.service.dm.v1.DanmuPlayerViewConfig.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerViewConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuPlayerViewConfig} message DanmuPlayerViewConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmuPlayerViewConfig.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.danmukuDefaultPlayerConfig != null && Object.hasOwnProperty.call(message, "danmukuDefaultPlayerConfig"))
                                $root.bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig.encode(message.danmukuDefaultPlayerConfig, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
                            if (message.danmukuPlayerConfig != null && Object.hasOwnProperty.call(message, "danmukuPlayerConfig"))
                                $root.bilibili.community.service.dm.v1.DanmuPlayerConfig.encode(message.danmukuPlayerConfig, writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
                            if (message.danmukuPlayerDynamicConfig != null && message.danmukuPlayerDynamicConfig.length)
                                for (var i = 0; i < message.danmukuPlayerDynamicConfig.length; ++i)
                                    $root.bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig.encode(message.danmukuPlayerDynamicConfig[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
                            return writer;
                        };

                        /**
                         * Encodes the specified DanmuPlayerViewConfig message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DanmuPlayerViewConfig.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerViewConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuPlayerViewConfig} message DanmuPlayerViewConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmuPlayerViewConfig.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DanmuPlayerViewConfig message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerViewConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DanmuPlayerViewConfig} DanmuPlayerViewConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmuPlayerViewConfig.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DanmuPlayerViewConfig();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.danmukuDefaultPlayerConfig = $root.bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig.decode(reader, reader.uint32());
                                        break;
                                    case 2:
                                        message.danmukuPlayerConfig = $root.bilibili.community.service.dm.v1.DanmuPlayerConfig.decode(reader, reader.uint32());
                                        break;
                                    case 3:
                                        if (!(message.danmukuPlayerDynamicConfig && message.danmukuPlayerDynamicConfig.length))
                                            message.danmukuPlayerDynamicConfig = [];
                                        message.danmukuPlayerDynamicConfig.push($root.bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig.decode(reader, reader.uint32()));
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DanmuPlayerViewConfig message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerViewConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DanmuPlayerViewConfig} DanmuPlayerViewConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmuPlayerViewConfig.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DanmuPlayerViewConfig message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerViewConfig
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DanmuPlayerViewConfig.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.danmukuDefaultPlayerConfig != null && message.hasOwnProperty("danmukuDefaultPlayerConfig")) {
                                var error = $root.bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig.verify(message.danmukuDefaultPlayerConfig);
                                if (error)
                                    return "danmukuDefaultPlayerConfig." + error;
                            }
                            if (message.danmukuPlayerConfig != null && message.hasOwnProperty("danmukuPlayerConfig")) {
                                var error = $root.bilibili.community.service.dm.v1.DanmuPlayerConfig.verify(message.danmukuPlayerConfig);
                                if (error)
                                    return "danmukuPlayerConfig." + error;
                            }
                            if (message.danmukuPlayerDynamicConfig != null && message.hasOwnProperty("danmukuPlayerDynamicConfig")) {
                                if (!Array.isArray(message.danmukuPlayerDynamicConfig))
                                    return "danmukuPlayerDynamicConfig: array expected";
                                for (var i = 0; i < message.danmukuPlayerDynamicConfig.length; ++i) {
                                    var error = $root.bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig.verify(message.danmukuPlayerDynamicConfig[i]);
                                    if (error)
                                        return "danmukuPlayerDynamicConfig." + error;
                                }
                            }
                            return null;
                        };

                        /**
                         * Creates a DanmuPlayerViewConfig message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerViewConfig
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DanmuPlayerViewConfig} DanmuPlayerViewConfig
                         */
                        DanmuPlayerViewConfig.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DanmuPlayerViewConfig)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DanmuPlayerViewConfig();
                            if (object.danmukuDefaultPlayerConfig != null) {
                                if (typeof object.danmukuDefaultPlayerConfig !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DanmuPlayerViewConfig.danmukuDefaultPlayerConfig: object expected");
                                message.danmukuDefaultPlayerConfig = $root.bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig.fromObject(object.danmukuDefaultPlayerConfig);
                            }
                            if (object.danmukuPlayerConfig != null) {
                                if (typeof object.danmukuPlayerConfig !== "object")
                                    throw TypeError(".bilibili.community.service.dm.v1.DanmuPlayerViewConfig.danmukuPlayerConfig: object expected");
                                message.danmukuPlayerConfig = $root.bilibili.community.service.dm.v1.DanmuPlayerConfig.fromObject(object.danmukuPlayerConfig);
                            }
                            if (object.danmukuPlayerDynamicConfig) {
                                if (!Array.isArray(object.danmukuPlayerDynamicConfig))
                                    throw TypeError(".bilibili.community.service.dm.v1.DanmuPlayerViewConfig.danmukuPlayerDynamicConfig: array expected");
                                message.danmukuPlayerDynamicConfig = [];
                                for (var i = 0; i < object.danmukuPlayerDynamicConfig.length; ++i) {
                                    if (typeof object.danmukuPlayerDynamicConfig[i] !== "object")
                                        throw TypeError(".bilibili.community.service.dm.v1.DanmuPlayerViewConfig.danmukuPlayerDynamicConfig: object expected");
                                    message.danmukuPlayerDynamicConfig[i] = $root.bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig.fromObject(object.danmukuPlayerDynamicConfig[i]);
                                }
                            }
                            return message;
                        };

                        /**
                         * Creates a plain object from a DanmuPlayerViewConfig message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerViewConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.DanmuPlayerViewConfig} message DanmuPlayerViewConfig
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DanmuPlayerViewConfig.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.arrays || options.defaults)
                                object.danmukuPlayerDynamicConfig = [];
                            if (options.defaults) {
                                object.danmukuDefaultPlayerConfig = null;
                                object.danmukuPlayerConfig = null;
                            }
                            if (message.danmukuDefaultPlayerConfig != null && message.hasOwnProperty("danmukuDefaultPlayerConfig"))
                                object.danmukuDefaultPlayerConfig = $root.bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig.toObject(message.danmukuDefaultPlayerConfig, options);
                            if (message.danmukuPlayerConfig != null && message.hasOwnProperty("danmukuPlayerConfig"))
                                object.danmukuPlayerConfig = $root.bilibili.community.service.dm.v1.DanmuPlayerConfig.toObject(message.danmukuPlayerConfig, options);
                            if (message.danmukuPlayerDynamicConfig && message.danmukuPlayerDynamicConfig.length) {
                                object.danmukuPlayerDynamicConfig = [];
                                for (var j = 0; j < message.danmukuPlayerDynamicConfig.length; ++j)
                                    object.danmukuPlayerDynamicConfig[j] = $root.bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig.toObject(message.danmukuPlayerDynamicConfig[j], options);
                            }
                            return object;
                        };

                        /**
                         * Converts this DanmuPlayerViewConfig to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerViewConfig
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DanmuPlayerViewConfig.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DanmuPlayerViewConfig;
                    })();

                    v1.DanmuDefaultPlayerConfig = (function() {

                        /**
                         * Properties of a DanmuDefaultPlayerConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDanmuDefaultPlayerConfig
                         * @property {boolean|null} [playerDanmakuUseDefaultConfig] DanmuDefaultPlayerConfig playerDanmakuUseDefaultConfig
                         * @property {boolean|null} [playerDanmakuAiRecommendedSwitch] DanmuDefaultPlayerConfig playerDanmakuAiRecommendedSwitch
                         * @property {number|null} [playerDanmakuAiRecommendedLevel] DanmuDefaultPlayerConfig playerDanmakuAiRecommendedLevel
                         * @property {boolean|null} [playerDanmakuBlocktop] DanmuDefaultPlayerConfig playerDanmakuBlocktop
                         * @property {boolean|null} [playerDanmakuBlockscroll] DanmuDefaultPlayerConfig playerDanmakuBlockscroll
                         * @property {boolean|null} [playerDanmakuBlockbottom] DanmuDefaultPlayerConfig playerDanmakuBlockbottom
                         * @property {boolean|null} [playerDanmakuBlockcolorful] DanmuDefaultPlayerConfig playerDanmakuBlockcolorful
                         * @property {boolean|null} [playerDanmakuBlockrepeat] DanmuDefaultPlayerConfig playerDanmakuBlockrepeat
                         * @property {boolean|null} [playerDanmakuBlockspecial] DanmuDefaultPlayerConfig playerDanmakuBlockspecial
                         * @property {number|null} [playerDanmakuOpacity] DanmuDefaultPlayerConfig playerDanmakuOpacity
                         * @property {number|null} [playerDanmakuScalingfactor] DanmuDefaultPlayerConfig playerDanmakuScalingfactor
                         * @property {number|null} [playerDanmakuDomain] DanmuDefaultPlayerConfig playerDanmakuDomain
                         * @property {number|null} [playerDanmakuSpeed] DanmuDefaultPlayerConfig playerDanmakuSpeed
                         * @property {boolean|null} [inlinePlayerDanmakuSwitch] DanmuDefaultPlayerConfig inlinePlayerDanmakuSwitch
                         */

                        /**
                         * Constructs a new DanmuDefaultPlayerConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DanmuDefaultPlayerConfig.
                         * @implements IDanmuDefaultPlayerConfig
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDanmuDefaultPlayerConfig=} [properties] Properties to set
                         */
                        function DanmuDefaultPlayerConfig(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuUseDefaultConfig.
                         * @member {boolean} playerDanmakuUseDefaultConfig
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuUseDefaultConfig = false;

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuAiRecommendedSwitch.
                         * @member {boolean} playerDanmakuAiRecommendedSwitch
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuAiRecommendedSwitch = false;

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuAiRecommendedLevel.
                         * @member {number} playerDanmakuAiRecommendedLevel
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuAiRecommendedLevel = 0;

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuBlocktop.
                         * @member {boolean} playerDanmakuBlocktop
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuBlocktop = false;

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuBlockscroll.
                         * @member {boolean} playerDanmakuBlockscroll
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuBlockscroll = false;

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuBlockbottom.
                         * @member {boolean} playerDanmakuBlockbottom
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuBlockbottom = false;

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuBlockcolorful.
                         * @member {boolean} playerDanmakuBlockcolorful
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuBlockcolorful = false;

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuBlockrepeat.
                         * @member {boolean} playerDanmakuBlockrepeat
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuBlockrepeat = false;

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuBlockspecial.
                         * @member {boolean} playerDanmakuBlockspecial
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuBlockspecial = false;

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuOpacity.
                         * @member {number} playerDanmakuOpacity
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuOpacity = 0;

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuScalingfactor.
                         * @member {number} playerDanmakuScalingfactor
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuScalingfactor = 0;

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuDomain.
                         * @member {number} playerDanmakuDomain
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuDomain = 0;

                        /**
                         * DanmuDefaultPlayerConfig playerDanmakuSpeed.
                         * @member {number} playerDanmakuSpeed
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.playerDanmakuSpeed = 0;

                        /**
                         * DanmuDefaultPlayerConfig inlinePlayerDanmakuSwitch.
                         * @member {boolean} inlinePlayerDanmakuSwitch
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         */
                        DanmuDefaultPlayerConfig.prototype.inlinePlayerDanmakuSwitch = false;

                        /**
                         * Creates a new DanmuDefaultPlayerConfig instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuDefaultPlayerConfig=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig} DanmuDefaultPlayerConfig instance
                         */
                        DanmuDefaultPlayerConfig.create = function create(properties) {
                            return new DanmuDefaultPlayerConfig(properties);
                        };

                        /**
                         * Encodes the specified DanmuDefaultPlayerConfig message. Does not implicitly {@link bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuDefaultPlayerConfig} message DanmuDefaultPlayerConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmuDefaultPlayerConfig.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.playerDanmakuUseDefaultConfig != null && Object.hasOwnProperty.call(message, "playerDanmakuUseDefaultConfig"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.playerDanmakuUseDefaultConfig);
                            if (message.playerDanmakuAiRecommendedSwitch != null && Object.hasOwnProperty.call(message, "playerDanmakuAiRecommendedSwitch"))
                                writer.uint32(/* id 4, wireType 0 =*/32).bool(message.playerDanmakuAiRecommendedSwitch);
                            if (message.playerDanmakuAiRecommendedLevel != null && Object.hasOwnProperty.call(message, "playerDanmakuAiRecommendedLevel"))
                                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.playerDanmakuAiRecommendedLevel);
                            if (message.playerDanmakuBlocktop != null && Object.hasOwnProperty.call(message, "playerDanmakuBlocktop"))
                                writer.uint32(/* id 6, wireType 0 =*/48).bool(message.playerDanmakuBlocktop);
                            if (message.playerDanmakuBlockscroll != null && Object.hasOwnProperty.call(message, "playerDanmakuBlockscroll"))
                                writer.uint32(/* id 7, wireType 0 =*/56).bool(message.playerDanmakuBlockscroll);
                            if (message.playerDanmakuBlockbottom != null && Object.hasOwnProperty.call(message, "playerDanmakuBlockbottom"))
                                writer.uint32(/* id 8, wireType 0 =*/64).bool(message.playerDanmakuBlockbottom);
                            if (message.playerDanmakuBlockcolorful != null && Object.hasOwnProperty.call(message, "playerDanmakuBlockcolorful"))
                                writer.uint32(/* id 9, wireType 0 =*/72).bool(message.playerDanmakuBlockcolorful);
                            if (message.playerDanmakuBlockrepeat != null && Object.hasOwnProperty.call(message, "playerDanmakuBlockrepeat"))
                                writer.uint32(/* id 10, wireType 0 =*/80).bool(message.playerDanmakuBlockrepeat);
                            if (message.playerDanmakuBlockspecial != null && Object.hasOwnProperty.call(message, "playerDanmakuBlockspecial"))
                                writer.uint32(/* id 11, wireType 0 =*/88).bool(message.playerDanmakuBlockspecial);
                            if (message.playerDanmakuOpacity != null && Object.hasOwnProperty.call(message, "playerDanmakuOpacity"))
                                writer.uint32(/* id 12, wireType 5 =*/101).float(message.playerDanmakuOpacity);
                            if (message.playerDanmakuScalingfactor != null && Object.hasOwnProperty.call(message, "playerDanmakuScalingfactor"))
                                writer.uint32(/* id 13, wireType 5 =*/109).float(message.playerDanmakuScalingfactor);
                            if (message.playerDanmakuDomain != null && Object.hasOwnProperty.call(message, "playerDanmakuDomain"))
                                writer.uint32(/* id 14, wireType 5 =*/117).float(message.playerDanmakuDomain);
                            if (message.playerDanmakuSpeed != null && Object.hasOwnProperty.call(message, "playerDanmakuSpeed"))
                                writer.uint32(/* id 15, wireType 0 =*/120).int32(message.playerDanmakuSpeed);
                            if (message.inlinePlayerDanmakuSwitch != null && Object.hasOwnProperty.call(message, "inlinePlayerDanmakuSwitch"))
                                writer.uint32(/* id 16, wireType 0 =*/128).bool(message.inlinePlayerDanmakuSwitch);
                            return writer;
                        };

                        /**
                         * Encodes the specified DanmuDefaultPlayerConfig message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuDefaultPlayerConfig} message DanmuDefaultPlayerConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmuDefaultPlayerConfig.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DanmuDefaultPlayerConfig message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig} DanmuDefaultPlayerConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmuDefaultPlayerConfig.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.playerDanmakuUseDefaultConfig = reader.bool();
                                        break;
                                    case 4:
                                        message.playerDanmakuAiRecommendedSwitch = reader.bool();
                                        break;
                                    case 5:
                                        message.playerDanmakuAiRecommendedLevel = reader.int32();
                                        break;
                                    case 6:
                                        message.playerDanmakuBlocktop = reader.bool();
                                        break;
                                    case 7:
                                        message.playerDanmakuBlockscroll = reader.bool();
                                        break;
                                    case 8:
                                        message.playerDanmakuBlockbottom = reader.bool();
                                        break;
                                    case 9:
                                        message.playerDanmakuBlockcolorful = reader.bool();
                                        break;
                                    case 10:
                                        message.playerDanmakuBlockrepeat = reader.bool();
                                        break;
                                    case 11:
                                        message.playerDanmakuBlockspecial = reader.bool();
                                        break;
                                    case 12:
                                        message.playerDanmakuOpacity = reader.float();
                                        break;
                                    case 13:
                                        message.playerDanmakuScalingfactor = reader.float();
                                        break;
                                    case 14:
                                        message.playerDanmakuDomain = reader.float();
                                        break;
                                    case 15:
                                        message.playerDanmakuSpeed = reader.int32();
                                        break;
                                    case 16:
                                        message.inlinePlayerDanmakuSwitch = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DanmuDefaultPlayerConfig message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig} DanmuDefaultPlayerConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmuDefaultPlayerConfig.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DanmuDefaultPlayerConfig message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DanmuDefaultPlayerConfig.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.playerDanmakuUseDefaultConfig != null && message.hasOwnProperty("playerDanmakuUseDefaultConfig"))
                                if (typeof message.playerDanmakuUseDefaultConfig !== "boolean")
                                    return "playerDanmakuUseDefaultConfig: boolean expected";
                            if (message.playerDanmakuAiRecommendedSwitch != null && message.hasOwnProperty("playerDanmakuAiRecommendedSwitch"))
                                if (typeof message.playerDanmakuAiRecommendedSwitch !== "boolean")
                                    return "playerDanmakuAiRecommendedSwitch: boolean expected";
                            if (message.playerDanmakuAiRecommendedLevel != null && message.hasOwnProperty("playerDanmakuAiRecommendedLevel"))
                                if (!$util.isInteger(message.playerDanmakuAiRecommendedLevel))
                                    return "playerDanmakuAiRecommendedLevel: integer expected";
                            if (message.playerDanmakuBlocktop != null && message.hasOwnProperty("playerDanmakuBlocktop"))
                                if (typeof message.playerDanmakuBlocktop !== "boolean")
                                    return "playerDanmakuBlocktop: boolean expected";
                            if (message.playerDanmakuBlockscroll != null && message.hasOwnProperty("playerDanmakuBlockscroll"))
                                if (typeof message.playerDanmakuBlockscroll !== "boolean")
                                    return "playerDanmakuBlockscroll: boolean expected";
                            if (message.playerDanmakuBlockbottom != null && message.hasOwnProperty("playerDanmakuBlockbottom"))
                                if (typeof message.playerDanmakuBlockbottom !== "boolean")
                                    return "playerDanmakuBlockbottom: boolean expected";
                            if (message.playerDanmakuBlockcolorful != null && message.hasOwnProperty("playerDanmakuBlockcolorful"))
                                if (typeof message.playerDanmakuBlockcolorful !== "boolean")
                                    return "playerDanmakuBlockcolorful: boolean expected";
                            if (message.playerDanmakuBlockrepeat != null && message.hasOwnProperty("playerDanmakuBlockrepeat"))
                                if (typeof message.playerDanmakuBlockrepeat !== "boolean")
                                    return "playerDanmakuBlockrepeat: boolean expected";
                            if (message.playerDanmakuBlockspecial != null && message.hasOwnProperty("playerDanmakuBlockspecial"))
                                if (typeof message.playerDanmakuBlockspecial !== "boolean")
                                    return "playerDanmakuBlockspecial: boolean expected";
                            if (message.playerDanmakuOpacity != null && message.hasOwnProperty("playerDanmakuOpacity"))
                                if (typeof message.playerDanmakuOpacity !== "number")
                                    return "playerDanmakuOpacity: number expected";
                            if (message.playerDanmakuScalingfactor != null && message.hasOwnProperty("playerDanmakuScalingfactor"))
                                if (typeof message.playerDanmakuScalingfactor !== "number")
                                    return "playerDanmakuScalingfactor: number expected";
                            if (message.playerDanmakuDomain != null && message.hasOwnProperty("playerDanmakuDomain"))
                                if (typeof message.playerDanmakuDomain !== "number")
                                    return "playerDanmakuDomain: number expected";
                            if (message.playerDanmakuSpeed != null && message.hasOwnProperty("playerDanmakuSpeed"))
                                if (!$util.isInteger(message.playerDanmakuSpeed))
                                    return "playerDanmakuSpeed: integer expected";
                            if (message.inlinePlayerDanmakuSwitch != null && message.hasOwnProperty("inlinePlayerDanmakuSwitch"))
                                if (typeof message.inlinePlayerDanmakuSwitch !== "boolean")
                                    return "inlinePlayerDanmakuSwitch: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a DanmuDefaultPlayerConfig message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig} DanmuDefaultPlayerConfig
                         */
                        DanmuDefaultPlayerConfig.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig();
                            if (object.playerDanmakuUseDefaultConfig != null)
                                message.playerDanmakuUseDefaultConfig = Boolean(object.playerDanmakuUseDefaultConfig);
                            if (object.playerDanmakuAiRecommendedSwitch != null)
                                message.playerDanmakuAiRecommendedSwitch = Boolean(object.playerDanmakuAiRecommendedSwitch);
                            if (object.playerDanmakuAiRecommendedLevel != null)
                                message.playerDanmakuAiRecommendedLevel = object.playerDanmakuAiRecommendedLevel | 0;
                            if (object.playerDanmakuBlocktop != null)
                                message.playerDanmakuBlocktop = Boolean(object.playerDanmakuBlocktop);
                            if (object.playerDanmakuBlockscroll != null)
                                message.playerDanmakuBlockscroll = Boolean(object.playerDanmakuBlockscroll);
                            if (object.playerDanmakuBlockbottom != null)
                                message.playerDanmakuBlockbottom = Boolean(object.playerDanmakuBlockbottom);
                            if (object.playerDanmakuBlockcolorful != null)
                                message.playerDanmakuBlockcolorful = Boolean(object.playerDanmakuBlockcolorful);
                            if (object.playerDanmakuBlockrepeat != null)
                                message.playerDanmakuBlockrepeat = Boolean(object.playerDanmakuBlockrepeat);
                            if (object.playerDanmakuBlockspecial != null)
                                message.playerDanmakuBlockspecial = Boolean(object.playerDanmakuBlockspecial);
                            if (object.playerDanmakuOpacity != null)
                                message.playerDanmakuOpacity = Number(object.playerDanmakuOpacity);
                            if (object.playerDanmakuScalingfactor != null)
                                message.playerDanmakuScalingfactor = Number(object.playerDanmakuScalingfactor);
                            if (object.playerDanmakuDomain != null)
                                message.playerDanmakuDomain = Number(object.playerDanmakuDomain);
                            if (object.playerDanmakuSpeed != null)
                                message.playerDanmakuSpeed = object.playerDanmakuSpeed | 0;
                            if (object.inlinePlayerDanmakuSwitch != null)
                                message.inlinePlayerDanmakuSwitch = Boolean(object.inlinePlayerDanmakuSwitch);
                            return message;
                        };

                        /**
                         * Creates a plain object from a DanmuDefaultPlayerConfig message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig} message DanmuDefaultPlayerConfig
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DanmuDefaultPlayerConfig.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.playerDanmakuUseDefaultConfig = false;
                                object.playerDanmakuAiRecommendedSwitch = false;
                                object.playerDanmakuAiRecommendedLevel = 0;
                                object.playerDanmakuBlocktop = false;
                                object.playerDanmakuBlockscroll = false;
                                object.playerDanmakuBlockbottom = false;
                                object.playerDanmakuBlockcolorful = false;
                                object.playerDanmakuBlockrepeat = false;
                                object.playerDanmakuBlockspecial = false;
                                object.playerDanmakuOpacity = 0;
                                object.playerDanmakuScalingfactor = 0;
                                object.playerDanmakuDomain = 0;
                                object.playerDanmakuSpeed = 0;
                                object.inlinePlayerDanmakuSwitch = false;
                            }
                            if (message.playerDanmakuUseDefaultConfig != null && message.hasOwnProperty("playerDanmakuUseDefaultConfig"))
                                object.playerDanmakuUseDefaultConfig = message.playerDanmakuUseDefaultConfig;
                            if (message.playerDanmakuAiRecommendedSwitch != null && message.hasOwnProperty("playerDanmakuAiRecommendedSwitch"))
                                object.playerDanmakuAiRecommendedSwitch = message.playerDanmakuAiRecommendedSwitch;
                            if (message.playerDanmakuAiRecommendedLevel != null && message.hasOwnProperty("playerDanmakuAiRecommendedLevel"))
                                object.playerDanmakuAiRecommendedLevel = message.playerDanmakuAiRecommendedLevel;
                            if (message.playerDanmakuBlocktop != null && message.hasOwnProperty("playerDanmakuBlocktop"))
                                object.playerDanmakuBlocktop = message.playerDanmakuBlocktop;
                            if (message.playerDanmakuBlockscroll != null && message.hasOwnProperty("playerDanmakuBlockscroll"))
                                object.playerDanmakuBlockscroll = message.playerDanmakuBlockscroll;
                            if (message.playerDanmakuBlockbottom != null && message.hasOwnProperty("playerDanmakuBlockbottom"))
                                object.playerDanmakuBlockbottom = message.playerDanmakuBlockbottom;
                            if (message.playerDanmakuBlockcolorful != null && message.hasOwnProperty("playerDanmakuBlockcolorful"))
                                object.playerDanmakuBlockcolorful = message.playerDanmakuBlockcolorful;
                            if (message.playerDanmakuBlockrepeat != null && message.hasOwnProperty("playerDanmakuBlockrepeat"))
                                object.playerDanmakuBlockrepeat = message.playerDanmakuBlockrepeat;
                            if (message.playerDanmakuBlockspecial != null && message.hasOwnProperty("playerDanmakuBlockspecial"))
                                object.playerDanmakuBlockspecial = message.playerDanmakuBlockspecial;
                            if (message.playerDanmakuOpacity != null && message.hasOwnProperty("playerDanmakuOpacity"))
                                object.playerDanmakuOpacity = options.json && !isFinite(message.playerDanmakuOpacity) ? String(message.playerDanmakuOpacity) : message.playerDanmakuOpacity;
                            if (message.playerDanmakuScalingfactor != null && message.hasOwnProperty("playerDanmakuScalingfactor"))
                                object.playerDanmakuScalingfactor = options.json && !isFinite(message.playerDanmakuScalingfactor) ? String(message.playerDanmakuScalingfactor) : message.playerDanmakuScalingfactor;
                            if (message.playerDanmakuDomain != null && message.hasOwnProperty("playerDanmakuDomain"))
                                object.playerDanmakuDomain = options.json && !isFinite(message.playerDanmakuDomain) ? String(message.playerDanmakuDomain) : message.playerDanmakuDomain;
                            if (message.playerDanmakuSpeed != null && message.hasOwnProperty("playerDanmakuSpeed"))
                                object.playerDanmakuSpeed = message.playerDanmakuSpeed;
                            if (message.inlinePlayerDanmakuSwitch != null && message.hasOwnProperty("inlinePlayerDanmakuSwitch"))
                                object.inlinePlayerDanmakuSwitch = message.inlinePlayerDanmakuSwitch;
                            return object;
                        };

                        /**
                         * Converts this DanmuDefaultPlayerConfig to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DanmuDefaultPlayerConfig
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DanmuDefaultPlayerConfig.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DanmuDefaultPlayerConfig;
                    })();

                    v1.DanmuPlayerConfig = (function() {

                        /**
                         * Properties of a DanmuPlayerConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDanmuPlayerConfig
                         * @property {boolean|null} [playerDanmakuSwitch] DanmuPlayerConfig playerDanmakuSwitch
                         * @property {boolean|null} [playerDanmakuSwitchSave] DanmuPlayerConfig playerDanmakuSwitchSave
                         * @property {boolean|null} [playerDanmakuUseDefaultConfig] DanmuPlayerConfig playerDanmakuUseDefaultConfig
                         * @property {boolean|null} [playerDanmakuAiRecommendedSwitch] DanmuPlayerConfig playerDanmakuAiRecommendedSwitch
                         * @property {number|null} [playerDanmakuAiRecommendedLevel] DanmuPlayerConfig playerDanmakuAiRecommendedLevel
                         * @property {boolean|null} [playerDanmakuBlocktop] DanmuPlayerConfig playerDanmakuBlocktop
                         * @property {boolean|null} [playerDanmakuBlockscroll] DanmuPlayerConfig playerDanmakuBlockscroll
                         * @property {boolean|null} [playerDanmakuBlockbottom] DanmuPlayerConfig playerDanmakuBlockbottom
                         * @property {boolean|null} [playerDanmakuBlockcolorful] DanmuPlayerConfig playerDanmakuBlockcolorful
                         * @property {boolean|null} [playerDanmakuBlockrepeat] DanmuPlayerConfig playerDanmakuBlockrepeat
                         * @property {boolean|null} [playerDanmakuBlockspecial] DanmuPlayerConfig playerDanmakuBlockspecial
                         * @property {number|null} [playerDanmakuOpacity] DanmuPlayerConfig playerDanmakuOpacity
                         * @property {number|null} [playerDanmakuScalingfactor] DanmuPlayerConfig playerDanmakuScalingfactor
                         * @property {number|null} [playerDanmakuDomain] DanmuPlayerConfig playerDanmakuDomain
                         * @property {number|null} [playerDanmakuSpeed] DanmuPlayerConfig playerDanmakuSpeed
                         * @property {boolean|null} [playerDanmakuEnableblocklist] DanmuPlayerConfig playerDanmakuEnableblocklist
                         * @property {boolean|null} [inlinePlayerDanmakuSwitch] DanmuPlayerConfig inlinePlayerDanmakuSwitch
                         * @property {number|null} [inlinePlayerDanmakuConfig] DanmuPlayerConfig inlinePlayerDanmakuConfig
                         */

                        /**
                         * Constructs a new DanmuPlayerConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DanmuPlayerConfig.
                         * @implements IDanmuPlayerConfig
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDanmuPlayerConfig=} [properties] Properties to set
                         */
                        function DanmuPlayerConfig(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DanmuPlayerConfig playerDanmakuSwitch.
                         * @member {boolean} playerDanmakuSwitch
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuSwitch = false;

                        /**
                         * DanmuPlayerConfig playerDanmakuSwitchSave.
                         * @member {boolean} playerDanmakuSwitchSave
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuSwitchSave = false;

                        /**
                         * DanmuPlayerConfig playerDanmakuUseDefaultConfig.
                         * @member {boolean} playerDanmakuUseDefaultConfig
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuUseDefaultConfig = false;

                        /**
                         * DanmuPlayerConfig playerDanmakuAiRecommendedSwitch.
                         * @member {boolean} playerDanmakuAiRecommendedSwitch
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuAiRecommendedSwitch = false;

                        /**
                         * DanmuPlayerConfig playerDanmakuAiRecommendedLevel.
                         * @member {number} playerDanmakuAiRecommendedLevel
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuAiRecommendedLevel = 0;

                        /**
                         * DanmuPlayerConfig playerDanmakuBlocktop.
                         * @member {boolean} playerDanmakuBlocktop
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuBlocktop = false;

                        /**
                         * DanmuPlayerConfig playerDanmakuBlockscroll.
                         * @member {boolean} playerDanmakuBlockscroll
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuBlockscroll = false;

                        /**
                         * DanmuPlayerConfig playerDanmakuBlockbottom.
                         * @member {boolean} playerDanmakuBlockbottom
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuBlockbottom = false;

                        /**
                         * DanmuPlayerConfig playerDanmakuBlockcolorful.
                         * @member {boolean} playerDanmakuBlockcolorful
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuBlockcolorful = false;

                        /**
                         * DanmuPlayerConfig playerDanmakuBlockrepeat.
                         * @member {boolean} playerDanmakuBlockrepeat
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuBlockrepeat = false;

                        /**
                         * DanmuPlayerConfig playerDanmakuBlockspecial.
                         * @member {boolean} playerDanmakuBlockspecial
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuBlockspecial = false;

                        /**
                         * DanmuPlayerConfig playerDanmakuOpacity.
                         * @member {number} playerDanmakuOpacity
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuOpacity = 0;

                        /**
                         * DanmuPlayerConfig playerDanmakuScalingfactor.
                         * @member {number} playerDanmakuScalingfactor
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuScalingfactor = 0;

                        /**
                         * DanmuPlayerConfig playerDanmakuDomain.
                         * @member {number} playerDanmakuDomain
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuDomain = 0;

                        /**
                         * DanmuPlayerConfig playerDanmakuSpeed.
                         * @member {number} playerDanmakuSpeed
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuSpeed = 0;

                        /**
                         * DanmuPlayerConfig playerDanmakuEnableblocklist.
                         * @member {boolean} playerDanmakuEnableblocklist
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.playerDanmakuEnableblocklist = false;

                        /**
                         * DanmuPlayerConfig inlinePlayerDanmakuSwitch.
                         * @member {boolean} inlinePlayerDanmakuSwitch
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.inlinePlayerDanmakuSwitch = false;

                        /**
                         * DanmuPlayerConfig inlinePlayerDanmakuConfig.
                         * @member {number} inlinePlayerDanmakuConfig
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         */
                        DanmuPlayerConfig.prototype.inlinePlayerDanmakuConfig = 0;

                        /**
                         * Creates a new DanmuPlayerConfig instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuPlayerConfig=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DanmuPlayerConfig} DanmuPlayerConfig instance
                         */
                        DanmuPlayerConfig.create = function create(properties) {
                            return new DanmuPlayerConfig(properties);
                        };

                        /**
                         * Encodes the specified DanmuPlayerConfig message. Does not implicitly {@link bilibili.community.service.dm.v1.DanmuPlayerConfig.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuPlayerConfig} message DanmuPlayerConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmuPlayerConfig.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.playerDanmakuSwitch != null && Object.hasOwnProperty.call(message, "playerDanmakuSwitch"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.playerDanmakuSwitch);
                            if (message.playerDanmakuSwitchSave != null && Object.hasOwnProperty.call(message, "playerDanmakuSwitchSave"))
                                writer.uint32(/* id 2, wireType 0 =*/16).bool(message.playerDanmakuSwitchSave);
                            if (message.playerDanmakuUseDefaultConfig != null && Object.hasOwnProperty.call(message, "playerDanmakuUseDefaultConfig"))
                                writer.uint32(/* id 3, wireType 0 =*/24).bool(message.playerDanmakuUseDefaultConfig);
                            if (message.playerDanmakuAiRecommendedSwitch != null && Object.hasOwnProperty.call(message, "playerDanmakuAiRecommendedSwitch"))
                                writer.uint32(/* id 4, wireType 0 =*/32).bool(message.playerDanmakuAiRecommendedSwitch);
                            if (message.playerDanmakuAiRecommendedLevel != null && Object.hasOwnProperty.call(message, "playerDanmakuAiRecommendedLevel"))
                                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.playerDanmakuAiRecommendedLevel);
                            if (message.playerDanmakuBlocktop != null && Object.hasOwnProperty.call(message, "playerDanmakuBlocktop"))
                                writer.uint32(/* id 6, wireType 0 =*/48).bool(message.playerDanmakuBlocktop);
                            if (message.playerDanmakuBlockscroll != null && Object.hasOwnProperty.call(message, "playerDanmakuBlockscroll"))
                                writer.uint32(/* id 7, wireType 0 =*/56).bool(message.playerDanmakuBlockscroll);
                            if (message.playerDanmakuBlockbottom != null && Object.hasOwnProperty.call(message, "playerDanmakuBlockbottom"))
                                writer.uint32(/* id 8, wireType 0 =*/64).bool(message.playerDanmakuBlockbottom);
                            if (message.playerDanmakuBlockcolorful != null && Object.hasOwnProperty.call(message, "playerDanmakuBlockcolorful"))
                                writer.uint32(/* id 9, wireType 0 =*/72).bool(message.playerDanmakuBlockcolorful);
                            if (message.playerDanmakuBlockrepeat != null && Object.hasOwnProperty.call(message, "playerDanmakuBlockrepeat"))
                                writer.uint32(/* id 10, wireType 0 =*/80).bool(message.playerDanmakuBlockrepeat);
                            if (message.playerDanmakuBlockspecial != null && Object.hasOwnProperty.call(message, "playerDanmakuBlockspecial"))
                                writer.uint32(/* id 11, wireType 0 =*/88).bool(message.playerDanmakuBlockspecial);
                            if (message.playerDanmakuOpacity != null && Object.hasOwnProperty.call(message, "playerDanmakuOpacity"))
                                writer.uint32(/* id 12, wireType 5 =*/101).float(message.playerDanmakuOpacity);
                            if (message.playerDanmakuScalingfactor != null && Object.hasOwnProperty.call(message, "playerDanmakuScalingfactor"))
                                writer.uint32(/* id 13, wireType 5 =*/109).float(message.playerDanmakuScalingfactor);
                            if (message.playerDanmakuDomain != null && Object.hasOwnProperty.call(message, "playerDanmakuDomain"))
                                writer.uint32(/* id 14, wireType 5 =*/117).float(message.playerDanmakuDomain);
                            if (message.playerDanmakuSpeed != null && Object.hasOwnProperty.call(message, "playerDanmakuSpeed"))
                                writer.uint32(/* id 15, wireType 0 =*/120).int32(message.playerDanmakuSpeed);
                            if (message.playerDanmakuEnableblocklist != null && Object.hasOwnProperty.call(message, "playerDanmakuEnableblocklist"))
                                writer.uint32(/* id 16, wireType 0 =*/128).bool(message.playerDanmakuEnableblocklist);
                            if (message.inlinePlayerDanmakuSwitch != null && Object.hasOwnProperty.call(message, "inlinePlayerDanmakuSwitch"))
                                writer.uint32(/* id 17, wireType 0 =*/136).bool(message.inlinePlayerDanmakuSwitch);
                            if (message.inlinePlayerDanmakuConfig != null && Object.hasOwnProperty.call(message, "inlinePlayerDanmakuConfig"))
                                writer.uint32(/* id 18, wireType 0 =*/144).int32(message.inlinePlayerDanmakuConfig);
                            return writer;
                        };

                        /**
                         * Encodes the specified DanmuPlayerConfig message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DanmuPlayerConfig.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuPlayerConfig} message DanmuPlayerConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmuPlayerConfig.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DanmuPlayerConfig message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DanmuPlayerConfig} DanmuPlayerConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmuPlayerConfig.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DanmuPlayerConfig();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.playerDanmakuSwitch = reader.bool();
                                        break;
                                    case 2:
                                        message.playerDanmakuSwitchSave = reader.bool();
                                        break;
                                    case 3:
                                        message.playerDanmakuUseDefaultConfig = reader.bool();
                                        break;
                                    case 4:
                                        message.playerDanmakuAiRecommendedSwitch = reader.bool();
                                        break;
                                    case 5:
                                        message.playerDanmakuAiRecommendedLevel = reader.int32();
                                        break;
                                    case 6:
                                        message.playerDanmakuBlocktop = reader.bool();
                                        break;
                                    case 7:
                                        message.playerDanmakuBlockscroll = reader.bool();
                                        break;
                                    case 8:
                                        message.playerDanmakuBlockbottom = reader.bool();
                                        break;
                                    case 9:
                                        message.playerDanmakuBlockcolorful = reader.bool();
                                        break;
                                    case 10:
                                        message.playerDanmakuBlockrepeat = reader.bool();
                                        break;
                                    case 11:
                                        message.playerDanmakuBlockspecial = reader.bool();
                                        break;
                                    case 12:
                                        message.playerDanmakuOpacity = reader.float();
                                        break;
                                    case 13:
                                        message.playerDanmakuScalingfactor = reader.float();
                                        break;
                                    case 14:
                                        message.playerDanmakuDomain = reader.float();
                                        break;
                                    case 15:
                                        message.playerDanmakuSpeed = reader.int32();
                                        break;
                                    case 16:
                                        message.playerDanmakuEnableblocklist = reader.bool();
                                        break;
                                    case 17:
                                        message.inlinePlayerDanmakuSwitch = reader.bool();
                                        break;
                                    case 18:
                                        message.inlinePlayerDanmakuConfig = reader.int32();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DanmuPlayerConfig message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DanmuPlayerConfig} DanmuPlayerConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmuPlayerConfig.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DanmuPlayerConfig message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DanmuPlayerConfig.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.playerDanmakuSwitch != null && message.hasOwnProperty("playerDanmakuSwitch"))
                                if (typeof message.playerDanmakuSwitch !== "boolean")
                                    return "playerDanmakuSwitch: boolean expected";
                            if (message.playerDanmakuSwitchSave != null && message.hasOwnProperty("playerDanmakuSwitchSave"))
                                if (typeof message.playerDanmakuSwitchSave !== "boolean")
                                    return "playerDanmakuSwitchSave: boolean expected";
                            if (message.playerDanmakuUseDefaultConfig != null && message.hasOwnProperty("playerDanmakuUseDefaultConfig"))
                                if (typeof message.playerDanmakuUseDefaultConfig !== "boolean")
                                    return "playerDanmakuUseDefaultConfig: boolean expected";
                            if (message.playerDanmakuAiRecommendedSwitch != null && message.hasOwnProperty("playerDanmakuAiRecommendedSwitch"))
                                if (typeof message.playerDanmakuAiRecommendedSwitch !== "boolean")
                                    return "playerDanmakuAiRecommendedSwitch: boolean expected";
                            if (message.playerDanmakuAiRecommendedLevel != null && message.hasOwnProperty("playerDanmakuAiRecommendedLevel"))
                                if (!$util.isInteger(message.playerDanmakuAiRecommendedLevel))
                                    return "playerDanmakuAiRecommendedLevel: integer expected";
                            if (message.playerDanmakuBlocktop != null && message.hasOwnProperty("playerDanmakuBlocktop"))
                                if (typeof message.playerDanmakuBlocktop !== "boolean")
                                    return "playerDanmakuBlocktop: boolean expected";
                            if (message.playerDanmakuBlockscroll != null && message.hasOwnProperty("playerDanmakuBlockscroll"))
                                if (typeof message.playerDanmakuBlockscroll !== "boolean")
                                    return "playerDanmakuBlockscroll: boolean expected";
                            if (message.playerDanmakuBlockbottom != null && message.hasOwnProperty("playerDanmakuBlockbottom"))
                                if (typeof message.playerDanmakuBlockbottom !== "boolean")
                                    return "playerDanmakuBlockbottom: boolean expected";
                            if (message.playerDanmakuBlockcolorful != null && message.hasOwnProperty("playerDanmakuBlockcolorful"))
                                if (typeof message.playerDanmakuBlockcolorful !== "boolean")
                                    return "playerDanmakuBlockcolorful: boolean expected";
                            if (message.playerDanmakuBlockrepeat != null && message.hasOwnProperty("playerDanmakuBlockrepeat"))
                                if (typeof message.playerDanmakuBlockrepeat !== "boolean")
                                    return "playerDanmakuBlockrepeat: boolean expected";
                            if (message.playerDanmakuBlockspecial != null && message.hasOwnProperty("playerDanmakuBlockspecial"))
                                if (typeof message.playerDanmakuBlockspecial !== "boolean")
                                    return "playerDanmakuBlockspecial: boolean expected";
                            if (message.playerDanmakuOpacity != null && message.hasOwnProperty("playerDanmakuOpacity"))
                                if (typeof message.playerDanmakuOpacity !== "number")
                                    return "playerDanmakuOpacity: number expected";
                            if (message.playerDanmakuScalingfactor != null && message.hasOwnProperty("playerDanmakuScalingfactor"))
                                if (typeof message.playerDanmakuScalingfactor !== "number")
                                    return "playerDanmakuScalingfactor: number expected";
                            if (message.playerDanmakuDomain != null && message.hasOwnProperty("playerDanmakuDomain"))
                                if (typeof message.playerDanmakuDomain !== "number")
                                    return "playerDanmakuDomain: number expected";
                            if (message.playerDanmakuSpeed != null && message.hasOwnProperty("playerDanmakuSpeed"))
                                if (!$util.isInteger(message.playerDanmakuSpeed))
                                    return "playerDanmakuSpeed: integer expected";
                            if (message.playerDanmakuEnableblocklist != null && message.hasOwnProperty("playerDanmakuEnableblocklist"))
                                if (typeof message.playerDanmakuEnableblocklist !== "boolean")
                                    return "playerDanmakuEnableblocklist: boolean expected";
                            if (message.inlinePlayerDanmakuSwitch != null && message.hasOwnProperty("inlinePlayerDanmakuSwitch"))
                                if (typeof message.inlinePlayerDanmakuSwitch !== "boolean")
                                    return "inlinePlayerDanmakuSwitch: boolean expected";
                            if (message.inlinePlayerDanmakuConfig != null && message.hasOwnProperty("inlinePlayerDanmakuConfig"))
                                if (!$util.isInteger(message.inlinePlayerDanmakuConfig))
                                    return "inlinePlayerDanmakuConfig: integer expected";
                            return null;
                        };

                        /**
                         * Creates a DanmuPlayerConfig message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DanmuPlayerConfig} DanmuPlayerConfig
                         */
                        DanmuPlayerConfig.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DanmuPlayerConfig)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DanmuPlayerConfig();
                            if (object.playerDanmakuSwitch != null)
                                message.playerDanmakuSwitch = Boolean(object.playerDanmakuSwitch);
                            if (object.playerDanmakuSwitchSave != null)
                                message.playerDanmakuSwitchSave = Boolean(object.playerDanmakuSwitchSave);
                            if (object.playerDanmakuUseDefaultConfig != null)
                                message.playerDanmakuUseDefaultConfig = Boolean(object.playerDanmakuUseDefaultConfig);
                            if (object.playerDanmakuAiRecommendedSwitch != null)
                                message.playerDanmakuAiRecommendedSwitch = Boolean(object.playerDanmakuAiRecommendedSwitch);
                            if (object.playerDanmakuAiRecommendedLevel != null)
                                message.playerDanmakuAiRecommendedLevel = object.playerDanmakuAiRecommendedLevel | 0;
                            if (object.playerDanmakuBlocktop != null)
                                message.playerDanmakuBlocktop = Boolean(object.playerDanmakuBlocktop);
                            if (object.playerDanmakuBlockscroll != null)
                                message.playerDanmakuBlockscroll = Boolean(object.playerDanmakuBlockscroll);
                            if (object.playerDanmakuBlockbottom != null)
                                message.playerDanmakuBlockbottom = Boolean(object.playerDanmakuBlockbottom);
                            if (object.playerDanmakuBlockcolorful != null)
                                message.playerDanmakuBlockcolorful = Boolean(object.playerDanmakuBlockcolorful);
                            if (object.playerDanmakuBlockrepeat != null)
                                message.playerDanmakuBlockrepeat = Boolean(object.playerDanmakuBlockrepeat);
                            if (object.playerDanmakuBlockspecial != null)
                                message.playerDanmakuBlockspecial = Boolean(object.playerDanmakuBlockspecial);
                            if (object.playerDanmakuOpacity != null)
                                message.playerDanmakuOpacity = Number(object.playerDanmakuOpacity);
                            if (object.playerDanmakuScalingfactor != null)
                                message.playerDanmakuScalingfactor = Number(object.playerDanmakuScalingfactor);
                            if (object.playerDanmakuDomain != null)
                                message.playerDanmakuDomain = Number(object.playerDanmakuDomain);
                            if (object.playerDanmakuSpeed != null)
                                message.playerDanmakuSpeed = object.playerDanmakuSpeed | 0;
                            if (object.playerDanmakuEnableblocklist != null)
                                message.playerDanmakuEnableblocklist = Boolean(object.playerDanmakuEnableblocklist);
                            if (object.inlinePlayerDanmakuSwitch != null)
                                message.inlinePlayerDanmakuSwitch = Boolean(object.inlinePlayerDanmakuSwitch);
                            if (object.inlinePlayerDanmakuConfig != null)
                                message.inlinePlayerDanmakuConfig = object.inlinePlayerDanmakuConfig | 0;
                            return message;
                        };

                        /**
                         * Creates a plain object from a DanmuPlayerConfig message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.DanmuPlayerConfig} message DanmuPlayerConfig
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DanmuPlayerConfig.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.playerDanmakuSwitch = false;
                                object.playerDanmakuSwitchSave = false;
                                object.playerDanmakuUseDefaultConfig = false;
                                object.playerDanmakuAiRecommendedSwitch = false;
                                object.playerDanmakuAiRecommendedLevel = 0;
                                object.playerDanmakuBlocktop = false;
                                object.playerDanmakuBlockscroll = false;
                                object.playerDanmakuBlockbottom = false;
                                object.playerDanmakuBlockcolorful = false;
                                object.playerDanmakuBlockrepeat = false;
                                object.playerDanmakuBlockspecial = false;
                                object.playerDanmakuOpacity = 0;
                                object.playerDanmakuScalingfactor = 0;
                                object.playerDanmakuDomain = 0;
                                object.playerDanmakuSpeed = 0;
                                object.playerDanmakuEnableblocklist = false;
                                object.inlinePlayerDanmakuSwitch = false;
                                object.inlinePlayerDanmakuConfig = 0;
                            }
                            if (message.playerDanmakuSwitch != null && message.hasOwnProperty("playerDanmakuSwitch"))
                                object.playerDanmakuSwitch = message.playerDanmakuSwitch;
                            if (message.playerDanmakuSwitchSave != null && message.hasOwnProperty("playerDanmakuSwitchSave"))
                                object.playerDanmakuSwitchSave = message.playerDanmakuSwitchSave;
                            if (message.playerDanmakuUseDefaultConfig != null && message.hasOwnProperty("playerDanmakuUseDefaultConfig"))
                                object.playerDanmakuUseDefaultConfig = message.playerDanmakuUseDefaultConfig;
                            if (message.playerDanmakuAiRecommendedSwitch != null && message.hasOwnProperty("playerDanmakuAiRecommendedSwitch"))
                                object.playerDanmakuAiRecommendedSwitch = message.playerDanmakuAiRecommendedSwitch;
                            if (message.playerDanmakuAiRecommendedLevel != null && message.hasOwnProperty("playerDanmakuAiRecommendedLevel"))
                                object.playerDanmakuAiRecommendedLevel = message.playerDanmakuAiRecommendedLevel;
                            if (message.playerDanmakuBlocktop != null && message.hasOwnProperty("playerDanmakuBlocktop"))
                                object.playerDanmakuBlocktop = message.playerDanmakuBlocktop;
                            if (message.playerDanmakuBlockscroll != null && message.hasOwnProperty("playerDanmakuBlockscroll"))
                                object.playerDanmakuBlockscroll = message.playerDanmakuBlockscroll;
                            if (message.playerDanmakuBlockbottom != null && message.hasOwnProperty("playerDanmakuBlockbottom"))
                                object.playerDanmakuBlockbottom = message.playerDanmakuBlockbottom;
                            if (message.playerDanmakuBlockcolorful != null && message.hasOwnProperty("playerDanmakuBlockcolorful"))
                                object.playerDanmakuBlockcolorful = message.playerDanmakuBlockcolorful;
                            if (message.playerDanmakuBlockrepeat != null && message.hasOwnProperty("playerDanmakuBlockrepeat"))
                                object.playerDanmakuBlockrepeat = message.playerDanmakuBlockrepeat;
                            if (message.playerDanmakuBlockspecial != null && message.hasOwnProperty("playerDanmakuBlockspecial"))
                                object.playerDanmakuBlockspecial = message.playerDanmakuBlockspecial;
                            if (message.playerDanmakuOpacity != null && message.hasOwnProperty("playerDanmakuOpacity"))
                                object.playerDanmakuOpacity = options.json && !isFinite(message.playerDanmakuOpacity) ? String(message.playerDanmakuOpacity) : message.playerDanmakuOpacity;
                            if (message.playerDanmakuScalingfactor != null && message.hasOwnProperty("playerDanmakuScalingfactor"))
                                object.playerDanmakuScalingfactor = options.json && !isFinite(message.playerDanmakuScalingfactor) ? String(message.playerDanmakuScalingfactor) : message.playerDanmakuScalingfactor;
                            if (message.playerDanmakuDomain != null && message.hasOwnProperty("playerDanmakuDomain"))
                                object.playerDanmakuDomain = options.json && !isFinite(message.playerDanmakuDomain) ? String(message.playerDanmakuDomain) : message.playerDanmakuDomain;
                            if (message.playerDanmakuSpeed != null && message.hasOwnProperty("playerDanmakuSpeed"))
                                object.playerDanmakuSpeed = message.playerDanmakuSpeed;
                            if (message.playerDanmakuEnableblocklist != null && message.hasOwnProperty("playerDanmakuEnableblocklist"))
                                object.playerDanmakuEnableblocklist = message.playerDanmakuEnableblocklist;
                            if (message.inlinePlayerDanmakuSwitch != null && message.hasOwnProperty("inlinePlayerDanmakuSwitch"))
                                object.inlinePlayerDanmakuSwitch = message.inlinePlayerDanmakuSwitch;
                            if (message.inlinePlayerDanmakuConfig != null && message.hasOwnProperty("inlinePlayerDanmakuConfig"))
                                object.inlinePlayerDanmakuConfig = message.inlinePlayerDanmakuConfig;
                            return object;
                        };

                        /**
                         * Converts this DanmuPlayerConfig to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerConfig
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DanmuPlayerConfig.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DanmuPlayerConfig;
                    })();

                    v1.DanmuPlayerDynamicConfig = (function() {

                        /**
                         * Properties of a DanmuPlayerDynamicConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IDanmuPlayerDynamicConfig
                         * @property {number|null} [progress] DanmuPlayerDynamicConfig progress
                         * @property {number|null} [playerDanmakuDomain] DanmuPlayerDynamicConfig playerDanmakuDomain
                         */

                        /**
                         * Constructs a new DanmuPlayerDynamicConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a DanmuPlayerDynamicConfig.
                         * @implements IDanmuPlayerDynamicConfig
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IDanmuPlayerDynamicConfig=} [properties] Properties to set
                         */
                        function DanmuPlayerDynamicConfig(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * DanmuPlayerDynamicConfig progress.
                         * @member {number} progress
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig
                         * @instance
                         */
                        DanmuPlayerDynamicConfig.prototype.progress = 0;

                        /**
                         * DanmuPlayerDynamicConfig playerDanmakuDomain.
                         * @member {number} playerDanmakuDomain
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig
                         * @instance
                         */
                        DanmuPlayerDynamicConfig.prototype.playerDanmakuDomain = 0;

                        /**
                         * Creates a new DanmuPlayerDynamicConfig instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuPlayerDynamicConfig=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig} DanmuPlayerDynamicConfig instance
                         */
                        DanmuPlayerDynamicConfig.create = function create(properties) {
                            return new DanmuPlayerDynamicConfig(properties);
                        };

                        /**
                         * Encodes the specified DanmuPlayerDynamicConfig message. Does not implicitly {@link bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuPlayerDynamicConfig} message DanmuPlayerDynamicConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmuPlayerDynamicConfig.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.progress != null && Object.hasOwnProperty.call(message, "progress"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.progress);
                            if (message.playerDanmakuDomain != null && Object.hasOwnProperty.call(message, "playerDanmakuDomain"))
                                writer.uint32(/* id 2, wireType 5 =*/21).float(message.playerDanmakuDomain);
                            return writer;
                        };

                        /**
                         * Encodes the specified DanmuPlayerDynamicConfig message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IDanmuPlayerDynamicConfig} message DanmuPlayerDynamicConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        DanmuPlayerDynamicConfig.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a DanmuPlayerDynamicConfig message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig} DanmuPlayerDynamicConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmuPlayerDynamicConfig.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.progress = reader.int32();
                                        break;
                                    case 2:
                                        message.playerDanmakuDomain = reader.float();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a DanmuPlayerDynamicConfig message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig} DanmuPlayerDynamicConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        DanmuPlayerDynamicConfig.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a DanmuPlayerDynamicConfig message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        DanmuPlayerDynamicConfig.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.progress != null && message.hasOwnProperty("progress"))
                                if (!$util.isInteger(message.progress))
                                    return "progress: integer expected";
                            if (message.playerDanmakuDomain != null && message.hasOwnProperty("playerDanmakuDomain"))
                                if (typeof message.playerDanmakuDomain !== "number")
                                    return "playerDanmakuDomain: number expected";
                            return null;
                        };

                        /**
                         * Creates a DanmuPlayerDynamicConfig message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig} DanmuPlayerDynamicConfig
                         */
                        DanmuPlayerDynamicConfig.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig();
                            if (object.progress != null)
                                message.progress = object.progress | 0;
                            if (object.playerDanmakuDomain != null)
                                message.playerDanmakuDomain = Number(object.playerDanmakuDomain);
                            return message;
                        };

                        /**
                         * Creates a plain object from a DanmuPlayerDynamicConfig message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig} message DanmuPlayerDynamicConfig
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        DanmuPlayerDynamicConfig.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.progress = 0;
                                object.playerDanmakuDomain = 0;
                            }
                            if (message.progress != null && message.hasOwnProperty("progress"))
                                object.progress = message.progress;
                            if (message.playerDanmakuDomain != null && message.hasOwnProperty("playerDanmakuDomain"))
                                object.playerDanmakuDomain = options.json && !isFinite(message.playerDanmakuDomain) ? String(message.playerDanmakuDomain) : message.playerDanmakuDomain;
                            return object;
                        };

                        /**
                         * Converts this DanmuPlayerDynamicConfig to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.DanmuPlayerDynamicConfig
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        DanmuPlayerDynamicConfig.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return DanmuPlayerDynamicConfig;
                    })();

                    v1.PlayerDanmakuSwitch = (function() {

                        /**
                         * Properties of a PlayerDanmakuSwitch.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuSwitch
                         * @property {boolean|null} [value] PlayerDanmakuSwitch value
                         * @property {boolean|null} [canIgnore] PlayerDanmakuSwitch canIgnore
                         */

                        /**
                         * Constructs a new PlayerDanmakuSwitch.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuSwitch.
                         * @implements IPlayerDanmakuSwitch
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuSwitch=} [properties] Properties to set
                         */
                        function PlayerDanmakuSwitch(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuSwitch value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitch
                         * @instance
                         */
                        PlayerDanmakuSwitch.prototype.value = false;

                        /**
                         * PlayerDanmakuSwitch canIgnore.
                         * @member {boolean} canIgnore
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitch
                         * @instance
                         */
                        PlayerDanmakuSwitch.prototype.canIgnore = false;

                        /**
                         * Creates a new PlayerDanmakuSwitch instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitch
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuSwitch=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuSwitch} PlayerDanmakuSwitch instance
                         */
                        PlayerDanmakuSwitch.create = function create(properties) {
                            return new PlayerDanmakuSwitch(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuSwitch message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuSwitch.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitch
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuSwitch} message PlayerDanmakuSwitch message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuSwitch.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            if (message.canIgnore != null && Object.hasOwnProperty.call(message, "canIgnore"))
                                writer.uint32(/* id 2, wireType 0 =*/16).bool(message.canIgnore);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuSwitch message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuSwitch.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitch
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuSwitch} message PlayerDanmakuSwitch message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuSwitch.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuSwitch message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitch
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuSwitch} PlayerDanmakuSwitch
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuSwitch.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitch();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    case 2:
                                        message.canIgnore = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuSwitch message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitch
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuSwitch} PlayerDanmakuSwitch
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuSwitch.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuSwitch message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitch
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuSwitch.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            if (message.canIgnore != null && message.hasOwnProperty("canIgnore"))
                                if (typeof message.canIgnore !== "boolean")
                                    return "canIgnore: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuSwitch message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitch
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuSwitch} PlayerDanmakuSwitch
                         */
                        PlayerDanmakuSwitch.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitch)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitch();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            if (object.canIgnore != null)
                                message.canIgnore = Boolean(object.canIgnore);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuSwitch message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitch
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuSwitch} message PlayerDanmakuSwitch
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuSwitch.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults) {
                                object.value = false;
                                object.canIgnore = false;
                            }
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            if (message.canIgnore != null && message.hasOwnProperty("canIgnore"))
                                object.canIgnore = message.canIgnore;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuSwitch to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitch
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuSwitch.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuSwitch;
                    })();

                    v1.PlayerDanmakuSwitchSave = (function() {

                        /**
                         * Properties of a PlayerDanmakuSwitchSave.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuSwitchSave
                         * @property {boolean|null} [value] PlayerDanmakuSwitchSave value
                         */

                        /**
                         * Constructs a new PlayerDanmakuSwitchSave.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuSwitchSave.
                         * @implements IPlayerDanmakuSwitchSave
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuSwitchSave=} [properties] Properties to set
                         */
                        function PlayerDanmakuSwitchSave(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuSwitchSave value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave
                         * @instance
                         */
                        PlayerDanmakuSwitchSave.prototype.value = false;

                        /**
                         * Creates a new PlayerDanmakuSwitchSave instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuSwitchSave=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave} PlayerDanmakuSwitchSave instance
                         */
                        PlayerDanmakuSwitchSave.create = function create(properties) {
                            return new PlayerDanmakuSwitchSave(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuSwitchSave message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuSwitchSave} message PlayerDanmakuSwitchSave message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuSwitchSave.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuSwitchSave message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuSwitchSave} message PlayerDanmakuSwitchSave message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuSwitchSave.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuSwitchSave message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave} PlayerDanmakuSwitchSave
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuSwitchSave.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuSwitchSave message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave} PlayerDanmakuSwitchSave
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuSwitchSave.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuSwitchSave message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuSwitchSave.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuSwitchSave message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave} PlayerDanmakuSwitchSave
                         */
                        PlayerDanmakuSwitchSave.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuSwitchSave message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave} message PlayerDanmakuSwitchSave
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuSwitchSave.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = false;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuSwitchSave to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSwitchSave
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuSwitchSave.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuSwitchSave;
                    })();

                    v1.PlayerDanmakuUseDefaultConfig = (function() {

                        /**
                         * Properties of a PlayerDanmakuUseDefaultConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuUseDefaultConfig
                         * @property {boolean|null} [value] PlayerDanmakuUseDefaultConfig value
                         */

                        /**
                         * Constructs a new PlayerDanmakuUseDefaultConfig.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuUseDefaultConfig.
                         * @implements IPlayerDanmakuUseDefaultConfig
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuUseDefaultConfig=} [properties] Properties to set
                         */
                        function PlayerDanmakuUseDefaultConfig(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuUseDefaultConfig value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig
                         * @instance
                         */
                        PlayerDanmakuUseDefaultConfig.prototype.value = false;

                        /**
                         * Creates a new PlayerDanmakuUseDefaultConfig instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuUseDefaultConfig=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig} PlayerDanmakuUseDefaultConfig instance
                         */
                        PlayerDanmakuUseDefaultConfig.create = function create(properties) {
                            return new PlayerDanmakuUseDefaultConfig(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuUseDefaultConfig message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuUseDefaultConfig} message PlayerDanmakuUseDefaultConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuUseDefaultConfig.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuUseDefaultConfig message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuUseDefaultConfig} message PlayerDanmakuUseDefaultConfig message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuUseDefaultConfig.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuUseDefaultConfig message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig} PlayerDanmakuUseDefaultConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuUseDefaultConfig.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuUseDefaultConfig message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig} PlayerDanmakuUseDefaultConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuUseDefaultConfig.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuUseDefaultConfig message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuUseDefaultConfig.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuUseDefaultConfig message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig} PlayerDanmakuUseDefaultConfig
                         */
                        PlayerDanmakuUseDefaultConfig.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuUseDefaultConfig message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig} message PlayerDanmakuUseDefaultConfig
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuUseDefaultConfig.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = false;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuUseDefaultConfig to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuUseDefaultConfig
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuUseDefaultConfig.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuUseDefaultConfig;
                    })();

                    v1.PlayerDanmakuAiRecommendedSwitch = (function() {

                        /**
                         * Properties of a PlayerDanmakuAiRecommendedSwitch.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuAiRecommendedSwitch
                         * @property {boolean|null} [value] PlayerDanmakuAiRecommendedSwitch value
                         */

                        /**
                         * Constructs a new PlayerDanmakuAiRecommendedSwitch.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuAiRecommendedSwitch.
                         * @implements IPlayerDanmakuAiRecommendedSwitch
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuAiRecommendedSwitch=} [properties] Properties to set
                         */
                        function PlayerDanmakuAiRecommendedSwitch(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuAiRecommendedSwitch value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch
                         * @instance
                         */
                        PlayerDanmakuAiRecommendedSwitch.prototype.value = false;

                        /**
                         * Creates a new PlayerDanmakuAiRecommendedSwitch instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuAiRecommendedSwitch=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch} PlayerDanmakuAiRecommendedSwitch instance
                         */
                        PlayerDanmakuAiRecommendedSwitch.create = function create(properties) {
                            return new PlayerDanmakuAiRecommendedSwitch(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuAiRecommendedSwitch message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuAiRecommendedSwitch} message PlayerDanmakuAiRecommendedSwitch message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuAiRecommendedSwitch.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuAiRecommendedSwitch message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuAiRecommendedSwitch} message PlayerDanmakuAiRecommendedSwitch message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuAiRecommendedSwitch.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuAiRecommendedSwitch message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch} PlayerDanmakuAiRecommendedSwitch
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuAiRecommendedSwitch.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuAiRecommendedSwitch message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch} PlayerDanmakuAiRecommendedSwitch
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuAiRecommendedSwitch.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuAiRecommendedSwitch message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuAiRecommendedSwitch.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuAiRecommendedSwitch message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch} PlayerDanmakuAiRecommendedSwitch
                         */
                        PlayerDanmakuAiRecommendedSwitch.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuAiRecommendedSwitch message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch} message PlayerDanmakuAiRecommendedSwitch
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuAiRecommendedSwitch.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = false;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuAiRecommendedSwitch to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedSwitch
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuAiRecommendedSwitch.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuAiRecommendedSwitch;
                    })();

                    v1.PlayerDanmakuAiRecommendedLevel = (function() {

                        /**
                         * Properties of a PlayerDanmakuAiRecommendedLevel.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuAiRecommendedLevel
                         * @property {boolean|null} [value] PlayerDanmakuAiRecommendedLevel value
                         */

                        /**
                         * Constructs a new PlayerDanmakuAiRecommendedLevel.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuAiRecommendedLevel.
                         * @implements IPlayerDanmakuAiRecommendedLevel
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuAiRecommendedLevel=} [properties] Properties to set
                         */
                        function PlayerDanmakuAiRecommendedLevel(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuAiRecommendedLevel value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel
                         * @instance
                         */
                        PlayerDanmakuAiRecommendedLevel.prototype.value = false;

                        /**
                         * Creates a new PlayerDanmakuAiRecommendedLevel instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuAiRecommendedLevel=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel} PlayerDanmakuAiRecommendedLevel instance
                         */
                        PlayerDanmakuAiRecommendedLevel.create = function create(properties) {
                            return new PlayerDanmakuAiRecommendedLevel(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuAiRecommendedLevel message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuAiRecommendedLevel} message PlayerDanmakuAiRecommendedLevel message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuAiRecommendedLevel.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuAiRecommendedLevel message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuAiRecommendedLevel} message PlayerDanmakuAiRecommendedLevel message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuAiRecommendedLevel.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuAiRecommendedLevel message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel} PlayerDanmakuAiRecommendedLevel
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuAiRecommendedLevel.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuAiRecommendedLevel message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel} PlayerDanmakuAiRecommendedLevel
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuAiRecommendedLevel.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuAiRecommendedLevel message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuAiRecommendedLevel.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuAiRecommendedLevel message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel} PlayerDanmakuAiRecommendedLevel
                         */
                        PlayerDanmakuAiRecommendedLevel.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuAiRecommendedLevel message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel} message PlayerDanmakuAiRecommendedLevel
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuAiRecommendedLevel.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = false;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuAiRecommendedLevel to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuAiRecommendedLevel
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuAiRecommendedLevel.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuAiRecommendedLevel;
                    })();

                    v1.PlayerDanmakuBlocktop = (function() {

                        /**
                         * Properties of a PlayerDanmakuBlocktop.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuBlocktop
                         * @property {boolean|null} [value] PlayerDanmakuBlocktop value
                         */

                        /**
                         * Constructs a new PlayerDanmakuBlocktop.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuBlocktop.
                         * @implements IPlayerDanmakuBlocktop
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlocktop=} [properties] Properties to set
                         */
                        function PlayerDanmakuBlocktop(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuBlocktop value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlocktop
                         * @instance
                         */
                        PlayerDanmakuBlocktop.prototype.value = false;

                        /**
                         * Creates a new PlayerDanmakuBlocktop instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlocktop
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlocktop=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlocktop} PlayerDanmakuBlocktop instance
                         */
                        PlayerDanmakuBlocktop.create = function create(properties) {
                            return new PlayerDanmakuBlocktop(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuBlocktop message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuBlocktop.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlocktop
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlocktop} message PlayerDanmakuBlocktop message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuBlocktop.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuBlocktop message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuBlocktop.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlocktop
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlocktop} message PlayerDanmakuBlocktop message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuBlocktop.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuBlocktop message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlocktop
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlocktop} PlayerDanmakuBlocktop
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuBlocktop.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuBlocktop();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuBlocktop message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlocktop
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlocktop} PlayerDanmakuBlocktop
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuBlocktop.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuBlocktop message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlocktop
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuBlocktop.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuBlocktop message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlocktop
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlocktop} PlayerDanmakuBlocktop
                         */
                        PlayerDanmakuBlocktop.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuBlocktop)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuBlocktop();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuBlocktop message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlocktop
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuBlocktop} message PlayerDanmakuBlocktop
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuBlocktop.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = false;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuBlocktop to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlocktop
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuBlocktop.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuBlocktop;
                    })();

                    v1.PlayerDanmakuBlockscroll = (function() {

                        /**
                         * Properties of a PlayerDanmakuBlockscroll.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuBlockscroll
                         * @property {boolean|null} [value] PlayerDanmakuBlockscroll value
                         */

                        /**
                         * Constructs a new PlayerDanmakuBlockscroll.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuBlockscroll.
                         * @implements IPlayerDanmakuBlockscroll
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockscroll=} [properties] Properties to set
                         */
                        function PlayerDanmakuBlockscroll(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuBlockscroll value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll
                         * @instance
                         */
                        PlayerDanmakuBlockscroll.prototype.value = false;

                        /**
                         * Creates a new PlayerDanmakuBlockscroll instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockscroll=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll} PlayerDanmakuBlockscroll instance
                         */
                        PlayerDanmakuBlockscroll.create = function create(properties) {
                            return new PlayerDanmakuBlockscroll(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuBlockscroll message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockscroll} message PlayerDanmakuBlockscroll message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuBlockscroll.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuBlockscroll message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockscroll} message PlayerDanmakuBlockscroll message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuBlockscroll.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuBlockscroll message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll} PlayerDanmakuBlockscroll
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuBlockscroll.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuBlockscroll message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll} PlayerDanmakuBlockscroll
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuBlockscroll.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuBlockscroll message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuBlockscroll.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuBlockscroll message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll} PlayerDanmakuBlockscroll
                         */
                        PlayerDanmakuBlockscroll.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuBlockscroll message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll} message PlayerDanmakuBlockscroll
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuBlockscroll.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = false;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuBlockscroll to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockscroll
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuBlockscroll.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuBlockscroll;
                    })();

                    v1.PlayerDanmakuBlockbottom = (function() {

                        /**
                         * Properties of a PlayerDanmakuBlockbottom.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuBlockbottom
                         * @property {boolean|null} [value] PlayerDanmakuBlockbottom value
                         */

                        /**
                         * Constructs a new PlayerDanmakuBlockbottom.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuBlockbottom.
                         * @implements IPlayerDanmakuBlockbottom
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockbottom=} [properties] Properties to set
                         */
                        function PlayerDanmakuBlockbottom(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuBlockbottom value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom
                         * @instance
                         */
                        PlayerDanmakuBlockbottom.prototype.value = false;

                        /**
                         * Creates a new PlayerDanmakuBlockbottom instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockbottom=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom} PlayerDanmakuBlockbottom instance
                         */
                        PlayerDanmakuBlockbottom.create = function create(properties) {
                            return new PlayerDanmakuBlockbottom(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuBlockbottom message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockbottom} message PlayerDanmakuBlockbottom message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuBlockbottom.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuBlockbottom message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockbottom} message PlayerDanmakuBlockbottom message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuBlockbottom.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuBlockbottom message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom} PlayerDanmakuBlockbottom
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuBlockbottom.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuBlockbottom message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom} PlayerDanmakuBlockbottom
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuBlockbottom.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuBlockbottom message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuBlockbottom.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuBlockbottom message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom} PlayerDanmakuBlockbottom
                         */
                        PlayerDanmakuBlockbottom.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuBlockbottom message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom} message PlayerDanmakuBlockbottom
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuBlockbottom.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = false;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuBlockbottom to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockbottom
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuBlockbottom.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuBlockbottom;
                    })();

                    v1.PlayerDanmakuBlockcolorful = (function() {

                        /**
                         * Properties of a PlayerDanmakuBlockcolorful.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuBlockcolorful
                         * @property {boolean|null} [value] PlayerDanmakuBlockcolorful value
                         */

                        /**
                         * Constructs a new PlayerDanmakuBlockcolorful.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuBlockcolorful.
                         * @implements IPlayerDanmakuBlockcolorful
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockcolorful=} [properties] Properties to set
                         */
                        function PlayerDanmakuBlockcolorful(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuBlockcolorful value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful
                         * @instance
                         */
                        PlayerDanmakuBlockcolorful.prototype.value = false;

                        /**
                         * Creates a new PlayerDanmakuBlockcolorful instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockcolorful=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful} PlayerDanmakuBlockcolorful instance
                         */
                        PlayerDanmakuBlockcolorful.create = function create(properties) {
                            return new PlayerDanmakuBlockcolorful(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuBlockcolorful message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockcolorful} message PlayerDanmakuBlockcolorful message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuBlockcolorful.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuBlockcolorful message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockcolorful} message PlayerDanmakuBlockcolorful message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuBlockcolorful.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuBlockcolorful message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful} PlayerDanmakuBlockcolorful
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuBlockcolorful.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuBlockcolorful message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful} PlayerDanmakuBlockcolorful
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuBlockcolorful.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuBlockcolorful message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuBlockcolorful.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuBlockcolorful message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful} PlayerDanmakuBlockcolorful
                         */
                        PlayerDanmakuBlockcolorful.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuBlockcolorful message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful} message PlayerDanmakuBlockcolorful
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuBlockcolorful.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = false;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuBlockcolorful to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockcolorful
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuBlockcolorful.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuBlockcolorful;
                    })();

                    v1.PlayerDanmakuBlockrepeat = (function() {

                        /**
                         * Properties of a PlayerDanmakuBlockrepeat.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuBlockrepeat
                         * @property {boolean|null} [value] PlayerDanmakuBlockrepeat value
                         */

                        /**
                         * Constructs a new PlayerDanmakuBlockrepeat.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuBlockrepeat.
                         * @implements IPlayerDanmakuBlockrepeat
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockrepeat=} [properties] Properties to set
                         */
                        function PlayerDanmakuBlockrepeat(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuBlockrepeat value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat
                         * @instance
                         */
                        PlayerDanmakuBlockrepeat.prototype.value = false;

                        /**
                         * Creates a new PlayerDanmakuBlockrepeat instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockrepeat=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat} PlayerDanmakuBlockrepeat instance
                         */
                        PlayerDanmakuBlockrepeat.create = function create(properties) {
                            return new PlayerDanmakuBlockrepeat(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuBlockrepeat message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockrepeat} message PlayerDanmakuBlockrepeat message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuBlockrepeat.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuBlockrepeat message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockrepeat} message PlayerDanmakuBlockrepeat message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuBlockrepeat.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuBlockrepeat message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat} PlayerDanmakuBlockrepeat
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuBlockrepeat.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuBlockrepeat message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat} PlayerDanmakuBlockrepeat
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuBlockrepeat.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuBlockrepeat message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuBlockrepeat.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuBlockrepeat message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat} PlayerDanmakuBlockrepeat
                         */
                        PlayerDanmakuBlockrepeat.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuBlockrepeat message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat} message PlayerDanmakuBlockrepeat
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuBlockrepeat.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = false;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuBlockrepeat to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockrepeat
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuBlockrepeat.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuBlockrepeat;
                    })();

                    v1.PlayerDanmakuBlockspecial = (function() {

                        /**
                         * Properties of a PlayerDanmakuBlockspecial.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuBlockspecial
                         * @property {boolean|null} [value] PlayerDanmakuBlockspecial value
                         */

                        /**
                         * Constructs a new PlayerDanmakuBlockspecial.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuBlockspecial.
                         * @implements IPlayerDanmakuBlockspecial
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockspecial=} [properties] Properties to set
                         */
                        function PlayerDanmakuBlockspecial(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuBlockspecial value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial
                         * @instance
                         */
                        PlayerDanmakuBlockspecial.prototype.value = false;

                        /**
                         * Creates a new PlayerDanmakuBlockspecial instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockspecial=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial} PlayerDanmakuBlockspecial instance
                         */
                        PlayerDanmakuBlockspecial.create = function create(properties) {
                            return new PlayerDanmakuBlockspecial(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuBlockspecial message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockspecial} message PlayerDanmakuBlockspecial message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuBlockspecial.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuBlockspecial message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuBlockspecial} message PlayerDanmakuBlockspecial message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuBlockspecial.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuBlockspecial message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial} PlayerDanmakuBlockspecial
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuBlockspecial.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuBlockspecial message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial} PlayerDanmakuBlockspecial
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuBlockspecial.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuBlockspecial message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuBlockspecial.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuBlockspecial message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial} PlayerDanmakuBlockspecial
                         */
                        PlayerDanmakuBlockspecial.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuBlockspecial message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial} message PlayerDanmakuBlockspecial
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuBlockspecial.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = false;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuBlockspecial to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuBlockspecial
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuBlockspecial.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuBlockspecial;
                    })();

                    v1.PlayerDanmakuOpacity = (function() {

                        /**
                         * Properties of a PlayerDanmakuOpacity.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuOpacity
                         * @property {number|null} [value] PlayerDanmakuOpacity value
                         */

                        /**
                         * Constructs a new PlayerDanmakuOpacity.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuOpacity.
                         * @implements IPlayerDanmakuOpacity
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuOpacity=} [properties] Properties to set
                         */
                        function PlayerDanmakuOpacity(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuOpacity value.
                         * @member {number} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuOpacity
                         * @instance
                         */
                        PlayerDanmakuOpacity.prototype.value = 0;

                        /**
                         * Creates a new PlayerDanmakuOpacity instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuOpacity
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuOpacity=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuOpacity} PlayerDanmakuOpacity instance
                         */
                        PlayerDanmakuOpacity.create = function create(properties) {
                            return new PlayerDanmakuOpacity(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuOpacity message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuOpacity.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuOpacity
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuOpacity} message PlayerDanmakuOpacity message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuOpacity.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 5 =*/13).float(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuOpacity message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuOpacity.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuOpacity
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuOpacity} message PlayerDanmakuOpacity message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuOpacity.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuOpacity message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuOpacity
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuOpacity} PlayerDanmakuOpacity
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuOpacity.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuOpacity();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.float();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuOpacity message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuOpacity
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuOpacity} PlayerDanmakuOpacity
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuOpacity.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuOpacity message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuOpacity
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuOpacity.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "number")
                                    return "value: number expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuOpacity message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuOpacity
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuOpacity} PlayerDanmakuOpacity
                         */
                        PlayerDanmakuOpacity.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuOpacity)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuOpacity();
                            if (object.value != null)
                                message.value = Number(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuOpacity message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuOpacity
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuOpacity} message PlayerDanmakuOpacity
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuOpacity.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = 0;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = options.json && !isFinite(message.value) ? String(message.value) : message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuOpacity to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuOpacity
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuOpacity.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuOpacity;
                    })();

                    v1.PlayerDanmakuScalingfactor = (function() {

                        /**
                         * Properties of a PlayerDanmakuScalingfactor.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuScalingfactor
                         * @property {number|null} [value] PlayerDanmakuScalingfactor value
                         */

                        /**
                         * Constructs a new PlayerDanmakuScalingfactor.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuScalingfactor.
                         * @implements IPlayerDanmakuScalingfactor
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuScalingfactor=} [properties] Properties to set
                         */
                        function PlayerDanmakuScalingfactor(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuScalingfactor value.
                         * @member {number} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor
                         * @instance
                         */
                        PlayerDanmakuScalingfactor.prototype.value = 0;

                        /**
                         * Creates a new PlayerDanmakuScalingfactor instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuScalingfactor=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor} PlayerDanmakuScalingfactor instance
                         */
                        PlayerDanmakuScalingfactor.create = function create(properties) {
                            return new PlayerDanmakuScalingfactor(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuScalingfactor message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuScalingfactor} message PlayerDanmakuScalingfactor message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuScalingfactor.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 5 =*/13).float(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuScalingfactor message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuScalingfactor} message PlayerDanmakuScalingfactor message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuScalingfactor.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuScalingfactor message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor} PlayerDanmakuScalingfactor
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuScalingfactor.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.float();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuScalingfactor message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor} PlayerDanmakuScalingfactor
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuScalingfactor.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuScalingfactor message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuScalingfactor.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "number")
                                    return "value: number expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuScalingfactor message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor} PlayerDanmakuScalingfactor
                         */
                        PlayerDanmakuScalingfactor.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor();
                            if (object.value != null)
                                message.value = Number(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuScalingfactor message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor} message PlayerDanmakuScalingfactor
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuScalingfactor.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = 0;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = options.json && !isFinite(message.value) ? String(message.value) : message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuScalingfactor to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuScalingfactor
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuScalingfactor.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuScalingfactor;
                    })();

                    v1.PlayerDanmakuDomain = (function() {

                        /**
                         * Properties of a PlayerDanmakuDomain.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuDomain
                         * @property {number|null} [value] PlayerDanmakuDomain value
                         */

                        /**
                         * Constructs a new PlayerDanmakuDomain.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuDomain.
                         * @implements IPlayerDanmakuDomain
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuDomain=} [properties] Properties to set
                         */
                        function PlayerDanmakuDomain(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuDomain value.
                         * @member {number} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuDomain
                         * @instance
                         */
                        PlayerDanmakuDomain.prototype.value = 0;

                        /**
                         * Creates a new PlayerDanmakuDomain instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuDomain
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuDomain=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuDomain} PlayerDanmakuDomain instance
                         */
                        PlayerDanmakuDomain.create = function create(properties) {
                            return new PlayerDanmakuDomain(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuDomain message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuDomain.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuDomain
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuDomain} message PlayerDanmakuDomain message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuDomain.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 5 =*/13).float(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuDomain message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuDomain.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuDomain
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuDomain} message PlayerDanmakuDomain message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuDomain.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuDomain message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuDomain
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuDomain} PlayerDanmakuDomain
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuDomain.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuDomain();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.float();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuDomain message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuDomain
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuDomain} PlayerDanmakuDomain
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuDomain.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuDomain message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuDomain
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuDomain.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "number")
                                    return "value: number expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuDomain message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuDomain
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuDomain} PlayerDanmakuDomain
                         */
                        PlayerDanmakuDomain.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuDomain)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuDomain();
                            if (object.value != null)
                                message.value = Number(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuDomain message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuDomain
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuDomain} message PlayerDanmakuDomain
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuDomain.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = 0;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = options.json && !isFinite(message.value) ? String(message.value) : message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuDomain to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuDomain
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuDomain.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuDomain;
                    })();

                    v1.PlayerDanmakuSpeed = (function() {

                        /**
                         * Properties of a PlayerDanmakuSpeed.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuSpeed
                         * @property {number|null} [value] PlayerDanmakuSpeed value
                         */

                        /**
                         * Constructs a new PlayerDanmakuSpeed.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuSpeed.
                         * @implements IPlayerDanmakuSpeed
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuSpeed=} [properties] Properties to set
                         */
                        function PlayerDanmakuSpeed(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuSpeed value.
                         * @member {number} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSpeed
                         * @instance
                         */
                        PlayerDanmakuSpeed.prototype.value = 0;

                        /**
                         * Creates a new PlayerDanmakuSpeed instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSpeed
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuSpeed=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuSpeed} PlayerDanmakuSpeed instance
                         */
                        PlayerDanmakuSpeed.create = function create(properties) {
                            return new PlayerDanmakuSpeed(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuSpeed message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuSpeed.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSpeed
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuSpeed} message PlayerDanmakuSpeed message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuSpeed.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuSpeed message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuSpeed.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSpeed
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuSpeed} message PlayerDanmakuSpeed message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuSpeed.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuSpeed message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSpeed
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuSpeed} PlayerDanmakuSpeed
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuSpeed.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuSpeed();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.int32();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuSpeed message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSpeed
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuSpeed} PlayerDanmakuSpeed
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuSpeed.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuSpeed message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSpeed
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuSpeed.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (!$util.isInteger(message.value))
                                    return "value: integer expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuSpeed message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSpeed
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuSpeed} PlayerDanmakuSpeed
                         */
                        PlayerDanmakuSpeed.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuSpeed)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuSpeed();
                            if (object.value != null)
                                message.value = object.value | 0;
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuSpeed message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSpeed
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuSpeed} message PlayerDanmakuSpeed
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuSpeed.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = 0;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuSpeed to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuSpeed
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuSpeed.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuSpeed;
                    })();

                    v1.PlayerDanmakuEnableblocklist = (function() {

                        /**
                         * Properties of a PlayerDanmakuEnableblocklist.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IPlayerDanmakuEnableblocklist
                         * @property {boolean|null} [value] PlayerDanmakuEnableblocklist value
                         */

                        /**
                         * Constructs a new PlayerDanmakuEnableblocklist.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents a PlayerDanmakuEnableblocklist.
                         * @implements IPlayerDanmakuEnableblocklist
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuEnableblocklist=} [properties] Properties to set
                         */
                        function PlayerDanmakuEnableblocklist(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * PlayerDanmakuEnableblocklist value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist
                         * @instance
                         */
                        PlayerDanmakuEnableblocklist.prototype.value = false;

                        /**
                         * Creates a new PlayerDanmakuEnableblocklist instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuEnableblocklist=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist} PlayerDanmakuEnableblocklist instance
                         */
                        PlayerDanmakuEnableblocklist.create = function create(properties) {
                            return new PlayerDanmakuEnableblocklist(properties);
                        };

                        /**
                         * Encodes the specified PlayerDanmakuEnableblocklist message. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuEnableblocklist} message PlayerDanmakuEnableblocklist message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuEnableblocklist.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified PlayerDanmakuEnableblocklist message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist
                         * @static
                         * @param {bilibili.community.service.dm.v1.IPlayerDanmakuEnableblocklist} message PlayerDanmakuEnableblocklist message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        PlayerDanmakuEnableblocklist.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes a PlayerDanmakuEnableblocklist message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist} PlayerDanmakuEnableblocklist
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuEnableblocklist.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes a PlayerDanmakuEnableblocklist message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist} PlayerDanmakuEnableblocklist
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        PlayerDanmakuEnableblocklist.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies a PlayerDanmakuEnableblocklist message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        PlayerDanmakuEnableblocklist.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            return null;
                        };

                        /**
                         * Creates a PlayerDanmakuEnableblocklist message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist} PlayerDanmakuEnableblocklist
                         */
                        PlayerDanmakuEnableblocklist.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from a PlayerDanmakuEnableblocklist message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist
                         * @static
                         * @param {bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist} message PlayerDanmakuEnableblocklist
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        PlayerDanmakuEnableblocklist.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = false;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this PlayerDanmakuEnableblocklist to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.PlayerDanmakuEnableblocklist
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        PlayerDanmakuEnableblocklist.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return PlayerDanmakuEnableblocklist;
                    })();

                    v1.InlinePlayerDanmakuSwitch = (function() {

                        /**
                         * Properties of an InlinePlayerDanmakuSwitch.
                         * @memberof bilibili.community.service.dm.v1
                         * @interface IInlinePlayerDanmakuSwitch
                         * @property {boolean|null} [value] InlinePlayerDanmakuSwitch value
                         */

                        /**
                         * Constructs a new InlinePlayerDanmakuSwitch.
                         * @memberof bilibili.community.service.dm.v1
                         * @classdesc Represents an InlinePlayerDanmakuSwitch.
                         * @implements IInlinePlayerDanmakuSwitch
                         * @constructor
                         * @param {bilibili.community.service.dm.v1.IInlinePlayerDanmakuSwitch=} [properties] Properties to set
                         */
                        function InlinePlayerDanmakuSwitch(properties) {
                            if (properties)
                                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                                    if (properties[keys[i]] != null)
                                        this[keys[i]] = properties[keys[i]];
                        }

                        /**
                         * InlinePlayerDanmakuSwitch value.
                         * @member {boolean} value
                         * @memberof bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch
                         * @instance
                         */
                        InlinePlayerDanmakuSwitch.prototype.value = false;

                        /**
                         * Creates a new InlinePlayerDanmakuSwitch instance using the specified properties.
                         * @function create
                         * @memberof bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch
                         * @static
                         * @param {bilibili.community.service.dm.v1.IInlinePlayerDanmakuSwitch=} [properties] Properties to set
                         * @returns {bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch} InlinePlayerDanmakuSwitch instance
                         */
                        InlinePlayerDanmakuSwitch.create = function create(properties) {
                            return new InlinePlayerDanmakuSwitch(properties);
                        };

                        /**
                         * Encodes the specified InlinePlayerDanmakuSwitch message. Does not implicitly {@link bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch.verify|verify} messages.
                         * @function encode
                         * @memberof bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch
                         * @static
                         * @param {bilibili.community.service.dm.v1.IInlinePlayerDanmakuSwitch} message InlinePlayerDanmakuSwitch message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        InlinePlayerDanmakuSwitch.encode = function encode(message, writer) {
                            if (!writer)
                                writer = $Writer.create();
                            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.value);
                            return writer;
                        };

                        /**
                         * Encodes the specified InlinePlayerDanmakuSwitch message, length delimited. Does not implicitly {@link bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch.verify|verify} messages.
                         * @function encodeDelimited
                         * @memberof bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch
                         * @static
                         * @param {bilibili.community.service.dm.v1.IInlinePlayerDanmakuSwitch} message InlinePlayerDanmakuSwitch message or plain object to encode
                         * @param {$protobuf.Writer} [writer] Writer to encode to
                         * @returns {$protobuf.Writer} Writer
                         */
                        InlinePlayerDanmakuSwitch.encodeDelimited = function encodeDelimited(message, writer) {
                            return this.encode(message, writer).ldelim();
                        };

                        /**
                         * Decodes an InlinePlayerDanmakuSwitch message from the specified reader or buffer.
                         * @function decode
                         * @memberof bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @param {number} [length] Message length if known beforehand
                         * @returns {bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch} InlinePlayerDanmakuSwitch
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        InlinePlayerDanmakuSwitch.decode = function decode(reader, length) {
                            if (!(reader instanceof $Reader))
                                reader = $Reader.create(reader);
                            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch();
                            while (reader.pos < end) {
                                var tag = reader.uint32();
                                switch (tag >>> 3) {
                                    case 1:
                                        message.value = reader.bool();
                                        break;
                                    default:
                                        reader.skipType(tag & 7);
                                        break;
                                }
                            }
                            return message;
                        };

                        /**
                         * Decodes an InlinePlayerDanmakuSwitch message from the specified reader or buffer, length delimited.
                         * @function decodeDelimited
                         * @memberof bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch
                         * @static
                         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
                         * @returns {bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch} InlinePlayerDanmakuSwitch
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        InlinePlayerDanmakuSwitch.decodeDelimited = function decodeDelimited(reader) {
                            if (!(reader instanceof $Reader))
                                reader = new $Reader(reader);
                            return this.decode(reader, reader.uint32());
                        };

                        /**
                         * Verifies an InlinePlayerDanmakuSwitch message.
                         * @function verify
                         * @memberof bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch
                         * @static
                         * @param {Object.<string,*>} message Plain object to verify
                         * @returns {string|null} `null` if valid, otherwise the reason why it is not
                         */
                        InlinePlayerDanmakuSwitch.verify = function verify(message) {
                            if (typeof message !== "object" || message === null)
                                return "object expected";
                            if (message.value != null && message.hasOwnProperty("value"))
                                if (typeof message.value !== "boolean")
                                    return "value: boolean expected";
                            return null;
                        };

                        /**
                         * Creates an InlinePlayerDanmakuSwitch message from a plain object. Also converts values to their respective internal types.
                         * @function fromObject
                         * @memberof bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch
                         * @static
                         * @param {Object.<string,*>} object Plain object
                         * @returns {bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch} InlinePlayerDanmakuSwitch
                         */
                        InlinePlayerDanmakuSwitch.fromObject = function fromObject(object) {
                            if (object instanceof $root.bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch)
                                return object;
                            var message = new $root.bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch();
                            if (object.value != null)
                                message.value = Boolean(object.value);
                            return message;
                        };

                        /**
                         * Creates a plain object from an InlinePlayerDanmakuSwitch message. Also converts values to other types if specified.
                         * @function toObject
                         * @memberof bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch
                         * @static
                         * @param {bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch} message InlinePlayerDanmakuSwitch
                         * @param {$protobuf.IConversionOptions} [options] Conversion options
                         * @returns {Object.<string,*>} Plain object
                         */
                        InlinePlayerDanmakuSwitch.toObject = function toObject(message, options) {
                            if (!options)
                                options = {};
                            var object = {};
                            if (options.defaults)
                                object.value = false;
                            if (message.value != null && message.hasOwnProperty("value"))
                                object.value = message.value;
                            return object;
                        };

                        /**
                         * Converts this InlinePlayerDanmakuSwitch to JSON.
                         * @function toJSON
                         * @memberof bilibili.community.service.dm.v1.InlinePlayerDanmakuSwitch
                         * @instance
                         * @returns {Object.<string,*>} JSON object
                         */
                        InlinePlayerDanmakuSwitch.prototype.toJSON = function toJSON() {
                            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
                        };

                        return InlinePlayerDanmakuSwitch;
                    })();

                    return v1;
                })();

                return dm;
            })();

            return service;
        })();

        return community;
    })();

    return bilibili;
})();