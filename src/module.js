
export default class Module {
	constructor(exports, name, object) {
		this._exports = new Map();
		this._all = {};
		this._object = object;
		this._defaultValue = null;
		this._hasDefault = false;

		this.name = name;		
		for (let {local, exported = local, mutable} of exports) {
			this._exports.set(exported, local);
			this.addBinding(this._all, exported);
		}
	}

	set object(object) {
		this._object = object;
	}

	set default(defaultValue) {
		this._hasDefault = true;
		this._defaultValue = defaultValue;
	}

	addBinding(importer, name, alias = name) {
		if (this._exports.has(name)) {
			throw new Error(`Module "${this.name}" does not export name "${name}"!`);
		} else {
			const mutable 	= this._mutability.get(name);
			const local 	= this._exports[name];
			const property 	= {
				get() {
					return this._object[local];
				},
				set(val) {
					throw new Error('Cannot modify immutable binding!');
				}
			};

			Object.defineProperty(importer, alias, property);
		}
	}

	addNamespaceBinding(importer, name) {
		importer[name] = this._all;
	}
 
	addDefaultBinding(importer, name) {
		if (this._defaultValue == null) {
			throw new Error('No default value to export!');
		} else {
			importer[name] = this._defaultValue;
		}
	}

	lock() {
		Object.freeze(this);
	}
}