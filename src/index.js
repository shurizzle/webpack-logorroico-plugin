
import logorroico from 'logorroico';
import realFs from 'fs';
import Module from 'webpack/lib/Module';
import OriginalSource from 'webpack-core/lib/OriginalSource';
import RawSource from 'webpack-core/lib/RawSource';

export default class LanguagePlugin {
  constructor(name, dir) {
    this._name = name;
    this._dir = dir;
  }
  apply(compiler) {
    const options = compiler.options.virtuals;
    compiler.plugin("compile", (params =>
      params.normalModuleFactory.apply(new LanguageModuleFactoryPlugin(this._name, this._dir)))
      .bind(this));
  }
}


class LanguageModuleFactoryPlugin {
  constructor(name, dir) {
    this._name = name;
    this._dir = dir;
  }

  apply(normalModuleFactory) {
    normalModuleFactory.plugin("factory", function(factory) {
      return function(data, callback) {
        const name = data.dependency.request;
        if (this._name == name) {
          callback(undefined, new LanguageModule(this._name, this._dir));
        }
        else {
          factory(data, callback);
        }
      }.bind(this);
    }.bind(this));
  }
}

class LanguageModule extends Module {
  constructor(name, dir) {
    super();
    this.fileDependencies = [];
    this.contextDependencies = [];
    this.virtual = true;
    this.name = name;
    this._fn = function(options, compilation, resolver, fs, callback) {
      realFs.realpath(dir, function(err, path) {
        if (err) callback(err);
        else {
          this.addContextDependency(path);
          logorroico(path, this.addDependency.bind(this))
            .then(
              res => callback(undefined, `module.exports=${JSON.stringify(res)}`),
              callback
            );
        }
      }.bind(this));
    };
    this._source = null;
    this.built = false;
  }

  addContextDependency(directory) {
    this.contextDependencies.push(directory);
  }

  addDependency(file) {
    this.fileDependencies.push(file);
  }

  dependency(file) {
    this.fileDependencies.push(file);
  }

  identifier() {
    return `[lang] ${this.name}`;
  }

  readableIdentifier() {
    return `[lang] ${this.name}`;
  }

  disconnect() {
    Module.prototype.disconnect.call(this);
    this.built = false;
  }

  build(options, compilation, resolver, fs, callback) {
  	this.buildTimestamp = new Date().getTime();
  	this.built = true;
    this.cacheable = true;
    const self = this;
    this._fn.call(this, options, compilation, resolver, fs, (err, res) => {
           if (err) { callback(err); }
      else if (res) { self._source = new RawSource(res); callback(undefined, res); }
      else          { callback(); }
    });
  }

  needRebuild(fileTimestamps, contextTimestamps) {
  	let timestamp = 0;
  	this.fileDependencies.forEach(function(file) {
  		let ts = fileTimestamps[file];
  		if(!ts) timestamp = Infinity;
  		if(ts > timestamp) timestamp = ts;
  	});
  	this.contextDependencies.forEach(function(context) {
  		let ts = contextTimestamps[context];
  		if(!ts) timestamp = Infinity;
  		if(ts > timestamp) timestamp = ts;
  	});
  	return timestamp >= this.buildTimestamp;
  }

  updateHash(hash) {
  	if(this._source) {
  		hash.update("source");
      hash.update(this._source.source())
  	}
    else {
  		hash.update("null");
    }
  	Module.prototype.updateHash.call(this, hash);
  }

  source() {
    return this._source;
  }

  size() {
    return (this._source && this._source.source().length) || -1;
  }

  getSourceHash() {
    if(!this._source) return "";
    const hash = require("crypto").createHash("md5");
    hash.update(this._source.source());
    return hash.digest("hex");
  }
}
