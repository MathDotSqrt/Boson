"use strict";
import * as BOSON from './demo.js';
import * as BOSON_EPHEMERIS from './ephemeris.js';
import * as BOSON_TARGETS from './targets.js';
import {appendDropFileElement, appendDropFileElementPlatform, appendDropFileElementTarget, appendSatellite} from './frontend.js';


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
  const fileReader = new FileReader();
  fileReader.onloadstart = function(){
  };
  fileReader.onload = function(){
    const result = parseEphemerisFile(new_file.name, fileReader.result);
    if(result){
      func(new_file.name, result);
    }
  };

  fileReader.readAsText(new_file);
}

export function loadSensorFile(new_file, func){
  const fileReader = new FileReader();
  fileReader.onloadstart = function(){
  };
  fileReader.onload = function(){
    const result = parseSensor(new_file.name, fileReader.result);
    if(result){
      func(new_file.name, result);
    }
  };
  fileReader.readAsText(new_file);
}

export function loadTargetFile(new_file, func){
  const fileReader = new FileReader();
  fileReader.onloadstart = function(){
  };
  fileReader.onload = function(){
    var target = parseSubtarget(new_file.name, fileReader.result);
    if(target === null){
      target = parseTarget(new_file.name, fileReader.result);
    }
    if(target){
      func(new_file.name, target);
    }
  };
  fileReader.readAsText(new_file);
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

function parseEphemerisFile(name, fr){
  const lines = fr.split('\n');
  if(lines[0].trim() === "platform"){
    return parsePlatform(name, lines);
  }
  else{
    return parseRegular(name, lines);
  }

}

function parseRegular(name, lines){
  const ephemeris = {time: [], position: [], velocity: [], id: 1};

  for(const line of lines){
    const split = line.split(',');
    if(split.length != 7) continue;
    ephemeris.time.push(Number(split[0]));
    ephemeris.position.push(Number(split[1]));
    ephemeris.position.push(Number(split[2]));
    ephemeris.position.push(Number(split[3]));

    ephemeris.velocity.push(Number(split[4]));
    ephemeris.velocity.push(Number(split[5]));
    ephemeris.velocity.push(Number(split[6]));
  }

  return ephemeris;
}

function parsePlatform(name, lines){
  const platform = {};

  for(const line of lines){
    const split = line.split(',');
    if(split.length != 9) continue;

    const id = line[0];

    if(!(id in platform)){
      console.log("NEW ID");
      platform[id] = {time: [], position: [], velocity: [], id: id};
    }

    const ephemeris = platform[id];
    ephemeris.time.push(Number(split[1]));
    ephemeris.position.push(Number(split[2]));
    ephemeris.position.push(Number(split[3]));
    ephemeris.position.push(Number(split[4]));

    ephemeris.velocity.push(Number(split[5]));
    ephemeris.velocity.push(Number(split[6]));
    ephemeris.velocity.push(Number(split[7]));
  }

  return platform;
}

function parseSubtarget(name, lines){
  const TARGET = "TargetID";
  const LATITUDE = "Latitude";
  const LONGITUDE = "Longitude";
  const ORIENTATION = "MajorAxis";

  lines = lines.split('\n');
  const header = lines[0].split(',');
  const targetIndex = header.indexOf(TARGET);
  const latIndex = header.indexOf(LATITUDE);
  const lonIndex = header.indexOf(LONGITUDE);
  const orientationIndex = header.indexOf(ORIENTATION);
  console.log(header);
  console.log(header.indexOf("Longitude"));
  console.log(orientationIndex);

  if([targetIndex, latIndex, lonIndex, orientationIndex].some(x => x < 0)){
    return null;
  }

  const targets = {};
  for(var i = 1; i < lines.length -1; i++){
    const split = lines[i].split(',');
    if(split === undefined) break;
    const targetID = split[targetIndex];
    const lon = split[lonIndex] * 180 / 3.1415;
    const lat = split[latIndex] * 180 / 3.1415;

    const coords = [
      lon + .1, lat + .1,
      lon - .1, lat + .1,
      lon - .1, lat - .1,
      lon + .1, lat - .1,

    ];

    targets[targetID] = {
      id : targetID,
      coords : coords
    }
  }

  return targets;
}

function parseTarget(name, lines){
  const TARGET = "TargetID";
  const LATITUDE = "Latitude";
  const LONGITUDE = "Longitude";

  lines = lines.split('\n');
  const header = lines[0].split(',');
  const targetIndex = header.indexOf(TARGET);
  const latIndex = header.indexOf(LATITUDE);
  const lonIndex = header.indexOf(LONGITUDE);

  if([targetIndex, latIndex, lonIndex].some(x => x < 0)){
    console.log("FAIL");
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

  const header = lines[0].split(',');
  const platformIndex = header.indexOf(PLATFORM);
  const targetIndex = header.indexOf(TARGET);
  const startIndex = header.indexOf(START);
  const endIndex = header.indexOf(END);

  if(platformIndex === -1
    || targetIndex === -1
    || startIndex === -1
    || endIndex === -1){

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

    //if(targetID && targetID.includes("stk")) continue;

    if(!(platformID in schedule)){
      schedule[platformID] = {
        platformID: platformID,
        targets: [],
        interval: []
      };
    }

    schedule[platformID].targets.push(targetID);
    schedule[platformID].interval.push(start, end);
  }

  return schedule;
}
