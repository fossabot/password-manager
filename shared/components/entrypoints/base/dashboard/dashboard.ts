import { ConfigurableWebComponent, WebComponentBase } from "../../../../lib/webcomponents";
import { ThemeSelector } from '../../../util/theme-selector/theme-selector';
import { MaterialInput } from '../../../util/material-input/material-input';
import { defineProps, JSONType } from '../../../../lib/webcomponent-util';
import { InfiniteList } from '../../../util/infinite-list/infinite-list';
import { PaperToast } from '../../../util/paper-toast/paper-toast';
import { PublicKeyDecrypted } from '../../../../types/db-types';
import { APISuccessfulReturns } from '../../../../types/api';

export type MetaPasswords = PublicKeyDecrypted<APISuccessfulReturns['/api/password/allmeta']['encrypted']>;
export const DashboarDependencies: (typeof WebComponentBase)[] = [
	MaterialInput,
	PaperToast,
	InfiniteList,
	ThemeSelector
]
export abstract class Dashboard extends ConfigurableWebComponent { 
	props = defineProps(this, {
		priv: {
			metaPasswords: {
				type: JSONType<MetaPasswords>(),
				defaultValue: []
			}
		}
	});

	protected abstract _getPasswordMeta(): Promise<MetaPasswords|null>|MetaPasswords|null;

	async mounted() {
		const pwMeta = await this._getPasswordMeta();
		if (!pwMeta) {
			//Redirecting to /login, just let this go
			return;
		}
		this.props.metaPasswords = pwMeta || [];
	}
}