"use strict";

import * as THREE from './build/three.module.js'


import * as BOSON_RENDER from './cesium_scene.js';
import * as BOSON_UTIL from './util.js';
import * as BOSON_ORBIT from './orbit.js';
import * as BOSON_EPHEMERIS from './ephemeris.js';
import * as BOSON_TARGETS from './targets.js';

const current_simulations = {};

class Sensor {
  constructor(name, type, min_value, max_value){
    this._sensor_type = type;
    this._min_value = min_value;
    this._max_value = max_value;

    BOSON_RENDER.create_sensor(name, type, min_value, max_value);
  }
  get sensor_type(){
    return this._sensor_type;
  }

  get min_value() {
    return this._min_value;
  }
  get max_value() {
    return this._max_value;
  }
}

class Satellite {
  constructor(name, id, color, ephemeris){
    this._name = name;
    this._id = id;
    this._sensor = null;

    BOSON_RENDER.create_orbit(name, ephemeris, color);

    this.color = color;
    this.orbit_trail = BOSON_RENDER.ALL;
  }

  get name() { return this._name }

  get id() { return this._id }

  get color() { return this._color }
  set color(new_color) {
    BOSON_RENDER.set_satellite_color(this.name, new_color);
    if(this._sensor)
      BOSON_RENDER.set_sensor_color(this.name, this.sensor.sensor_type, new_color);
    this._color = new_color;
  }

  get orbit_trail(){ return this._orbit_trail }
  set orbit_trail(trail_type){
    if(trail_type === "all") trail_type = BOSON_RENDER.ALL;
    else if(trail_type === "one_rev") trail_type = BOSON_RENDER.ONE_REV;
    else if(trail_type === "none") trail_type = BOSON_RENDER.NONE;
    else if(typeof trail_type !== "number") return; //invalid input

    BOSON_RENDER.set_orbit_trail(this.name, trail_type);
    this._orbit_trail = trail_type;
  }

  get sensor(){
    return this._sensor;
  }
  set sensor(sensor){
    if(sensor instanceof Sensor){
      this._sensor = sensor;
      this.color = this._color; //force sensor to change color
    }
  }

  update(){
    BOSON_RENDER.update_satellite(this.name);
  }
}

function get_by_platform_id(id){
  for(const satellite of Object.values(current_simulations)){
    if(satellite.id === id){
      return satellite;
    }
  }

  return null;
}

function init(dom){
  BOSON_RENDER.create_scene(dom);

  function animate(){
    requestAnimationFrame(animate)
    updateTime();
    BOSON_RENDER.update();
  }

  function updateTime(){
    for(const satellite of Object.values(current_simulations)){
      satellite.update();
    }
  }
  animate();
}

export async function import_data(name, id=-1){
  const color = "#fff";
  const ephemeris = BOSON_EPHEMERIS.get_ephemeris(name);
  current_simulations[name] = new Satellite(name, parseInt(id), color, ephemeris);
}

export function remove_simulation(names){
  for(const name of names){
    BOSON_RENDER.remove_satellite(name);
    delete current_simulations[name];
  }
}

export function import_sensor(sensor_parameter){
  const satellite = get_by_platform_id(sensor_parameter.platformID);

  const name = satellite.name;
  const type = sensor_parameter.sensorType;
  const min = sensor_parameter.minValue;
  const max = sensor_parameter.maxValue;

  satellite.sensor = new Sensor(name, type, min, max);
  console.log(satellite.sensor);
}

export async function import_target_set(name){
  const target_set = BOSON_TARGETS.get_target_set(name);
  BOSON_RENDER.draw_all_targets(name, target_set);
}

export function delete_target_set(name){
  BOSON_RENDER.remove_target_set(name);
}


export function set_orbit_trail(names, value){
  for(const name of names){
    current_simulations[name].orbit_trail = value;
  }
}

export function set_satellite_color(name, css_color){
  current_simulations[name].color = css_color;
}

export function set_target_color(name, css_color){
  BOSON_RENDER.set_target_color(name, css_color);
  BOSON_RENDER.select_target(name, "D1");
  BOSON_RENDER.select_target(name, "D3");
  BOSON_RENDER.select_target(name, "D123123123");
}

export function set_select_target_color(name, css_color){
  BOSON_RENDER.set_select_target_color(name, css_color);
}

init(document.getElementById("view"));
