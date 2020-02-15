import 'regenerator-runtime/runtime';
import CssBaseline from '@material-ui/core/CssBaseline';
import React from 'react';
import ReactDOM from 'react-dom';

import { App, assignAll } from './app';

export function runApp(Sketch, config, projectId) {
	ReactDOM.render(
		<>
			<CssBaseline />
			<App
				sketch={Sketch}
				originalConfig={config}
				projectId={projectId}
			/>
		</>,
		document.getElementById("container"),
	);
}

export function worker(Sketch, config) {
	let project, canvas;

	const handlers = {
		init: ctx => {
			canvas = new OffscreenCanvas(ctx.width, ctx.height);
			ctx.canvas = canvas;
			project = new Sketch(ctx);
		},
		setConfig: newConfig => {
			assignAll(newConfig, config);
		},
		render: ctx => {
			if (project.animate) {
				project.animate(ctx);
			}

			project.render(ctx);

			canvas.convertToBlob().then(blob => {
				const reader = new FileReader();
				reader.readAsDataURL(blob);
				reader.onloadend = () => {
					self.postMessage({frame: ctx.frame, dataUrl: reader.result });
				};
			})
		},
	};

	self.onmessage = e => {
		const { handler, ctx } = e.data;
		handlers[handler](ctx);
	};
}
