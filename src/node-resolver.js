import resolve from 'resolve';
import Module from './module';

export default function nodeResolver() {


	return {
		resolveId(importee, importer) {
			let [type, path] = importer.split(':');
			if (resolve.isCore(importee)) {
				return `core:${importee}`
			}

			if ()
		},
		load(id, entry = true) {

		}
	}
}