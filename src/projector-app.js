import {
  Mesh,
  MeshPhongMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  Vector3
} from "three";
import * as dat from 'dat.gui';

import { GLTFLoader } from './three-helpers/gltfloader.js'

import { Viewer } from './viewer.js';
import { Projector } from './projector.js';

import ProjectLightsFragmentBegin from './shaders/projector-lights-fragment-begin.glsl.js'

import trianglesImageSrc from '../static/triangles.jpg'
import skyscraperMeshSrc from '../static/skyscraper.glb'

export class ProjectorApp {
  _viewer;

  _projector;

  _gui;

  _projectorMaterials;

  constructor({ canvasDomElement }) {
    this._viewer = new Viewer({ canvasDomElement });

    this._projectorMaterials = [];

    this.initProjector(trianglesImageSrc);
    this.initScene();

    this.initGui();

    this._viewer.update();
  }

  initScene() {
    const planeWidth = 25;
    const planeHeight = 25;

    const sceneNode = new Object3D();

    // Planes

    const planeGeometry = new PlaneGeometry(planeWidth, planeHeight, 1, 1);
    const planeWhiteMaterial = this.createProjectorMaterial(0xffffff);
    this._projectorMaterials.push(planeWhiteMaterial);

    const planeFloor = new Mesh(planeGeometry, planeWhiteMaterial);
    planeFloor.rotateX(-Math.PI / 2);
    planeFloor.receiveShadow = true;
    sceneNode.add(planeFloor);

    const planeRear = new Mesh(planeGeometry, planeWhiteMaterial);
    planeRear.position.z = -planeHeight / 2;
    planeRear.position.y = planeHeight / 2;
    planeRear.receiveShadow = true;
    sceneNode.add(planeRear);

    const planeLeft = new Mesh(planeGeometry, planeWhiteMaterial);
    planeLeft.rotateY(Math.PI / 2);
    planeLeft.position.x = -planeWidth / 2;
    planeLeft.position.y = planeHeight / 2;
    planeLeft.receiveShadow = true;
    sceneNode.add(planeLeft);

    const planeRight = new Mesh(planeGeometry, planeWhiteMaterial);
    planeRight.rotateY(-Math.PI / 2);
    planeRight.position.x = planeWidth / 2;
    planeRight.position.y = planeHeight / 2;
    planeRight.receiveShadow = true;
    sceneNode.add(planeRight);

    const sphereGeometry = new SphereGeometry(1, 20, 20);
    const sphereMaterial = this.createProjectorMaterial(0x44aa88);
    const sphere = new Mesh(sphereGeometry, sphereMaterial);
    sphere.position.y = 1;
    sphere.castShadow = true;

    // Sphere

    sceneNode.add(sphere);
    this._projectorMaterials.push(sphereMaterial);

    // Mesh

    const loader = new GLTFLoader();
    loader.load(skyscraperMeshSrc, (gltf) => {
      const meshMaterial  = this.createProjectorMaterial(0xcccccc);

      meshMaterial.map = gltf.scene.children[0].material.map;

      gltf.scene.children[0].material = meshMaterial;
      gltf.scene.children[0].castShadow = true;
      gltf.scene.children[0].receiveShadow = true;
      gltf.scene.position.set(4, 5.25, -3);
      gltf.scene.scale.set(3, 3 ,3);

      sceneNode.add(gltf.scene);

      this._projectorMaterials.push(meshMaterial);

      this._viewer.update();
    });

    this._viewer.addSceneObject(sceneNode);
  }

  createProjectorMaterial(colour) {
    // Create a material for an object that receives light from a projector.
    // Three spotlights don't support projecting textures, so we patch the MeshPhongMaterial using
    // onBeforeCompile to include it.
    // It's a hacky solution, but it does mean that the rest of the material functionality is retained.

    const projectorMaterial = new MeshPhongMaterial({ color: colour });

    projectorMaterial.userData.spotLightMap = { value: this._projector.imageTexture };
    projectorMaterial.userData.spotLightMapEnabled = { value: true };

    projectorMaterial.onBeforeCompile = (material) => {
      material.uniforms.spotLightMap = projectorMaterial.userData.spotLightMap;
      material.uniforms.spotLightMapEnabled = projectorMaterial.userData.spotLightMapEnabled;

      material.fragmentShader = [
        'uniform sampler2D spotLightMap;',
        'uniform bool spotLightMapEnabled;',
        material.fragmentShader
      ].join('\n');

      material.fragmentShader = material.fragmentShader.replace(
        '#include <lights_fragment_begin>',
        ProjectLightsFragmentBegin
      );
    }

    return projectorMaterial;
  }

  initProjector(imageUrl) {
    this._projector = new Projector({
      colour: 0xffffff,
      position: new Vector3(-8, 5, 10),
      target: new Vector3(0, 3, 0),
      angle: Math.PI / 6,
      imageUrl
    });

    this._viewer.addSceneObject(this._projector.getSceneNode());
    this._viewer.setTransformableObject(this._projector._light);

    this._viewer.addBeforeRenderAction(() => { this._projector.update(); });
  }

  initGui() {
    this._gui = new dat.GUI();

    const params = {
      'Projector colour': this._projector.colour.getHex(),
      'Projector image': true,
      'Projector gizmo': true,
      Intensity: this._projector.intensity,
      Angle: this._projector.angle,
      Distance: this._projector.distance,
      Penumbra: this._projector._light.penumbra,
      Decay: this._projector._light.decay
    };

    this._gui.addColor(params, 'Projector colour').onChange(c => {
      this._projector.colour.setHex(c);
      this._viewer.update();
    });

    this._gui.add(params, 'Projector image').onChange(enabled => {
      this.setProjectorImageEnabled(enabled);
      this._viewer.update();
    });

    this._gui.add(params, 'Projector gizmo').onChange(enabled => {
      this._viewer.setTransformGizmoVisibility(enabled);
      this._viewer.update();
    });

    this._gui.add(params, 'Intensity', 0, 3).onChange(intensity => {
      this._projector.intensity = intensity;
      this._viewer.update();
    });

    this._gui.add(params, 'Angle', 0, Math.PI / 3).onChange(angle => {
      this._projector.angle = angle;
      this._viewer.update();
    });

    this._gui.add(params, 'Distance', 10, 100).onChange(distance => {
      this._projector.distance = distance;
      this._viewer.update();
    });

    this._gui.add(params, 'Penumbra', 0, 1).onChange(penumbra => {
      this._projector._light.penumbra = penumbra;
      this._viewer.update();
    });

    this._gui.add(params, 'Decay', 1, 5).onChange(decay => {
      this._projector._light.decay = decay;
      this._viewer.update();
    });

    this._gui.open();
  }

  setProjectorImageEnabled(enabled) {
    this._projectorMaterials.forEach(material => {
      material.userData.spotLightMapEnabled.value = enabled
    })
  }
}
