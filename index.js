/* jshint node: true */

var path = require('path');
var util = require('util');

var BASE = process.cwd();

/**
 * @param {object} opts The options object.
 * @param {string} opts.name The name of the module.
 * @param {string} [opts.filepath=bin\cli.js] The relative path inside the module to the file to require.
 * @param {function} done The callback to call when the module is required. This will provide an error as
 * the first parameter if the module cannot be found.
 */
module.exports = function callLocally(opts, callback) {
    var NAME = opts.name;
    var CLI = (function(relPath) {
        if (path.isAbsolute(relPath)) {
            return relPath;
        }
        
        if (relPath && typeof relPath === 'string') {
            return path.posix.format(path.parse(relPath));
        } else {
            return path.posix.join('bin', 'cli.js');
        }
        
    }(opts.filepath));
    
    var success = false;
    var mod;

    function tryRequire(route) {
        try {
            // Resolve will throw if the module does not exist.
            route = require.resolve(route);
        } catch(e) {
            return false;
        }

        // Do not try/catch the actual require. If the module itself actually
        // throws, we still want to see that error.
        mod = require(route);
        return true;
    }

    // Require the local version of grandma
    function requireLocal() {
        var resolvedUri = path.posix.join(BASE, 'node_modules', NAME, CLI);
        return tryRequire(resolvedUri);
    }

    // We did not find grandma installed locally, nor are we
    // executing in the grandma folder itself (which might happen
    // during development), so we will use the global one instead.
    function continueWithCurrent() {
        var resolvedUri = './cli.js';
        return tryRequire(resolvedUri);
    }

    var tasks = [ requireLocal ];
    
    if (opts.allowGlobal === true) {
        tasks.push(continueWithCurrent);
    }
    
    tasks.forEach(function(func) {
        success = success || !!func();
    });

    if (!success) {
        var err = new Error(util.format('could not find "%s" module', NAME));
        err.code = 'ENOMODULE';
        
        return setImmediate(callback, err);
    }

    setImmediate(callback, null, mod);
};
