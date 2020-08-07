# Boson
>A web-app that visualizes collection schedules of orbiting
electro-optical/radar sensors.

## Dependencies
All dependencies are prebuilt and stored in `./js/build/`. These dependencies
are either imported with a script tag in `index.html` or imported with es6 modules.

- [Cesium 1.72](https://cesium.com/downloads/)
- [MathDotSqrt/cesium-sensor-volumes](https://github.com/MathDotSqrt/cesium-sensor-volumes)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/)

*Boson should be backward compatible with all versions of Cesium >= **1.62***

## Deployment
To deploy Boson, it needs to be hosted on a webserver.
