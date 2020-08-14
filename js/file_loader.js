"use strict";
/*
...
file_loader: is a collection of functions that handle reading files and parsing
them asynchronously. When files are parsed they trigger a callback passed in
by the calling code.
...
*/

import * as BOSON from './demo.js';

function pFileReader(file){
  //Wraps FileReader with a Promise
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (e) => reject(e);
    reader.onload = () => resolve(reader.result);
    reader.readAsText(file);
  });
}

export function isValidFile(event){
  console.log(event.dataTransfer.items.length);
  if(event === undefined){
    return false;
  }

  if(event.dataTransfer.items.length !== 1){
    return false;
  }

  return true;
}

export function loadPresetJSON(new_file, func){
  const promise = pFileReader(new_file);
  promise.then((text) => {
    var result = null;
    try{
      result = JSON.parse(text);
      func(new_file.name, result);
    } catch(err){console.log("Error, could not parse", err);}

  });
}

export function loadEphemerisFile(new_file, func){
  const promise = pFileReader(new_file);
  promise.then((text) => {
    const result = parsePlatform(new_file.name, text);
    if(result){
      func(new_file.name, result);
    }
  }, (e) => console.log(e));
}

export function loadSensorFile(new_file, func){
  const promise = pFileReader(new_file);
  promise.then((text) => {
    const result = parseSensor(new_file.name, text);
    if(result){
      func(new_file.name, result);
    }
  }, (e) => console.log(e));
}

export function loadWindowFile(new_file, func){
  const promise = pFileReader(new_file);
  promise.then((text) => {
    const result = parseWindow(new_file.name, text);
    if(result){
      func(new_file.name, result);
    }
  }, e => console.log(e));
}

export function loadTargetFile(file_list, func){
  //contains centroid location of all targets
  const TARGETS = "targets.csv";
  //contains vertex data for non point targets
  const TARGET_VERTICES = "target_vertices.csv";

  //hacky way to get dir, non standard
  //const dir = file_list[0].webkitRelativePath.split('/')[0];

  const file_array = Object.values(file_list);
  const targets = file_array.find(file => file.name === TARGETS);
  const target_vertices = file_array.find(file => file.name === TARGET_VERTICES);

  //parse the two files independently
  const target_promise = pFileReader(targets).then(parseTarget, console.error);
  const vertex_promise = pFileReader(target_vertices).then(parseTargetVertex, console.error);

  //when both target and vertex data gets parsed
  Promise.all([target_promise, vertex_promise])
  .then(([targets, vertices]) => {
    //TODO: fix this error handling. This (might?) break the code.
    if(targets === null || vertices === null){
      throw new Error("Failed to parse target deck!");
    }

    //this returns 3 target_sets. Call callback 3 times for each target set
    const [point, dsa, mcg] = createTargetObject(targets, vertices);
    func("deck_point", point)
    func("deck_dsa", dsa)
    func("deck_mcg", mcg)
  });
}

export function loadScheduleFile(new_file, func){
  const promise = pFileReader(new_file);
  promise.then(text => {
    const schedule = parseSchedule(new_file.name, text);
    if(schedule){
      func(new_file.name, schedule);
    }
  })
}

function getHeaderIndices(header, columnMap){
  header = header.split(",").map(col => col.trim());

  const columns = Object.entries(columnMap);
  const indices = columns.map(([key, value]) => [key, header.indexOf(value)]);
  if(indices.some(([key, value]) => value < 0)){
    return null;
  }

  const indexMap = {};
  indices.forEach(([key, value]) => indexMap[key] = value);

  return indexMap;
}

function parsePlatform(name, lines){
  lines = lines.split("\n");
  const header = lines[0];

  const columnMap = {
    platformID : "PlatformID",
    time : "Time",
    posx : "PositionX",
    posy : "PositionY",
    posz : "PositionZ",
    velx : "VelocityX",
    vely : "VelocityY",
    velz : "VelocityZ"
  }

  const indexMap = getHeaderIndices(header, columnMap);

  if(indexMap === null){
    return null;
  }

  const platform = {};
  for(const line of lines){
    const split = line.split(',');

    const id = parseInt(split[indexMap.platformID]);

    if(isNaN(id)){
      continue;
    }

    const ephemeris_name = name + "_" + id;
    if(!(id in platform)){
      const ephemeris = { time: [], position: [], velocity: [] };
      platform[id] = {
        name: ephemeris_name,
        id: id,
        color: "#00ff00",
        orbitTrail: "all",
        ephemeris: ephemeris
      };
    }

    const ephemeris = platform[id].ephemeris;
    ephemeris.time.push(Number(split[indexMap.time]));
    //convert km to meters
    ephemeris.position.push(Number(split[indexMap.posx]) * 1000);
    ephemeris.position.push(Number(split[indexMap.posy]) * 1000);
    ephemeris.position.push(Number(split[indexMap.posz]) * 1000);

    ephemeris.velocity.push(Number(split[indexMap.velx]) * 1000);
    ephemeris.velocity.push(Number(split[indexMap.vely]) * 1000);
    ephemeris.velocity.push(Number(split[indexMap.velz]) * 1000);
  }

  return platform;
}

function parseSensor(name, lines){
  lines = lines.split('\n');
  const header = lines[0];

  const columnMap = {
    platformID : "PlatformID",
    constraint : "Constraint Type",
    minValue : "Min Value",
    maxValue : "Max Value"
  };

  const indexMap = getHeaderIndices(header, columnMap);
  if(indexMap === null){
    return null;
  }

  const sensors = [];
  for(var i = 1; i < lines.length; i++){
    const line = lines[i];
    const split = line.split(',');
    const sensor = {
      platformID    : Number(split[indexMap.platformID]),
      sensorType    : split[indexMap.constraint],
      minValue      : Number(split[indexMap.minValue]),
      maxValue      : Number(split[indexMap.maxValue]),
    }
    sensors.push(sensor);
  }

  return sensors;
}

function parseWindow(name, lines){
  lines = lines.split('\n');
  const header = lines[0];

  const columnMap = {
    platformID : "PlatformID",
    start : "StartTime",
    end : "EndTime"
  };

  const indexMap = getHeaderIndices(header, columnMap);
  if(indexMap === null){
    return null;
  }

  const intervals = {};

  for(var i = 1; i < lines.length; i++){
    const line = lines[i];
    const split = line.split(",");

    const platformID = parseInt(split[indexMap.platformID]);
    const start = Number(split[indexMap.start]);
    const end = Number(split[indexMap.end]);

    if(platformID === undefined || isNaN(platformID)) continue;

    if(!(platformID in intervals)){
      intervals[platformID] = [];
    }

    intervals[platformID].push([start, end]);
  }

  const window = {
    name: name,
    intervals: intervals
  }
  return window;
}

function createPointVerticies(lon, lat, size){
  size = .1;
  return [
    lon + size, lat + size,
    lon - size, lat + size,
    lon - size, lat - size,
    lon + size, lat - size
  ]
}

function createTargetObject(targets, vertices){
  const make_targets = name => {return {
    name: name,
    color: "#00ff00",
    selectColor: "#ff0000",
    alpha: 1,
    targetSet: {}
  }};

  const point_targets = make_targets("deck_point");
  targets.filter(t => t.typeID === 1).forEach(point => {
    point_targets.targetSet[point.targetID] = {
      targetID : point.targetID,
      coords : createPointVerticies(point.lon, point.lat, point.size),
    }
  });

  const dsa_targets = make_targets("deck_dsa");
  targets.filter(t => t.typeID === 3)
  .filter(t => t.targetID in vertices)
  .forEach(dsa => {
    dsa_targets.targetSet[dsa.targetID] = {
      targetID : dsa.targetID,
      coords : vertices[dsa.targetID].coords
    }
  });

  const mcg_targets = make_targets("deck_mcg");
  targets.filter(t => t.typeID === 5)
  .filter(t => t.targetID in vertices)
  .forEach(mcg => {
    mcg_targets.targetSet[mcg.targetID] = {
      targetID : mcg.targetID,
      coords : vertices[mcg.targetID].coords
    }
  });

  return [point_targets, dsa_targets, mcg_targets];
}

function parseTarget(lines){
  lines = lines.split('\n');
  const header = lines[0];

  const columnMap = {
    target : "TargetID",
    type : "TypeID",
    longitude : "CentroidLongitude",
    latitude : "CentroidLatitude",
    size : "Size"
  };
  const indexMap = getHeaderIndices(header, columnMap);
  if(indexMap === null){
    return null;
  }

  const targets = [];
  for(var i = 1; i < lines.length; i++){
    const split = lines[i].split(',');
    if(split === undefined) break;

    const targetID = split[indexMap.target];
    const typeID = parseInt(split[indexMap.type]);
    const lon = split[indexMap.longitude] * 180 / 3.1415;
    const lat = split[indexMap.latitude] * 180 / 3.1415;
    const size = split[indexMap.size];

    targets.push({
      targetID : targetID,
      typeID : typeID,
      lat : lat,
      lon : lon,
      size : size
    });

  }

  return targets;
}

function parseTargetVertex(lines){
  lines = lines.split('\n');
  const header = lines[0];
  const columnMap = {
    target : "TargetID",
    longitude : "Longitude",
    latitude : "Latitude"
  }

  const indexMap = getHeaderIndices(header, columnMap);
  if(indexMap === null){
    return null;
  }

  const targets = {};

  var target = {id: lines[1].split(',')[1], coords: []};
  for(var i = 1; i < lines.length; i++){
    const line = lines[i];
    const split = line.split(',');

    const current_target = split[indexMap.target];
    //const coord = {lat: split[3], lon: split[4], alt: split[5]};
    //const coord = [Number(split[3]), Number(split[4]), Number(split[5])];
    const coord = [
      Number(split[indexMap.longitude]) * 180 / 3.1415926,
      Number(split[indexMap.latitude]) * 180 / 3.1415926
    ];

    if(current_target !== target.id){
      targets[target.id] = target;
      target = {id: current_target, coords: []};
    }
    target.coords = target.coords.concat(coord);
  }
  targets[target.id] = target;

  return targets;
}

function parseSchedule(name, lines){
  lines = lines.split('\n');
  const header = lines[0];
  const columnMap = {
    platformID : "PlatformID",
    target : "TargetID",
    start : "ImageStartTime",
    end : "ImageEndTime",
    longitude : "Longitude",
    latitude : "Latitude"
  }
  const indexMap = getHeaderIndices(header, columnMap);
  if(indexMap === null){
    return null;
  }

  const schedule = {};

  for(var i = 1; i < lines.length; i++){
    const line = lines[i];
    const split = line.split(',');
    const platformID = parseInt(split[indexMap.platformID]);
    const targetID = split[indexMap.target];
    const start = parseFloat(split[indexMap.start]);
    const end = parseFloat(split[indexMap.end]);
    const lon = parseFloat(split[indexMap.longitude]);
    const lat = parseFloat(split[indexMap.latitude]);

    //if(targetID && targetID.includes("stk")) continue;

    if(!(platformID in schedule)){
      schedule[platformID] = {
        platformID: platformID,
        targets: [],
        interval: [],
        coords : [],
      };
    }

    schedule[platformID].targets.push(targetID);
    schedule[platformID].interval.push(start, end);
    schedule[platformID].coords.push(lon, lat);
  }

  return {
    name : name,
    schedule : schedule
  };
}
