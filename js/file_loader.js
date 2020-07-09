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



export function loadEphemerisFile(new_file){
  const fileReader = new FileReader();
  fileReader.onloadstart = function(){
  };
  fileReader.onload = function(){
    parseEphemerisFile(new_file.name, fileReader.result);
  };

  fileReader.readAsText(new_file);
}

export function loadSensorFile(new_file, func){
  const fileReader = new FileReader();
  fileReader.onloadstart = function(){
  };
  fileReader.onload = function(){
    const result = parseSensor(new_file.name, fileReader.result);
    if(func && result){
      func(new_file);
    }
  };
  fileReader.readAsText(new_file);
}

export function loadTargetFile(new_file){
  const fileReader = new FileReader();
  fileReader.onloadstart = function(){
  };
  fileReader.onload = function(){
    parseTarget(new_file.name, fileReader.result);
  };
  fileReader.readAsText(new_file);
}

export function loadScheduleFile(new_file){
  const fileReader = new FileReader();
  fileReader.onloadstart = function(){
  };
  fileReader.onload = function(){
    parseSchedule(new_file, fileReader.result);
  };

  fileReader.readAsText(new_file);
}

async function parseEphemerisFile(name, fr){
  const lines = fr.split('\n');
  if(lines[0].trim() === "platform"){
    parsePlatform(name, lines);
  }
  else{
    parseRegular(name, lines);
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

  BOSON_EPHEMERIS.register_ephemeris(name, ephemeris);
  BOSON.import_data(name);
  appendDropFileElement(name);
  appendSatellite(name);
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
    ephemeris.position.push(Number(split[4]));
    ephemeris.position.push(Number(split[3]));

    ephemeris.velocity.push(Number(split[5]));
    ephemeris.velocity.push(Number(split[7]));
    ephemeris.velocity.push(Number(split[6]));
  }

  const names = [];

  for(const id of Object.keys(platform)){
    const new_name = name + "_" + id;
    BOSON_EPHEMERIS.register_ephemeris(new_name, platform[id]);
    names.push(new_name);
    console.log(id);
    BOSON.import_data(new_name, id);
  }
  for(const name of names){
    appendSatellite(name);
  }
  appendDropFileElementPlatform(name, names);

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
  BOSON_TARGETS.register_target_set(name, targets);
  BOSON.import_target_set(name);
  appendDropFileElementTarget(name, Object.keys(targets).length);
}

function parseSensor(name, lines){
  lines = lines.split('\n');

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
    BOSON.import_sensor(sensor);
  }

  return true;
}

function parseSchedule(name, lines){
  lines = lines.split('\n');
  console.log(lines[0]);
}
