import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import Divider from '@material-ui/core/Divider';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import Slide from '@material-ui/core/Slide';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import AppBar from '@material-ui/core/AppBar';
import Tooltip from '@material-ui/core/Tooltip';
import { hierarchy as d3hierarchy, tree as d3tree } from 'd3-hierarchy';
import clsx from 'clsx';
import {
  INITIAL_VALUE,
  ReactSVGPanZoom,
  POSITION_NONE,
} from 'react-svg-pan-zoom';

const nodeWidth = 100;
const nodeHeight = 100;
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
	node: {
		cursor: 'hand',
		display: 'block',
		width: nodeWidth,
		height: nodeHeight,
		background: '#fff',
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'center',
		border: '1px solid #bbb',
		'&:hover': {
			border: '1px solid #000',
		},
	},
	active: {
		cursor: 'auto',
		border: '1px solid #000',
	},
}));


const Transition = React.forwardRef(function Transition(props, ref) {
	return <Slide direction="up" ref={ref} {...props} />;
});

function VersionLabel({ data, apiRoot, onLoadVersion, active }) {
	const classes = useStyles();

	return <Tooltip key={data.id} title={data.id}>
		<a 
			className={clsx(classes.node, active && classes.active)}
			onClick={() => onLoadVersion(data)}
			style={{
				backgroundImage: `url(${apiRoot}/${data.image})`,
				backgroundSize: 'contain',
			}}
		>
		</a>
	</Tooltip>;
}

function TreeView({ root, width, height, apiRoot, onLoadVersion, parentId }) {
	const classes = useStyles();

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

		nodes.push(<foreignObject
			key={`node-${i}`}
			x={lx}
			y={ty}
			width={nodeWidth}
			height={nodeHeight}
		>
			<VersionLabel
				data={d.data}
				apiRoot={apiRoot}
				onLoadVersion={onLoadVersion}
				active={d.data.id === parentId}
			/>
		</foreignObject>);

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

	return <ReactSVGPanZoom
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
		background="#fff"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
			viewBox={viewBox.join(' ')}
		>
			<g>
				{nodes}
				{paths}
			</g>
		</svg>
	</ReactSVGPanZoom>;
}

export default function LoadDialog({ open, handleClose, versions, width, height, apiRoot, onLoadVersion, parentId }) {
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
			parentId={parentId}
		/>}
	</Dialog>;
};
