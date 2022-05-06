
import { ProjectorApp } from './projector-app.js';
import './style.css'

const canvas = document.querySelector('canvas.viewer');

const app = new ProjectorApp({ canvasDomElement: canvas });
