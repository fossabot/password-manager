import { Database } from "../../../../database/database";
import { WebserverRouter } from "./modules/routing";
import { readFile } from "../../../../lib/util";
import { WebserverAuth } from "./modules/auth";
import { ServerConfig } from "../../server";
import bodyParser = require('body-parser');
import express = require('express');
import http2 = require('http2');


export class Webserver {
	public app: express.Express;
	public Auth: WebserverAuth = new WebserverAuth();
	public Router: WebserverRouter = new WebserverRouter(this);

	constructor(public database: Database, public config: ServerConfig) {
		this._init();
	}

	private _initMiddleware() {
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: false }));
	}

	private async _init() {
		this.app = express();
		this._initMiddleware();
		
		await Promise.all([...(this.config.https_key && this.config.https_cert ?
			[new Promise(async (resolve) => {
				http2.createSecureServer({
					key: await readFile(this.config.https_key),
					cert: await readFile(this.config.https_cert)
				}, this.app as any).listen(this.config.https, () => {
					console.log(`HTTPS server listening on port ${this.config.https}`);
					resolve();
				});
			})] : []), 
			new Promise((resolve) => {
				http2.createSecureServer({}, this.app as any).listen(this.config.http, () => {
					console.log(`HTTP server listening on port ${this.config.http}`);
					resolve();
				});
			})
		]);
	}
}