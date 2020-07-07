"use strict";
import * as THREE from './build/three.module.js'
// import { FBXLoader } from './util/jsm/loaders/FBXLoader.js';

export function rotateAboutPoint(obj, point, axis, theta){
  obj.position.sub(point);
  obj.position.applyAxisAngle(axis, theta);
  obj.position.add(point);
  obj.rotateOnAxis(axis, theta);
}

export function load_tex(url){
  const tex = THREE.ImageUtils.loadTexture(url);
  //tex.anisotropy = renderer.getMaxAnisotropy();
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.magFilter = THREE.LinearMipMapLinearFilter;
  return tex;
}

export function load_model(src, parent, name, color){
  const loader = new FBXLoader();
  loader.load(src,
    function(object){
      console.log('object');
      object.rotation.set(0, -3.1415/2, 0);
      object.scale.set(.00005, .00005, .00005);
      //object.position.set(0, 0, -1.1);

      const height = .099;
      const cone_geometry = new THREE.ConeGeometry(.05, height, 20, 1);
      const cone_material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        opacity: .3,
        transparent: true,
      });
      const cone_mesh = new THREE.Mesh(cone_geometry, cone_material);
      cone_mesh.position.z = height/2;
      cone_mesh.rotation.set(-3.1415 / 2, 0, 0);

      const torus_rad = 1.1;
      const torus_geometry = new THREE.TorusGeometry(torus_rad, .002, 10, 100);
      const torus_material = new THREE.MeshBasicMaterial({
        color: color,
        // opacity: .8,
        // transparent: false
      });
      const torus_mesh = new THREE.Mesh(torus_geometry, torus_material);

      torus_mesh.position.z = torus_rad;
      torus_mesh.rotation.y = 3.1415 / 2;

      const satellite = new THREE.Object3D();
      satellite.name = name;
      satellite.add(cone_mesh);
      satellite.add(object);
      satellite.add(torus_mesh)

      parent.add(satellite);
    }
  );
}

export function get_max(buffer){
  return buffer.reduce((max, v) => max >= v ? max : v, -Infinity);
}

export function get_min(buffer){
  return buffer.reduce((min, v) => min < v ? min : v, Infinity);
}
