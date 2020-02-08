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
