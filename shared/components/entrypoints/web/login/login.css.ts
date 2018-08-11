import { createThemedRules } from '../../../../lib/webcomponent-util';
import { html } from "lit-html";

export const LoginCSS = html`<style>
	#formContainer {
		width: 400px;
	}

	#buttonPositioner {
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
	}

	${createThemedRules('#pageContainer', {
		backgroundColor: ['background']
	})}

	#themeSelector {
		position: absolute;
		top: 5px;
		right: 5px;
	}
</style>`;