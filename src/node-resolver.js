
const fs 		= require('fs');
const path		= require('path');
const resolve 	= require('resolve');
const Module 	= require('./module');

function getType(map, id) {
	if (map.has(id)) {
		return map.get(id);
	} else {
		return null;
	}
}

function createContext(absPath) {
	const context = {};
	for (var key in global) {
		context[key] = global[key];
	}

	context.__dirname = path.dirname(absPath);
	context.__filename = absPath;
	context.global = context;

	delete context.require;

	return context;
}

module.exports = function nodeResolver() {
	const map = new Map();

	return {
		resolveId(importee, importer) {
			if (resolve.isCore(importee)) {
				map.set(importee, 'core');
				return importee;
			} else {
				let basedir = importer?
					path.dirname(importer) :
					process.cwd() ;
				let type;
				let absPath = resolve.sync(importee, {
					basedir,
					packageFilter(pkg) {
						if (pkg.hasOwnProperty('jsnext:main')) {
							pkg['main'] = pkg['jsnext:main'];
							type = 'es6';
						} else {
							type = 'cjs';
						}

						return pkg;
					}
				});

				map.set(absPath, type);

				return absPath;
			}
		},
		load(id) {
			const type = map.get(id);
			if (type === 'core' || type === 'cjs') {
				const nodeModule = require(id);
				const exports = [];
				let module;

				for (let key in nodeModule) {
					if (nodeModule.hasOwnProperty(key)) {
						exports.push({
							local: key,
							exported: key
						});
					}
				}
				
				module = new Module(exports, id, nodeModule, true);
				module.default = nodeModule;
				return {module};
			} else {
				const source = fs.readFileSync(id, 'utf8');
				const context = createContext(id);
				return {source, context};
			}
		}
	}
}