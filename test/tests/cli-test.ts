import { captureLogs, getFreshMain, finalizeLogs } from '../lib/util';
import { DEFAULT_ARGS, EXECUTABLE_SPECIFIC_HELP } from '../lib/consts';
import { VERSION } from '../../app/lib/constants';
// import { clearDB } from '../lib/db';

export function cliTest() {
	describe('CLI Test', () => {
		it('should display help information when called without args', () => {
			const { log, exit } = captureLogs();

			log.expectWrite(EXECUTABLE_SPECIFIC_HELP);
			exit.expect(0);

			getFreshMain().main(DEFAULT_ARGS, log, true);

			finalizeLogs(log, exit);
		});
		// beforeEach(async () => {
		// 	await clearDB();
		// });
		// describe('Account', () => {
		// 	describe('create', () => {
		// 		beforeEach(async () => {
		// 			await clearDB();
		// 		});	

		// 	});
		// 	describe('delete', () => {
		// 		beforeEach(async () => {
		// 			await clearDB();
		// 		});
		// 	});
		// });
		describe('Version', () => {
			it('should display the version when calling it with -v', () => {
				const { log, exit } = captureLogs();

				log.expectWrite(VERSION);
				exit.expect(0);

				getFreshMain().main([...DEFAULT_ARGS, '-v'], log, true);

				finalizeLogs(log, exit);
			});
		});
	});
}