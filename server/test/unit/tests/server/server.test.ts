import { captureURIs, genUserAndDb } from '../../lib/util';
import { ProcRunner } from '../../lib/procrunner';
import { rateLimitTest } from './ratelimit.test';
import { tokenTest } from './token.test';
import { APITest } from './api/api.test';
import { assert } from 'chai';
import http = require('http');

export function serverTest() {
	describe('Webserver', function() {
		this.timeout(1000 * 60 * 5);
		this.slow(1000 * 60 * 5);

		const uris = captureURIs();
		it('server can be started', async () => {
			const { dbpw, uri, http } = await genUserAndDb();
			uris.push(uri);
			const proc = new ProcRunner([
				'server',
				'--http', http + '',
				'--no-rate-limit',
				'-p', dbpw,
				'-d', uri,
				'--no-https-only',
				'--debug'
			]);

			proc.expectWrite(`HTTP server listening on port ${http}`)
			proc.expectExit(-1);

			await proc.run(30000);

			proc.check();
		});
		it('requests made over HTTP are redirected to HTTPS by default', async () => {
			const { dbpw, uri, http: httpPort } = await genUserAndDb();
			uris.push(uri);
			const proc = new ProcRunner([
				'server',
				'--http', httpPort + '',
				'--no-rate-limit',
				'-p', dbpw,
				'-d', uri,
				'--debug'
			]);

			proc.expectWrite('You enabled HTTPS only mode but haven\'t provided HTTPS certs,' + 
				' this means all requests are redirected to a non-existent server');
			proc.expectWrite(`HTTP server listening on port ${httpPort}`)
			proc.expectExit(-1);

			proc.run(Infinity);

			await new Promise((resolve, reject) => {
				const timer: NodeJS.Timer = setTimeout(() => {
					reject('Did not receive message that server is running within 120 seconds');
				}, 120000);
				proc.onText((text) => {
					if (text.startsWith('HTTP server listening on port')) {
						clearTimeout(timer);
						resolve();
					}
				});
			});
			assert.strictEqual(await new Promise<number>((resolve, reject) => {
				const req = http.request({
					port: httpPort,
					hostname: '127.0.0.1',
					method: 'GET',
					path: '/login',
				}, (res) => {
					res.setEncoding('utf8');
					res.on('data', () => {});
					res.on('end', () => {
						resolve(res.statusCode);
					});
					res.on('error', (err) => {
						reject(err);
					});
				});
				req.on('error', (err) => {
					reject(err);
				});
				req.end();
			}), 301, 'statuscode is 301');

			await proc.updateTimer(30000);

			proc.check();
		});
		it('requests made over HTTP are not redirected to HTTPS if disabled', async () => {
			const { dbpw, uri, http: httpPort } = await genUserAndDb();
			uris.push(uri);
			const proc = new ProcRunner([
				'server',
				'--http', httpPort + '',
				'--no-rate-limit',
				'-p', dbpw,
				'-d', uri,
				'--no-https-only',
				'--debug'
			]);

			proc.expectWrite(`HTTP server listening on port ${httpPort}`)
			proc.expectExit(-1);

			proc.run(Infinity);

			await new Promise((resolve, reject) => {
				const timer: NodeJS.Timer = setTimeout(() => {
					reject('Did not receive message that server is running within 120 seconds');
				}, 120000);
				proc.onText((text) => {
					if (text.startsWith('HTTP server listening on port')) {
						clearTimeout(timer);
						resolve();
					}
				});
			});
			assert.strictEqual(await new Promise<number>((resolve, reject) => {
				const req = http.request({
					port: httpPort,
					hostname: '127.0.0.1',
					method: 'GET',
					path: '/login',
				}, (res) => {
					res.setEncoding('utf8');
					res.on('end', () => {
						resolve(res.statusCode);
					});
					res.on('data', () => {});
					res.once('error', (err) => {
						reject(err);
					});
				});
				req.on('error', (err) => {
					reject(err);
				});
				req.end();
			}), 200, 'statuscode is 200');

			await proc.updateTimer(30000);

			proc.check();
		});
		tokenTest();
		rateLimitTest();
		APITest();
	});
}