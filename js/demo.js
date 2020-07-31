"use strict";

import * as BOSON_RENDER from './cesium_scene.js';


import Platform from './platform.js'
import Schedule from './schedule.js'
import TargetSet from './targetset.js'



export class Simulation {
  constructor(dom){
    this._scene = new BOSON_RENDER.Scene(dom);
    this._platform = null;
    this._currentTargetSets = {};
    this._currentSchedule = null;
    this._scene.addPreRenderEvent(this);
  }

  follow(name){
    this._scene.followEntity(name);
  }

  importPlatform(name, platform){
    this._platform = new Platform(name, platform, this._scene);
  }

  importSensors(sensor_name, sensors){
    if(this._platform){
      this._platform.addSensors(sensor_name, sensors);
    }
  }

  importWindow(window, isIW=true){
    if(this._platform && window){
      this._platform.setWindow(window.name, window.intervals, isIW);
    }
  }


  setOrbitColor(name, color){
    if(this._platform){
      this._platform.setOrbitColor(name, color);
    }
  }

  setOrbitTrail(name, value){
    if(this._platform){
      this._platform.setOrbitTrail(name, value);
    }
  }

  removeOrbit(name){
    if(this._platform){
      this._platform.removeAll();
      this._platform = null;
    }
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
    const platform = this._platform ? [this._platform.toJSON()] : [];
    const targets = Object.values(this._currentTargetSets).map(t => t.toJSON());
    const schedule = this._currentSchedule ? this._currentSchedule.toJSON() : null;
    const json = {
      platform : platform,
      targets : targets,
      schedule : schedule
    };

    return json;
  }


  //callback on cesiums update loop
  update(seconds){
    //orient all satellites to face the earth
    if(this._platform){
      this._platform.update();
    }

    //if we have a schedule loaded
    if(this._currentSchedule){
      //gets all events from prev seconds to current seconds
      const getEvent = (id) => this._currentSchedule.getScheduleEventContinuous(id, seconds);

      //gets all platformIDs defined in schedule
      const platformIDs = this._currentSchedule.getAllPlatformIDs();
      const events = platformIDs.map(id => [this._getByPlatformID(id), getEvent(id)]);

      //fires red vector to visualize target collection
      const fire_events = events
        .filter(([p, e]) => p && e)
        .map(([p, e]) => [p.name, e.event.coord])
        .forEach(([name, [lon, lat]]) => this._scene.fireVector(name, lon, lat));

      //removes red vector when no target is being collected
      const ice_events = events
        .filter(([p, e]) => p && !e)
        .forEach(([p, e]) => this._scene.iceVector(p.name));

      //gets all loaded target sets
      const target_sets = Object.values(this._currentTargetSets);
      const select_by_id   = (id) => target_sets.forEach(t => t.selectTargetByID(id));
      const deselect_by_id = (id) => target_sets.forEach(t => t.deselectTargetByID(id));
      const select_target = (delta, events, targetIDs) => {
        const select_func = delta >= 0 ? select_by_id : deselect_by_id;
        targetIDs.forEach(select_func);
        select_by_id(events.target)
      }

      const select_events = events
        .filter(([p, e]) => e)
        .map(([p, e]) => [e.delta, e.event, e.targets])
        .forEach(([delta, event, targets]) => select_target(delta, event, targets));
    }
  }

  _getByPlatformID(id){
    if(this._platform){
      return this._platform.getSatelliteByID(id);
    }
    return null;
  }
}
