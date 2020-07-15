"use strict";

import * as BOSON_UTIL from './cesium_util.js';

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
    this._targetPrimitives = {};
    this._start = Cesium.JulianDate.fromDate(new Date(2015, 2, 25, 16));
    //this._stop = Cesium.JulianDate.addSeconds(this._start, 36000000, new Cesium.JulianDate());
    this._stop = Cesium.JulianDate.addSeconds(this._start, 171246.075653055, new Cesium.JulianDate());
    this._entityView = null;

    this._viewer = new Cesium.Viewer(dom.id, {
      infoBox: false, //Disable InfoBox widget
      selectionIndicator: false, //Disable selection indicator
      shouldAnimate: true, // Enable animations
      requestRenderMode: false,
      //mapProjection: new Cesium.WebMercatorProjection()
      //terrainProvider: Cesium.createWorldTerrain(),
    });

    //Set bounds of our simulation time
    //Make sure viewer is at the desired time.
    this._viewer.clock.startTime = this._start.clone();
    this._viewer.clock.stopTime = this._stop.clone();
    this._viewer.clock.currentTime = this._start.clone();
    this._viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
    this._viewer.clock.multiplier = 10;

    //Set timeline to simulation bounds
    this._viewer.timeline.zoomTo(this._start, this._stop);

    const that = this;
    this._viewer.scene.preRender.addEventListener(function(){that._updateEntityView()});
  }

  _updateEntityView(){
    if(this._entityView){
      this._entityView.update(this._viewer.clock.currentTime);
    }
  }

  followEntity(name){
    const entity = this._viewer.entities.getById(name);
    if(entity){
      Cesium.EntityView.defaultOffset3D = new Cesium.Cartesian3(35000, 35000, 140000);
      this._entityView = new Cesium.EntityView(entity, this._viewer.scene);
    }
    else{
      this._entityView = null;
      this._viewer.scene.camera.flyHome(1);
    }
  }

  addPreRenderEvent(simulation){
    const that = this;
    this._viewer.scene.preRender.addEventListener(function(){
      const seconds = Cesium.JulianDate.secondsDifference(that._viewer.clock.currentTime, that._viewer.clock.startTime);
      simulation.update(seconds);
    });
  }

  createOrbit(name, ephemeris, color){
    const pos_property = new Cesium.SampledPositionProperty();
    pos_property.setInterpolationOptions({
      interpolationAlgorithm : Cesium.LagrangePolynomialApproximation,
      interpolationDegree : 2
    });

    for(var index = 0; index < ephemeris.position.length/3; index += 1){
      const pos_x = ephemeris.position[3 * index + 0];
      const pos_y = ephemeris.position[3 * index + 1];
      const pos_z = ephemeris.position[3 * index + 2];

      const time = ephemeris.time[index];
      const cesium_pos = new Cesium.Cartesian3(pos_x, pos_y, pos_z);
      const cesium_time = Cesium.JulianDate.addSeconds(this._start, time, new Cesium.JulianDate());
      pos_property.addSample(cesium_time, cesium_pos);
    }

    const cesium_color = Cesium.Color.fromCssColorString(color);

    const entity = this._viewer.entities.add({
      id: name,
      //Set the entity availability to the same interval as the simulation time.
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: this._start,
          stop: this._stop,
        }),
      ]),

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
      //Show the path as a colored line
      path: {
        resolution: 10000000,  //large resolution really helps with performance
        material: cesium_color,
        width: 1,
        trailTime: 10000000,
        leadTime: 0,
      },
    });
  }

  setOrbitTrail(id, trail){
    const entity = this._viewer.entities.getById(id);

    if(trail === ALL){
      entity.path.trailTime = 10000000;
    }
    else if(trail === NONE){
      entity.path.trailTime = 0;
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
      entity.path.trailTime = trail_time;
    }
  }

  setOrbitColor(id, css_color){
    const color = Cesium.Color.fromCssColorString(css_color);
    const entity = this._viewer.entities.getById(id);
    if(!entity) return;
    entity.path.material.color = color;
  }

  appendSensor(name, sensor_type, min, max){
    const color = Cesium.Color.fromCssColorString("#FFF");
    const entity = this._viewer.entities.getById(name);
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
    console.log("REMOVE ORBIT: " + name);
    this._viewer.entities.removeById(name);
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
        id : target.id,
        attributes : {
          color : color0
        }
      });

      instances.push(instance);
    }

    this._targetPrimitives[name] = new Cesium.Primitive({
      geometryInstances : instances,
      appearance : BOSON_UTIL.create_material(),
      allowPicking : false  //for performance reasons
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
    const attrib = primitive.getGeometryInstanceAttributes(target_id);
    if(attrib){
      attrib.color = new Cesium.ColorGeometryInstanceAttribute(0, 0, 0, 1).value;
    }
  }

  removeTargetPrimitive(name){
    this._viewer.scene.primitives.remove(this._targetPrimitives[name]);
    delete this._targetPrimitives[name];
  }

  updateSatellite(name){
    const time = this._viewer.clock.currentTime;
    const entity = this._viewer.entities.getById(name);
    if(entity){
      const position = entity.position.getValue(time);
      const velocity = entity.velocity.getValue(time);

      if(position === undefined) return;

      //this rotates the sensor with respect to the entity's
      //position and velocity. This sensor points strait up
      //need to rotate it to point to the surface of the earth
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
