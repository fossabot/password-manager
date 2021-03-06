import { TemplateFn, CHANGE_TYPE } from '../../../lib/webcomponents';
import { LoadingSpinner } from './loading-spinner';
import { html } from "lit-html";

function getDimensions(props: LoadingSpinner['props']) {
	if (props.dimensions) {
		return ~~props.dimensions;
	}
	if (props.big) {
		return 200;
	}
	if (props.medium) {
		return 100;
	}
	return 28;
}

export const LoadingSpinnerCSS = new TemplateFn<LoadingSpinner>((props) => {
	return html`<style>
		/**
		* Copyright 2015 Google Inc. All Rights Reserved.
		*
		* Licensed under the Apache License, Version 2.0 (the "License");
		* you may not use this file except in compliance with the License.
		* You may obtain a copy of the License at
		*
		* http://www.apache.org/licenses/LICENSE-2.0
		*
		* Unless required by applicable law or agreed to in writing, software
		* distributed under the License is distributed on an "AS IS" BASIS,
		* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		* See the License for the specific language governing permissions and
		* limitations under the License.
		*/
		.mdl-spinner {
			display: inline-block;
			position: relative;
			width: ${getDimensions(props)}px;
			height: ${getDimensions(props)}px;
		}
		.mdl-spinner:not(.is-upgraded).is-active:after {
			content: "Loading...";
		}
		.mdl-spinner.is-upgraded.is-active {
			animation: mdl-spinner__container-rotate 1568.2352941176ms linear infinite;
		}

		@keyframes mdl-spinner__container-rotate {
			to {
				transform: rotate(360deg);
			}
		}
		.mdl-spinner__layer {
			position: absolute;
			width: 100%;
			height: 100%;
			opacity: 0;
		}

		.mdl-spinner__layer-1 {
			border-color: rgb(66,165,245);
		}
		.mdl-spinner--single-color .mdl-spinner__layer-1 {
			border-color: rgb(63,81,181);
		}
		.mdl-spinner.is-active .mdl-spinner__layer-1 {
			animation: mdl-spinner__fill-unfill-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both, mdl-spinner__layer-1-fade-in-out 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both;
		}

		.mdl-spinner__layer-2 {
			border-color: rgb(244,67,54);
		}
		.mdl-spinner--single-color .mdl-spinner__layer-2 {
			border-color: rgb(63,81,181);
		}
		.mdl-spinner.is-active .mdl-spinner__layer-2 {
			animation: mdl-spinner__fill-unfill-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both, mdl-spinner__layer-2-fade-in-out 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both;
		}

		.mdl-spinner__layer-3 {
			border-color: rgb(253,216,53);
		}
		.mdl-spinner--single-color .mdl-spinner__layer-3 {
			border-color: rgb(63,81,181);
		}
		.mdl-spinner.is-active .mdl-spinner__layer-3 {
			animation: mdl-spinner__fill-unfill-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both, mdl-spinner__layer-3-fade-in-out 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both;
		}

		.mdl-spinner__layer-4 {
			border-color: rgb(76,175,80);
		}
		.mdl-spinner--single-color .mdl-spinner__layer-4 {
			border-color: rgb(63,81,181);
		}
		.mdl-spinner.is-active .mdl-spinner__layer-4 {
			animation: mdl-spinner__fill-unfill-rotate 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both, mdl-spinner__layer-4-fade-in-out 5332ms cubic-bezier(0.4, 0, 0.2, 1) infinite both;
		}

		@keyframes mdl-spinner__fill-unfill-rotate {
			12.5% {
				transform: rotate(135deg);
			}
			25% {
				transform: rotate(270deg);
			}
			37.5% {
				transform: rotate(405deg);
			}
			50% {
				transform: rotate(540deg);
			}
			62.5% {
				transform: rotate(675deg);
			}
			75% {
				transform: rotate(810deg);
			}
			87.5% {
				transform: rotate(945deg);
			}
			to {
				transform: rotate(1080deg);
			}
		}
		
		@keyframes mdl-spinner__layer-1-fade-in-out {
			from {
				opacity: 0.99;
			}
			25% {
				opacity: 0.99;
			}
			26% {
				opacity: 0;
			}
			89% {
				opacity: 0;
			}
			90% {
				opacity: 0.99;
			}
			100% {
				opacity: 0.99;
			}
		}
		@keyframes mdl-spinner__layer-2-fade-in-out {
			from {
				opacity: 0;
			}
			15% {
				opacity: 0;
			}
			25% {
				opacity: 0.99;
			}
			50% {
				opacity: 0.99;
			}
			51% {
				opacity: 0;
			}
		}
		@keyframes mdl-spinner__layer-3-fade-in-out {
			from {
				opacity: 0;
			}
			40% {
				opacity: 0;
			}
			50% {
				opacity: 0.99;
			}
			75% {
				opacity: 0.99;
			}
			76% {
				opacity: 0;
			}
		}
		@keyframes mdl-spinner__layer-4-fade-in-out {
			from {
				opacity: 0;
			}
			65% {
				opacity: 0;
			}
			75% {
				opacity: 0.99;
			}
			90% {
				opacity: 0.99;
			}
			100% {
				opacity: 0;
			}
		}
		/**
		* Patch the gap that appear between the two adjacent
		* div.mdl-spinner__circle-clipper while the spinner is rotating
		* (appears on Chrome 38, Safari 7.1, and IE 11).
		*
		* Update: the gap no longer appears on Chrome when .mdl-spinner__layer-N's
		* opacity is 0.99, but still does on Safari and IE.
		*/
		.mdl-spinner__gap-patch {
			position: absolute;
			box-sizing: border-box;
			top: 0;
			left: 45%;
			width: 10%;
			height: 100%;
			overflow: hidden;
			border-color: inherit;
		}
		.mdl-spinner__gap-patch .mdl-spinner__circle {
			width: 1000%;
			left: -450%;
		}

		.mdl-spinner__circle-clipper {
			display: inline-block;
			position: relative;
			width: 50%;
			height: 100%;
			overflow: hidden;
			border-color: inherit;
		}
		.mdl-spinner__circle-clipper.mdl-spinner__left {
			float: left;
		}
		.mdl-spinner__circle-clipper.mdl-spinner__right {
			float: right;
		}
		.mdl-spinner__circle-clipper .mdl-spinner__circle {
			width: 200%;
		}

		.mdl-spinner__circle {
			box-sizing: border-box;
			height: 100%;
			border-width: 3px;
			border-style: solid;
			border-color: inherit;
			border-bottom-color: transparent !important;
			border-radius: 50%;
			animation: none;
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
		}
		.mdl-spinner__left .mdl-spinner__circle {
			border-right-color: transparent !important;
			transform: rotate(129deg);
		}
		.mdl-spinner.is-active .mdl-spinner__left .mdl-spinner__circle {
			animation: mdl-spinner__left-spin 1333ms cubic-bezier(0.4, 0, 0.2, 1) infinite both;
		}
		.mdl-spinner__right .mdl-spinner__circle {
			left: -100%;
			border-left-color: transparent !important;
			transform: rotate(-129deg);
		}
		.mdl-spinner.is-active .mdl-spinner__right .mdl-spinner__circle {
			animation: mdl-spinner__right-spin 1333ms cubic-bezier(0.4, 0, 0.2, 1) infinite both;
		}

		@keyframes mdl-spinner__left-spin {
			from {
				transform: rotate(130deg);
			}
			50% {
				transform: rotate(-5deg);
			}
			to {
				transform: rotate(130deg);
			}
		}
		@keyframes mdl-spinner__right-spin {
			from {
				transform: rotate(-130deg);
			}
			50% {
				transform: rotate(5deg);
			}
			to {
				transform: rotate(-130deg);
			}
		}
	</style>`
}, CHANGE_TYPE.PROP);