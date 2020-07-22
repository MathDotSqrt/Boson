"use strict";

import * as BOSON_RENDER from './cesium_scene.js';

import Schedule from './schedule.js'
import WindowInterval from './WindowInterval.js'


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
    this._ephemeris = ephemeris;

    this._scene = scene;
    this._scene.createOrbit(name, ephemeris, color);
    this.color = color;
    this.orbit_trail = BOSON_RENDER.ALL;

    this._sensor = null;
    this._window = new WindowInterval(this, scene);
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

  get window(){
    return this._window;
  }

  update(schedule){
    this._scene.updateSatellite(this.name);
  }
}

class TargetSet {
  constructor(name, color, selectColor, targetSet, scene){
    this._name = name;
    this._scene = scene;

    this._targetSet = targetSet;
    //const target_set = BOSON_TARGETS.get_target_set(name);
    this._scene.createTargetPrimitive(name, this._targetSet);

    this.color = color;
    this.alpha = 1;
    this.selectColor = selectColor;

  }

  get name(){
    return this._name;
  }

  get color(){
    return this._color;
  }
  set color(color){
    this._scene.setTargetColor(this.name, color, this._alpha);
    this._color = color;
  }

  get alpha(){
    return this._alpha;
  }

  set alpha(alpha){
    this._scene.setTargetColor(this.name, this._color, alpha);
    this._alpha = alpha;
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

  deselectTargetByID(id){
    this._scene.deselectTarget(this.name, id);
  }

  update(){

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

  importOrbit(name, ephemeris, id=-1){
    const color = "#fff";
    //const ephemeris = BOSON_EPHEMERIS.get_ephemeris(name);
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

  importWindow(windows, isIW=true){
    const satellites = Object.keys(windows)
      .map(x => parseInt(x))
      .map(x => this._getByPlatformID(x))
      .filter(x => x);

    console.log(satellites);

    if(isIW){
      satellites.forEach(s => s.window.setIWInterval(windows[s.id]));
    }
    else{
      satellites.forEach(s => s.window.setCWInterval(windows[s.id]));
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

  importTargetSet(name, targetSet){
    this._currentTargetSets[name] = new TargetSet(name, "#00FF00", "#FF0000", targetSet, this._scene);
  }

  setTargetColor(name, color, alpha){
    const target_set = this._currentTargetSets[name];
    if(target_set){
      target_set.color = color;
      if(alpha !== undefined) target_set.alpha = alpha;
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
      const platformIDs = this._currentSchedule.getAllPlatformIDs();

      for(const platformID of platformIDs){
        const out = this._currentSchedule.getScheduleEventContinuous(platformID, seconds);
        //const schedule_event = this._currentSchedule.getScheduleEvent(platformID, seconds);
        const platform = this._getByPlatformID(platformID);

        if(out){
          const schedule_event = out.event;
          const targets = out.targets;
          if(platform){
            const [lon, lat] = schedule_event.coord;
            this._scene.fireVector(platform.name, lon, lat);
          }
          for(const target_set of Object.values(this._currentTargetSets)){
            for(const target of targets){
              if(out.delta >= 0){
                target_set.selectTargetByID(target);
              }
              else{
                target_set.deselectTargetByID(target);
              }
            }
            target_set.selectTargetByID(schedule_event.target);

          }
        }
        else{
          if(platform){
            this._scene.iceVector(platform.name);
          }
        }
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

  _getPlatforms(){
    return Object.values(this._currentOrbits).filter(x => x.id > 0);
  }
}
