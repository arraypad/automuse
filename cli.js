import { JSDOM } from 'jsdom';

import { BaseRunner } from './index';

export class CliRunner extends BaseRunner {
	constructor(projectClass, config) {
		super(projectClass, config);

		const { document } = (new JSDOM('')).window;
		this.context.document = document;
		this.context.container = document.body;
		this.updateContext();

		this.project = new projectClass(this.context);
	}

	render() {
		super.render();
		return this.context.container.innerHTML;
	}
}
