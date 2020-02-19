
export const config = {
	width: 700,
	height: 300,
	seed: 'MjQ3LDE1MywxMzIsMTM0',
	frames: 300,
	frequency: 0.01,
	octaves: 10,
	scale: 20,
	extension: 'svg',
};

export class Sketch {
	constructor({ canvas }) {
		this.ctx = canvas.getContext('2d');
	}

	renderSvg({ random, time }) {
		const freq = (1.5 + Math.sin(time / Math.PI)) * config.frequency;
		return `<svg width="700" height="300" viewBox="0 0 700 300" xmlns="http://www.w3.org/2000/svg">
	<filter id="displace">
		<feTurbulence type="turbulence" baseFrequency="${freq}" numOctaves="${config.octaves}" result="turbulence" seed="${random() * 10}" />
		<feDisplacementMap in2="turbulence" in="SourceGraphic" scale="${config.scale}" xChannelSelector="R" yChannelSelector="G"/>
	</filter>
	<text x="80" y="180" style="fill: red; font: 100px sans-serif; filter: url(#displace)">Hello, world</text>
</svg>`;
	}

	render({ width, height, random, time }) {
		return new Promise((resolve, reject) => {
			const svg = this.renderSvg({ random, time });

			const img = document.createElement('img');
			img.onload = e => {
				this.ctx.clearRect(0, 0, width, height);
				this.ctx.drawImage(img, 0, 0, width, height);
				resolve(svg);
			};

			img.src = 'data:image/svg+xml; charset=utf8, ' + encodeURIComponent(svg);
		})
	}
}
