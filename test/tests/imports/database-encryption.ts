import { DatabaseEncryption } from '../../../app/database/libs/db-encryption';
import { test } from 'ava';
import { genRandomString } from '../../../app/lib/util';

class DBEncryptionTest extends DatabaseEncryption {
	public obfuscateKey(key: string) {
		return this._obfuscateKey(key);
	}

	public deObfuscateKey(obfuscated: string) {
		this._obfuscatedKey = obfuscated;
		return this._deObfuscateKey();
	}
}

test('obfuscated value can be deobfuscated', t => {
	const enc = new DBEncryptionTest({} as any);
	const lengths = [...Array(50).keys(), ...[...Array(10).keys()].map(val => val * 5)];
	for (const length of lengths) {
		const key = genRandomString(length);

		t.is(enc.deObfuscateKey(enc.obfuscateKey(key)), key,
			`deobfuscated key of length ${length} is the same as original`);
	}
});
test('dbencrypted value can be decrypted', t => {
	const enc = new DBEncryptionTest({} as any);
	const key = genRandomString(25);
	enc.setKey(key);

	const data = genRandomString(50);
	t.is(enc.dbDecrypt(enc.dbEncrypt(data)), data,
		'decrypted data is the same as original');
});
test('salted and encrypted value can be decrypted', t => {
	const enc = new DBEncryptionTest({} as any);
	const key = genRandomString(25);
	enc.setKey(key);

	const data = genRandomString(50);
	t.is(enc.dbDecryptWithSalt(enc.dbEncryptWithSalt(data)), data,
		'decrypted data is the same as original');
});