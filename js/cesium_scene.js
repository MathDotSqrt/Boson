"use strict";

/*
...
Scene: is a class that owns cesium viewer, entities and primitives.
...
*/

import * as BOSON_UTIL from './cesium_util.js';
import * as BOSON_ORBIT from './cesium_orbit.js';

const EULER_DOWN = new Cesium.HeadingPitchRoll(0, Math.PI / 2, 0);
export const ALL = 0;
export const ONE_REV = 1;
export const NONE = 2;

const temp0_vec3 = new Cesium.Cartesian3();
const temp1_vec3 = new Cesium.Cartesian3();
const temp0_quat = new Cesium.Quaternion();
const temp1_quat = new Cesium.Quaternion();

export class Scene {
  constructor(dom){
    this._targetPrimitives = {};      //Object of target primitives
    this._sampleLines = {};           //Object of collection "laser" visualizer
    this._entityPaths = {};           //Object of all the polylines in the scene
    this._entityView = null;          //Pointer to the satellite being followed

    this._start = Cesium.JulianDate.fromDate(new Date(2015, 2, 25, 16));
    // TODO: Dont hard code this!!
    this._stop = Cesium.JulianDate.addSeconds(this._start, 1, new Cesium.JulianDate());


    this._viewer = new Cesium.Viewer(dom.id, {
      infoBox: false, //Disable InfoBox widget
      selectionIndicator: false, //Disable selection indicator
      shouldAnimate: true, // Enable animations
      requestRenderMode: false,


      baseLayerPicker : false
    });

    const layers = this._viewer.scene.imageryLayers;
    layers.addImageryProvider(new Cesium.WebMapServiceImageryProvider({
        url : new Cesium.Resource({
            url: '/path/to/imagery',
            //dont need proxy if imagry source has cross origin resource sharing enabled
            //proxy : new Cesium.DefaultProxy('/proxy/')
        })
    }));

    //Set bounds of our simulation time
    //Make sure viewer is at the desired time.
    this._viewer.clock.startTime = this._start.clone();
    this._viewer.clock.stopTime = this._stop.clone();
    this._viewer.clock.currentTime = this._start.clone();
    this._viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
    this._viewer.clock.multiplier = 0;

    //Set timeline to simulation bounds
    this._viewer.timeline.zoomTo(this._start.clone(), this._stop.clone());

    const that = this;
    this._viewer.scene.preRender.addEventListener(function(){that._preRender()});
    this._viewer.scene.postRender.addEventListener(function(){that._postRender()});
  }

  _preRender(){
    this._updateEntityView();
    for(const line of Object.values(this._sampleLines)){

    }
  }

  _postRender(){
    for(const line of Object.values(this._sampleLines)){
    }
  }

  _updateEntityView(){
    if(this._entityView){
      //cesium needs to update this every frame
      this._entityView.update(this._viewer.clock.currentTime);
    }
  }

  updatePrimitives(){
      this._viewer.scene.render(this._viewer.clock.currentTime);
  }

  getCurrentTime(){
    const current = this._viewer.clock.currentTime;
    const start = this._viewer.clock.startTime;
    const seconds = Cesium.JulianDate.secondsDifference(current, start);
    return seconds;
  }

  setCurrentTime(seconds){
    const current = Cesium.JulianDate.addSeconds(this._start, seconds, new Cesium.JulianDate())
    //hmm cant do bounds checks because start and stop time is dynamic and often
    this._viewer.clock.currentTime = current;
  }

  setStopTime(seconds){
    if(seconds == 0){
      this._stop = Cesium.JulianDate.addSeconds(this._start, 1, new Cesium.JulianDate());
      this._viewer.clock.multiplier = 0;
    }
    else{
      this._stop = Cesium.JulianDate.addSeconds(this._start, seconds + 1, new Cesium.JulianDate());
    }

    this._viewer.clock.stopTime = this._stop.clone();
    this._viewer.timeline.zoomTo(this._start, this._stop);
  }

  followEntity(name){
    const entity = this._viewer.entities.getById(name);
    if(entity){
      //Cesium.EntityView.defaultOffset3D = new Cesium.Cartesian3(35000, 35000, 140000);
      this._entityView = new Cesium.EntityView(entity, this._viewer.scene);
    }
    else{
      //If the entity doesnt exist, fly home
      this._entityView = null;
      this._viewer.scene.camera.flyHome(1);
    }
  }

  addPreRenderEvent(simulation){
    const that = this;
    this._viewer.scene.preRender.addEventListener(function(){
      simulation.update();
    });
  }

  createOrbit(name, ephemeris){
    const pos_property = new Cesium.SampledPositionProperty();
    pos_property.setInterpolationOptions({
      interpolationAlgorithm : Cesium.LagrangePolynomialApproximation,
      interpolationDegree : 2
    });
    var last_time = this._start;
    for(var index = 0; index < ephemeris.position.length/3; index += 1){
      const pos_x = ephemeris.position[3 * index + 0];
      const pos_y = ephemeris.position[3 * index + 1];
      const pos_z = ephemeris.position[3 * index + 2];

      const time = ephemeris.time[index];
      const cesium_pos = new Cesium.Cartesian3(pos_x, pos_y, pos_z);
      const cesium_time = Cesium.JulianDate.addSeconds(this._start, time, new Cesium.JulianDate());
      pos_property.addSample(cesium_time, cesium_pos);
      last_time = cesium_time;
    }

    const entity = this._viewer.entities.add({
      id: name,
      //Set the entity availability to the same interval as the simulation time.
      // availability: new Cesium.TimeIntervalCollection([
      //   new Cesium.TimeInterval({
      //     start: this._start,
      //     stop: this._stop,
      //   }),
      // ]),

      //Use our computed positions
      position: pos_property,
      velocity: new Cesium.VelocityVectorProperty(pos_property, false),
      velOrientation: new Cesium.VelocityOrientationProperty(pos_property),
      orientation: new Cesium.ConstantProperty(
        Cesium.Quaternion.IDENTITY.clone()
      ),

      model: {
        uri: "./res/model/Satellite/Satellite.glb",
        minimumPixelSize: 64,
      },
    });


    //Create default polyline for entire orbit interval.
    //This will be replaced when user loads iw/cw file.
    const interval = [this._start, last_time];
    const paths = BOSON_ORBIT.createIntervalPolyline([interval], pos_property, this._viewer);

    this._entityPaths[name] = {
      default: paths,
      image_window : [],
      comm_window : [],
      intersection : []
    };
  }

  setOrbitWindows(name, none, onlyIW, onlyCW, both){
    const entity = this._viewer.entities.getById(name);
    if(entity){
      const to_julian = time => Cesium.JulianDate.addSeconds(this._start, time, new Cesium.JulianDate());
      const to_julian_interval = interval => interval.map(to_julian);

      const julianNoneInterval = none.map(to_julian_interval);
      const julianIWInterval = onlyIW.map(to_julian_interval);
      const julianCWInterval = onlyCW.map(to_julian_interval);
      const julianBothInterval = both.map(to_julian_interval);

      //Clean up all of the previous polylines
      const dispose = entity => this._viewer.entities.remove(entity);
      Object.values(this._entityPaths[name]).flat().forEach(dispose);

      const to_polyline = interval => BOSON_ORBIT.createIntervalPolyline(interval, entity.position, this._viewer);
      this._entityPaths[name].default = to_polyline(julianNoneInterval);
      this._entityPaths[name].image_window = to_polyline(julianIWInterval);
      this._entityPaths[name].comm_window = to_polyline(julianCWInterval);
      this._entityPaths[name].intersection = to_polyline(julianBothInterval);
    }
  }

  setOrbitColor(name, csscolor, type){
    type = type ? type : "default";

    const entity = this._viewer.entities.getById(name);
    if(entity){
      const color = Cesium.Color.fromCssColorString(csscolor);
      this._entityPaths[name][type].forEach(e => e.path.material.color = color);
    }
  }

  setOrbitTrail(id, trail){
    const entity = this._viewer.entities.getById(id);
    const entityPaths = Object.values(this._entityPaths[id]).flat();
    const set_trail = trailTime => entityPaths.forEach(e => e.path.trailTime = trailTime);

    if(trail === ALL){
      set_trail(10000000);
    }
    else if(trail === NONE){
      set_trail(0);
    }
    else if(trail === ONE_REV){
      const time = this._viewer.clock.currentTime;
      const position = entity.position.getValue(time);
      const magnitude = Cesium.Cartesian3.magnitude(position);

      //estimated, does not account for elliptical orbit
      const semimajor_axis = magnitude;
      const a3 = semimajor_axis * semimajor_axis * semimajor_axis;

      //https://en.wikipedia.org/wiki/Standard_gravitational_parameter
      const u = 3.986E14;

      //https://en.wikipedia.org/wiki/Elliptic_orbit
      const trail_time = 2 * Math.PI * Math.sqrt(a3 / u);
      set_trail(trail_time);
    }
  }

  appendSensor(name, sensor_type, min, max){
    const color = Cesium.Color.fromCssColorString("#FFF");
    const entity = this._viewer.entities.getById(name);

    //I think there is a bug with cesium-volume-sensors with removing
    //sensor proerties from entities and replacing with a new property
    const hide = (name) => {if(entity[name]) entity[name].show = false;};
    hide("conicSensor");
    hide("customPatternSensor");

    if(sensor_type === "Doppler Cone Angle"){
      BOSON_UTIL.create_squint_sensor(entity, min, max, 55, 20, color);
    }
    else if(sensor_type === "Graze Angle"){
      BOSON_UTIL.create_conic_sensor(entity, 50, 50, color);
    }
  }

  setSensorColor(id, sensor_type, css_color){
    const color = Cesium.Color.fromCssColorString(css_color).withAlpha(.5);
    const entity = this._viewer.entities.getById(id);
    if(sensor_type === "Doppler Cone Angle"){
      entity.customPatternSensor.lateralSurfaceMaterial.color = color;
    }
    else if(sensor_type === "Graze Angle"){
      entity.conicSensor.lateralSurfaceMaterial.color = color;
    }
  }

  removeOrbit(name){
    this._viewer.entities.removeById(name);
    //Clean up the polylines
    const dispose = entity => this._viewer.entities.remove(entity);
    Object.values(this._entityPaths[name]).flat().forEach(dispose);
    delete this._entityPaths[name];
  }

  createTargetPrimitive(name, target_set){
    var color0 = new Cesium.ColorGeometryInstanceAttribute(0, 0, 0, 0);
    const instances = [];
    for(const target of Object.values(target_set)){
      const coords = target.coords;
      const polygon = Cesium.PolygonGeometry.fromPositions({
        positions: Cesium.Cartesian3.fromDegreesArray(coords),

        vertexFormat : new Cesium.VertexFormat({
          position : true,
          st : true,
          color : true
        }),
      });

      const instance = new Cesium.GeometryInstance({
        geometry : polygon,
        id : target.targetID,
        attributes : {
          color : color0
        }
      });

      instances.push(instance);
    }

    this._targetPrimitives[name] = new Cesium.Primitive({
      geometryInstances : instances,
      appearance : BOSON_UTIL.create_material(),
      allowPicking : false,  //for performance reasons
      asynchronous : true

    });

    this._viewer.scene.primitives.add(this._targetPrimitives[name]);
  }

  setTargetColor(id, css_color, alpha=.5){
    const color = Cesium.Color.fromCssColorString(css_color).withAlpha(alpha);
    const primitive = this._targetPrimitives[id];
    primitive.appearance.material.uniforms.color = color;
  }

  setTargetSelectColor(id, css_color){
    const color = Cesium.Color.fromCssColorString(css_color).withAlpha(.9);
    const primitive = this._targetPrimitives[id];
    primitive.appearance.material.uniforms.select = color;
  }

  selectTarget(name, target_id){
    const primitive = this._targetPrimitives[name];
    if(primitive){
      const attrib = primitive.getGeometryInstanceAttributes(target_id);
      if(attrib){
        //console.log(name, attrib);

        //attrib.color.value[3] !
        attrib.color = new Cesium.ColorGeometryInstanceAttribute(0, 0, 0, 1).value;
      }
    }
  }

  // selectAllTargets(name){
  //   const primitive = this._targetPrimitives[name];
  //   if(primitive){
  //     console.log(primitive);
  //   }
  // }

  deselectTarget(name, target_id){
    const primitive = this._targetPrimitives[name];
    if(primitive){
      const attrib = primitive.getGeometryInstanceAttributes(target_id);

      if(attrib){
        //console.log("DESELECT:", target_id);

        //attrib.color.value[3] !
        attrib.color = new Cesium.ColorGeometryInstanceAttribute(0, 0, 0, 0).value;
      }
    }
  }

  removeTargetPrimitive(name){
    this._viewer.scene.primitives.remove(this._targetPrimitives[name]);
    delete this._targetPrimitives[name];
  }

  fireVector(name, lon, lat){
    const pos = new Cesium.PositionPropertyArray([
      new Cesium.ReferenceProperty(this._viewer.entities, name, ['position']),
      new Cesium.ConstantPositionProperty(Cesium.Cartesian3.fromDegrees(lon, lat))
    ]);
    if(!(name in this._sampleLines)){
      this._sampleLines[name] = this._viewer.entities.add({
        polyline : {
          positions : pos,

          width : 5,
          material : new Cesium.PolylineOutlineMaterialProperty({
            color : Cesium.Color.RED,
            outlineColor : Cesium.Color.BLACK
          })
        }
      });
    }
    else{
      //console.log(this._sampleLines[name].polyline);
      this._sampleLines[name].polyline.positions = pos;
      this._sampleLines[name].polyline.show = true;

    }
  }

  iceVector(name){
    if(name in this._sampleLines){
      this._sampleLines[name].polyline.show = false;
    }
  }

  clearAllVectors(){
    Object.values(this._sampleLines).forEach(s => s.polyline.show = false);
  }

  updateSatellite(name){
    const time = this._viewer.clock.currentTime;
    const entity = this._viewer.entities.getById(name);
    if(entity){
      const position = entity.position.getValue(time);
      const velocity = entity.velocity.getValue(time);

      if(position === undefined) return;

      const current_orientation = entity.velOrientation.getValue(time);
      const orientation = entity.orientation.getValue();

      //points sensor to surface of the earth
      //rotate sensor 180 degrees along the axis of its velocity
      const vel_axis = Cesium.Cartesian3.normalize(velocity, temp0_vec3);
      const rotate_down_quat = Cesium.Quaternion.fromAxisAngle(vel_axis, Math.PI, temp0_quat);
      Cesium.Quaternion.multiply(rotate_down_quat, current_orientation, orientation);

      //not accurate in Wgs84 because it measures from center of earth not
      //orthogonal from surface of earth
      const pos_axis = Cesium.Cartesian3.normalize(position, temp0_vec3);
      const offset_rotation = 0;
      const offset_quat = Cesium.Quaternion.fromAxisAngle(pos_axis, offset_rotation, temp0_quat);
      Cesium.Quaternion.multiply(offset_quat, orientation, orientation);

      //final orientation
      entity.orientation.setValue(orientation);
    }
  }
}
