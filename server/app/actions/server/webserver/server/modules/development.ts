import { Webserver, STATIC_SERVE_PATH, DEVELOPMENT_SERVE_PATH } from "../webserver";
import { synchronizePromise } from "../../../../../lib/util";
import { PROJECT_ROOT } from "../../../../../lib/constants";
import { ServerResponse } from "./ratelimit";
import * as express from 'express'
import * as webpack from 'webpack'
import * as fs from 'fs-extra'
import * as path from 'path'

function serve(root: string, {
	rewrite = (val) => val,
	raw = false,
	prefix = '',
	exclude = [],
	extensions = []
}: {
	rewrite?: (content: string, filename: string) => Promise<string>|string;
	prefix?: string;
	exclude?: string[];
	extensions?: string[]
	raw?: boolean;
} = {}): express.RequestHandler {
	return async (req: express.Request, res: ServerResponse, next: express.NextFunction) => {
		if (!req.url.startsWith(prefix)) {
			return next();
		}

		if (exclude.indexOf(path.basename(req.url)) !== -1 ||
			exclude.indexOf(req.url) !== -1) {
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
			if (raw) {
				res.sendFile(filePath);
			} else {
				res.send(await rewrite(result!.toString(), filePath));
				res.end();
			}
			return;
		}
		next();
	}
}

function rewriteEsModuleImports(file: string): string {
	return file	
		.replace(/import (.*) from ['"]js-sha512['"]/g, 'import $1 from \'/modules/js-sha512\'')
		.replace(/import (.*) from ['"]aes-js['"]/g, 'import $1 from \'/modules/aes-js\'')
		.replace(/import (.*) from ['"]tslib['"]/g, 'import $1 from \'/modules/tslib\'')
		.replace(/import (.*) from ['"]lit-html['"]/g, 'import $1 from \'/modules/lit-html\'')
		.replace(/import (.*) from ['"]lit-html\/lib\/lit-extended['"]/g, 'import $1 from \'/modules/lit-html/lib/lit-extended\'');
}

async function getWebpackPacked(name: string, src: string) {
	return new Promise<string>(async (resolve, reject) => {
		const { err, result } = await synchronizePromise(fs.readFile(path.join(
			PROJECT_ROOT, 'temp/', `${name}.js`
		)));
		if (!err) {
			resolve(result!.toString());
			return;
		}
		
		webpack({
			mode: "development",
			entry: src,
			output: {
				library: `_${name}`,
				path: path.join(PROJECT_ROOT, 'temp/'),
				filename: `${name}.js`
			}
		}, async (err) => {
			if (err) {
				reject('Failed to convert file');
			} else {
				const { err, result: content } = await synchronizePromise(fs.readFile(path.join(
					PROJECT_ROOT, 'temp/', `${name}.js`
				)));
				if (err) {
					reject('Failed to write file');
					return;
				}
				resolve(content!.toString());
			}
		});
	});
}

async function genSingleFileWebpackRoute(res: express.Response, name: string, src: string) {
	const { err, result } = await synchronizePromise(getWebpackPacked(name, src));

	if (err) {
		res.status(500);
		res.end();
		return;
	}

	res.contentType('.js');
	res.write(`${result}\n\n
	export default _${name}.default;`);
	res.end();
}

export function initDevelopmentMiddleware(webserver: Webserver) {
	webserver.app.all('/shared/lib/shared-crypto.js', async (_req, res) => {
		await genSingleFileWebpackRoute(res, 'sharedCrypto', 
			path.join(PROJECT_ROOT, `shared/lib/shared-crypto.js`));
	});
	webserver.app.all('/shared/lib/browser-crypto.js', async (_req, res) => {
		await genSingleFileWebpackRoute(res, 'browserCrypto', 
			path.join(PROJECT_ROOT, `shared/lib/browser-crypto.js`));
	});
	webserver.app.all([
		'/modules/js-sha512',
		'/modules/js-sha512.js',
		'/modules/js-sha512/js-sha512.js'
	], async (_req, res) => {
		const result = await getWebpackPacked('jsSha512',
			path.join(PROJECT_ROOT, 'node_modules/js-sha512/src/sha512.js'));
		res.contentType('.js');
		res.write(`${result};
		const { sha512, sha384, sha512_256, sha512_224 } = _jsSha512;
		export { sha512, sha384, sha512_256, sha512_224 }`);
		res.end();
	});
	webserver.app.all([
		'/modules/aes-js',
		'/modules/aes-js.js',
		'/modules/aes-js/aes-js.js'
	], async (_req, res) => {
		const result = await getWebpackPacked('aesJs',
			path.join(PROJECT_ROOT, 'node_modules/aes-js/index.js'));
		res.contentType('.js');
		res.write(`${result};
		const { AES, Counter, ModeOfOperation, utils, padding } = _aesJs;
		export { AES, Counter, ModeOfOperation, utils, padding }`);
		res.end();
	});
	webserver.app.all([
		'/modules/tslib',
		'/modules/tslib.js',
		'/modules/tslib/tslib.js'
	], async (_req, res) => {
		res.contentType('.js');
		res.write(await fs.readFile(path.join(PROJECT_ROOT, 'node_modules/tslib/tslib.es6.js')));
		res.end();
	});
	webserver.app.all([
		'/modules/lit-html',
		'/modules/lit-html.js',
		'/modules/lit-html/lit-html.js'
	], async (_req, res) => {
		res.contentType('.js');
		res.write(await fs.readFile(path.join(PROJECT_ROOT, 'node_modules/lit-html/lit-html.js')));
		res.end();
	});
	webserver.app.all([
		'/modules/lit-html.js.map',
		'/modules/lit-html/lit-html.js.map'
	], async (_req, res) => {
		res.contentType('.js');
		res.write(await fs.readFile(path.join(PROJECT_ROOT, 'node_modules/lit-html/lit-html.js.map')));
		res.end();
	});
	webserver.app.all('/modules/lit-html/lib/lit-extended', async (_req, res) => {
		res.contentType('.js');
		res.write(await fs.readFile(path.join(PROJECT_ROOT, 'node_modules/lit-html/lib/lit-extended.js')));
		res.end();
	});
	webserver.app.all('/modules/lit-html/lib/lit-extended.js.map', async (_req, res) => {
		res.contentType('.js');
		res.write(await fs.readFile(path.join(PROJECT_ROOT, 'node_modules/lit-html/lib/lit-extended.js.map')));
		res.end();
	});
	webserver.app.use(serve(DEVELOPMENT_SERVE_PATH, {
		rewrite(content, filePath) {
			if (filePath.endsWith('.js')) {
				return rewriteEsModuleImports(content);
			}
			return content;
		},
		exclude: ['/serviceworker.js']
	}));
	webserver.app.use(serve(STATIC_SERVE_PATH, {
		prefix: '/static/',
		extensions: ['js']
	}));
	webserver.app.use(serve(path.join(__dirname, '../development/'), { 
		raw: true
	}));
	webserver.app.use(serve(path.join(PROJECT_ROOT, 'shared/components/'), {
		rewrite(content, filePath) {
			if (filePath.endsWith('.js')) {
				return rewriteEsModuleImports(content);
			}
			return content;
		},
		extensions: ['js']
	}));
	webserver.app.use(serve(path.join(PROJECT_ROOT, 'shared/components/'), {
		prefix: '/shared/components',
		rewrite(content, filePath) {
			if (filePath.endsWith('.js')) {
				return rewriteEsModuleImports(content);
			}
			return content;
		},
		extensions: ['js']
	}));
	webserver.app.use(serve(path.join(PROJECT_ROOT, 'shared/'), {
		prefix: '/shared',
		rewrite(content, filePath) {
			if (filePath.endsWith('.js')) {
				return rewriteEsModuleImports(content);
			}
			return content;
		},
		extensions: ['js']
	}));
}

function findWithGlob(glob: typeof import('glob'), pattern: string, nodir: boolean) {
	return new Promise<string[]>((resolve, reject) => {
		glob(pattern, {
			nodir: nodir
		}, (err, matches) => {
			if (err) {
				reject(err);
			} else {
				resolve(matches);
			}
		});
	});
}

let glob: (typeof import('glob'))|null = null;
let babel: (typeof import('babel-core'))|null = null;
async function getDevImports() {
	if (!glob || !babel) {
		const [ _babel, _glob ] = await Promise.all([
			import('babel-core'),
			import('glob')
		]);
		babel = _babel;
		glob = _glob;	
	}
	return {
		glob,
		babel
	}
}

export async function convertSingleFileToCommonJs(filePath: string) {
	const { babel } = await getDevImports();
	const originalFile = await fs.readFile(filePath, {
		encoding: 'utf8'
	});

	await fs.writeFile(filePath, babel.transform(originalFile, {
		plugins: ['transform-es2015-modules-commonjs']
	}), {
		encoding: 'utf8'
	});

	return async () => {
		await fs.writeFile(filePath, originalFile, {
			encoding: 'utf8'
		});
	}
}

export async function convertComponentsToCommonJS() {
	const { babel, glob } = await getDevImports();
	const pattern = `${path.join(PROJECT_ROOT, 'shared')}/**/*.js`
	const files = await findWithGlob(glob, pattern, true);

	console.log('found');
	const originalFiles: Map<string, string> = new Map();
	await Promise.all(files.map(async (file) => {
		const content = await fs.readFile(file, {
			encoding: 'utf8'
		});
		originalFiles.set(file, content);
	}));
	console.log('read');

	await Promise.all(files.map(async (file) => {
		await fs.writeFile(file, 
			babel.transform(originalFiles.get(file)!, {
				plugins: ['transform-es2015-modules-commonjs']
			}), {
				encoding: 'utf8'
			});
	}));
	console.log('written"0;')

	/**
	 * Undo function
	 */
	return async () => {
		await Promise.all(files.map(async (file) => {
			await fs.writeFile(file, originalFiles.get(file)!, {
				encoding: 'utf8'
			});
		}));
	}
}
export const enum ROUTES {
	LOGIN = 'login',
	DASHBOARD = 'dashboard'
}