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

## Developer Guide

### Important Files
  - ### `new_ui.html`
  Base html of Boson
  - ### `frontend.js`
  A collection of functions that add event listeners to existing html elements
  and make the UI responsive.
  - ### `file_loader.js`
  A collection of functions that handle reading files and parsing the content
  into JSON asynchronously. When files are successfully parsed they trigger a callback.
  - ### `demo.js`
  `Simulation` is a class that represents the current state of the simulation.
  This class handles the importing and serialization of state. The primary function
  of this class it to guarantee any changes made to the UI will be represented in
  cesium's `Scene` class. Simulation and its children does not own any cesium entities or
  primitives. This state ownership architecture designed to work well with including
  additional visualization libraries.
  - ### `cesium_scene.js`
  `Scene` is a class that owns cesium's `Viewer`, `entities` and `primitives`.

  <img src="docs/codereview.png" width="800">
