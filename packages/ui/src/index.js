import 'regenerator-runtime/runtime';
import React from 'react';
import ReactDOM from 'react-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import { makeStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import FavoriteIcon from '@material-ui/icons/Favorite';

import Play from './play';

const useStyles = makeStyles(theme => ({
	appBar: {
		zIndex: theme.zIndex.drawer + 1,
	},
	capture: {
		zIndex: theme.zIndex.drawer + 1,
		position: 'fixed',
		right: theme.spacing(2),
		bottom: theme.spacing(2),
	},
	captureIcon: {
		margin: theme.spacing(1),
	},
}));


/*
export class UiRunner extends BaseRunner {
	constructor(projectClass, config) {
		super(projectClass, config);

		this.originalConfig = JSON.stringify(config);
		const cachedConfigJson = window.localStorage.getItem('config');
		if (cachedConfigJson !== null) {
			const cachedConfig = JSON.parse(cachedConfigJson);
			assignAll(cachedConfig, config);
		}

		this.context.document = document;
		this.context.container = document.body;

		this.updateContext();
		this.setupUi();

		window.addEventListener('resize', () => {
			this.updateContext();
			this.project.resize(this.context);
		}, false);

		const animate = () => {
			requestAnimationFrame(animate);
			this.animate();
			this.render();
		};

		animate();
	}

	setupUi() {
		if (this.ui) {
			this.ui.destroy();
		}

		this.ui = new dat.GUI();

		const core = this.ui.addFolder('Core');
		core.add({capture: () => this.capture()}, 'capture');
		core.add({reset: () => this.reset()}, 'reset');
		core.add({load: () => this.list()}, 'load');
		core.add({clear: () => this.clear()}, 'clear');

		for (const [ k, v ] of Object.entries(this.config)) {
			if (v instanceof ConfigFolder) {
				this.addUiSection(this.ui, k, v);
			} else {
				if (v instanceof ConfigValue) {
					this.addUiField('Core', core, k, v, 'value');
				} else {
					this.addUiField('Core', core, k, this.config, k);
				}
			}
		}
	}

	addUiSection(parent, section, fields) {
		const folder = parent.addFolder(section);
		for (const [ name, field ] of Object.entries(fields)) {
			if (field instanceof ConfigFolder) {
				this.addUiSection(folder, name, field);
			} else if (field instanceof ConfigValue) {
				this.addUiField(section, folder, name, field, 'value');
			} else {
				this.addUiField(section, folder, name, fields, name);
			}
		}
	}

	addUiField(section, folder, name, field, fieldName) {
		const onChange = v => {
			field[fieldName] = v;
			this.updateContext();

			if (field.onChange) {
				field.onChange.call(this.project, field[fieldName]);
			} else {
				this.restart();
			}

			window.localStorage.setItem('config', JSON.stringify(this.config));
		};

		if (field[fieldName].constructor.name === 'Vector3') {
			const subFolder = folder.addFolder(name);
			subFolder.add(field[fieldName], 'x')
				.onChange(v => {
					field[fieldName].x = v;
					onChange(field[fieldName]);
				});
			subFolder.add(field[fieldName], 'y')
				.onChange(v => {
					field[fieldName].y = v;
					onChange(field[fieldName]);
				});
			subFolder.add(field[fieldName], 'z')
				.onChange(v => {
					field[fieldName].z = v;
					onChange(field[fieldName]);
				});
		} else if (name.match(/colou?r/i)) {
			folder.addColor(field, fieldName).name(name).onChange(onChange);
		} else {
			folder.add(field, fieldName).name(name).onChange(onChange);
		}
	}

	updateContext() {
		this.context.width = window.innerWidth;
		this.context.height = window.innerHeight;
		super.updateContext();
	}

	reset() {
		this.applyConfig(JSON.parse(this.originalConfig));
	}

	clear() {
		window.localStorage.clear();
	}

	applyConfig(config) {
		assignAll(config, this.config);
		window.localStorage.setItem('config', JSON.stringify(this.config));
		this.setupUi();
	}

	async capture() {
		const el = this.project.capture();
		if (!(el instanceof HTMLCanvasElement)) {
			alert('Captured element not supported');
			return;
		}			
		
		const dataUrl = el.toDataURL();
		await fetch('/api/save', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				image: dataUrl,
				config: this.config,
			}),
		});
	}

	async list() {
		const res = await fetch('/api/list');
		const list = await res.json();

		const modal = document.createElement('div');
		modal.className = 'modal';
		modal.style = '';
		modal.addEventListener('click', () => document.body.removeChild(modal));

		for (const { id, image, config } of list) {
			const imgEl = document.createElement('img');
			imgEl.style = 'width: 100%';
			imgEl.src = image;

			const el = document.createElement('a');
			el.className = 'version';
			el.appendChild(imgEl);
			el.addEventListener('click', () => {
				this.applyConfig(config);
				document.body.removeChild(modal);
			});

			el.appendChild(document.createTextNode(id));

			modal.appendChild(el);
		}

		document.body.appendChild(modal);
	}
}
*/

function App({ sketch, config }) {
	const classes = useStyles();
	return <>
		<div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
			<AppBar position="sticky" className={classes.appBar}>
				<Toolbar>
					<IconButton
						edge="start"
						className={classes.menuButton}
						color="inherit"
						aria-label="menu"
					>
						<MenuIcon />
					</IconButton>
					<Typography variant="h6" className={classes.title}>
						Automuse
					</Typography>
				</Toolbar>
			</AppBar>
			<Play
				sketch={sketch}
				originalConfig={config}
			/>
		</div>
		<Fab variant="extended" color="primary" aria-label="add" className={classes.capture}>
			<FavoriteIcon className={classes.captureIcon} />
			Capture
		</Fab>
	</>;
};

export function runApp(Sketch, config) {
	ReactDOM.render(
		<App
			sketch={Sketch}
			config={config}
		/>,
		document.getElementById("container"),
	);
}
