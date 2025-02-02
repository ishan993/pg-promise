/*
 * Copyright (c) 2015-present, Vitaly Tomilov
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Removal or modification of this copyright notice is prohibited.
 */

'use strict';

const npm = {
    path: require('path'),
    util: require('util'),
    patterns: require('../patterns')
};

////////////////////////////////////////////
// Simpler check for null/undefined;
function isNull(value) {
    return value === null || value === undefined;
}

////////////////////////////////////////////////////////
// Verifies parameter for being a non-empty text string;
function isText(txt) {
    return txt && typeof txt === 'string' && /\S/.test(txt);
}

///////////////////////////////////////////////////////////
// Approximates the environment as being for development.
//
// Proper configuration is having NODE_ENV = 'development', but this
// method only checks for 'dev' being present, and regardless of the case.
function isDev() {
    const env = global.process.env.NODE_ENV || '';
    return env.toLowerCase().indexOf('dev') !== -1;
}

///////////////////////////////////////////////////
// Locks all properties in an object to read-only,
// or freezes the entire object for any changes.
function lock(obj, freeze, options) {
    if (options && options.noLocking) {
        return;
    }
    if (freeze) {
        Object.freeze(obj); // freeze the entire object, permanently;
    } else {
        const desc = {
            writable: false,
            configurable: false,
            enumerable: true
        };
        for (const p in obj) {
            Object.defineProperty(obj, p, desc);
        }
    }
}

/////////////////////////////////////////////
// Adds properties from source to the target,
// making them read-only and enumerable.
function addReadProperties(target, source) {
    for (const p in source) {
        addReadProp(target, p, source[p]);
    }
}

///////////////////////////////////////////////////////
// Adds a read-only, non-deletable enumerable property.
function addReadProp(obj, name, value, hidden) {
    Object.defineProperty(obj, name, {
        value,
        configurable: false,
        enumerable: !hidden,
        writable: false
    });
}

//////////////////////////////////////////////////////////////
// Converts a connection string or object into its safe copy:
// if password is present, it is masked with symbol '#'.
function getSafeConnection(cn) {
    if (typeof cn === 'object') {
        const copy = Object.assign({}, cn);
        if (typeof copy.password === 'string') {
            copy.password = copy.password.replace(/./g, '#');
        }
        if (typeof copy.connectionString === 'string') {
            copy.connectionString = maskPassword(copy.connectionString);
        }
        return copy;
    }
    return maskPassword(cn);
}

///////////////////////////////////////////////////////////
// Replaces password letters with # in a connection string.
function maskPassword(connectionString) {
    return connectionString.replace(/:(?![/])([^@]+)/, (_, m) => {
        return ':' + new Array(m.length + 1).join('#');
    });
}

///////////////////////////////////////////
// Returns a space gap for console output;
function messageGap(level) {
    return ' '.repeat(level * 4);
}

/////////////////////////////////////////
// Provides platform-neutral inheritance;
function inherits(child, parent) {
    child.prototype.__proto__ = parent.prototype;
}

///////////////////////////////////////////////////////////////////////////
// Checks if the path is absolute;
//
// Though we do test it, we still skip it from the coverage,
// because it is platform-specific.
//
// istanbul ignore next
function isPathAbsolute(path) {
    // Based on: https://github.com/sindresorhus/path-is-absolute
    if (process.platform === 'win32') {
        const result = npm.patterns.splitDevice.exec(path);
        const device = result[1] || '';
        const isUnc = !!device && device.charAt(1) !== ':';
        return !!result[2] || isUnc;
    }
    return path.charAt(0) === '/';
}

function getLocalStack(startIdx) {
    // from the call stack, we take only lines starting with the client's
    // source code, and only those that contain a full path inside brackets,
    // indicating a reference to the client's source code:
    return new Error().stack.split('\n').slice(startIdx).filter(line => {
        return line.match(/\(.*(\\+|\/+).*\)/); // contains \ or / inside ()
    }).join('\n');
}

//////////////////////////////
// Internal error container;
function InternalError(error) {
    this.error = error;
}

/////////////////////////////////////////////////////////////////
// Parses a property name, and gets its name from the object,
// if the property exists. Returns object {valid, has, target, value}:
//  - valid - true/false, whether the syntax is valid
//  - has - a flag that property exists; set when 'valid' = true
//  - target - the target object that contains the property; set when 'has' = true
//  - value - the value; set when 'has' = true
function getIfHas(obj, prop) {
    const result = {valid: true};
    if (prop.indexOf('.') === -1) {
        result.has = prop in obj;
        result.target = obj;
        if (result.has) {
            result.value = obj[prop];
        }
    } else {
        const names = prop.split('.');
        let missing, target;
        for (let i = 0; i < names.length; i++) {
            const n = names[i];
            if (!n) {
                result.valid = false;
                return result;
            }
            if (!missing && hasProperty(obj, n)) {
                target = obj;
                obj = obj[n];
            } else {
                missing = true;
            }
        }
        result.has = !missing;
        if (result.has) {
            result.target = target;
            result.value = obj;
        }
    }
    return result;
}

/////////////////////////////////////////////////////////////////////////
// Checks if the property exists in the object or value or its prototype;
function hasProperty(value, prop) {
    return (value && typeof value === 'object' && prop in value) ||
        value !== null && value !== undefined && value[prop] !== undefined;
}

////////////////////////////////////////////////////////
// Adds prototype inspection, with support of the newer
// Custom Inspection, which was added in Node.js 6.x
function addInspection(type, cb) {
    // istanbul ignore next;
    if (npm.util.inspect.custom) {
        // Custom inspection is supported:
        type.prototype[npm.util.inspect.custom] = cb;
    } else {
        // Use classic inspection:
        type.prototype.inspect = cb;
    }
}

/////////////////////////////////////////////////////////////////////////////////////////
// Identifies a general connectivity error, after which no more queries can be executed.
// This is for detecting when to skip executing ROLLBACK for a failed transaction.
function isConnectivityError(err) {
    const code = err && typeof err.code === 'string' && err.code;
    const cls = code && code.substr(0, 2); // Error Class
    // istanbul ignore next (we cannot test-cover all error cases):
    return code === 'ECONNRESET' || (cls === '08' && code !== '08P01') || (cls === '57' && code !== '57014');
    // Code 'ECONNRESET' - Connectivity issue handled by the driver.
    // Class 08 - Connection Exception (except for 08P01, for protocol violation).
    // Class 57 - Operator Intervention (except for 57014, for cancelled queries).
    //
    // ERROR CODES: https://www.postgresql.org/docs/9.6/static/errcodes-appendix.html
}

const exp = {
    getIfHas,
    addInspection,
    InternalError,
    getLocalStack,
    isPathAbsolute,
    lock,
    isText,
    isNull,
    isDev,
    addReadProp,
    addReadProperties,
    getSafeConnection,
    messageGap,
    inherits,
    isConnectivityError
};

const mainFile = process.argv[1];

// istanbul ignore next
exp.startDir = mainFile ? npm.path.dirname(mainFile) : process.cwd();

Object.freeze(exp);

module.exports = exp;
