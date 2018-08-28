import { MetaPasswords } from './dashboard';

let incrementedIds: number = 0;
	function getIncrementedId() {
		return `idabcde${incrementedIds++}`;
	}

const googleWebsite = {
	host: 'google.com',
	exact: 'https://www.google.com/login',
	favicon: '/icons/google.png',
};

const redditWebsite = {
	host: 'reddit.com',
	exact: 'https://www.reddit.com/login',
	favicon: '/icons/reddit.png'
}

function genPassword(websites: {
    host: string;
    exact: string;
    favicon: string|null;
}[], twofactorEnabled: boolean) {
	return {
		id: getIncrementedId() as any,
		websites: websites,
		twofactor_enabled: twofactorEnabled
	}
}

function genGooglePassword({
	twofactorEnabled = false,
	noFavicon = false
}: {
	twofactorEnabled?: boolean;
	noFavicon?: boolean;
} = {}): MetaPasswords[0] {
	return genPassword([{...googleWebsite, ...noFavicon ? {
		favicon: null
	} : {}}], twofactorEnabled)
}

function range<T>(from: number, to: number, fn: () => T): T[] {
	const arr: T[] = [];
	for (let i = from; i < to; i++) {
		arr.push(fn());
	}
	return arr;
}

export function getDevPasswords() {
	return [
		genGooglePassword(),
		genGooglePassword(),
		genPassword([{...googleWebsite}, {...redditWebsite}], false),
		genGooglePassword({
			twofactorEnabled: true
		}),
		genGooglePassword({
			noFavicon: true
		}),
		...range(0, 200, () => {
			return genGooglePassword()
		})
	]
}