import { CHANGE_TYPE, TemplateFn } from '../../../../lib/webcomponents';
import { changeOpacity } from '../../../../lib/webcomponent-util';
import { RippleCSS } from '../../../../mixins/ripple';
import { PasswordPreview } from './password-preview';
import { html } from 'lit-html';

export const invertedCardCSS = new TemplateFn<PasswordPreview>((_props, theme) => {
	return html`<style>
		#shadow {
			background-color: ${theme.oppositeBackground};
			color: ${theme.textOnNonbackground};
		}
	</style>`;
}, CHANGE_TYPE.THEME);
export const noCustomCSS = new TemplateFn<PasswordPreview>(null, CHANGE_TYPE.NEVER);

export const PasswordPreviewCSS = new TemplateFn<PasswordPreview>(function (props, theme) {
	return html`
		${RippleCSS.render(CHANGE_TYPE.THEME, this)}
		<style>

		#container {
			display: block;
			cursor: pointer;
			-webkit-user-select: none;
			-moz-user-select: none;
			-khtml-user-select: none; 
			-ms-user-select: none;
			user-select: none;
		}

		#content {
			display: -webkit-flex;
			display: flex;
			flex-direction: row;
			-webkit-justify-content: space-between;
			justify-content: space-between;
			width: 475px;
			padding: 5px 0;
		}

		#pointer {
			margin-right: 25px;
			display: -webkit-flex;
			display: flex;
			flex-direction: row;
			-webkit-justify-content: flex-end;
			justify-content: flex-end;
		}

		#arrow, #twofactorEnabled, #u2fEnabled {
			display: -webkit-flex;
			display: flex;
			flex-direction: column;
			-webkit-justify-content: center;
			justify-content: center;
		}

		.noIcon, #twofactorEnabled, #u2fEnabled {
			transition: fill 300ms ease-in-out;
			fill: ${props.selected ?
				changeOpacity(theme.textOnNonbackground, 70) :
				changeOpacity(theme.textOnBackground, 70)};
		}

		#pointer .__hollow_arrow {
			transition: border-color 300ms ease-in-out;
			border-color: ${props.selected ?
				changeOpacity(theme.textOnNonbackground, 70) :
				changeOpacity(theme.textOnBackground, 70)};
		}

		#websites {
			flex-grow: 100;
			display: -webkit-flex;
			display: flex;
			flex-direction: column;
			transition: color 300ms ease-in-out;
			color: ${props.selected ? 
				theme.textOnNonbackground : 
				theme.textOnBackground};
		}

		.website {
			display: -webkit-flex;
			display: flex;
			flex-direction: row;
			padding: 10px 15px;
			height: 70px;
		}

		.username {
			transition: color 300ms ease-in-out;
			color: ${props.selected ? 
				changeOpacity(theme.textOnNonbackground, 85) :
				changeOpacity(theme.textOnBackground, 85)};
		}

		.urls {
			flex-grow: 100;
			display: block;
			margin-top: 10px;
			margin-left: 10px;
		}

		.url {
			font-weight: 500;
			font-size: 150%;
		}

		.mdl-ripple {
			background-color: ${theme.oppositeBackground};
		}
	</style>`
}, CHANGE_TYPE.ALWAYS);