"use strict";

import * as BOSON_RENDER from './cesium_scene.js';


import Platform from './platform.js'
import Schedule from './schedule.js'
import TargetSet from './targetset.js'



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
    console.log(platform);
    this._platforms[name] = new Platform(name, platform, this._scene);
  }

  importSensors(ephemeris_name, sensor_name, sensors){
    this._platforms[ephemeris_name].addSensors(sensor_name, sensors);
  }

  importWindow(ephemeris_name, window, isIW=true){
    const platform = this._platforms[ephemeris_name];
    if(platform && window){
      platform.setWindow(window.name, window.intervals, isIW);
    }
  }


  setOrbitColor(name, color){
    // TODO: Change this
    Object.values(this._platforms).forEach(p => p.setOrbitColor(name, color));
  }

  setOrbitTrail(names, value){
    // TODO: Change this
    Object.values(this._platforms).forEach(p => p.setOrbitTrail(names, value));
  }

  removeOrbit(name){
    this._platforms[name].removeAll();
    delete this._platforms[name];
  }

  importTargetSet(name, targets){
    this._currentTargetSets[name] = new TargetSet(targets, this._scene);
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
      this._currentSchedule = new Schedule(name, schedule);
    }
  }

  toJSON(){
    const platform = Object.values(this._platforms).map(p => p.toJSON());
    const targets = Object.values(this._currentTargetSets).map(t => t.toJSON());
    const schedule = this._currentSchedule ? this._currentSchedule.toJSON() : null;
    const json = {
      platform : platform,
      targets : targets,
      schedule : schedule
    };

    return json;
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
