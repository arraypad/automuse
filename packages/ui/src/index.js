import 'regenerator-runtime/runtime';
import CssBaseline from '@material-ui/core/CssBaseline';
import React from 'react';
import ReactDOM from 'react-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import FlashAutoIcon from '@material-ui/icons/FlashAuto';
import SettingsIcon from '@material-ui/icons/Settings';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';

import Play, { drawerWidth } from './play';

const useStyles = makeStyles(theme => ({
	icon: {
		marginRight: theme.spacing(1),
	},
	appBar: {
		transition: theme.transitions.create(['margin', 'width'], {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.leavingScreen,
		}),
	},
	wrapper: {
		flex: 1,
	},
	title: {
		flexGrow: 1,
	},
}));

/*
export class UiRunner extends BaseRunner {
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
	const theme = useTheme();

	const [drawerOpen, setDrawerOpen] = React.useState(false);

	return <>
		<CssBaseline />
		<div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
			<AppBar position="sticky" className={classes.appBar}>
				<Toolbar>
					<FlashAutoIcon classes={{root: classes.icon}} />
					<Typography variant="h6" noWrap className={classes.title}>
						Automuse
					</Typography>
					<IconButton
						color="inherit"
						aria-label="open drawer"
						edge="end"
						onClick={() => setDrawerOpen(true)}
					>
						<SettingsIcon />
					</IconButton>
				</Toolbar>
			</AppBar>
			<Play
				sketch={sketch}
				originalConfig={config}
				drawerOpen={drawerOpen}
				setDrawerOpen={setDrawerOpen}
			/>
		</div>
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
