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
    const target = parseTarget(new_file.name, fileReader.result);
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
  //
  // BOSON_EPHEMERIS.register_ephemeris(name, ephemeris);
  // BOSON.import_data(name);
  // appendDropFileElement(name);
  // appendSatellite(name);
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

  // const names = [];
  //
  // for(const id of Object.keys(platform)){
  //   const new_name = name + "_" + id;
  //   BOSON_EPHEMERIS.register_ephemeris(new_name, platform[id]);
  //   names.push(new_name);
  //   console.log(id);
  //   BOSON.import_data(new_name, id);
  // }
  // for(const name of names){
  //   appendSatellite(name);
  // }
  // appendDropFileElementPlatform(name, names);
}

function parseTarget(name, lines){
  lines = lines.split('\n');
  const targets = {};

  var target = {id: lines[1].split(',')[1], coords: []};
  for(var i = 1; i < lines.length; i++){
    const line = lines[i];
    const split = line.split(',');

    const current_target = split[1];
    //const coord = {lat: split[3], lon: split[4], alt: split[5]};
    //const coord = [Number(split[3]), Number(split[4]), Number(split[5])];
    const coord = [Number(split[4]) * 180 / 3.1415, Number(split[3]) * 180 / 3.1415];

    if(current_target !== target.id){
      targets[target.id] = target;
      target = {id: current_target, coords: []};
    }
    target.coords = target.coords.concat(coord);
  }
  targets[target.id] = target;

  return targets;
  // BOSON_TARGETS.register_target_set(name, targets);
  // BOSON.import_target_set(name);
  // appendDropFileElementTarget(name, Object.keys(targets).length);
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

    if(targetID && targetID.includes("stk")) continue;

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
