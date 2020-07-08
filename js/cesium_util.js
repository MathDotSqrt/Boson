


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
}

export function create_squint_sensor(entity, min_clock, max_clock, min_angle, max_angle, color){
  entity.addProperty('customPatternSensor');
  const sensor = entity.customPatternSensor = new CesiumSensors.CustomPatternSensorGraphics();

  const NUM_POINTS = 16;
  const angle_delta = max_clock - min_clock;

  const directions = [];
  for (var i = 0; i < NUM_POINTS; i++) {
		const clock = Cesium.Math.toRadians(angle_delta * i / (NUM_POINTS-1) + min_clock);
		const cone = Cesium.Math.toRadians(min_angle);
    directions.push(new Cesium.Spherical(clock, cone));
	}

  for(var i = NUM_POINTS - 1; i >= 0; i--){
    const clock = Cesium.Math.toRadians(angle_delta * i / (NUM_POINTS-1) + min_clock);
		const cone = Cesium.Math.toRadians(max_angle);
    directions.push(new Cesium.Spherical(clock, cone));
  }

  directions.push(null);

  for (var i = 0; i < NUM_POINTS; i++) {
		const clock = Cesium.Math.toRadians(angle_delta * i / (NUM_POINTS - 1) + min_clock);
		const cone = Cesium.Math.toRadians(min_angle);
    directions.push(new Cesium.Spherical(clock + Math.PI, cone));
	}

  for(var i = NUM_POINTS - 1; i >= 0; i--){
    const clock = Cesium.Math.toRadians(angle_delta * i / (NUM_POINTS-1) + min_clock);
		const cone = Cesium.Math.toRadians(max_angle);
    directions.push(new Cesium.Spherical(clock + Math.PI, cone));
  }


  sensor.directions = directions;
  sensor.radius = 5500000;
  sensor.lateralSurfaceMaterial = new Cesium.ColorMaterialProperty(color.withAlpha(.5));
  sensor.intersectionWidth = 10;

}
