"use strict";

import * as BOSON_RENDER from './cesium_scene.js';
import * as BOSON_EPHEMERIS from './ephemeris.js';
import * as BOSON_TARGETS from './targets.js';

import Schedule from './schedule.js'

class Sensor {
  constructor(name, type, min_value, max_value, scene){
    this._sensor_type = type;
    this._min_value = min_value;
    this._max_value = max_value;
    this._scene = scene;

    this._scene.appendSensor(name, type, min_value, max_value);
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
  constructor(name, id, color, ephemeris, scene){
    this._name = name;
    this._id = id;
    this._sensor = null;
    this._scene = scene;

    this._scene.createOrbit(name, ephemeris, color);

    this.color = color;
    this.orbit_trail = BOSON_RENDER.ALL;
  }

  get name() { return this._name }

  get id() { return this._id }

  get color() { return this._color }
  set color(new_color) {
    this._scene.setOrbitColor(this.name, new_color);
    if(this._sensor)
      this._scene.setSensorColor(this.name, this.sensor.sensor_type, new_color);
    this._color = new_color;
  }

  get orbit_trail(){ return this._orbit_trail }
  set orbit_trail(trail_type){
    if(trail_type === "all") trail_type = BOSON_RENDER.ALL;
    else if(trail_type === "one_rev") trail_type = BOSON_RENDER.ONE_REV;
    else if(trail_type === "none") trail_type = BOSON_RENDER.NONE;
    else if(typeof trail_type !== "number") return; //invalid input

    this._scene.setOrbitTrail(this.name, trail_type);
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
    this._scene.updateSatellite(this.name);
  }
}

class TargetSet {
  constructor(name, color, selectColor, scene){
    this._name = name;
    this._scene = scene;

    const target_set = BOSON_TARGETS.get_target_set(name);
    this._scene.createTargetPrimitive(name, target_set);

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
    this._scene.setTargetColor(this.name, color);
    this._color = color;
  }

  get selectColor(){
    return this._selectColor;
  }
  set selectColor(selectColor){
    this._scene.setTargetSelectColor(this.name, selectColor);
    this._selectColor = selectColor;
  }

  selectTargetByID(id){
    this._scene.selectTarget(this.name, id);
  }

  update(schedule){

  }
};

export class Simulation {
  constructor(dom){
    this._scene = new BOSON_RENDER.Scene(dom);
    this._currentOrbits = {};
    this._currentTargetSets = {};
    this._currentSchedule = null;
    console.log(this);
    this._scene.addPreRenderEvent(this);
  }

  follow(name){
    this._scene.followEntity(name);
  }

  importOrbit(name, id=-1){
    const color = "#fff";
    const ephemeris = BOSON_EPHEMERIS.get_ephemeris(name);
    this._currentOrbits[name] = new Satellite(name, parseInt(id), color, ephemeris, this._scene);
  }

  importSensor(sensor_parameter){
    console.log(sensor_parameter);
    const satellite = this._getByPlatformID(sensor_parameter.platformID);
    console.log(satellite);
    if(satellite){
      const name = satellite.name;
      const type = sensor_parameter.sensorType;
      const min = sensor_parameter.minValue;
      const max = sensor_parameter.maxValue;

      satellite.sensor = new Sensor(name, type, min, max, this._scene);
    }
  }

  setOrbitColor(name, color){
    const orbit = this._currentOrbits[name];
    if(orbit){
      orbit.color = color;
    }
  }

  setOrbitTrail(names, value){
    for(const name of names){
      const orbit = this._currentOrbits[name];
      if(orbit){
        orbit.orbit_trail = value;
      }
    }
  }

  removeOrbit(names){
    if(!Array.isArray(names)) names = [names];

    for(const name of names){
      this._scene.removeOrbit(name);
      delete this._currentOrbits[name];
    }
  }

  importTargetSet(name){
    this._currentTargetSets[name] = new TargetSet(name, "#00FF00", "#FF0000", this._scene);
  }

  setTargetColor(name, color){
    const target_set = this._currentTargetSets[name];
    if(target_set){
      target_set.color = color;
    }
  }

  setTargetSelectColor(name, color){
    const target_set = this._currentTargetSets[name];
    if(target_set){
      target_set.selectColor = color;
    }
  }

  removeTargetSet(name){
    this._scene.removeTargetPrimitive(name);
    delete this._currentTargetSets[name];
  }

  importSchedule(name, schedule){
    if(!this._currentSchedule){
      this._currentSchedule = new Schedule(schedule);
    }
  }

  update(seconds){
    for(const satellite of Object.values(this._currentOrbits)){
      satellite.update();
    }

    if(this._currentSchedule){
      console.log(this._currentSchedule);
      const id1 = this._currentSchedule.getTargetID(1, seconds);
      const id2 = this._currentSchedule.getTargetID(2, seconds);
      if(id1) console.log(id1);
      if(id2) console.log(id2);
      for(const target_set of Object.values(this._currentTargetSets)){
        if(id1) target_set.selectTargetByID(id1);
        if(id2) target_set.selectTargetByID(id2);
      }
    }
  }

  _getByPlatformID(id){
    for(const satellite of Object.values(this._currentOrbits)){
      if(satellite.id === id){
        return satellite;
      }
    }

    return null;
  }
}
