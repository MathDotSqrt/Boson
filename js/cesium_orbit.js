
//https://groups.google.com/forum/#!topic/cesium-dev/FKfcfuw2TpI
export function createIWPolyline(positions, polylineCollection){
  const color = Cesium.Color.RED;
  const colors = [];
  for(var i = 0; i < positions.length-1; i++){
    colors.push(color);
  }
  console.log(colors);

  polylineCollection.add({
    positions : positions,
    vertexFormat : Cesium.PolylineColorAppearance.VERTEX_FORMAT,
    colors : colors,
    colorsPerVertex: false
  });
  colors.length = 1;
  console.log(colors);

  colors.length = 3;
  console.log(colors);

}
