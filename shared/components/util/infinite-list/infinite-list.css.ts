import { Theme } from '../../../types/shared-types';
import { InfiniteList } from './infinite-list';
import { html } from 'lit-html';

export function InfiniteListCSS<D, ID>(this: InfiniteList<D, ID>, theme: Theme, _props: InfiniteList<D, ID>['props']) {
	return html`<style>
		:host {
			display: flex;
			flex-direction: column;
		}

		.hidden {
			display: none;
		}

		.container {
			top: 0;
			position: absolute;
		}

		.item {
			${this.itemSize !== null ? 
				html`height: ${this.itemSize}px` : html``
			}
		}

		#contentContainer {
			display: flex;
			position: relative;
			overflow-y: scroll;
			background-color: ${theme.background};
		}

		#focusCapturer {
			top: 0;
			left: 0;
			position: absolute;
			height: 0;
			width: 0;
		}
	</style>`;
}