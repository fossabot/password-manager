import { APIFns, APIArgs, APIReturns } from "../../server/app/api";
import { encryptWithPublicKey } from "./shared-crypto";

export function doHTTPRequest<R>(url: string, method: 'GET'|'POST', data: any): Promise<R> {
	const json = JSON.stringify(data);
	if (typeof window !== 'undefined' && window && 'fetch' in window) {
		return fetch(url, {
			method: method.toLowerCase(),
			headers: {
				'Content-Type': 'application/json'
			},
			body: json
		}).then(res => res.json());
	} else {
		return new Promise<R>((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open(method, url);
			xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			
			xhr.onreadystatechange = () => {
				if (xhr.readyState === XMLHttpRequest.DONE) {
					if (xhr.status === 200) {
						try {
							resolve(JSON.parse(xhr.responseText));
						} catch(e) {
							reject(new Error('Failed to parse response'));
						}
					} else {
						reject(new Error('Failed XHR'));
					}
				}
			}

			xhr.send(json);
		});
	}
}

export async function doClientAPIRequest<K extends keyof APIFns>({ publicKey }: {
	publicKey: string;
}, path: K,args: APIArgs[K][0], encrypted: APIArgs[K][1]): Promise<APIReturns[K]>;
export async function doClientAPIRequest<K extends keyof APIFns>({  }: {
	publicKey?: string;
}, path: K,args: APIArgs[K][0]): Promise<APIReturns[K]>;
export async function doClientAPIRequest<K extends keyof APIFns>({ publicKey }: {
	publicKey?: string;
}, path: K,args: APIArgs[K][0], encrypted?: APIArgs[K][1]): Promise<APIReturns[K]> {
	const keys = Object.getOwnPropertyNames(encrypted || {});
	if (keys.length && !publicKey) {
		throw new Error('Missing public key for encryption');
	}
	const data = {...args as Object, ...(keys.length && publicKey ? {
		encrypted: encryptWithPublicKey(encrypted, publicKey)
	} : {})};

	const port = location.port.length > 0 ? `:${location.port}` : '';
	const baseURL = `${location.protocol}://${location.host}${port}`;
	return doHTTPRequest(`${baseURL}${path}`, 'POST', data) as Promise<APIReturns[K]>;
}