<script setup lang="ts">

import { ref, onMounted, shallowRef } from 'vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';


const customCanvas = shallowRef<HTMLCanvasElement | null>(null)
const canvasContainer = shallowRef<HTMLDivElement | null>(null)

const threeData: {scene: THREE.Scene, camera: THREE.Camera, raycaster: THREE.Raycaster, renderer: THREE.WebGLRenderer | null} = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(),
  raycaster: new THREE.Raycaster(),
  renderer: null,
}

const sceneData: {cube: THREE.Mesh[], pointer: THREE.PointLight, plane: THREE.Mesh} = {
  cube: [],
  pointer: new THREE.PointLight( 0xff0000, 10000),
  plane: new THREE.Mesh( new THREE.PlaneGeometry(10, 10), new THREE.MeshPhongMaterial( { color: 0x0000ff } ) )

}
const pointer = new THREE.Vector2();

const bgGeometry = new THREE.SphereGeometry(0.5)
const bgMesh = new THREE.Mesh(bgGeometry, new THREE.MeshBasicMaterial({color: 0xffffff}))
bgMesh.position.set(0, 0, 0)

const axesHelper = new THREE.AxesHelper(1);
threeData.scene.add(axesHelper);

onMounted(() => {
  threeData.scene = new THREE.Scene();

  let w = canvasContainer.value!.offsetWidth;
  let h = canvasContainer.value!.offsetHeight;
  console.log(w, h, canvasContainer.value!.getBoundingClientRect())
  const aspectRatio = w / h;
  const near = 0.1;
  const far = 1000;

  threeData.camera = new THREE.PerspectiveCamera(
    25,  // Field of view
    aspectRatio,
    near,  // Near plane
    far  // Far plane

  )

  threeData.renderer = new THREE.WebGLRenderer( { canvas: customCanvas.value!, antialias: true } );
  threeData.renderer.setSize(w, h);
  threeData.renderer.setPixelRatio(window.devicePixelRatio);


  const loader = new FontLoader();
  let geometry: TextGeometry;

  loader.load( './public/font.json', function ( font ) {
      console.log(font)
      geometry = new TextGeometry( 'Ben Halstead', {
          font: font,
      } );

    const material = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
    const cube = new THREE.Mesh( geometry, material );
    cube.scale.set(0.02, 0.02, 0.02)
    cube.position.set(-8, -0.75, 0)
    threeData.scene.add( cube );
    sceneData.cube.push(cube)

  } );
  threeData.scene.add( new THREE.AmbientLight( 0x404040, 1) );

  sceneData.plane.position.z = -1;
  // threeData.scene.add( sceneData.plane );

  // threeData.scene.add( sceneData.pointer );
  const light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position.set( 10, 10, 15 );
  light.castShadow = true;
  sceneData.pointer.castShadow = true;
  threeData.scene.add( light );
  threeData.scene.add(bgMesh);


  threeData.camera.position.z = 30;

  customCanvas.value!.addEventListener( 'mousemove', onPointerMove );
  let controls = new OrbitControls( threeData.camera, threeData.renderer.domElement );
  requestAnimationFrame(animate)
}
)

function animate() {
  
  threeData.raycaster.setFromCamera( pointer, threeData.camera );

  const intersections = threeData.raycaster.intersectObjects( [sceneData.plane], false );
  let intersection = ( intersections.length ) > 0 ? intersections[ 0 ] : null;
  if ( intersection ) {
    let p: {x: number, y: number, z: number} = {
      x: intersection.point.x,
      y: intersection.point.y,
      z: intersection.point.z + 1.0,
    }
    sceneData.pointer.position.copy( p );
  }

  threeData.renderer!.render(threeData.scene, threeData.camera)
  requestAnimationFrame(animate)
}

function onPointerMove( event: MouseEvent ) {
  pointer.x = ( event.offsetX / customCanvas.value!.width ) * 2 - 1;
  pointer.y = - ( event.offsetY / customCanvas.value!.height) * 2 + 1;
}

console.log('test')

</script>

<template>
  <div flex="~ col" w="min" border="~ main rounded-md" ref="canvasContainer"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
    <canvas ref="customCanvas" id='test' style="width: 100%; height: 100%;">
    </canvas>
  </div>
</template>
