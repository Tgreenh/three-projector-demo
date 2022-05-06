import {
  DirectionalLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "./three-helpers/orbitcontrols.js";
import { TransformControls } from "./three-helpers/transformcontrols.js";

export class Viewer {
  _renderer;
  _scene;

  _width;
  _height;

  _camera;
  _controls;

  _transformControls;

  _beforeRenderActions;

  constructor({ canvasDomElement }) {
    this._renderer = new WebGLRenderer({ canvas: canvasDomElement });
    this._renderer.setClearColor(0xaaaaaa);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = PCFSoftShadowMap;
    this._renderer.outputEncoding = sRGBEncoding;

    this._width = canvasDomElement.clientWidth;
    this._height = canvasDomElement.clientHeight;

    // Camera

    const fov = 45;
    const aspect = 4/3;
    const near = 0.1;
    const far = 500;
    this._camera = new PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.y = 20;
    this._camera.position.z = 40;

    // Scene

    this._scene = new Scene();

    // Lights

    const directionalLight = new DirectionalLight(0xffffff, 0.1);
    directionalLight.position.set(1, 2, 4);
    this._scene.add(directionalLight);

    // Controls

    this._controls =  new OrbitControls(this._camera, canvasDomElement);

    this._transformControls = new TransformControls(this._camera, canvasDomElement);
    this._scene.add(this._transformControls);

    this._beforeRenderActions = [];

    this._addEventListeners();
  }

  _addEventListeners() {
    this._controls.addEventListener('change', () => this.update());

    this._transformControls.addEventListener('change', () => this.update());
    this._transformControls.addEventListener('dragging-changed', (event) => {
      this._controls.enabled = !event.value;
    });

    window.addEventListener('resize', () => this.update());

    window.addEventListener('keydown', (e) => { this.update() });
  }

  static resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;

    this._width = width;
    this._height = height;

    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  addBeforeRenderAction(action) {
    this._beforeRenderActions.push(action);
  }

  addSceneObject(sceneObject) {
    this._scene.add(sceneObject);
  }

  setTransformableObject(sceneObject) {
    this._transformControls.attach(sceneObject);
  }

  setTransformGizmoVisibility(visible) {
    this._transformControls.visible = visible;
  }

  setTransformGizmoMode(mode) {
    this._transformControls.setMode(mode);
  }

  _render() {
    if (Viewer.resizeRendererToDisplaySize(this._renderer)) {
      const canvas = this._renderer.domElement;

      this._camera.aspect = canvas.clientWidth / canvas.clientHeight;
      this._camera.updateProjectionMatrix();
    }

    this._renderer.render(this._scene, this._camera);
  }

  update() {
    this._beforeRenderActions.forEach(action => { action(); });

    this._render();
  }
}
