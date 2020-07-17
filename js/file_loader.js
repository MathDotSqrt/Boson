"use strict";
import * as BOSON from './demo.js';
import * as BOSON_EPHEMERIS from './ephemeris.js';
import * as BOSON_TARGETS from './targets.js';
import {appendDropFileElement, appendDropFileElementPlatform, appendDropFileElementTarget, appendSatellite} from './frontend.js';

function pFileReader(file){
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



export function loadEphemerisFile(new_file, func){
  const promise = pFileReader(new_file);
  promise.then((text) => {
    const result = parseEphemerisFile(new_file.name, text);
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

export function loadTargetFile(file_list, func){
  const TARGETS = "targets.csv";
  const TARGET_VERTICES = "target_vertices.csv";

  //const dir = file_list[0].webkitRelativePath.split('/')[0];

  const file_array = Object.values(file_list);
  const targets = file_array.find(file => file.name === TARGETS);
  const target_vertices = file_array.find(file => file.name === TARGET_VERTICES);

  const target_promise = pFileReader(targets).then(parseTarget, console.error);
  const vertex_promise = pFileReader(target_vertices).then(parseTargetVertex, console.error);

  Promise.all([target_promise, vertex_promise])
  .then(([targets, vertices]) => {
    if(targets === null || vertices === null){
      throw new Error("Failed to parse target deck!");
    }

    const [point, dsa, mcg] = createTargetObject(targets, vertices);
    func("deck_point", point)
    func("deck_dsa", dsa)
    func("deck_mcg", mcg)
  });
}

export function loadScheduleFile(new_file, func){
  const fileReader = new FileReader();
  fileReader.onloadstart = function(){
  };
  fileReader.onload = function(){
    const schedule = parseSchedule(new_file.name, fileReader.result);
    if(schedule){
      func(new_file, schedule);
    }
  };

  fileReader.readAsText(new_file);
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

function parseEphemerisFile(name, text){
  return parsePlatform(name, text);
}

function parsePlatform(name, lines){
  lines = lines.split("\n");
  const header = lines[0];

  const columns = {
    platformID : "PlatformID",
    time : "Time",
    posx : "PositionX",
    posy : "PositionY",
    posz : "PositionZ",
    velx : "VelocityX",
    vely : "VelocityY",
    velz : "VelocityZ"
  }

  const indexMap = getHeaderIndices(header, columns);
  console.log(indexMap);

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

    if(!(id in platform)){
      console.log("NEW ID");
      platform[id] = {time: [], position: [], velocity: [], id: id};
    }

    const ephemeris = platform[id];
    ephemeris.time.push(Number(split[indexMap.time]));
    //convert km to meters
    ephemeris.position.push(Number(split[indexMap.posx]) * 1000);
    ephemeris.position.push(Number(split[indexMap.posy]) * 1000);
    ephemeris.position.push(Number(split[indexMap.posz]) * 1000);

    ephemeris.velocity.push(Number(split[indexMap.velx]) * 1000);
    ephemeris.velocity.push(Number(split[indexMap.vely]) * 1000);
    ephemeris.velocity.push(Number(split[indexMap.velz]) * 1000);
  }

  console.log(platform);
  return platform;
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
  const point_targets = {};
  targets.filter(t => t.typeID === 1).forEach(point => {
    point_targets[point.targetID] = {
      targetID : point.targetID,
      coords : createPointVerticies(point.lon, point.lat, point.size),
    }
  });

  const dsa_targets = {};
  targets.filter(t => t.typeID === 3)
  .filter(t => t.targetID in vertices)
  .forEach(dsa => {
    dsa_targets[dsa.targetID] = {
      targetID : dsa.targetID,
      coords : vertices[dsa.targetID].coords
    }
  });

  const mcg_targets = {};
  targets.filter(t => t.typeID === 5)
  .filter(t => t.targetID in vertices)
  .forEach(mcg => {
    mcg_targets[mcg.targetID] = {
      targetID : mcg.targetID,
      coords : vertices[mcg.targetID].coords
    }
  });

  return [point_targets, dsa_targets, mcg_targets];
}

function parseTarget(lines){
  const TARGET = "TargetID";
  const TYPE = "TypeID";
  const LATITUDE = "CentroidLatitude";
  const LONGITUDE = "CentroidLongitude";
  const SIZE = "Size";

  lines = lines.split('\n');
  const header = lines[0].split(',').map(x => x.trim());
  const targetIndex = header.indexOf(TARGET);
  const typeIndex = header.indexOf(TYPE);
  const latIndex = header.indexOf(LATITUDE);
  const lonIndex = header.indexOf(LONGITUDE);
  const sizeIndex = header.indexOf(SIZE);

  if([targetIndex, typeIndex, latIndex, lonIndex, sizeIndex].some(x => x < 0)){
    return null;
  }

  const targets = [];
  for(var i = 1; i < lines.length -1; i++){
    const split = lines[i].split(',');
    if(split === undefined) break;

    const targetID = split[targetIndex];
    const typeID = parseInt(split[typeIndex]);
    const lon = split[lonIndex] * 180 / 3.1415;
    const lat = split[latIndex] * 180 / 3.1415;
    const size = split[sizeIndex];

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
  const TARGET = "TargetID";
  const LATITUDE = "Latitude";
  const LONGITUDE = "Longitude";

  lines = lines.split('\n');
  const header = lines[0].split(',');
  const targetIndex = header.indexOf(TARGET);
  const latIndex = header.indexOf(LATITUDE);
  const lonIndex = header.indexOf(LONGITUDE);

  if([targetIndex, latIndex, lonIndex].some(x => x < 0)){
    return null;
  }

  const targets = {};

  var target = {id: lines[1].split(',')[1], coords: []};
  for(var i = 1; i < lines.length; i++){
    const line = lines[i];
    const split = line.split(',');

    const current_target = split[targetIndex];
    //const coord = {lat: split[3], lon: split[4], alt: split[5]};
    //const coord = [Number(split[3]), Number(split[4]), Number(split[5])];
    const coord = [Number(split[lonIndex]) * 180 / 3.1415, Number(split[latIndex]) * 180 / 3.1415];

    if(current_target !== target.id){
      targets[target.id] = target;
      target = {id: current_target, coords: []};
    }
    target.coords = target.coords.concat(coord);
  }
  targets[target.id] = target;

  return targets;
}

function parseSensor(name, lines){
  lines = lines.split('\n');
  const sensors = [];
  for(var i = 1; i < lines.length; i++){
    const line = lines[i];
    const split = line.split(',');

    if(split.length !== 4) continue;

    const sensor = {
      platformID    : Number(split[0]),
      sensorType    : split[1],
      minValue      : Number(split[2]),
      maxValue      : Number(split[3]),
    }
    console.log("ID: " + i);
    sensors.push(sensor);
  }

  return sensors;
}

function parseSchedule(name, lines){
  lines = lines.split('\n');
  const PLATFORM = "PlatformID";
  const TARGET = "TargetID";
  const START = "ImageStartTime";
  const END = "ImageEndTime";
  const LONGITUDE = "Longitude";
  const LATITUDE = "Latitude";

  const header = lines[0].split(',');
  const platformIndex = header.indexOf(PLATFORM);
  const targetIndex = header.indexOf(TARGET);
  const startIndex = header.indexOf(START);
  const endIndex = header.indexOf(END);
  const lonIndex = header.indexOf(LONGITUDE);
  const latIndex = header.indexOf(LATITUDE);

  if([platformIndex, targetIndex,
      startIndex, endIndex,
      lonIndex, latIndex].some(x => x < 0)){
    return null;
  }

  const schedule = {};

  for(var i = 1; i < lines.length; i++){
    const line = lines[i];
    const split = line.split(',');
    const platformID = parseInt(split[platformIndex]);
    const targetID = split[targetIndex];
    const start = parseFloat(split[startIndex]);
    const end = parseFloat(split[endIndex]);
    const lon = parseFloat(split[lonIndex]);
    const lat = parseFloat(split[latIndex]);

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

  return schedule;
}
