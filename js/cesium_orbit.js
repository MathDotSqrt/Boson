
//https://groups.google.com/forum/#!topic/cesium-dev/FKfcfuw2TpI
export function createIntervalPolyline(intervals, positions, viewer){
  const polylines = intervals.map(([start, stop]) => {
    return viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({
          start: start,
          stop: stop,
        }),
      ]),
      position: positions,
      path: {
        resolution: 10000000,  //large resolution really helps with performance
        material: Cesium.Color.RED,
        width: 1,
        trailTime: 10000000,
        leadTime: 0,
      },
    });
  });

  return polylines;
}
