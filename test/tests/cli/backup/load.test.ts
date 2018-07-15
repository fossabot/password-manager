import { genDBWithPW, hasCreatedDBWithPW, clearDB, getDB } from '../../../lib/db';
import { genRandomString, writeBuffer } from '../../../../app/lib/util';
import { genTempDatabase, captureURIs } from '../../../lib/util';
import { Export } from '../../../../app/actions/backup/export';
import { ProcRunner } from '../../../lib/procrunner';
import path = require('path');
import { test } from 'ava';
import fs = require('fs');

const dumps: string[] = [];
async function createDummyDump(uri: string) {
	const dumpPath = path.join(__dirname,
		`../../../temp/dummpydump${genRandomString(25)}.dump`);
	dumps.push(dumpPath);
	const dbpw = await genDBWithPW(uri);
	const data = await Export.exportDatabase(uri, true);
	await writeBuffer(dumpPath, data);
	return {
		dumpPath, dbpw 
	};
}

const uris = captureURIs(test);
test('print an error when no input is passed', async t => {
	const uri = await genTempDatabase(t);
	uris.push(uri);

	const proc = new ProcRunner(t, [
		'backup',
		'load',
		'-d', uri
	]);
	proc.expectWrite('No input was specified');
	proc.expectExit(1);

	await proc.run();
	proc.check();
});
test('print an error when a config file was passed', async t => {
	const uri = await genTempDatabase(t);
	uris.push(uri);

	const proc = new ProcRunner(t, [
		'backup',
		'load',
		'-c', path.join(__dirname, '../../../dummies/load.config.json'),
		'-d', uri
	]);
	proc.expectWrite('You specified a config file but you\'re using' + 
		'the "load" option. This seems a bit conflicting,' +
		' remove the config option to continue');
	proc.expectExit(1);

	await proc.run();
	proc.check();
});
test('fail when input file does not exist', async t => {
	const uri = await genTempDatabase(t);
	uris.push(uri);

	const proc = new ProcRunner(t, [
		'backup',
		'load',
		'-i', path.join(__dirname, '../../../dummies/empty.file'),
		'-d', uri,
	]);
	proc.expectWrite('Reading file...');
	proc.expectWrite('Failed to find input file');
	proc.expectExit(1);

	await proc.run();
	proc.check();
});
test('succeed when restoring a passwordless backup', async t => {
	const uri = await genTempDatabase(t);
	uris.push(uri);
	const { dumpPath, dbpw } = await createDummyDump(uri);

	//Clear source database
	await clearDB(uri);

	const { db, done } = await getDB(uri);
	t.is((await db.collection('meta').find().toArray()).length, 0,
		'meta collection is empty');
	done();

	const proc = new ProcRunner(t, [
		'backup',
		'load',
		'-i', dumpPath,
		'-d', uri
	]);
	proc.expectWrite('Reading file...');
	proc.expectWrite('Restoring...');
	proc.expectWrite('Done!');
	proc.expectExit(0);

	await proc.run();
	proc.check();

	//Check if the database was actually created
	t.true(await hasCreatedDBWithPW(dbpw, uri));
});
test.after('delete dummy dumps', async () => {
	await Promise.all(dumps.map((dump) => {
		return new Promise((resolve, reject) => {
			fs.unlink(dump, (err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});
	}));
});