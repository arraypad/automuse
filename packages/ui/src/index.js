import 'regenerator-runtime/runtime';
import CssBaseline from '@material-ui/core/CssBaseline';
import React from 'react';
import ReactDOM from 'react-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
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

function App({ sketch, config, projectId }) {
	const classes = useStyles();
	const theme = useTheme();

	const [drawerOpen, setDrawerOpen] = React.useState(false);

	const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
	const menuClose = () => {
		setMenuAnchorEl(null);
	};
	const playRef = React.useRef();

	return <>
		<CssBaseline />
		<div style={{ display: 'flex', flexFlow: 'column', height: '100%' }}>
			<AppBar position="sticky" className={classes.appBar}>
				<Toolbar>
					<IconButton
						classes={{root: classes.icon}}
						color="inherit"
						onClick={e => setMenuAnchorEl(e.currentTarget)}
					>
						<MenuIcon />
					</IconButton>
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
			<Menu
				variant="menu"
				getContentAnchorEl={null}
				anchorEl={menuAnchorEl}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'left',
				}}
				keepMounted
				open={Boolean(menuAnchorEl)}
				onClose={menuClose}
			>
				<MenuItem onClick={() => {
					menuClose();
					playRef.current.export();
				}}>
					Export
				</MenuItem>
			</Menu>
			<Play
				ref={playRef}
				sketch={sketch}
				originalConfig={config}
				drawerOpen={drawerOpen}
				setDrawerOpen={setDrawerOpen}
				projectId={projectId}
			/>
		</div>
	</>;
};

export function runApp(Sketch, config, projectId) {
	ReactDOM.render(
		<App
			sketch={Sketch}
			config={config}
			projectId={projectId}
		/>,
		document.getElementById("container"),
	);
}
