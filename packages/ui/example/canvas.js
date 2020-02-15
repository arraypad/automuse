
export const config = {
	width: 300,
	height: 300,
	backgroundColor: '#fff',
	backgroundEnabled: false,
	color: '#f00',
	rotation: {
		enabled: true,
		speed: 0.5,
	},
};

export class Sketch {
	constructor({ width, height, document, canvas }) {
		this.ctx = canvas.getContext('2d');
	}

	animate() {
	}

	render({ width, height, time }) {
		this.ctx.clearRect(0, 0, width, height);

		if (config.backgroundEnabled) {
			this.ctx.fillStyle = config.backgroundColor;
			this.ctx.fillRect(0, 0, width, height);
		}

		this.ctx.save();

		if (config.rotation.enabled) {
			// rotate around center
			this.ctx.translate(width / 2, height / 2);
			this.ctx.rotate(time * config.rotation.speed);
			this.ctx.translate(-width / 2, -height / 2);
		}

		// draw rect
		this.ctx.fillStyle = config.color;
		this.ctx.fillRect(width / 4, height / 4, width / 2, height / 2);

		// clear rotation
		this.ctx.restore();
	}
}
