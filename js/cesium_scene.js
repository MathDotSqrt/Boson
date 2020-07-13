"use strict";

import * as BOSON_UTIL from './cesium_util.js';

const EULER_DOWN = new Cesium.HeadingPitchRoll(0, Math.PI / 2, 0);
export const ALL = 0;
export const ONE_REV = 1;
export const NONE = 2;

const target_primitives = {};

var viewer = null;
var entity = null;

const start = Cesium.JulianDate.fromDate(new Date(2015, 2, 25, 16));
const stop = Cesium.JulianDate.addSeconds(
  start,
  36000000,
  new Cesium.JulianDate()
);

export function create_scene(dom){
  viewer = new Cesium.Viewer(dom.id, {
    infoBox: false, //Disable InfoBox widget
    selectionIndicator: false, //Disable selection indicator
    shouldAnimate: true, // Enable animations
    requestRenderMode: false,
    //mapProjection: new Cesium.WebMercatorProjection()
    //terrainProvider: Cesium.createWorldTerrain(),
  });
  //viewer.scene.debugShowCommands  = true;

  Cesium.Math.setRandomNumberSeed(3);

  //Set bounds of our simulation time
  //Make sure viewer is at the desired time.
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
  viewer.clock.multiplier = 10;

  //Set timeline to simulation bounds
  viewer.timeline.zoomTo(start, stop);
}

export function update(){
  //todo only render when somthing changes
  //viewer.scene.requestRender();
};
var test = true;
export function create_orbit(name, ephemeris, color){
  const pos_property = new Cesium.SampledPositionProperty();
  pos_property.setInterpolationOptions({
    interpolationAlgorithm : Cesium.LagrangePolynomialApproximation,
    interpolationDegree : 2
  });
  console.log(pos_property);

  for(var index = 0; index < ephemeris.position.length/3; index += 1){
    const pos_x = ephemeris.position[3 * index + 0];
    const pos_y = ephemeris.position[3 * index + 1];
    const pos_z = ephemeris.position[3 * index + 2];

    const time = ephemeris.time[index];
    const cesium_pos = new Cesium.Cartesian3(pos_x, pos_y, pos_z);
    const cesium_time = Cesium.JulianDate.addSeconds(start, time, new Cesium.JulianDate());
    pos_property.addSample(cesium_time, cesium_pos);
  }

  const cesium_color = Cesium.Color.fromCssColorString(color);

  const entity = viewer.entities.add({
    id: name,
    //Set the entity availability to the same interval as the simulation time.
    availability: new Cesium.TimeIntervalCollection([
      new Cesium.TimeInterval({
        start: start,
        stop: stop,
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

export function remove_satellite(name){
  viewer.entities.removeById(name);
};

export function create_sensor(name, sensor_type, min, max){
  const color = Cesium.Color.fromCssColorString("#FFF");
  const entity = viewer.entities.getById(name);
  if(sensor_type === "Doppler Cone Angle"){
    BOSON_UTIL.create_squint_sensor(entity, min, max, 50, 20, color);
  }
  else if(sensor_type === "Graze Angle"){
    BOSON_UTIL.create_conic_sensor(entity, 40, 40, color);
  }
}

const temp0_vec3 = new Cesium.Cartesian3();
const temp1_vec3 = new Cesium.Cartesian3();
const temp0_quat = new Cesium.Quaternion();
const temp1_quat = new Cesium.Quaternion();
export function update_satellite(name){
  const time = viewer.clock.currentTime;
  const entity = viewer.entities.getById(name);
  const position = entity.position.getValue(time);
  const velocity = entity.velocity.getValue(time);

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
};


export function draw_all_targets(name, target_set){
  var color1 = new Cesium.ColorGeometryInstanceAttribute(0, 0, 0, 1);
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
        color : Math.random() > .5 ? color0 : color1
      }
    });

    instances.push(instance);
  }

  target_primitives[name] = new Cesium.Primitive({
    geometryInstances : instances,
    appearance : BOSON_UTIL.create_material()
  });

  viewer.scene.primitives.add(target_primitives[name]);
  console.log(target_primitives);
  BOSON_UTIL.create_material();
}

export function remove_target_set(name){
  const removed = viewer.scene.primitives.remove(target_primitives[name]);
}

export function set_orbit_trail(id, trail){
  console.log(id);
  const entity = viewer.entities.getById(id);

  if(trail === ALL){
    entity.path.trailTime = 10000000;
  }
  else if(trail === NONE){
    entity.path.trailTime = 0;
  }
  else if(trail === ONE_REV){
    const time = viewer.clock.currentTime;
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

export function set_satellite_color(id, cssColor){
  const color = Cesium.Color.fromCssColorString(cssColor);
  const entity = viewer.entities.getById(id);
  if(!entity) return;

  entity.path.material.color = color;
}

export function set_sensor_color(id, sensor_type, css_color){
  const color = Cesium.Color.fromCssColorString(css_color).withAlpha(.5);
  const entity = viewer.entities.getById(id);
  if(sensor_type === "Doppler Cone Angle"){
    entity.customPatternSensor.lateralSurfaceMaterial.color = color;
  }
  else if(sensor_type === "Graze Angle"){
    entity.conicSensor.lateralSurfaceMaterial.color = color;
  }
}

export function set_target_color(id, cssColor){
  const color = Cesium.Color.fromCssColorString(cssColor).withAlpha(.9);
  const primitive = target_primitives[id];
  primitive.appearance.material.uniforms.color = color;
}

export function set_select_target_color(id, cssColor){
  const color = Cesium.Color.fromCssColorString(cssColor).withAlpha(.9);
  const primitive = target_primitives[id];
  primitive.appearance.material.uniforms.select = color;
}
