const defaultResolver 			= require('./node-resolver');
const {getModuleFromId, runId} 	= require('./utils');

exports.run = function run(importee, importer = null, resolver = defaultResolver()) {
	const id = resolver.resolveId(importee, importer);

	return runId(id, resolver);
}

exports.require = function require(importee, importer, resolver = defaultResolver()) {
	const id 		= resolver.resolveId(importee, importer);
	const module	= getModuleFromId(id, resolver);

	return module.asCjsModule(true);
}