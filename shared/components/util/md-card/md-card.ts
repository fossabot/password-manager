/// <reference path="../../../types/elements.d.ts" />

import { defineProps, PROP_TYPE, config } from '../../../lib/webcomponent-util';
import { ConfigurableWebComponent } from '../../../lib/webcomponents';
import { MdCardIDMap } from './md-card-querymap';
import { MDCardHTML } from './md-card.html';
import { MDCardCSS } from './md-card.css';

@config({
	is: 'md-card',
	css: MDCardCSS,
	html: MDCardHTML
})
export class MDCard extends ConfigurableWebComponent<MdCardIDMap> {
	props = defineProps(this, {
		reflect: {
			level: {
				type: PROP_TYPE.NUMBER,
				defaultValue: 1,
				coerce: true
			},
			paddingVertical: {
				type: PROP_TYPE.NUMBER,
				defaultValue: 20,
				coerce: true
			},
			paddingHorizontal: {
				type: PROP_TYPE.NUMBER,
				defaultValue: 20,
				coerce: true
			}
		}
	});
}