import Sensor from './sensor.js'
import WindowInterval from './WindowInterval.js'
import * as BOSON_RENDER from './cesium_scene.js';


export default class Satellite {
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
