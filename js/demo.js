"use strict";

import * as BOSON_RENDER from './cesium_scene.js';

import Sensor from './sensor.js'
import Satellite from './satellite.js'
import Schedule from './schedule.js'
import WindowInterval from './windowinterval.js'
import TargetSet from './targetset.js'

class Platform{
  constructor(name, platform, scene){
    this._name = name;
    this._scene = scene;
    this._satellites = {};
    this._sensors = {};
    this._windows = {};

    const satellites = Object.entries(platform)
      .map(([name, s]) => new Satellite(name, s.id, "#0000ff", s, this._scene));

    satellites.forEach(s => this._satellites[s.name] = s);
    console.log(this);
  }

  addSensors(name, sensors){
    sensors.map(sensor => [this.getSatelliteByID(sensor.platformID), sensor])
      .filter(([satellite, sensor]) => satellite)
      .forEach(([satellite, sensor]) => {
        satellite.sensor
          = new Sensor(satellite.name, sensor.sensorType, sensor.minValue, sensor.maxValue, this._scene);
      });
  }

  setOrbitColor(name, color){
    const orbit = this._satellites[name];
    if(orbit){
      orbit.color = color;
    }
  }

  setOrbitTrail(names, value){
    for(const name of names){
      const orbit = this._satellites[name];
      if(orbit){
        orbit.orbit_trail = value;
      }
    }
  }

  setAllOrbitTrail(value){
    Object.values(this._satellites).forEach(s => s.orbit_trail = value);
  }

  setWindow(window_name, windows, isIW){
    this._windows[window_name] = windows;
    const satellites = Object.keys(windows)
      .map(x => parseInt(x))
      .map(x => this.getSatelliteByID(x))
      .filter(x => x);

    console.log(Object.keys(windows).map(x => parseInt(x)));
    console.log(satellites);

    if(isIW){
      satellites.forEach(s => s.window.setIWInterval(windows[s.id]));
    }
    else{
      satellites.forEach(s => s.window.setCWInterval(windows[s.id]));
    }
  }

  getSatelliteByName(name){
    return this._satellites[name];
  }

  getSatelliteByID(id){
    return Object.values(this._satellites).find(s => s.id === id);
  }

  removeAll(){
    Object.values(this._satellites).forEach(s => this._scene.removeOrbit(s.name));
  }

  get name(){
    return this._name;
  }

  update(){
    Object.values(this._satellites).forEach(s => s.update());
  }
}

export class Simulation {
  constructor(dom){
    this._scene = new BOSON_RENDER.Scene(dom);
    this._platforms = {};
    this._currentTargetSets = {};
    this._currentSchedule = null;
    this._scene.addPreRenderEvent(this);
  }

  follow(name){
    this._scene.followEntity(name);
  }

  importPlatform(name, platform){
    this._platforms[name] = new Platform(name, platform, this._scene);
  }

  // importOrbit(name, ephemeris, id=-1){
  //   const color = "#fff";
  //   //const ephemeris = BOSON_EPHEMERIS.get_ephemeris(name);
  //   this._currentOrbits[name] = new Satellite(name, parseInt(id), color, ephemeris, this._scene);
  // }

  importSensors(ephemeris_name, sensor_name, sensors){
    this._platforms[ephemeris_name].addSensors(sensor_name, sensors);
  }

  importWindow(ephemeris_name, window_name, windows, isIW=true){
    const platform = this._platforms[ephemeris_name];
    if(platform){
      platform.setWindow(window_name, windows, isIW);
    }
  }

  setOrbitColor(name, color){
    Object.values(this._platforms).forEach(p => p.setOrbitColor(name, color));
  }

  setOrbitTrail(names, value){
    Object.values(this._platforms).forEach(p => p.setOrbitTrail(names, value));
  }

  removeOrbit(name){
    this._platforms[name].removeAll();
    delete this._platforms[name];
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
    Object.values(this._platforms).forEach(p => p.update());

    if(this._currentSchedule){
      const platformIDs = this._currentSchedule.getAllPlatformIDs();

      for(const platformID of platformIDs){
        const out = this._currentSchedule.getScheduleEventContinuous(platformID, seconds);
        //const schedule_event = this._currentSchedule.getScheduleEvent(platformID, seconds);
        const satellite = this._getByPlatformID(platformID);

        if(out){
          const schedule_event = out.event;
          const targets = out.targets;
          if(satellite){
            const [lon, lat] = schedule_event.coord;
            console.log(satellite);
            console.log(satellite.name);
            this._scene.fireVector(satellite.name, lon, lat);
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
          if(satellite){
            this._scene.iceVector(satellite.name);
          }
        }
      }
    }
  }

  _getByPlatformID(id){
    return Object.values(this._platforms)
      .map(p => p.getSatelliteByID(id))
      .find(s => s.id === id);
  }

  _getPlatforms(){
    return Object.values(this._currentOrbits).filter(x => x.id > 0);
  }
}
