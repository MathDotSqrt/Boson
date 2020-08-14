"use strict";

/*
...
Simulation is a class that repersents the current state of the simulation.
This class handles the importing and serialization of state. The primary function
of this class it to guarantee any changes made to the ui will be repersented in
cesium's scene. Simulation and its children does not own any cesium entities or
primitives. This state ownership architecture designed to work well with including
additional visualization libraries.
...
*/

import * as BOSON_RENDER from './cesium_scene.js';
import Platform from './platform.js'
import Schedule from './schedule.js'
import TargetSet from './targetset.js'



export class Simulation {
  constructor(dom){
    //this._scene is an instance of Cesiums state.
    //If any state changes were made in simulation or its children this._scene
    //needs to be updated.
    this._scene = new BOSON_RENDER.Scene(dom);

    this._platform = null;

    //Named object of all the target types. (Point, DSA, MCG)
    //Designed to work seemlessly with adding new target types in the UI.
    this._currentTargetSets = {};
    this._currentSchedule = null;

    //Cesium owns the update/animation loop for the visualization
    //This is how Simulation remains in lockstep with cesium's update loop
    this._scene.addPreRenderEvent(this);

    //name of the entity getting followed
    this._follow = null;
  }

  follow(name){
    this._scene.followEntity(name);
    this._follow = name;
  }

  setVisualizationTime(seconds){
    //Cesium owns the current timestep of the simulation
    this._scene.setCurrentTime(seconds);
  }

  importPlatform(name, platform){
    this._platform = new Platform(name, platform, this._scene);

    //An imported satellite's ephemeris can expand the bounds of cesiums timeline
    this._recomputeSimulationTime();
  }

  getAllPlatformNames(){
    if(this._platform){
      return this._platform.getAllSatelliteNames();
    }
    return [];
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

  removeAllOrbits(){
    if(this._platform){
      this._platform.removeAll();
      this._platform = null;

      //A removed satellite can shrink the bounds of cesiums timeline
      this._recomputeSimulationTime();
    }
  }

  importTargetSet(name, targets){
    this._currentTargetSets[name] = new TargetSet(targets, this._scene);

    //This is to fix a bug when swapping targets in the middle of a schedule.
    //Essentually this initalizes the generated primitives for schedule to update
    //its selection state
    this._scene.updatePrimitives();

    //Tells the schedule to clear the cached event. Forces schedule to update
    //from timestep 0 to currentTime
    if(this._currentSchedule){
      this._currentSchedule.clearLastEventCache();
    }
  }

  setTargetColor(name, color, alpha){
    const target_set = this._currentTargetSets[name];
    if(target_set){
      target_set.color = color;
      if(alpha !== undefined) target_set.alpha = alpha;
    }
  }

  setTargetSelectColor(name, color){
    //TODO: add alpha parameter
    const target_set = this._currentTargetSets[name];
    if(target_set){
      target_set.selectColor = color;
    }
  }

  removeTargetSet(name){
    this._scene.removeTargetPrimitive(name);
    delete this._currentTargetSets[name];
  }

  removeAllTargetSets(){
    const remove = (name) => this._scene.removeTargetPrimitive(name);
    Object.keys(this._currentTargetSets).forEach(remove);
    this._currentTargetSets = {};
  }

  importSchedule(name, schedule){
    if(!this._currentSchedule){
      this._currentSchedule = new Schedule(name, schedule);

      //An imported schedule can expand the bounds of cesiums timeline
      this._recomputeSimulationTime();
    }
  }

  removeSchedule(){
    if(this._currentSchedule){
      const schedule_targets = this._currentSchedule.getAllTargets();
      const target_sets = Object.values(this._currentTargetSets);
      const deselect_by_id = (id) => target_sets.forEach(t => t.deselectTargetByID(id));

      schedule_targets.forEach(deselect_by_id);

      this._scene.clearAllVectors();
      this._currentSchedule = null;

      //A removed schedule can shrink the bounds of cesiums timeline
      this._recomputeSimulationTime();
    }
  }

  //Steps the simulation to the next schedule event. If no satellite is followed
  //then timestep to closest event in scene
  nextScheduleEvent(){
    if(this._currentSchedule){
      const seconds = this._scene.getCurrentTime();
      const following_platform = this._getByPlatformName(this._follow);
      const next_event = this._currentSchedule.getNextEventTime(seconds, following_platform);
      this._scene.setCurrentTime(next_event);
    }
  }

  //Steps the simulation to the previous schedule event. If no satellite is followed
  //then timestep to closest event in scene
  prevScheduleEvent(){
    if(this._currentSchedule){
      const seconds = this._scene.getCurrentTime();
      const following_platform = this._getByPlatformName(this._follow);
      const prev_event = this._currentSchedule.getPrevEventTime(seconds, following_platform);
      this._scene.setCurrentTime(prev_event);
    }
  }

  //Converts the state of the entire simulation to a single json object
  toJSON(){
    const settings = {
      follow: this._follow,
      currentTime: this._scene.getCurrentTime()
    };

    const platform = this._platform ? this._platform.toJSON() : null;

    const target_map = {};
    const targets = Object.entries(this._currentTargetSets)
      .forEach(([key,value]) => target_map[key] = value.toJSON());

    const schedule = this._currentSchedule ? this._currentSchedule.toJSON() : null;
    const json = {
      settings: settings,
      platform : platform,
      targets : target_map,
      schedule : schedule
    };

    return json;
  }


  //callback on cesiums update loop
  update(){
    const seconds = this._scene.getCurrentTime();

    //orient all satellites
    if(this._platform){
      this._platform.update();
    }

    if(this._currentSchedule){
      //This returns the current event and all previous events missed
      const schedule_event = this._currentSchedule.getScheduleEventContinuous(seconds);
      const delta = schedule_event.delta;
      const platform_events = schedule_event.platform_events;
      const target_ids = schedule_event.target_ids;

      const schedule_platform_ids = this._currentSchedule.getAllPlatformIDs();
      const vector_events = schedule_platform_ids
        .map(id => this._getByPlatformID(id))
        .filter(p => p);

      const fire_events = vector_events
        .filter(p => p.id in platform_events)
        .forEach(p => {
          const fire_event = platform_events[p.id];
          const lon = fire_event.coord[0];
          const lat = fire_event.coord[1];
          this._scene.fireVector(p.name, lon, lat);
        })

      const ice_events = vector_events
        .filter(p => !(p.id in platform_events))
        .forEach(p => this._scene.iceVector(p.name));

      const target_sets = Object.values(this._currentTargetSets);
      //If time has progressed forward or backwards, potentially update targets
      if(delta != 0){
        for(const target_set of target_sets){
          const select_by_id = (id) => target_set.selectTargetByID(id);
          const deselect_by_id = (id) => target_set.deselectTargetByID(id);

          //If delts is positive we moved foreward in time
          const select_func = delta > 0 ? select_by_id : deselect_by_id;

          target_ids.forEach(select_func);
        }
      }
    }
  }

  _recomputeSimulationTime(){
    console.log("recompute:", this._getMaxTime());
    this._scene.setStopTime(this._getMaxTime());
  }

  _getMaxTime(){
    const platform_time = this._platform ? this._platform.getMaxTime() : 0;
    const schedule_time = this._currentSchedule ? this._currentSchedule.getMaxTime() : 0;
    return Math.max(platform_time, schedule_time);
  }

  _getByPlatformID(id){
    if(this._platform){
      return this._platform.getSatelliteByID(id);
    }
    return null;
  }

  _getByPlatformName(name){
    if(this._platform){
      return this._platform.getSatelliteByName(name);
    }
    return null;
  }
}
