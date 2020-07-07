"use strict";
import * as THREE from './build/three.module.js'

export function generate_orbit_geometry(buffer, min, max){
  const line_geometry = new THREE.BufferGeometry();
  line_geometry.setAttribute('position', new THREE.BufferAttribute(buffer, 3));

  return line_geometry;
}

export function generate_orbit_mesh(line_geometry, color){
  const line_material = new THREE.LineDashedMaterial({
    color: color,
    dashSize: 3,
    gapSize: 100,
  });

  const line_mesh = new THREE.Line(line_geometry, line_material);

  return line_mesh;
}
