/* jshint node: true */

var path = require('path');
var util = require('util');

var BASE = process.cwd();

module.exports = function callLocally(opts, callback) {
    var NAME = opts.name;
    var CLI = path.posix.join('bin', 'cli.js');

    function tryRequire(route) {
        try {
            // Resolve will throw if the module does not exist.
            route = require.resolve(route);
        } catch(e) {
            return false;
        }

        // Do not try/catch the actual require. If the module itself actually
        // throws, we still want to see that error.
        require(route);
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

    var success = false;

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

    setImmediate(callback);
};





// This is requiring the package at the current root (cwd), assuming
// that the user is me actually developing grandma.
//function requireDev() {
//    // If we are not in this super-special env, move on.
//    if (process.env.NODE_ENV !== 'dev-test') {
//        return false;
//    }
//
//    var resolvedUri = path.posix.join(BASE, CLI);
//    return tryRequire(resolvedUri);
//}


