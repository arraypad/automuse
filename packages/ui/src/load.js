import React from 'react';

import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Slide from '@material-ui/core/Slide';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';

import { makeStyles } from '@material-ui/core/styles';

import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { hierarchy as d3hierarchy, tree as d3tree } from 'd3-hierarchy';
import clsx from 'clsx';
import {
	INITIAL_VALUE,
	ReactSVGPanZoom,
	POSITION_NONE,
} from 'react-svg-pan-zoom';

const nodeWidth = 100;
const nodeHeight = 100;
const previewWidth = 200;
const previewHeight = 200;
const sepHorizontal = 30;
const sepVertical = 30;

const useStyles = makeStyles(theme => ({
	appBar: {
		position: 'relative',
	},
	title: {
		marginLeft: theme.spacing(2),
		flex: 1,
	},
	edge: {
		fill: 'none',
		stroke: '#bbb',
	},
	nodeBorder: {
		stroke: '#bbb',
		fill: '#fff',
		stokeWidth: 2,
		'&:hover': {
			stroke: '#000',
		},
	},
	active: {
		stroke: '#000',
	},
	node: {
		cursor: 'hand',
	},
	aboutBody: {
		position: 'relative',
	},
	aboutContainer: {
		display: 'flex',
		margin: theme.spacing(2),
		alignItems: 'center',
	},
	aboutLeft: {
		width: '100%',
	},
	aboutRight: {
		marginRight: theme.spacing(2),
	},
	aboutImg: {
		display: 'block',
		width: '100%',
		height: 'auto',
		background: '#fff',
		border: '1px solid #bbb',
	},
	about: {
		// minWidth: '500px',
	},
	actions: {
		padding: theme.spacing(2),
		display: 'flex',
		flexFlow: 'row',
		justifyContent: 'flex-end',
		'& > *': {
			marginLeft: theme.spacing(1),
		},
	},
	configContainer: {
		margin: theme.spacing(2),
	},
	configArea: {
		width: '100%',
		minHeight: '200px',
	},
}));

const Transition = React.forwardRef(function Transition(props, ref) {
	return <Slide direction="up" ref={ref} {...props} />;
});

function TreeView({ root, width, height, apiRoot, onLoadVersion, onDeleteVersion, parentId }) {
	const classes = useStyles();

	const [selectedOpen, setSelectedOpen] = React.useState(null);
	const [selectedDelete, setSelectedDelete] = React.useState(null);

	// calculate tree layout
	const defaultViewWidth = nodeWidth * 5;
	const defaultViewHeight = height * defaultViewWidth / width;

	const tree = d3tree().nodeSize([
		nodeWidth + sepHorizontal,
		nodeHeight + sepVertical,
	]);

	const hroot = d3hierarchy(root);
	tree(hroot);

	const nodes = [], paths = [];
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
	let cx = 0, cy = 0, i = 0;
	for (const d of hroot.descendants()) {
		const [x, y] = [d.x, d.y];
		const lx = x - nodeWidth / 2;
		const rx = x + nodeWidth / 2;
		const ty = y - nodeHeight / 2;
		const by = y + nodeHeight / 2;
		if (lx < minX) minX = lx;
		if (rx > maxX) maxX = rx;
		if (ty < minY) minY = ty;
		if (by > maxY) maxY = by;

		if (d.data.id === parentId) {
			cx = x;
			cy = y;
		}

		if (d.parent) {
			const hx = (d.x + d.parent.x) / 2;
			const hy = (d.y + d.parent.y) / 2;
			paths.push(<path
				className={classes.edge}
				d={`M ${x} ${ty} C ${x} ${hy} ${d.parent.x} ${hy} ${d.parent.x} ${d.parent.y + nodeHeight / 2}`}
				key={`edge-${i}`}
			/>);
		}

		nodes.push(<g key={`node-${i}`}>
			<rect
				className={clsx(classes.nodeBorder, d.data.id === parentId && classes.active)}
				x={lx}
				y={ty}
				width={nodeWidth}
				height={nodeHeight}
			/>
			<image
				className={classes.node}
				x={lx}
				y={ty}
				width={nodeWidth}
				height={nodeHeight}
				href={`${apiRoot}/${d.data.image}`}
				onClick={e => setSelectedOpen(d.data)}
			/>
		</g>);

		i++;
	}

	const viewBox = [
		cx - defaultViewWidth / 2,
		cy - defaultViewHeight / 2,
		defaultViewWidth,
		defaultViewHeight,
	];

	const viewerRef = React.useRef(null);
	const [panZoomValue, setPanZoomValue] = React.useState(INITIAL_VALUE);
	React.useEffect(() => {
		if (viewerRef) {
			viewerRef.current.fitSelection(...viewBox);
		}
	}, [viewerRef]);

	return <>
		<ReactSVGPanZoom
			ref={viewerRef}
			width={width}
			height={height}
			tool="auto"
			toolbarProps={{position: POSITION_NONE}}
			miniatureProps={{position: POSITION_NONE}}
			detectAutoPan={false}
			value={panZoomValue}
			onChangeValue={setPanZoomValue}
			onChangeTool={() => {}}
			background="#eee"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				xmlnsXlink="http://www.w3.org/1999/xlink"
				viewBox={viewBox.join(' ')}
			>
				<rect x={viewBox[0]} y={viewBox[1]} width={viewBox[2]} height={viewBox[3]} fill="#eee" />
				<g>
					{nodes}
					{paths}
				</g>
			</svg>
		</ReactSVGPanZoom>
		<Dialog
			open={Boolean(selectedOpen)}
			onClose={() => setSelectedOpen(null)}
			onClick={e => e.stopPropagation()}
			onMouseDown={e => e.stopPropagation()}
			onTouchStart={e => e.stopPropagation()}
		><div>
			{selectedOpen && (<div className={classes.aboutDialog}>
				<DialogTitle>View version</DialogTitle>
				<div className={classes.aboutContainer}>
					<div className={classes.aboutLeft}>
						<List className={classes.about}>
							<ListItem><ListItemText primary="ID" secondary={selectedOpen.id} /></ListItem>
							<ListItem><ListItemText primary="Git revision" secondary={selectedOpen.revision || '[no revision]'} /></ListItem>
						</List>
					</div>
					<div className={classes.aboutRight}>
						<img
							className={classes.aboutImg}
							src={`${apiRoot}/${selectedOpen.image}`}
						/>
					</div>
				</div>
				<div className={classes.configContainer}>
					<List className={classes.about}>
						<ListItem>
							<ListItemText
								primary="Config"
								secondary={<textarea
									className={classes.configArea}
									wrap="off"
									readOnly
									value={JSON.stringify(selectedOpen.config, 0, 4)}
								/>}
								secondaryTypographyProps={{ component: 'div' }}
							/>
						</ListItem>
					</List>
				</div>
				<div className={classes.actions}>
					<Button
						color="primary"
						onClick={() => { setSelectedDelete(selectedOpen); }}
					>
						Delete
					</Button>
					<Button
						color="secondary"
						variant="contained"
						onClick={() => { onLoadVersion(selectedOpen); }}
						disabled={selectedOpen.id === parentId}
					>
						Load
					</Button>
				</div>
			</div>)}
		</div></Dialog>
		<Dialog
			open={Boolean(selectedDelete)}
			onClose={() => setSelectedDelete(null)}
			onClick={e => e.stopPropagation()}
			onMouseDown={e => e.stopPropagation()}
			onTouchStart={e => e.stopPropagation()}
		><div>
			{selectedDelete && (<>
				<DialogTitle>{"Delete version"}</DialogTitle>
				<DialogContent>
					<DialogContentText>
						This will permanently delete version {selectedDelete.id}, are you sure you want to continue?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setSelectedDelete(null)}>
						Cancel
					</Button>
					<Button onClick={() => onDeleteVersion(selectedDelete)} color="primary" autoFocus>
						Delete
					</Button>
				</DialogActions>
			</>)}
		</div></Dialog>
	</>;
}

export default function LoadDialog({ open, handleClose, versions, width, height, apiRoot, onLoadVersion, onDeleteVersion, parentId }) {
	const classes = useStyles();

	let root;
	if (versions.length) {
		const versionMap = {};
		for (const v of versions) {
			versionMap[v.id] = {...v, children: []};
		}

		root = versionMap[versions[0].id];
		for (const [vId, v] of Object.entries(versionMap)) {
			if (vId === root.id) {
				continue;
			}

			versionMap[v.parentId].children.push(v);
		}
	}

	return <Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
		<AppBar className={classes.appBar}>
			<Toolbar>
				<IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
					<CloseIcon />
				</IconButton>
				<Typography variant="h6" className={classes.title}>
					Saved versions
				</Typography>
			</Toolbar>
		</AppBar>
		{root && <TreeView
			root={root}
			width={width}
			height={height}
			apiRoot={apiRoot}
			onLoadVersion={onLoadVersion}
			onDeleteVersion={onDeleteVersion}
			parentId={parentId}
		/>}
	</Dialog>;
};
