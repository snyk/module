module.exports = moduleToObject;
module.exports.encode = encode;

var debug = require('debug')('snyk:module');
var gitHost = require('hosted-git-info');
var validate = require('validate-npm-package-name');

function moduleToObject(str) {
  if (!str) {
    throw new Error('requires string to parse into module');
  }

  debug('module to object from: %s', str);

  var url = looksLikeUrl(str);
  if (url) {
    // then the string looks like a url, let's try to parse it
    return supported(fromUrl(url));
  }

  var parts = str.split('@');

  if (str.indexOf('@') === 0) {
    // put the scoped package name back together
    parts = parts.slice(1);
    parts[0] = '@' + parts[0];
  }

  if (parts.length === 1) { // no version
    parts.push('*');
  }

  var module = {
    name: parts[0],
    version: parts[1],
  };

  debug('parsed from string');

  return supported(module);
}

function looksLikeUrl(str) {
  if (str.slice(-1) === '/') {
    // strip the trailing slash since we can't parse it properly anyway
    str = str.slice(0, -1);
  }

  var obj = gitHost.fromUrl(str);

  return obj;
}

function fromUrl(obj) {
  var error = false;

  debug('parsed from hosted-git-info');

  /* istanbul ignore if */
  if (!obj.project || !obj.user) {
    // this should never actually occur
    error = new Error('not supported: failed to fully parse');
    error.code = 501;
    throw error;
  }

  var module = {
    name: obj.project,
    version: obj.user + '/' + obj.project,
  };

  if (obj.committish) {
    module.version += '#' + obj.committish;
  }

  return supported(module);
}

function encode(name) {
  return name[0] + encodeURIComponent(name.slice(1));
}

function supported(module) {
  var error;

  var valid = validate(module.name);

  if (!valid.validForOldPackages) {
    error = new Error('invalid package name: ' + module.name +
      ', errors: ' + (valid.warnings || valid.errors || []).join('\n'));
    throw error;
  }


  if (module.version.indexOf('http') === 0 ||
      module.version.indexOf('git') === 0 ||
      module.name.indexOf('://') !== -1) {
    // we don't support non-npm modules atm
    debug('not supported %s@%s (ext)', module.name, module.version);
    error = new Error('not supported: external module: ' + toString(module));
  }

  if (error) {
    error.code = 501; // not implemented
    throw error;
  }

  if (module.version === 'latest') {
    module.version = '*';
  }

  return module;
}

function toString(module) {
  return module.name + '@' + module.version;
}

/* istanbul ignore if */
if (!module.parent) {
  // support simple cli testing
  console.log(moduleToObject(process.argv[2]));
}