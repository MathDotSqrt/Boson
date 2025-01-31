import Sensor from './sensor.js'
import Satellite from './satellite.js'
import WindowInterval from './windowinterval.js'

export default class Platform{
  constructor(name, platform, scene){
    this._name = name;
    this._scene = scene;
    this._satellites = {};
    this._sensors = null;
    this._iwWindow = null;
    this._cwWindow = null;

    const satellites = Object.values(platform).map(s=>new Satellite(s, this._scene));
    satellites.forEach(s => this._satellites[s.id] = s);
  }

  addSensors(name, sensors){
    sensors.map(sensor => [this.getSatelliteByID(sensor.platformID), sensor])
      .filter(([satellite, sensor]) => satellite)
      .forEach(([satellite, sensor]) => {
        satellite.sensor
          = new Sensor(satellite.name, sensor.sensorType, sensor.minValue, sensor.maxValue, this._scene);
      });

    this._sensors = {
      name: name,
      parameters : sensors
    }
  }

  setOrbitColor(name, color){
    const orbit = this.getSatelliteByName(name);
    if(orbit){
      orbit.color = color;
    }
  }

  setOrbitTrail(name, value){
    const orbit = this.getSatelliteByName(name);
    if(orbit){
      orbit.orbit_trail = value;
    }
  }

  setAllOrbitTrail(value){
    Object.values(this._satellites).forEach(s => s.orbit_trail = value);
  }

  setWindow(window_name, intervals, isIW){
    const windows = {
      name : window_name,
      intervals: intervals
    };
    //this._windows[window_name] = windows;
    const satellites = Object.keys(windows.intervals)
      .map(x => parseInt(x))
      .map(x => this.getSatelliteByID(x))
      .filter(x => x);

    if(isIW){
      this._iwWindow = windows;
      satellites.forEach(s => s.window.setIWInterval(windows.intervals[s.id]));
    }
    else{
      this._cwWindow = windows;
      satellites.forEach(s => s.window.setCWInterval(windows.intervals[s.id]));
    }
    satellites.forEach(s => s.orbit_trail = s.orbit_trail);
  }

  getSatelliteByName(name){
    return Object.values(this._satellites).find(s => s.name === name);
  }

  getSatelliteByID(id){
    return this._satellites[id];
  }

  getAllSatelliteNames(){
    return Object.values(this._satellites).map(s => s.name);
  }

  getMaxTime(){
    const max_times = Object.values(this._satellites).map(s => s.getMaxTime());
    return Math.max(...max_times);
  }

  removeAll(){
    Object.values(this._satellites).forEach(s => this._scene.removeOrbit(s.name));
  }

  get name(){
    return this._name;
  }

  toJSON(){
    const satelliteMap = {};
    const satellites = Object.values(this._satellites).map(s => s.toJSON());
    satellites.forEach(s => satelliteMap[s.id] = s);  //convert array to map

    const sensors = this._sensors;
    //const windows = this._windows;
    const json = {
      name : this.name,
      satellites : satelliteMap,
      sensors : sensors,
      iwWindow : this._iwWindow,
      cwWindow : this._cwWindow,
    };

    return json;
  }

  update(){
    Object.values(this._satellites).forEach(s => s.update());
  }
}
