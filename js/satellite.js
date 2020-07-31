import Sensor from './sensor.js'
import WindowInterval from './windowinterval.js'
import * as BOSON_RENDER from './cesium_scene.js';


export default class Satellite {
  constructor(satellite, scene){
    this._name = satellite.name;
    this._id = satellite.id;
    this._ephemeris = satellite.ephemeris;

    this._scene = scene;
    this._scene.createOrbit(this.name, satellite.ephemeris, satellite.color);
    this.color = satellite.color;
    this.orbit_trail = satellite.orbitTrail;

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
  set orbit_trail(trail_name){
    var trail_type = BOSON_RENDER.ALL;
    if(trail_name === "all") trail_type = BOSON_RENDER.ALL;
    else if(trail_name === "one_rev") trail_type = BOSON_RENDER.ONE_REV;
    else if(trail_name === "none") trail_type = BOSON_RENDER.NONE;

    this._scene.setOrbitTrail(this.name, trail_type);
    this._orbit_trail = trail_name;
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

  toJSON(){
    //NOTE: we do not add sensor/window data to this
    //that will be stored in the platforms json
    const json = {
      name : this.name,
      id : this.id,
      color : this.color,
      orbitTrail : this.orbit_trail,
      ephemeris : this._ephemeris
    }

    return json;
  }

  update(schedule){
    this._scene.updateSatellite(this.name);
  }
}
