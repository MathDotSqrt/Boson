"use strict";

import * as BOSON_RENDER from './cesium_scene.js';
import * as BOSON_EPHEMERIS from './ephemeris.js';
import * as BOSON_TARGETS from './targets.js';

import Schedule from './schedule.js'

const scene = new BOSON_RENDER.Scene(document.getElementById("view"));
const current_simulations = {};
const current_target_sets = {};
var current_schedule = null;

class Sensor {
  constructor(name, type, min_value, max_value){
    this._sensor_type = type;
    this._min_value = min_value;
    this._max_value = max_value;

    scene.appendSensor(name, type, min_value, max_value);
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

    scene.createOrbit(name, ephemeris, color);

    this.color = color;
    this.orbit_trail = BOSON_RENDER.ALL;
  }

  get name() { return this._name }

  get id() { return this._id }

  get color() { return this._color }
  set color(new_color) {
    scene.setOrbitColor(this.name, new_color);
    if(this._sensor)
      scene.setSensorColor(this.name, this.sensor.sensor_type, new_color);
    this._color = new_color;
  }

  get orbit_trail(){ return this._orbit_trail }
  set orbit_trail(trail_type){
    if(trail_type === "all") trail_type = BOSON_RENDER.ALL;
    else if(trail_type === "one_rev") trail_type = BOSON_RENDER.ONE_REV;
    else if(trail_type === "none") trail_type = BOSON_RENDER.NONE;
    else if(typeof trail_type !== "number") return; //invalid input

    scene.setOrbitTrail(this.name, trail_type);
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
    scene.updateSatellite(this.name);
  }
}

class TargetSet {
  constructor(name, color, selectColor){
    this._name = name;

    const target_set = BOSON_TARGETS.get_target_set(name);
    scene.createTargetPrimitive(name, target_set);

    this.color = color;
    this.selectColor = selectColor;

  }

  get name(){
    return this._name;
  }

  get color(){
    return this._color;
  }
  set color(color){
    scene.setTargetColor(this.name, color);
    this._color = color;
  }

  get selectColor(){
    return this._selectColor;
  }
  set selectColor(selectColor){
    scene.setTargetSelectColor(this.name, selectColor);
    this._selectColor = selectColor;
  }

  selectTargetByID(id){
    scene.selectTarget(this.name, id);
  }

  update(schedule){

  }
};

function get_by_platform_id(id){
  for(const satellite of Object.values(current_simulations)){
    if(satellite.id === id){
      return satellite;
    }
  }

  return null;
}

function init(){
  scene.addPreRenderEvent(updateTime);
}

function updateTime(seconds){
  for(const satellite of Object.values(current_simulations)){
    satellite.update();
  }

  if(current_schedule){
    const id1 = current_schedule.getTargetID(1, seconds);
    const id2 = current_schedule.getTargetID(2, seconds);
    if(id1) console.log(id1);
    if(id2) console.log(id2);
    for(const target_set of Object.values(current_target_sets)){
      if(id1) target_set.selectTargetByID(id1);
      if(id2) target_set.selectTargetByID(id2);
    }
  }
}

export async function import_data(name, id=-1){
  const color = "#fff";
  const ephemeris = BOSON_EPHEMERIS.get_ephemeris(name);
  current_simulations[name] = new Satellite(name, parseInt(id), color, ephemeris);
}

export function remove_simulation(names){
  for(const name of names){
    scene.removeOrbit(name);
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
}

export function set_orbit_trail(names, value){
  for(const name of names){
    current_simulations[name].orbit_trail = value;
  }
}

export function set_satellite_color(name, css_color){
  current_simulations[name].color = css_color;
}

export async function import_target_set(name){
  current_target_sets[name] = new TargetSet(name, "#00FF00", "#FF0000");
}

export function delete_target_set(name){
  BOSON_RENDER.remove_target_set(name);
  scene.removeTargetPrimitive(name);
  delete current_target_sets[name];
}

export function set_target_color(name, css_color){
  current_target_sets[name].color = css_color;
}

export function set_select_target_color(name, css_color){
  current_target_sets[name].selectColor = css_color;
}

export function import_schedule(name, schedule){
  if(!current_schedule){
    current_schedule = new Schedule(schedule);
  }
}

init();
