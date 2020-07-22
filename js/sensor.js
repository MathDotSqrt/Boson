export default class Sensor {
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
