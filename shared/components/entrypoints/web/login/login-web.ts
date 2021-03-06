import { genRSAKeyPair, encryptWithPublicKey, hash, pad, decryptWithPrivateKey } from '../../../../lib/browser-crypto';
import { config, cancelTimeout, wait, createCancellableTimeout, reportDefaultResponseErrors } from '../../../../lib/webcomponent-util';
import { PaperToast } from '../../../util/paper-toast/paper-toast';
import { Login, LoginDependencies } from '../../base/login/login';
import { doClientAPIRequest } from '../../../../lib/apirequests';
import { API_ERRS, APIReturns } from '../../../../types/api';
import { ENTRYPOINT } from '../../../../types/shared-types';
import { bindToClass } from '../../../../lib/decorators';
import { LoginHTML } from '../../base/login/login.html';
import { LoginCSS } from '../../base/login/login.css';
import { ERRS } from '../../../../types/crypto';

type ServerLoginResponse = APIReturns['/api/dashboard/login'];

@config({
	is: 'login-page',
	css: LoginCSS,
	html: LoginHTML,
	dependencies: LoginDependencies
})
export class LoginWeb extends Login {
	private async _doLoginRequest({
		email, password, twofactor_token
	}: {
		valid: boolean;
		email: string;
		password: string;
		twofactor_token: string|null;
	}): Promise<{
		privateKey: string|null;
		response: ServerLoginResponse
	}> {
		const serverData = await this.getData();
		if (serverData === null) {
			PaperToast.create({
				content: 'Could not establish connection to server',
				buttons: [PaperToast.BUTTONS.HIDE]
			});
			return {
				privateKey: null,
				response: {
					success: false,
					ERR: API_ERRS.NO_REQUEST_BODY,
					error: 'no data provided by server on page load'
				}
			}
		}

		const keyPair = genRSAKeyPair();
		localStorage.setItem('instance_private_key', keyPair.privateKey);
		localStorage.setItem('instance_public_key', keyPair.publicKey);

		const { comm_token, server_public_key } = serverData;
		try {
			const res = {
				privateKey: keyPair.privateKey,
				response: await doClientAPIRequest({},
					'/api/dashboard/login', {
						comm_token,
						public_key: keyPair.publicKey,
						encrypted_data: encryptWithPublicKey({
							email: email,
							twofactor_token: twofactor_token || undefined,
							password: hash(pad(password, 'masterpwverify')),
						}, server_public_key)
					})
			};
			if (res.response.success === false) {
				reportDefaultResponseErrors(res.response,
					PaperToast);
			}
			return res;
		} catch(e) {
			PaperToast.create({
				content: 'Could not establish connection to server',
				buttons: [PaperToast.BUTTONS.HIDE]
			});
			return {
				privateKey: keyPair.privateKey,
				response: {
					success: false,
					ERR: API_ERRS.CLIENT_ERR,
					error: 'failed to complete request'
				}
			}
		}
	}

	private async _proceedToDashboard({
		privateKey, response, password
	}: {
		privateKey: string;
		response: ServerLoginResponse
		password: string;
	}) {
		if (!response.success) return;

		//Decrypt data
		const {
			instance_id, server_public_key, auth_token
		} = {
			instance_id: decryptWithPrivateKey(
				response.data.id, privateKey),
			server_public_key: decryptWithPrivateKey(
				response.data.server_public_key, privateKey),
			auth_token: decryptWithPrivateKey(
				response.data.auth_token, privateKey)
		}
		if (instance_id === ERRS.INVALID_DECRYPT ||
			server_public_key === ERRS.INVALID_DECRYPT ||
			auth_token === ERRS.INVALID_DECRYPT) {
				PaperToast.hideAll();
				PaperToast.create({
					content: 'Failed to decrypt data, please try again',
					buttons: [PaperToast.BUTTONS.HIDE]
				});
				return;
			}

		const root = this.getRoot();
		root.setAPIToken(auth_token);
		root.storeData('loginData', {
			password,
			server_public_key,
			login_auth: auth_token,
			private_key: privateKey,
			instance_id: instance_id
		});
		root.changePage(ENTRYPOINT.DASHBOARD);
	}

	@bindToClass
	async onLogin() {
		const inputData = this._getInputData();
		if (inputData.valid === false || this.$.button.getState() === 'loading') {
			//Just do nothing
			return;
		}
	
		cancelTimeout(this, 'failure-button');
		this.$.button.setState('loading');

		//Wait for the ripple animation to clear before doing heavy work
		await wait(300);
		const { privateKey, response } = await this._doLoginRequest(inputData);	

		if (response.success && privateKey) {
			if (this.props.emailRemembered) {
				const email = this.$.emailInput.value;
				localStorage.setItem('rememberedEmail', email || '');
			}
			this.$.button.setState('success');
			PaperToast.create({
				content: 'Loading dashboard...',
				duration: 1000,
				buttons: [PaperToast.BUTTONS.HIDE]
			});
			await this._proceedToDashboard({ 
				privateKey, 
				response,
				password: inputData.password
			});
		} else {
			this.$.button.setState('failure');
			createCancellableTimeout(this, 'failure-button', () => {
				this.$.button.setState('regular');
			}, 3000);
		}
	}
}