export class BaseRunner {
	constructor(projectClass, config) {
		this.projectClass = projectClass;
		this.config = config || {};
		this.context = {
			startTime: new Date().getTime(),
		};
	}

	updateContext(config) {
		Object.assign(this.context, config || this.config);
	}

	animate() {
		if (this.project.animate) {
			this.project.animate();
		}
	}

	render() {
		this.context.time = (new Date().getTime() - this.context.startTime) / 1000;
		this.project.render(this.context);
	}

	restart() {
		if (this.project.destroy) {
			this.project.destroy(this.context);
		}

		this.project = new this.projectClass(this.context);
	}
};

export class ConfigValue {
	constructor(settings) {
		Object.assign(this, settings);
	}
};

export class ConfigFolder {
	constructor(settings) {
		Object.assign(this, settings);
	}
};
