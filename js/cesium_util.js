/*
  This is a modified version of EllipsoidSurfaceAppearance vertex shader.
  The only modification was adding the color attribute and passing it
  to the fragment shader. This color attribute is a value passed to each
  vertex in the shader. The color attribute's alpha value is used in the
  fragment shader to decide whether to sample from a default color uniform
  or from a selected color uniform. This is done for performance reasons

*/
const vertexSource =
`
attribute vec3 position3DHigh;
attribute vec3 position3DLow;
attribute vec2 st;
attribute vec4 color;         //added color attribute
attribute float batchId;
varying vec3 v_positionMC;
varying vec3 v_positionEC;
varying vec2 v_st;
varying vec4 v_color;         //define fragment variable for color attribute
void main() {
  vec4 p = czm_computePosition();
  v_positionMC = position3DHigh + position3DLow;
  v_positionEC = (czm_modelViewRelativeToEye * p).xyz;
  v_st = st;
  v_color = color;            //apply vertex color attribute to fragment
  gl_Position = czm_modelViewProjectionRelativeToEye * p;
}
`

/*
  https://github.com/CesiumGS/cesium/wiki/Fabric
  Frabric lives in the fragment shader. A custom
  material is defined with this source to color the
  fragment. The v_color attribute was passed from
  the vertex shader and is used to select which uniform
  color to use.
*/
const fabric_source =
`
varying vec4 v_color;         //fragment color attribute from vertex shader
czm_material czm_getMaterial(czm_materialInput materialInput){
  czm_material m = czm_getDefaultMaterial(materialInput);
  m.diffuse = v_color.a > .5 ? select.rgb : color.rgb;
  m.alpha = v_color.a > .5 ? select.a : color.a;
  return m;
}
`

export function create_material(){
  const material = new Cesium.Material({
    fabric : {
      uniforms : {
        color : new Cesium.Color(1, 1, 0, 1),
        select : new Cesium.Color(1, 0, 1, 1)
      },
      source : fabric_source
    }
  });

  const appearance = new Cesium.EllipsoidSurfaceAppearance({
    flat : true,
    vertexShaderSource : vertexSource,
    //fragmentShaderSource : fragmentSource,  //no need for a custom fragment shader
    material : material,
  });

  return appearance;
}

//https://groups.google.com/forum/#!topic/cesium-dev/FKfcfuw2TpI
export function createIWPolyLine(entity, polylineCollection){

}

export function create_rectangular_sensor(entity, x_angle, y_angle, color){
  console.log('CHRIS TRENKOV');
  entity.addProperty('rectangularSensor');
  const sensor = entity.rectangularSensor = new CesiumSensors.RectangularSensorGraphics();
  sensor.xHalfAngle = Cesium.Math.toRadians(x_angle);
  sensor.yHalfAngle = Cesium.Math.toRadians(y_angle);
  console.log(color);
  sensor.lateralSurfaceMaterial = new Cesium.ColorMaterialProperty(color.withAlpha(.9));
  sensor.radius = 1500000;
  //sensor.radius = 1500000;
  sensor.show = true;
  sensor.intersectionWidth = 10;

}

export function create_conic_sensor(entity, inner_half_angle, outer_half_angle, color){
  entity.addProperty('conicSensor');
  const sensor = entity.conicSensor = new CesiumSensors.ConicSensorGraphics();
  sensor.innerHalfAngle = Cesium.Math.toRadians(inner_half_angle);
  sensor.outerHalfAngle = Cesium.Math.toRadians(outer_half_angle);
  sensor.lateralSurfaceMaterial = new Cesium.ColorMaterialProperty(color.withAlpha(.5));
  sensor.radius = 5500000;
  sensor.show = true;
  sensor.intersectionWidth = 10;
  entity.ellipsoid = new Cesium.EllipsoidGraphics({
    radii: new Cesium.Cartesian3(5500000, 5500000, 5500000),
    maximumCone: Cesium.Math.toRadians(outer_half_angle),
    material: color.withAlpha(.5),
    outline: new Cesium.ConstantProperty(true),
    show: false
  });

  console.log(new Cesium.CheckerboardMaterialProperty());
}

export function create_squint_sensor(entity, min_clock, max_clock, min_angle, max_angle, color){
  entity.addProperty('customPatternSensor');
  const sensor = entity.customPatternSensor = new CesiumSensors.CustomPatternSensorGraphics();

  const NUM_POINTS = 16;
  const LINE_POINTS = 8;
  function mix(min, max, t){
    return min * (1 - t) + max * t;
  }

  const angle_delta = max_clock - min_clock;

  const directions = [];
  for (var i = 0; i <= 1; i += 1 / (NUM_POINTS-1)) {
		const clock = Cesium.Math.toRadians(mix(min_clock, max_clock, i));
		const cone = Cesium.Math.toRadians(min_angle);
    directions.push(new Cesium.Spherical(clock, cone));
	}

  for(var i = 0; i <= 1; i += 1 / (LINE_POINTS-1)){
    const clock = Cesium.Math.toRadians(max_clock);
		const cone = Cesium.Math.toRadians(mix(min_angle, max_angle, i));
    directions.push(new Cesium.Spherical(clock, cone));
  }

  for(var i = 0; i <= 1; i += 1 / (NUM_POINTS-1)){
    const clock = Cesium.Math.toRadians(mix(max_clock, min_clock, i));
		const cone = Cesium.Math.toRadians(max_angle);
    directions.push(new Cesium.Spherical(clock, cone));
  }

  for(var i = 0; i <= 1; i += 1 / (LINE_POINTS-1)){
    const clock = Cesium.Math.toRadians(min_clock);
		const cone = Cesium.Math.toRadians(mix(max_angle, min_angle, i));
    directions.push(new Cesium.Spherical(clock, cone));
  }

  directions.push(null);

  for (var i = 0; i <= 1; i += 1 / (NUM_POINTS-1)) {
		const clock = Cesium.Math.toRadians(mix(min_clock, max_clock, i));
		const cone = Cesium.Math.toRadians(min_angle);
    directions.push(new Cesium.Spherical(clock + Math.PI, cone));
	}

  for(var i = 0; i <= 1; i += 1 / (LINE_POINTS-1)){
    const clock = Cesium.Math.toRadians(max_clock);
		const cone = Cesium.Math.toRadians(mix(min_angle, max_angle, i));
    directions.push(new Cesium.Spherical(clock + Math.PI, cone));
  }

  for(var i = 0; i <= 1; i += 1 / (NUM_POINTS-1)){
    const clock = Cesium.Math.toRadians(mix(max_clock, min_clock, i));
		const cone = Cesium.Math.toRadians(max_angle);
    directions.push(new Cesium.Spherical(clock + Math.PI, cone));
  }

  for(var i = 0; i <= 1; i += 1 / (LINE_POINTS-1)){
    const clock = Cesium.Math.toRadians(min_clock);
		const cone = Cesium.Math.toRadians(mix(max_angle, min_angle, i));
    directions.push(new Cesium.Spherical(clock + Math.PI, cone));
  }

  sensor.directions = directions;
  sensor.radius = 5500000;
  sensor.lateralSurfaceMaterial = new Cesium.ColorMaterialProperty(color.withAlpha(.5));
  sensor.intersectionWidth = 10;

}
