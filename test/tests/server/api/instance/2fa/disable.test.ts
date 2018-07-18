import { captureURIs, doAPIRequest, createServer, genUserAndDb } from '../../../../../lib/util';
import { EncryptedInstance, StringifiedObjectId } from '../../../../../../app/database/db-types';
import { pad, hash, decryptWithSalt, ERRS } from '../../../../../../app/lib/crypto';
import { testParams, testInvalidCredentials } from '../../../../../lib/macros';
import { DEFAULT_EMAIL } from '../../../../../lib/consts';
import { doSingleQuery } from '../../../../../lib/db';
import { API_ERRS } from '../../../../../../app/api';
import speakeasy = require('speakeasy');
import mongo = require('mongodb');
import { test } from 'ava';

const uris = captureURIs(test);
testParams(test, uris, '/api/instance/2fa/enable', {
	instance_id: 'string',
	password: 'string',
	email: 'string'
}, {}, {}, {});
test('can disable 2FA when given a valid 2FA token', async t => {
	const twofactor = speakeasy.generateSecret();
	const config = await genUserAndDb(t, {
		account_twofactor_enabled: true,
		instance_twofactor_enabled: true,
		twofactor_token: twofactor.base32
	});
	const server = await createServer(config);
	const { 
		http, 
		userpw, 
		uri, 
		instance_id, 
		dbpw
	} = config;
	uris.push(uri);

	const response = JSON.parse(await doAPIRequest({ port: http }, '/api/instance/2fa/disable', {
		instance_id: instance_id.toHexString(),
		password: hash(pad(userpw, 'masterpwverify')),
		email: DEFAULT_EMAIL,
		twofactor_token: speakeasy.totp({
			secret: twofactor.base32,
			encoding: 'base32'
		})
	}));

	server.kill();

	t.true(response.success, 'API call succeeded');
	if (!response.success) return;
	const data = response.data;
	t.falsy((data as {
		message: 'state unchanged (was already set)'
	}).message, 'state is not unchanged');
	if ((data as {
		message: 'state unchanged (was already set)'
	}).message) {
		return;
	}
	const finalData = data as {
		disabled: true;	
	};
	t.true(finalData.disabled, '2FA was disabled');

	const instance = await doSingleQuery(uri, async (db) => {
		return await db.collection('instances').findOne({
			_id: new mongo.ObjectId(instance_id)
		});
	});
	t.truthy(instance, 'instance exists');
	if (!instance) return;
	const decrypt = decryptWithSalt(instance.twofactor_enabled, dbpw);
	t.not(decrypt, ERRS.INVALID_DECRYPT, 'is not an invalid decrypt');
	if (decrypt === ERRS.INVALID_DECRYPT) return;
	t.is(decrypt, false, '2FA is now disabled');
});
test('state is unchanged if already disabled', async t => {
	const config = await genUserAndDb(t, {
		account_twofactor_enabled: false,
		instance_twofactor_enabled: false,
		twofactor_token: null!
	});
	const server = await createServer(config);
	const { 
		http, 
		userpw, 
		uri, 
		instance_id, 
	} = config;
	uris.push(uri);

	const response = JSON.parse(await doAPIRequest({ port: http }, '/api/instance/2fa/disable', {
		instance_id: instance_id.toHexString(),
		password: hash(pad(userpw, 'masterpwverify')),
		email: DEFAULT_EMAIL,
		twofactor_token: 'sometoken'
	}));

	server.kill();

	t.true(response.success, 'API call succeeded');
	if (!response.success) return;
	const data = response.data;
	t.is((data as {
		message: 'state unchanged (was already set)'
	}).message, 'state unchanged (was already set)', 'state is unchanged');
});
test('fails if an invalid token is passed', async t => {
	const twofactor = speakeasy.generateSecret();
	const config = await genUserAndDb(t, {
		account_twofactor_enabled: true,
		instance_twofactor_enabled: true,
		twofactor_token: twofactor.base32
	});
	const server = await createServer(config);
	const { 
		http, 
		userpw, 
		uri, 
		instance_id, 
	} = config;
	uris.push(uri);

	const response = JSON.parse(await doAPIRequest({ port: http }, '/api/instance/2fa/disable', {
		instance_id: instance_id.toHexString(),
		password: hash(pad(userpw, 'masterpwverify')),
		email: DEFAULT_EMAIL,
		twofactor_token: speakeasy.totp({
			secret: twofactor.base32,
			encoding: 'base32',
			time: Date.now() - (60 * 60)
		})
	}));

	server.kill();

	t.false(response.success, 'API call failed');
	if (response.success) return;
	t.is(response.ERR, API_ERRS.INVALID_CREDENTIALS, 'got invalid credentials error');
});
test('fails if password is wrong', async t => {
	const twofactor = speakeasy.generateSecret();
	const config = await genUserAndDb(t, {
		account_twofactor_enabled: true,
		instance_twofactor_enabled: true,
		twofactor_token: twofactor.base32
	});
	const server = await createServer(config);
	const { http, userpw, uri, instance_id } = config;
	uris.push(uri);

	await testInvalidCredentials(t, {
		route: '/api/instance/2fa/disable',
		port: http,
		encrypted: {},
		unencrypted: {
			instance_id: instance_id.toHexString(),
			password: hash(pad(userpw + 'wrongpw', 'masterpwverify')),
			email: DEFAULT_EMAIL,
			twofactor_token: speakeasy.totp({
				secret: twofactor.base32,
				encoding: 'base32',
				time: Date.now() - (60 * 60)
			})
		},
		server: server
	});
});
test('fails if instance id wrong', async t => {
	const twofactor = speakeasy.generateSecret();
	const config = await genUserAndDb(t, {
		account_twofactor_enabled: true,
		instance_twofactor_enabled: true,
		twofactor_token: twofactor.base32
	});
	const server = await createServer(config);
	const { http, userpw, uri } = config;
	uris.push(uri);

	await testInvalidCredentials(t, {
		route: '/api/instance/2fa/disable',
		port: http,
		encrypted: {},
		unencrypted: {
			instance_id: new mongo.ObjectId().toHexString() as StringifiedObjectId<EncryptedInstance>,
			password: hash(pad(userpw, 'masterpwverify')),
			email: DEFAULT_EMAIL,
			twofactor_token: speakeasy.totp({
				secret: twofactor.base32,
				encoding: 'base32',
				time: Date.now() - (60 * 60)
			})
		},
		server: server
	});
});