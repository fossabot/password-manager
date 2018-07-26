import { ServerConfig } from '../actions/server/server';
import { TypedObjectID } from '../database/db-types';
import commentJson = require('comment-json');
import { SERVER_ROOT } from './constants';
import nodemailer = require('nodemailer');
import { EventEmitter } from 'events';
import Mute = require('mute-stream');
import { Readable } from 'stream';
import mongo = require('mongodb');
import mkdirp = require('mkdirp');
import path = require('path');
import fs = require('fs-extra');

//Prevent circular import
function unref(...emitters: (EventEmitter|{
	unref(): void;
})[]) {
	for (const emitter of emitters) {
		(emitter as any).unref &&
			(emitter as any).unref();
	}
}

function listenWithoutRef(src: Readable, handler: (chunk: string) => void) {
	src.on('data', (chunk) => {
		handler(chunk.toString());
	});
	unref(src);
}

class StdinCapturer {
	private _read: string = '';
	private _listeners: ((text: string) => void)[] = [];

	constructor() {
		listenWithoutRef(process.stdin, (chunk) => {
			this._read += chunk.toString();
			this._updateListeners();
		});
	}

	private _getLine() {
		let currentText: string = '';
		for (let i = 0; i < this._read.length; i++) {
			const char = this._read[i];
			if (char === '\n') {
				return {
					isNewLine: true,
					text: currentText
				}
			}
			currentText += char;
		}
		return {
			isNewLine: false,
			text: ''
		}
	}

	private _updateListeners() {
		if (this._listeners.length === 0) {
			return;
		}

		for (let { isNewLine, text } = this._getLine(); 
			isNewLine && this._listeners.length; 
			{ isNewLine, text } = this._getLine()) {
				this._read = this._read.slice(text.length + 1);
				this._listeners.shift()!(text);
			}
	}

	public getLine(callback: (text: string) => void) {
		this._listeners.push(callback);
		this._updateListeners();
	}
}

const capturer = new StdinCapturer();

export function assertDir(dirPath: string) {
	return new Promise((resolve, reject) => {
		mkdirp(dirPath, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		})
	});
}

export function writeBuffer(filePath: string, data: Buffer) {
	return new Promise(async (resolve, reject) => {
		await assertDir(path.dirname(filePath)).catch((err) => {
			resolve(err);
		});
		fs.writeFile(filePath, data, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

export async function readJSON<T>(filePath: string): Promise<T> {
	return commentJson.parse(await fs.readFile(filePath, {
		encoding: 'utf8'
	}) as EncodedString<T>);
}

export function exitWith(err: string): never {
	console.log(err);
	return process.exit(1);
}

export async function getConfirmedPassword(msg: string): Promise<string> {
	while (true) {
		const password = await readPassword(msg);
		if (await readPassword('Please confirm your password') === password) {
			return password;
		} else {
			console.log('Passwords don\'t match, please try again\n');
		}
	}
}

interface Secrets {
	google: {
		web: {
			client_id: string;
			token_uri: string;
			auth_provider_x509_cert_url: string;
			client_secret: string;
		}
	}
}

let _secrets: Secrets;
export function getSecrets(): Secrets {
	if (_secrets) {
		return _secrets;
	}
	try {
		_secrets = require('../../secrets');
		return _secrets;
	} catch(e) {
		return exitWith('Please provide a ./secrets.js file');
	}
}

export async function createTempFile(filePath: string, data: Buffer) {
	await writeBuffer(filePath, data);
	return (): Promise<void> => {
		return new Promise<void>((resolve, reject) => {
			fs.unlink(filePath, (err) => {
				if (err) {
					reject(err);
				} else {
					resolve(undefined);
				}
			});
		});
	}
}

export function sendEmail({ email }: ServerConfig, to: string,
	subject: string, content: string) {
		if (!email) {
			console.log('Attempting to send email while no email settings are' + 
				' configured, skipping');
			return;
		}

		const {
			from,
			password,
			port,
			server,
			user
		} = email;

		const transporter = nodemailer.createTransport({
			host: server,
			port: ~~port,
			secure: false,
			auth: {
				user: user,
				pass: password
			}
		});

		transporter.sendMail({
			from: from,
			to: [to],
			subject: subject,
			text: content
		}, (err) => {
			if (err) {
				console.log(err);
			}
		});
	}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';

export function genRandomString(length: number = 50): string {
	let str = '';
	for (let i = 0; i < length; i++) {
		str += chars[Math.floor(Math.random() * chars.length)];
	}
	return str;
}

export function readPassword(text: string) {
	console.log(text);
	return new Promise<string>((resolve) => {
		const m = new Mute({ replace: '*', prompt: text });
		m.pipe(process.stdout, { end: false });

		m.mute();
		capturer.getLine((text) => {
			m.unmute();
			resolve(text.trim());
		});
	});
}

export function readConfirm(text: string) {
	console.log(text);
	return new Promise<string>((resolve) => {
		capturer.getLine((text) => {
			resolve(text.trim());
		});
	});
}

export function getDBFromURI(uri: string) {
	return uri.split('/').slice(-1).join('');
}

export function genID<T>(): TypedObjectID<T> {
	return new mongo.ObjectId() as TypedObjectID<T>;
}

export function isVoid(val: any): val is void {
	return val === undefined || val === null;
}

export function wait(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(undefined);
		}, ms);
	});
}

export function captureFileOutput() {
	const filePath = path.join(SERVER_ROOT, 'temp/');
	const fileName = `${genRandomString(25)}.file`;
	return {
		filePath,
		fileName,
		async check() {
			const content = await fs.readFile(`${filePath}${fileName}`, {
				encoding: 'utf8'
			});
			await fs.unlink(`${filePath}${fileName}`);
			return content;
		}
	}
}