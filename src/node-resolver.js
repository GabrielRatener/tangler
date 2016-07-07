
import fs from 'fs';
import resolve from 'resolve';
import Module from './module';

function getType(map, id) {
	if (map.has(id)) {
		return map.get(id);
	} else {
		return null;
	}
}

export default function nodeResolver() {
	const map = new Map();

	return {
		resolveId(importee, importer) {
			if (resolve.isCore(importee)) {
				map.set(importee, 'core');
				return importee;
			} else {
				let type;
				let basedir = importer?
					path.dirname(importerPath) :
					process.cwd() ;
				let absPath = resolve.sync(importee, {
					basedir,
					packageFilter(pkg) {
						if (pkg.hasOwnProperty('jsnext:main')) {
							pkg['main'] = pkg['jsnext:main'];
							type = 'cjs';
						} else {
							type = 'es6';
						}
					}
				});

				map.set(absPath, type);

				return absPath;
			}
		},
		load(id) {
			const type = map.get(id);
			if (type === 'core' || type === 'cjs') {
				const module = new Module([], id);
				module.default = require(id);
				return {module};
			} else {
				return {source: fs.readFileSync(id, 'utf8')};
			}
		}
	}
}