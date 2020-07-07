"use strict";
import {get_max, get_min} from "./util.js"
var data = {};

function scale(buffer, min, max){
  const buffer_max = get_max(buffer);
  const buffer_min = get_min(buffer);
  return buffer.map(x => {
    const new_x = ((x-buffer_min) * (max-min)) / (buffer_max-buffer_min) + min;
    return new_x;
  });
}

function multiply(buffer, scale){
  return buffer.map(x => {
    return x * scale;
  });
}

export function register_ephemeris(name, new_ephemeris){
  new_ephemeris.position = new Float32Array(new_ephemeris.position);
  data[name] = new_ephemeris;
  return name;
}

export function delete_ephemeris(name){
  if(name in data){
    delete data[name];
  }
  else{
    console.log(data);
    console.log("COULD NOT REMOVED EPHEMERIS: " + name);
  }
}

export function get_ephemeris(name){
  return data[name];
}

export function has_ephermeris(name){
  return name in data;
}

function binary_search(buffer, value){
  var start = 0;
  var end = buffer.length - 1;
  while(start <= end){
    const middle = Math.floor((start + end) / 2);

    if(value === buffer[middle]){
      return [middle];
    }

    if(value > buffer[middle]){
      start = middle + 1;
    } else {
      end = middle - 1;
    }
  }

  return [start-1, start];
}

function interpolate(pos_a, pos_b, frac){
  const nx = pos_a.x + (pos_b.x - pos_a.x) * frac;
  const ny = pos_a.y + (pos_b.y - pos_a.y) * frac;
  const nz = pos_a.z + (pos_b.z - pos_a.z) * frac;

  var i = {x: nx, y: ny, z: nz};
  return i;
}

function get_pos(index, pos_buffer){
  return {
    x: pos_buffer[3 * index + 0],
    y: pos_buffer[3 * index + 1],
    z: pos_buffer[3 * index + 2]
  };
}

export function sample(time, name){
  if(!has_ephermeris(name)){
    return {indices: undefined, pos: undefined, vel: undefined};
  }

  const ephemeris = get_ephemeris(name);
  const time_buffer = ephemeris.time;
  const pos_buffer = ephemeris.position;
  const vel_buffer = ephemeris.velocity;
  const index = binary_search(ephemeris.time, time);

  var position;
  var velocity;

  if(index.length == 1){
    position = get_pos(index[0], pos_buffer);
    velocity = get_pos(index[0], vel_buffer);
  }
  if(index.length == 2){
    const frac = (time - time_buffer[index[0]]) / (time_buffer[index[1]] - time_buffer[index[0]]);

    const pos_a = get_pos(index[0], pos_buffer);
    const pos_b = get_pos(index[1], pos_buffer);
    position = interpolate(pos_a, pos_b, frac);

    const vel_a = get_pos(index[0], vel_buffer);
    const vel_b = get_pos(index[1], vel_buffer);
    velocity = interpolate(vel_a, vel_b, frac);
  }
  return {indices: index, pos: position, vel: velocity};
}
