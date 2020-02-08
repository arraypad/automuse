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
import Tree from 'react-d3-tree';

const useStyles = makeStyles(theme => ({
	appBar: {
		position: 'relative',
	},
	title: {
		marginLeft: theme.spacing(2),
		flex: 1,
	},
}));

const Transition = React.forwardRef(function Transition(props, ref) {
	return <Slide direction="up" ref={ref} {...props} />;
});

class VersionLabel extends React.PureComponent {
	render() {
		const { nodeData: { attributes }, onLoadVersion, apiRoot } = this.props;
		return <div key={attributes.id}>
			<a style={{
					display: 'block',
					border: '1px solid #666',
					zIndex: 10,
				}}
				onClick={() => onLoadVersion(attributes)}
			>
				<img src={`${apiRoot}/${attributes.image}`} style={{width: '100%'}} />
			</a>
		</div>;
	}
}

export default function LoadDialog({ open, handleClose, versions, width, height, apiRoot, onLoadVersion }) {
	const classes = useStyles();

	let root;
	if (versions.length) {
		const versionMap = {};
		for (const v of versions) {
			versionMap[v.id] = {attributes: v, children: []};
		}

		root = versionMap[versions[0].id];
		for (const [vId, v] of Object.entries(versionMap)) {
			if (vId === root.attributes.id) {
				continue;
			}

			versionMap[v.attributes.parentId].children.push(v);
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
		<div style={{width: `${width}px`, height: `${height}px`}}>
			{root &&
				<Tree
					data={root}
					orientation="vertical"
					allowForeignObjects
					nodeLabelComponent={{
						render: <VersionLabel onLoadVersion={onLoadVersion} apiRoot={apiRoot} />,
						foreignObjectWrapper: {},
					}}
					translate={{
						x: width / 2,
						y: height / 2,
					}}
				/>
			}
		</div>
	</Dialog>;
};
