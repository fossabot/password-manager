import { html, TemplateResult } from 'lit-html';

export const Questionmark = QuestionmarkSize();

export function QuestionmarkSize(width: number, height: number): TemplateResult;
export function QuestionmarkSize(size: number): TemplateResult;
export function QuestionmarkSize(): TemplateResult;
export function QuestionmarkSize(width: number = 24, height: number = width) {
	return html`
		<svg width="${width}" height="${height}" viewBox="0 0 24 24">
			<path d="M10,19H13V22H10V19M12,2C17.35,2.22 19.68,7.62 16.5,11.67C15.67,12.67 14.33,13.33 13.67,14.17C13,15 13,16 13,17H10C10,15.33 10,13.92 10.67,12.92C11.33,11.92 12.67,11.33 13.5,10.67C15.92,8.43 15.32,5.26 12,5A3,3 0 0,0 9,8H6A6,6 0 0,1 12,2Z" />
		</svg>
	`
}