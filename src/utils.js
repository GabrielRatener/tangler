import {parse} from 'acorn';
import {generate} from 'escodegen';
import vm from 'vm';
import Module from './module';

const moduleCache = new Map();

function processProgram(ast) {
	const exports = [];
	const imports = new Map();
	const filterted = [];
	const bodies = [];
	let defaultName = null;

	for (let line of ast.body) {
		if (line.type === 'ImportDeclaration') {
			const importee = line.source.value;
			if (!imports.has(importee)) {
				imports.set(importee, []);
			}
			const importList = imports.get(importee);

			for (let specifier of line.specifiers) {
				if (specifier.type === 'ImportDefaultSpecifier') {
					const {local} = speficier;
					importList.push({local, imported: 'default'});
					continue;
				}

				if (specifier.type === 'ImportNamespaceSpecifier') {
					const {local} = speficier;
					importList.push({local, imported: '*'});
					continue;
				}

				if (specifier.type === 'ImportSpecifier') {
					const {local, imported} = specifier;
					importList.push({local, imported});
					continue;
				}
			}
		}



		if (line.type === 'ExportDefaultDeclaration') {
			bodies.push(program(filterted));
			filterted = [];

			if (line.declaration.type === 'FunctionDeclaration' ||
				line.declaration.type === 'ClassDeclaration') {

				if (line.declaration.id) {
					defaultName = line.declaration.id;
					filtered.push(line.declaration);
				} else {
					const expression = Object.assign({}, line.declaration);
					expression.type = expression.type
						.replace('Declaration','Expression');
					filtered.push(statement(expression));
				}
			} else {
				filtered.push(statement(line.declaration));
			}

			bodies.push(program(filtered));
			filtered = [];
		}

		if (line.type === 'ExportNamedDeclaration') {
			if (line.declaration) {
				const name = line.decalration.id.name;
				exports.push({local: name, exported: name});
			} else {
				for (let {local, exported} of line.specifiers) {
					exports.push({local, exported});
				}
			}
		}

		if (line.type === 'ExportAllDeclaration') {
			continue;
		}
	}

	bodies.push(program(filtered));

	return {exports, imports, bodies, defaultName};
}

function statement(expression) {
	return {
		type		: 'ExpressionStatement',
		expression
	}
}

function program(lines) {
	return {
		type	: 'Program',
		body	: lines
	}
}

// bring all function declarations and exports containing them to top
// of the program
function hoistFunctions(program) {
	var functions = [];
	var body = [];
	for (let line of program.body) {
		if (line.type === 'ExportDefaultDeclaration') {
			if (line.declaration.type === 'FunctionDeclaration') {
				functions.push(line);
			} else {
				body.push(line);
			}

			continue;
		}

		if (line.type === 'ExportNamedDeclaration') {
			if (!!line.declaration &&
				line.declaration.type === 'FunctionDeclaration') {

				functions.push(line);
			} else {
				body.push(line);
			}

			continue;
		}

		if (line.type === 'FunctionDeclaration') {
			functions.push(line);
		} else {
			body.push(line);
		}
	}

	return program([...functions, ...body]);
}

// get ast from loaded id (if applicable)
export function getAST(load) {
	if (load.ast) {
		return ast;
	} else {
		if (load.source) {
			return parse(load.source)
		} else {
			throw new Error('Cannot get AST!');
		}
	}
}

// 
export function getModuleFromId(id, resolver) {
	if (!moduleCache.has(id)) {
		const load = resolver.load(id);
		if (load.module) {
			moduleCache.set(id, load.module);
			return load.module;
		} else {
			const ast = hoistFunctions(getAST(load));
			const {exports, imports, bodies, defaultName}
				= processProgram(ast);
			const ctxt = Object.assign({}, load.context);
			const module = new Module(exports, id);
			let defaultValue;

			moduleCache.set(id, module);

			for (let [source, importees] of imports) {
				const importedId = resolver.resolveId(source, id);
				const importedModule = getModuleFromId(importId, resolver);

				for (let {local, imported} of importees) {
					if (imported === '*') {
						importedModule.addNamespaceBinding(ctxt, local);
						continue;
					}

					if (imported === 'default') {
						importedModule.addDefaultBinding(ctxt, local);
						continue;
					}

					// if not default or namespace ...
					importedModule.addBinding(ctxt, imported, local);
				}
			}

			// if module has no default export
			if (bodies.length === 1) {
				const code = generate(bodies[0]);
				vm.runInNewContext(code, ctxt);

			// if module has a default export (length === 3)
			} else {
				const codes = bodies.map(ast => generate(ast));
				vm.runInNewContext(codes[0], ctxt);
				defaultValue = vm.runInNewContext(codes[1], ctxt);
				if (defaultName) {
					defaultValue = ctxt[defaultName];
				}

				vm.runInNewContext(codes[2], ctxt);
				module.default = defaultValue;
			}

			module.object = ctxt;
			module.lock();

			return module;
		}
	} else {
		return moduleCache.get(id);
	}
}

export function run(load, id) {

}