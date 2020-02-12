import * as THREE from 'three';

export const config = {
	width: 600,
	height: 600,
	ambientColor: 0x000000,
	clearColor: 0xF58723,
	meshColor: 0xFFFFFF,
	point: {
		color: 0xFFFFFF,
		intensity: 3.0,
		position: new THREE.Vector3(0, 5, 5),
	},
	rotation: {
		start: new THREE.Euler(0, 0, 0),
		speed: new THREE.Euler(0.01, 0, 0.01),
	},
};

export class Sketch {
	constructor({ width, height, document, container }) {
		this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
		this.camera.position.set(0, 0, 2);
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));

		this.scene = new THREE.Scene();

		this.point = new THREE.PointLight(
			config.point.color,
			config.point.intensity,
		);
		this.point.position.copy(config.point.position);
		this.scene.add(this.point);

		this.ambient = new THREE.AmbientLight(config.ambientColor);
		this.scene.add(this.ambient);

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setClearColor(config.clearColor, 1.0);
		this.renderer.setSize(width, height);
		container.appendChild(this.renderer.domElement);

		this.mesh = new THREE.Mesh(
			new THREE.BoxBufferGeometry(1, 1, 1),
			new THREE.MeshStandardMaterial({
				color: config.meshColor,
			}),
		);

		this.mesh.rotation.copy(config.rotation.start);
		this.scene.add(this.mesh);
	}

	destroy({ container }) {
		container.removeChild(this.renderer.domElement);
	}

	resize({ width, height }) {
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
	}

	capture(context) {
		this.render(context);
		return this.renderer.domElement;
	}

	animate() {
		this.mesh.rotation.x += config.rotation.speed.x;
		this.mesh.rotation.y += config.rotation.speed.y;
		this.mesh.rotation.z += config.rotation.speed.z;
	}

	render() {
		// update properties which aren't directly linked to config
		// (e.g. the constructor makes a copy)
		this.renderer.setClearColor(config.clearColor, 1.0);
		this.ambient.color.setHex(config.ambientColor);
		this.mesh.material.color.setHex(config.meshColor);
		this.point.color.setHex(config.point.color);
		this.point.intensity = config.point.intensity;
		this.point.position.copy(config.point.position);

		// render
		this.renderer.render(this.scene, this.camera);
	}
}
