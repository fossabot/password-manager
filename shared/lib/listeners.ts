import { WebComponent } from './webcomponents';
type IDMap = Map<string, (this: any, ev: HTMLElementEventMap[keyof HTMLElementEventMap]) => any>;
const listenedToElements: WeakMap<WebComponent, {
	self: IDMap;
	identifiers: Map<string, {
		element: HTMLElement;
		map: IDMap;
	}>;
	elements: Map<string, {
		element: HTMLElement;
		map: IDMap;
	}>;
}> = new WeakMap();
let _supportsPassive: boolean | null = null;
export function supportsPassive() {
	if (_supportsPassive !== null) {
		return _supportsPassive;
	}
	_supportsPassive = false;
	try {
		var opts = Object.defineProperty({}, 'passive', {
			get: function () {
				_supportsPassive = true;
			}
		});
		const tempFn = () => { };
		window.addEventListener("testPassive", tempFn, opts);
		window.removeEventListener("testPassive", tempFn, opts);
	}
	catch (e) { }
	return _supportsPassive;
}
function doListen<I extends {
	[key: string]: HTMLElement;
}, T extends WebComponent<I>, K extends keyof HTMLElementEventMap>(base: T, type: 'element' | 'identifier', element: HTMLElement, id: string, event: K, listener: (this: T, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions) {
	const boundListener = listener.bind(base);
	if (!listenedToElements.has(base)) {
		listenedToElements.set(base, {
			identifiers: new Map(),
			elements: new Map(),
			self: new Map()
		});
	}
	const { elements: elementIDMap, identifiers: identifiersMap } = listenedToElements.get(base)!;
	const usedMap = type === 'element' ?
		elementIDMap : identifiersMap;
	if (!usedMap.has(id)) {
		usedMap.set(id, {
			element,
			map: new Map()
		});
	}
	const { map: eventIDMap } = usedMap.get(id)!;
	if (!eventIDMap.has(event)) {
		eventIDMap.set(event, boundListener);
	}
	else {
		element.removeEventListener(event, eventIDMap.get(event)!);
	}
	if (options !== undefined && options !== null && supportsPassive) {
		element.addEventListener(event, boundListener, options);
	}
	else {
		element.addEventListener(event, boundListener);
	}
}
export function listen<I extends {
	[key: string]: HTMLElement;
}, T extends WebComponent<I>, K extends keyof HTMLElementEventMap>(base: T, id: keyof T['$'], event: K, listener: (this: T, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions) {
	const element: HTMLElement = (base.$ as any)[id];
	doListen(base, 'element', element, id as string, event, listener, options);
}
export function listenWithIdentifier<I extends {
	[key: string]: HTMLElement;
}, T extends WebComponent<I>, K extends keyof HTMLElementEventMap>(base: T, element: HTMLElement, identifier: string, event: K, listener: (this: T, ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions) {
	doListen(base, 'identifier', element, identifier, event, listener, options);
}
const usedElements: WeakSet<HTMLElement> = new WeakSet();
export function isNewElement(element: HTMLElement) {
	if (!element)
		return false;
	const has = usedElements.has(element);
	if (!has) {
		usedElements.add(element);
	}
	return !has;
}
export function listenIfNew<I extends {
	[key: string]: HTMLElement;
}, T extends WebComponent<I>, K extends keyof HTMLElementEventMap>(base: T, id: keyof T['$'], event: K, listener: (this: T, ev: HTMLElementEventMap[K]) => any, isNew?: boolean, options?: boolean | AddEventListenerOptions) {
	const element: HTMLElement = (base.$ as any)[id];
	const isElementNew = typeof isNew === 'boolean' ? isNew : isNewElement(element);
	if (!isElementNew) {
		return;
	}
	listen(base, id, event, listener, options);
}
export function listenToComponent<T extends WebComponent<any>, K extends keyof HTMLElementEventMap>(base: T, event: K, listener: (this: T, ev: HTMLElementEventMap[K]) => any) {
	if (!listenedToElements.has(base)) {
		listenedToElements.set(base, {
			identifiers: new Map(),
			elements: new Map(),
			self: new Map()
		});
	}
	const { self: selfEventMap } = listenedToElements.get(base)!;
	if (!selfEventMap.has(event)) {
		selfEventMap.set(event, listener);
	}
	else {
		base.removeEventListener(event, selfEventMap.get(event)!);
	}
	base.addEventListener(event, listener);
}
function removeListeners(element: HTMLElement, map: IDMap) {
	for (const [event, listener] of map.entries()) {
		element.removeEventListener(event, listener);
	}
}
export function removeAllElementListeners(base: WebComponent) {
	if (!listenedToElements.has(base)) {
		return;
	}
	const { elements: elementIDMap, self: selfEventMap } = listenedToElements.get(base)!;
	for (const { map, element } of elementIDMap.values()) {
		removeListeners(element, map);
	}
	removeListeners(base, selfEventMap);
}