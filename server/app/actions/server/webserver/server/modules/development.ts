import { PROJECT_ROOT, SERVER_ROOT } from "../../../../../lib/constants";
import { Webserver } from "../webserver";
import express = require('express');
import webpack = require('webpack');
import fs = require('fs-extra');
import path = require('path');
import { ResponseCaptured } from "./ratelimit";
import { parse } from "url";

function synchronizePromise<T>(prom: Promise<T>): Promise<{
	err: Error|null;
	result: T|null;
}> {
	return new Promise((resolve) => {
		prom.catch((err) => {
			resolve({
				err,
				result: null
			})
		}).then((result) => {
			resolve({
				err: null,
				result: result as T
			})
		});
	});
}

function serve(root: string, {
	rewrite = (val) => val,
	prefix = '',
	exclude = [],
	extensions = []
}: {
	rewrite?: (content: string, filename: string) => string;
	prefix?: string;
	exclude?: string[];
	extensions?: string[]
} = {}): express.RequestHandler {
	return async (req: express.Request, res: ResponseCaptured, next: express.NextFunction) => {
		if (!req.url.startsWith(prefix)) {
			return next();
		}

		if (exclude.indexOf(path.basename(req.url)) !== -1) {
			return next();
		}

		const basePath = path.join(root, req.url.slice(prefix.length));
		const filePaths = [basePath, ...extensions.map((extension) => {
			return `${basePath}.${extension}`
		})];
		for (const filePath of filePaths) {
			const { err, result } = await synchronizePromise(fs.readFile(filePath));
			if (err) {
				continue;
			}
			res.contentType(filePath);
			res.status(200);
			res.send(rewrite(result!.toString(), filePath));
			res.end();
			return;
		}
		next();
	}
}

function commonjsToEs6(file: string): string {
	return file
		.replace(/Object.defineProperty\(exports, .__esModule., { value: true }\);/g, '')
		.replace(/(\w+) (\w+) = require\("@material-ui\/core"\)/g, 'import * as $2 from "/modules/material-ui/core"')
		.replace(/(\w+) (\w+) = require\("react-dom"\)/g, 'import $2 from "/modules/react-dom"')
		.replace(/(\w+) (\w+) = require\("react"\)/g, 'import $2 from "/modules/react"')
		.replace(/(\w+) (\w+) = require\("(.*)"\)/g, 'import * as $2 from "$3.js"')
		.replace(/exports.default = (\w+)/g, 'export default $1')
		.replace(/exports.(\w+) = (\w+)/g, 'export { $2 as $1 }')
}

function getMaterialUIImportName(content: string) {
	for (const line of content.split('\n')) {
		const match = /\w+ (\w+) = require\("@material-ui\/core"\)/.exec(line);
		if (match) {
			return match[1];
		}
	}
	return 'core_1';
}

function genCustomMaterialUI(content: string) {
	const imports: string[] = [];
	const name = getMaterialUIImportName(content);
	const lines = content.split('\n');
	const nameRegex = new RegExp(`${name}\\.(\\w+)`);
	for (let line of lines) {
		while (nameRegex.exec(line)) {
			const match = nameRegex.exec(line)!;
			imports.push(match[1]);

			line = line.replace(nameRegex, '---');
		}
	}

	return imports.map((component) => {
		return `export { default as ${component} } from './${component}';`
	}).join('\n');
}

export function initDevelopmentMiddleware(webserver: Webserver, base: string) {
	const materialUIRoot = path.join(SERVER_ROOT, 'node_modules/@material-ui/core');
	webserver.app.all('/modules/react', async (_req, res) => {
		res.contentType('.js');
		const content = (await fs.readFile(path.join(SERVER_ROOT, 'node_modules/react/umd/',
			'react.development.js'))).toString();
		const replaced = content.replace(/\}\((this), \(function \(\) \{ 'use strict'/,
			'} (window, (function () { \'use strict\'');
		res.write(`${replaced}\n\n
		export default window.React`);

		res.end();
	});
	webserver.app.all('/modules/react-dom', async (_req, res) => {
		res.contentType('.js');
		const content = (await fs.readFile(path.join(SERVER_ROOT, 'node_modules/react-dom/umd/',
			'react-dom.development.js'))).toString();
		const replaced = content.replace(/\}\((this), \(function \(React\) \{ 'use strict'/g,
			'} (window, (function (React) { \'use strict\'');
		res.write(`${replaced}\n\n
		export default window.ReactDOM`);
		res.end();
	});
	webserver.app.all('/modules/material-ui/core', async (req, res) => {
		const ref = req.header('Referer')!;
		const refFile = parse(ref).pathname!;
		const srcFile = await fs.readFile(path.join(PROJECT_ROOT, refFile));
		res.contentType('.js');
		res.write(genCustomMaterialUI(srcFile.toString()));
		res.end();
	});
	webserver.app.use(serve(path.join(materialUIRoot, 'es/colors/'), {
		prefix: '/modules/material-ui/',
		exclude: ['index.js'],
		extensions: ['js']
	}));
	webserver.app.all('/modules/material-ui/colors', async (_req, res) => {
		res.contentType('.js');
		res.write(await fs.readFile(path.join(materialUIRoot, 'es/colors/index.js')));
		res.end();
	});
	webserver.app.all('/modules/material-ui/styles', async (_req, res) => {
		res.contentType('.js');
		res.write(await fs.readFile(path.join(materialUIRoot, 'es/styles/index.js')));
		res.end();
	});
	webserver.app.all('/modules/material-ui/Modal', async (_req, res) => {
		res.contentType('.js');
		const file = await fs.readFile(path.join(materialUIRoot, 'es/Modal/index.js'));
		const replaced = file.toString()
			.replace(/export { default } from '.\/Modal';/g, 
				'export { default } from \'./Modal2\';');
		res.write(replaced);
		res.end();
	});
	webserver.app.all('/modules/material-ui/:module', async (req, res, next) => {
		let component = req.params.module;
		const modals = [
			'isOverflowing',
			'manageAriaHidden',
			'ModalManager',
			'Modal2'
		];
		if (modals.indexOf(component) === -1) {
			return next();
		}
		if (component === 'Modal2') {
			component = 'Modal';
		}

		const { err, result } = await synchronizePromise(fs.readFile(path.join(
			PROJECT_ROOT, 'temp/', `${component}.js`
		)));
		if (!err) {
			res.contentType('.js');
			res.write(`${result}\n\n
			export default _${component}.default;`);
			res.end();
			return;
		}
	
		webpack({
			mode: "development",
			entry: path.join(materialUIRoot, 'Modal/', `${component}.js`),
			output: {
				library: `_${component}`,
				path: path.join(PROJECT_ROOT, 'temp/'),
				filename: `${component}.js`
			}
		}, async (err) => {
			if (err) {
				res.status(500);
				res.end();
			} else {
				res.contentType('.js');
				const { err, result: content } = await synchronizePromise(fs.readFile(path.join(
					PROJECT_ROOT, 'temp/', `${component}.js`
				)));
				if (err) {
					res.status(500);
					res.end();
					return;
				}
				res.write(`${content}\n\n
				export default _${component}.default;`);
				res.end();
			}
		});
	});
	webserver.app.all('/modules/material-ui/:module', async (req, res, next) => {
		const component = req.params.module;
		const styles = [
			'createGenerateClassName', 'createMuiTheme', 
			'jssPreset', 'MuiThemeProvider',
			'createStyles', 'withStyles', 'withTheme'
		];
		if (styles.indexOf(component) === -1) {
			return next();
		}

		const { err, result } = await synchronizePromise(fs.readFile(path.join(
			PROJECT_ROOT, 'temp/', `${component}.js`
		)));
		if (!err) {
			res.contentType('.js');
			res.write(`${result}\n\n
			export default _${component}.default;`);
			res.end();
			return;
		}
	
		webpack({
			mode: "development",
			entry: path.join(materialUIRoot, 'styles/', `${component}.js`),
			output: {
				library: `_${component}`,
				path: path.join(PROJECT_ROOT, 'temp/'),
				filename: `${component}.js`
			}
		}, async (err) => {
			if (err) {
				res.status(500);
				res.end();
			} else {
				res.contentType('.js');
				const { err, result: content } = await synchronizePromise(fs.readFile(path.join(
					PROJECT_ROOT, 'temp/', `${component}.js`
				)));
				if (err) {
					res.status(500);
					res.end();
					return;
				}
				res.write(`${content}\n\n
				export default _${component}.default;`);
				res.end();
			}
		});
	});
	webserver.app.all('/modules/material-ui/:module', async (req, res) => {
		const component = req.params.module;
		const { err, result } = await synchronizePromise(fs.readFile(path.join(
			PROJECT_ROOT, 'temp/', `${component}.js`
		)));
		if (!err) {
			res.contentType('.js');
			res.write(`${result}\n\n
			export default _${component}.default;`);
			res.end();
			return;
		}

		webpack({
			mode: "development",
			entry: path.join(materialUIRoot, component, 'index.js'),
			output: {
				library: `_${component}`,
				path: path.join(PROJECT_ROOT, 'temp/'),
				filename: `${component}.js`
			}
		}, async (err) => {
			if (err) {
				res.status(500);
				res.end();
			} else {
				res.contentType('.js');
				const { err, result: content } = await synchronizePromise(fs.readFile(path.join(
					PROJECT_ROOT, 'temp/', `${component}.js`
				)));
				if (err) {
					res.status(500);
					res.end();
					return;
				}
				res.write(`${content}\n\n
				export default _${component}.default;`);
				res.end();
			}
		});
	});
	webserver.app.use(serve(path.join(base, 'src/'), {
		rewrite(content, filePath) {
			if (filePath.endsWith('.js')) {
				return commonjsToEs6(content);
			}
			return content;
		}
	}));
	webserver.app.use(serve(path.join(PROJECT_ROOT, 'shared/components/'), {
		rewrite(content, filePath) {
			if (filePath.endsWith('.js')) {
				return commonjsToEs6(content);
			}
			return content;
		}
	}));
	webserver.app.use(serve(path.join(PROJECT_ROOT, 'shared/components/'), {
		prefix: '/shared/components',
		rewrite(content, filePath) {
			if (filePath.endsWith('.js')) {
				return commonjsToEs6(content);
			}
			return content;
		}
	}));
	webserver.app.use(serve(path.join(PROJECT_ROOT, 'shared/'), {
		prefix: '/shared',
		rewrite(content, filePath) {
			if (filePath.endsWith('.js')) {
				return commonjsToEs6(content);
			}
			return content;
		}
	}));
}