let audioContext;
let audioElement;
let htmlElement;
let renderer;
let visualScene;
let camera;
let mesh;
let isCursorDown = false;
let screenPercentToHorizontalAngleSpeed = 90;
let screenPercentToVerticalAngleSpeed = 90;
let azimuth = 0;
let elevation = 0;
let clickTime = 0;
let audioScene;
let source;
let dimensions = {
  width: 10, height: 7, depth: 10,
};
let materials = {
  left: 'uniform', right: 'uniform',
  front: 'uniform', back: 'uniform',
  up: 'uniform', down: 'uniform',
};
let defaultSourceRadius = 3;
let alphaInit = 0;
let betaInit = 0;
let gammaInit = 0;
let lastMatrixUpdate = 0;
let audioReady = false;

let prevTime = performance.now();
const rotateSpeed = 1;
/**
 * @private
 */
function animate() {
  let currTime = performance.now();
  let deltaTime = (currTime - prevTime) / 1000;
  prevTime = currTime;

  mesh.rotation.x += rotateSpeed * deltaTime;
  mesh.rotation.y += rotateSpeed * deltaTime;

  renderer.render(visualScene, camera);
}

let isFullscreen = false;
/**
 * @private
 */
function resize() {
  let width = htmlElement.parentNode.clientWidth;
  let height = htmlElement.parentNode.clientHeight;
  if (!isFullscreen) {
    height = width;
  }
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

/**
 * @private
 */
function initAudio() {
  // Create audio scene.
  audioContext = new (window.AudioContext || window.webkitAudioContext);
  audioScene = new ResonanceAudio(audioContext, {
    ambisonicOrder: 3,
    dimensions: dimensions,
    materials: materials,
  });
  source = audioScene.createSource();
  audioElement = document.createElement('audio');
  audioElement.src = 'https://s3.amazonaws.com/bose-ar/cube-sound.wav';
  audioElement.crossOrigin = 'anonymous';
  audioElement.load();
  audioElement.loop = true;
  audioElementSource =
    audioContext.createMediaElementSource(audioElement);
  audioElementSource.connect(source.input);
  audioScene.output.connect(audioContext.destination);
  source.setPosition(mesh.position.x, mesh.position.y, mesh.position.z);
  audioReady = true;
}

let onLoad = function() {
  htmlElement = document.getElementById('renderer');

  // Construct the 3D scene.
  visualScene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  camera.position.set(0, 0, 0);

  let room = new THREE.Mesh(
    new THREE.BoxGeometry(
      dimensions.width, dimensions.height, dimensions.depth),
    new THREE.MeshPhongMaterial({
      side: THREE.BackSide,
    })
  );
  visualScene.add(room);

  let cameraLight = new THREE.PointLight(0xffffff, 0.9, 100);
  cameraLight.position.set(camera.position.x, camera.position.y,
    camera.position.z);
    visualScene.add(cameraLight);

  let ceilingLight = new THREE.DirectionalLight(0xffffff, 0.5);
  ceilingLight.position.set(0, 1, 0);
  visualScene.add(ceilingLight);

  mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({
      color: 0xff0000,
    })
  );
  mesh.position.set(0, 0, -1 * defaultSourceRadius);
  visualScene.add(mesh);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  htmlElement.appendChild(renderer.domElement);

  renderer.animate(animate);

  resize();

  let button = document.getElementById('sourceButton');
  let buttonContainer = document.getElementById('buttonContainer');
  let goFullscreenIcon = document.getElementById('goFullscreenIcon');
  let exitFullscreenIcon = document.getElementById('exitFullscreenIcon');
  button.addEventListener('click', function(event) {
    switch (event.target.textContent) {
      case 'Go Fullscreen': {
        if (!audioReady) {
          initAudio();
        }
        audioElement.play();
        button.textContent = 'Exit Fullscreen';
        htmlElement.parentNode.className = 'fullscreen';
        buttonContainer.className = 'fullscreenContainer';
        goFullscreenIcon.hidden = true;
        exitFullscreenIcon.hidden = false;
        let buttonContainerWidth = buttonContainer.clientWidth;
        buttonContainer.style.marginLeft =
          '-' + buttonContainerWidth / 2 + 'px';
        isFullscreen = true;
        resize();
      }
      break;
      case 'Exit Fullscreen': {
        button.textContent = 'Go Fullscreen';
        audioElement.pause();
        htmlElement.parentNode.className = '';
        buttonContainer.className = '';
        goFullscreenIcon.hidden = false;
        exitFullscreenIcon.hidden = true;
        buttonContainer.style.marginLeft = '0px';
        isFullscreen = false;
        resize();
      }
    }
  });
  window.addEventListener('resize', function(event) {
    resize();
  }, false);
};
window.addEventListener('load', onLoad);
