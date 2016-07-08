const vm = require('vm');

module.exports = class Module {
	constructor(exports, id, object) {
		this._exports = new Map();
		this._all = {};
		this._object = object;
		this._defaultValue = null;
		this._hasDefault = false;
		this._bindingCache = new Map();

		this.id = id;		
		for (let {local, exported = local} of exports) {
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
		if (!this._exports.has(name)) {
			throw new Error(`Module "${this.name}" does not export name "${name}"!`);
		} else {
			const local = this._exports.get(name);
			if (this._bindingCache.has(local)) {
				const property = this._bindingCache.get(local);
				Object.defineProperty(importer, alias, property);
			} else {
				const code		= `({get() {return ${local};}})`;
				const property 	= vm.runInNewContext(code, this._object);
				property.enumerable = true;
				property.set = () => {
					throw new Error('Immutable binding: cannot change value!');
				}

				this._bindingCache.set(local, property);				
				Object.defineProperty(importer, alias, property);
			}
		}
	}

	addNamespaceBinding(importer, name) {
		importer[name] = this._all;
	}
 
	addDefaultBinding(importer, name) {
		if (!this._hasDefault) {
			throw new Error('No default value to export!');
		} else {
			importer[name] = this._defaultValue;
		}
	}

	lock() {
		Object.freeze(this);
	}

	asCjsModule(def = false) {

		if (def) {
			return Object.assign({default: this._defaultValue}, this._all);
		} else {
			return Object.assign({}, this._all);
		}
	}
}