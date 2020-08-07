# Boson
>A web-app that visualizes collection schedules of orbiting
electro-optical/radar sensors.

## Dependencies
All dependencies are prebuilt and stored in `./js/build/`. These dependencies
are either imported with a script tag in `index.html` or imported with es6 modules.

### Current Dependencies
- [Cesium 1.72](https://cesium.com/downloads/)
- [MathDotSqrt/cesium-sensor-volumes](https://github.com/MathDotSqrt/cesium-sensor-volumes)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js/)

*Boson should be backward compatible with all versions of Cesium >= __1.62__*

## Deployment

Boson runs best on the newest version of chrome, but will run on any browser
that supports ES6 and WebGL.

### Hosting
Although Boson runs entirely on the front-end's browser, Cesium will not serve
cross-origin requests unless it is hosted on a webserver. The project folder needs to be hosted on a webserver. The user can either host
the webserver locally on his machine and connect to the project via
[localhost](localhost:8080/boson/new_ui.html) or host it remotely and connect to
it via the hosts IP.
