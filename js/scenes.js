"use strict";
import * as THREE from './build/three.module.js'
import * as BOSON_UTIL from './util.js'
import * as BOSON_ORBIT from './orbit.js';

import { FBXLoader } from './util/jsm/loaders/FBXLoader.js';
import { OrbitControls } from './util/jsm/controls/OrbitControls.js';

export const NONE = -1;
export const STYLE = 0;
export const DEFAULT = 1;
export const DEFAULT2 = 2;

const current_state = {scene: null, camera: null, update: null, celestial_origin: null, type: -1};

const scene_manager = {
  style: {scene: [], camera: [], body: [], update: null, type: STYLE},
  default: {scene: [], camera: [], body: [], update: null, type: DEFAULT},
  none: {scene: [], camera: [], body: [], update: null, type: DEFAULT2}
}

const renderer = new THREE.WebGLRenderer({antialias: true, sortObjects : false});
var controls = null;

const orbit_geometry_manager = {}

function get_scene(type){
  for(const key of Object.keys(scene_manager)){
    const scene = scene_manager[key];
    if(scene.type === type){
      return scene;
    }
  }
  return null;
}

export function switch_scene(new_type){
  const current_type = current_state.type;
  const new_scene = get_scene(new_type);
  if(new_scene === null){
    return;
  }

  const old_scene = get_scene(current_type);
  if(old_scene !== null){
    for(const obj of old_scene.scene){
      current_state.scene.remove(obj);
    }
    for(const obj of old_scene.camera){
      current_state.camera.remove(obj);
    }
    for(const obj of old_scene.body){
      current_state.celestial_origin.remove(obj);
    }
  }

  for(const obj of new_scene.camera){
    current_state.camera.add(obj);
  }

  for(const obj of new_scene.scene){
    current_state.scene.add(obj);
  }
  for(const obj of new_scene.body){
    current_state.celestial_origin.add(obj);
  }

  current_state.type = new_type;
  current_state.update = new_scene.update;
  console.log(current_state);
}

function create_none_scene(){
  scene_manager.none.update = function(){};
  scene_manager.none.scene.push(new THREE.AmbientLight(0xffffff, 1));
}

function update_style_scene(scene){

}

function create_style_earth_scene(){
  scene_manager.style.update = update_style_scene;

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const material = new THREE.MeshPhongMaterial({
    color       : 0x373030,
    //map         : load_tex('res/diffuse_16k.jpg'),
    //bumpMap     : load_tex('res/elev_bump_8k.jpg'),
    //bumpScale   : .01,
    //specularMap : load_tex('res/water_16k_inv.png'),
    shininess   : 1,
    alphaMap    : BOSON_UTIL.load_tex('res/water_16k.png'),
    alphaTest   : .5,
    //transparent : true,
    //side        : THREE.DoubleSide,
    depthWrite  : true,
    //opacity     : 1,
    blending    : THREE.NoBlending
  });
  const earthMesh = new THREE.Mesh(geometry, material);

  const materialInner = new THREE.MeshPhongMaterial({
    color       : 0x090505,
    //map         : load_tex('res/diffuse_16k.jpg'),
    //bumpMap     : load_tex('res/elev_bump_8k.jpg'),
    //bumpScale   : .01,
    specularMap : BOSON_UTIL.load_tex('res/water_16k.png'),
    shininess   : 20,
    alphaMap    : BOSON_UTIL.load_tex('res/water_16k.png'),
    alphaTest   : .5,
    transparent : true,
    side        : THREE.BackSide,
    depthWrite  : false,
    depthTest   : true,
    opacity     : 1,
    blending    : THREE.NoBlending


  });
  const earthMeshInner = new THREE.Mesh(geometry, materialInner);

  //earthMesh.add(cloudMesh)
  earthMeshInner.add(earthMesh);
  scene_manager.style.body.push(earthMeshInner);


  const pointLight = new THREE.PointLight(0xffffee, .9, 8);
  scene_manager.style.camera.push(pointLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene_manager.style.scene.push(ambientLight);
}

function update_earth(scene){
  const earth = scene.getObjectByName("earth");
  const clouds = earth.children[0];
  clouds.rotation.y -= .0002;
  clouds.rotation.z -= .0001;
}

function create_earth_scene(){
  scene_manager.default.update = update_earth;

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const material = new THREE.MeshPhongMaterial({
    map         : BOSON_UTIL.load_tex('res/diffuse_16k.jpg'),
    bumpMap     : BOSON_UTIL.load_tex('res/elev_bump_16k.jpg'),
    bumpScale   : .02,
    specularMap : BOSON_UTIL.load_tex('res/water_16k_inv.png'),
    shininess   : 100
  });

  const earthMesh = new THREE.Mesh(geometry, material);
  earthMesh.name = "earth";

  const cloud_geometry  = new THREE.SphereGeometry(1.015, 64, 64);
  const cloud_material  = new THREE.MeshPhongMaterial({
    map         : BOSON_UTIL.load_tex('res/africa_clouds_8k.jpg'),
    alphaMap		: BOSON_UTIL.load_tex('res/africa_clouds_8k.jpg'),
    side        : THREE.DoubleSide,
    opacity     : .7,
    transparent : true,
    depthWrite  : false,
  });
  const cloudMesh = new THREE.Mesh(cloud_geometry, cloud_material)
  earthMesh.add(cloudMesh)
  scene_manager.default.body.push(earthMesh);

  const point = new THREE.PointLight(0xffffee, 1, 10);
  point.position.set(2, 2, 2);
  scene_manager.default.scene.push(point);

  const ambient = new THREE.AmbientLight(0x404040, 1);
  scene_manager.default.scene.push(ambient);
}

export function create_scene(dom){
  renderer.setSize(dom.offsetWidth, dom.offsetHeight);
  dom.appendChild(renderer.domElement);
  current_state.scene = new THREE.Scene();
  current_state.camera = new THREE.PerspectiveCamera(90, dom.offsetWidth / dom.offsetHeight, .01, 1000);

  controls = new OrbitControls(current_state.camera, renderer.domElement);
  current_state.camera.position.set(0, 0, 1.5);
  controls.update();
  current_state.scene.add(current_state.camera);

  current_state.celestial_origin = new THREE.Object3D();
  //current_state.celestial_origin.rotation.z = THREE.MathUtils.degToRad(10.3);
  current_state.scene.add(current_state.celestial_origin);

  current_state.scene.add(new THREE.AxisHelper(1.1));

  create_none_scene();
  create_earth_scene();
  create_style_earth_scene();
  switch_scene(STYLE);
}

export function update(){
  current_state.update(current_state.scene);
  controls.update();
  renderer.render(current_state.scene, current_state.camera);

}

export function on_resize(dom){
  current_state.camera.aspect = dom.offsetWidth / dom.offsetHeight;
  current_state.camera.updateProjectionMatrix();
  renderer.setSize( dom.offsetWidth, dom.offsetHeight );
}

export function create_orbit(name, position_buffer, color){
  BOSON_UTIL.load_model('res/model/Satellite/satellite_tex.fbx', current_state.celestial_origin, "satellite_" + name, color);
  orbit_geometry_manager[name] = BOSON_ORBIT.generate_orbit_geometry(position_buffer);
  orbit_geometry_manager[name].setDrawRange(0, 0);
  const orbit_mesh = BOSON_ORBIT.generate_orbit_mesh(orbit_geometry_manager[name], color);
  orbit_mesh.name = "orbit_" + name;
  orbit_mesh.visible = false;
  current_state.celestial_origin.add(orbit_mesh);
}

export function set_earth_rotation(seconds){
  const percent = seconds / 86400;  //thats how many seconds in a day
  const rad = percent * 3.14159 * 2;

  current_state.celestial_origin.rotation.y = -rad;
}

export function set_orbit_draw_range(name, start, length){
  orbit_geometry_manager[name].setDrawRange(start, length);

}

export function set_satellite_pos(name, pos, vel){


  const object = current_state.scene.getObjectByName("satellite_" + name);

  if(Number.isNaN(pos.x)){
    object.visible = false;
    return;
  }
  object.visible = true;

  const pos_vec = new THREE.Vector3(pos.x, pos.y, pos.z);
  const vel_vec = new THREE.Vector3(vel.x, vel.y, vel.z).applyMatrix4(current_state.celestial_origin.matrix);

  object.position.set(pos_vec.x, pos_vec.y, pos_vec.z);
  object.lookAt(0, 0, 0);
  const torus = object.children[2];

  torus.lookAt(vel_vec);
  torus.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), 3.14159/2);
}

export function remove_satellite(name){
  const satellite = current_state.celestial_origin.getObjectByName("satellite_" + name);
  const orbit = current_state.celestial_origin.getObjectByName("orbit_" + name);
  current_state.celestial_origin.remove(satellite);
  current_state.celestial_origin.remove(orbit);
  delete orbit_geometry_manager[name];
}

export function toggle_orbit_trail(name){
  console.log(name);
  const orbit_mesh = current_state.scene.getObjectByName("orbit_" + name);
  orbit_mesh.visible = !orbit_mesh.visible;
}
