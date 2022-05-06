import {
  CameraHelper,
  Object3D,
  SpotLight,
  SpotLightHelper,
  TextureLoader
} from "three";

export class Projector {
  _light

  _lightHelper
  _shadowHelper

  _sceneNode

  _imageUrl
  _imageTexture

  constructor({ colour = 0xffffff, position, target, angle, penumbra = 0.1, decay = 1.5, imageUrl }) {
    this._light = new SpotLight(colour);

    this._light.angle = angle;
    this._light.penumbra = penumbra;
    this._light.decay = decay;
    this._light.distance = 40;

    this._light.castShadow = true;

    this._light.shadow.mapSize.width = 1024;
    this._light.shadow.mapSize.height = 1024;
    this._light.shadow.camera.near = 1;
    this._light.shadow.camera.far = 50;
    this._light.shadow.focus = 1;

    this._light.position.copy(position);
    this._light.target = new Object3D();
    this._light.target.position.copy(target);

    this._lightHelper = new SpotLightHelper(this._light);
    this._shadowHelper = new CameraHelper(this._light.shadow.camera);

    this._sceneNode = new Object3D();
    this._sceneNode.add(this._light);
    this._sceneNode.add(this._light.target);
    this._sceneNode.add(this._lightHelper);
    this._sceneNode.add(this._shadowHelper);

    this._imageUrl = imageUrl;

    const textureLoader = new TextureLoader();
    this._imageTexture = textureLoader.load(this._imageUrl);
  }

  get colour() {
    return this._light.color;
  }

  set colour(colour) {
    this._light.color = colour;
  }

  get intensity() {
    return this._light.intensity;
  }

  set intensity(intensity) {
    this._light.intensity = intensity;
    }

  get angle() {
    return this._light.angle;
  }

  set angle(angle) {
    this._light.angle = angle;
  }

  get distance() {
    return this._light.distance;
  }

  set distance(distance) {
    this._light.distance = distance;
  }

  get imageTexture() {
    return this._imageTexture;
  }

  set targetObject(targetObject) {
    this._light.target = targetObject;
  }

  getSceneNode() {
    return this._sceneNode;
  }

  update() {
    this._lightHelper.update();
    this._shadowHelper.update();
  }
}
