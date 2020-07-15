"use strict";
import * as BOSON from './demo.js'
import * as BOSON_EPHEMERIS from './ephemeris.js'
import * as BOSON_TARGETS from './targets.js'
import * as BOSON_FILELOADER from './file_loader.js';

const colors = ["#34b1eb", "#00FFFF", "#C0392B", "#BB8FCE", "#1ABC9C", "#BA4A00", "#C02B9A"];

const simulation = new BOSON.Simulation(document.getElementById('view'));
/* PANEL */
export function openNav(){
  document.getElementById("side_panel_1").style.width = "275px";
}
export function closeNav(){
  document.getElementById("side_panel_1").style.width = "0px";
}

for(const element of document.getElementsByClassName("close_btn")){
  element.onclick = closeNav;
}

for(const element of document.getElementsByClassName("open_btn")){
  element.onclick = openNav;
}
/* PANEL */

/* GLOBAL CONTROLS */
function createGlobalControls(){
  const global_panel = document.getElementById("global");

  const table = document.createElement("table");
  global_panel.append(table);

  function insert_field(table, field_name, field){
    const tr = table.insertRow(-1);
    tr.className = "global_control";
    const cell0 = tr.insertCell(0);
    insertP(cell0, field_name);

    const cell1 = tr.insertCell(1);
    cell1.className = "data";
    cell1.append(field);
  }

  const selector = createFollowSelector(["None"]);
  insert_field(table, "Follow", selector);
  insert_field(table, "Example", "example_control");
  insert_field(table, "Delete All", "delete_all");
}

function createFollowSelector(names){
  const select = document.createElement("select");
  select.className = "follow_selector";
  select.onchange = function(event){
    const value = select.options[select.selectedIndex].value;
    simulation.follow(value);
    //simulation.setOrbitTrail(names, value);
  }

  for(const name of names){
    insertSelect(select, name);
  }

  return select;
}

export function insertFollowSelect(name){
  const select = document.getElementsByClassName("follow_selector")[0];
  if(select){
    insertSelect(select, name);
  }
}

export function removeFollowSelect(name){
  const select = document.getElementsByClassName("follow_selector")[0];
  if(select){
    for(const option of select){
      if(option.value == name){
        const value_before = select.value;
        option.remove();
        const value_after = select.value;
        if(value_before != value_after){
          simulation.follow("None");
        }

        break;
      }
    }
  }
}

function insertSelect(select, value){
  const option = document.createElement("option");
  option.value = value;
  insertP(option, value);
  select.add(option);
}
createGlobalControls();
/* GLOBAL CONTROLS */

/* SATELLITE */
export function appendSatellite(name){
  const satellite_list = document.querySelector("#satellite_list");
  const satellite = createSatelliteNode(name);
  satellite_list.append(satellite);
  insertFollowSelect(name);
}

function deleteSatelliteNode(name){
  document.getElementById(name).remove();
  removeFollowSelect(name);

}

function createSatelliteNode(name){
  const new_node = document.createElement("div");
  new_node.id = name;
  new_node.className = "element showable";
  insertP(new_node, name, "showable");

  const controls = document.createElement("div");
  controls.className = "element_controls";
  const table = document.createElement("table");
  controls.append(table);

  function insert_field(table, field_name, field){
    const tr = table.insertRow(-1);
    const cell0 = tr.insertCell(0);
    insertP(cell0, field_name);

    const cell1 = tr.insertCell(1);
    cell1.append(field);
  }

  const color_picker = createColorPicker(name, function(name, color){
    simulation.setOrbitColor(name, color);
  });
  insert_field(table, "Color", color_picker);

  const alpha_data = document.createElement("p");
  alpha_data.className = "data";
  alpha_data.append(document.createTextNode("0.5"));
  insert_field(table, "Alpha", alpha_data);

  const orbit_selector = createOrbitSelector([name]);
  insert_field(table, "Orbit Trail", orbit_selector);

  const sensor_type = document.createElement("p");
  sensor_type.className = "data";
  sensor_type.append(document.createTextNode("squint"));
  insert_field(table, "Sensor Type", sensor_type);

  new_node.append(controls);

  new_node.onclick = function(event){
    const classList = event.target.classList;
    if(!classList.contains("showable")){
      return;
    }
    new_node.classList.toggle("show");
  }
  return new_node;
}

function createEphemerisNode(name, satellite_names){
  const new_node = document.createElement("div");
  new_node.id = name;
  new_node.className = "element showable";
  new_node.append(createDeleteNodeTitle(name, onDeleteHandeler));

  const controls = document.createElement("div");
  controls.className = "element_controls";
  const table = document.createElement("table");
  controls.append(table);

  function insert_field(table, field_name, field){
    const tr = table.insertRow(-1);
    const cell0 = tr.insertCell(0);
    insertP(cell0, field_name);

    const cell1 = tr.insertCell(1);
    cell1.append(field);
  }

  for(const satellite_name of satellite_names){
    const p = document.createElement("p");
    p.className = "data";
    p.append(document.createTextNode(satellite_name));
    insert_field(table, "ID:", p);
  }

  const orbit_selector = createOrbitSelector(satellite_names);
  insert_field(table, "Orbit Trail", orbit_selector);

  const sensor_input = createSensorInput();
  insert_field(table, "Sensor File", sensor_input)

  new_node.append(controls);

  new_node.onclick = function(event){
    const classList = event.target.classList;
    if(!classList.contains("showable")){
      return;
    }
    new_node.classList.toggle("show");
  }
  return new_node;
}

function createTargetNode(name, num_targets){
  const new_node = document.createElement("div");
  new_node.id = name;
  new_node.className = "element showable";
  new_node.append(createDeleteNodeTitle(name, onDeleteTargetHandler));
  //insertP(new_node, name, "showable");

  const controls = document.createElement("div");
  controls.className = "element_controls";
  const table = document.createElement("table");
  controls.append(table);

  function insert_field(table, field_name, field){
    const tr = table.insertRow(-1);
    const cell0 = tr.insertCell(0);
    insertP(cell0, field_name);

    const cell1 = tr.insertCell(1);
    cell1.append(field);
  }

  const color_picker = createColorPicker(name, function(name, color){
    simulation.setTargetColor(name, color);
  });
  insert_field(table, "Color", color_picker);

  const color_select_picker = createColorPicker(name, function(name, color){
    simulation.setTargetSelectColor(name, color);
  }, "#ff0000");
  insert_field(table, "Select Color", color_select_picker);

  const p = document.createElement("p");
  p.className = "data";
  p.append(document.createTextNode(num_targets + ""));
  insert_field(table, "Num Targets:", p);

  new_node.append(controls);

  new_node.onclick = function(event){
    const classList = event.target.classList;
    if(!classList.contains("showable")){
      return;
    }
    new_node.classList.toggle("show");
  }
  return new_node;
}

function createScheduleNode(name){
  const new_node = document.createElement("div");
  new_node.id = name;
  new_node.className = "element showable";
  new_node.append(createDeleteNodeTitle(name, function(){console.log("lol");}));

  return new_node;
}

function createDeleteNodeTitle(text, deleteFunc){
  const header = document.createElement("div");
  header.className = "title showable";

  const table = document.createElement("table");
  const tr = table.insertRow(-1);

  const cell0 = tr.insertCell(0);
  cell0.className = "showable";
  insertP(cell0, text, "showable");
  const cell1 = tr.insertCell(1);
  cell1.className = "showable";

  const close = document.createElement("a");
  close.className = "close";
  close.innerHTML = "&times;";
  close.onclick = deleteFunc;
  cell1.append(close);
  header.append(table);

  return header;
}

function createOrbitSelector(names){
  const select = document.createElement("select");
  select.className = "orbit_trail_selector";
  select.onchange = function(event){
    const value = select.options[select.selectedIndex].value;
    simulation.setOrbitTrail(names, value);
  }

  const option_all = document.createElement("option");
  option_all.value = "all";
  insertP(option_all, "All");

  const option_one = document.createElement("option");
  option_one.value = "one_rev";
  insertP(option_one, "One Rev");

  const option_none = document.createElement("option");
  option_none.value = "none";
  insertP(option_none, "None");

  select.add(option_all);
  select.add(option_one);
  select.add(option_none);

  return select;
}

function createColorPicker(id, set_color_func, default_color){
  const color_picker = document.createElement("input");
  color_picker.className = "color_picker";
  color_picker.type = "color";
  color_picker.id = id;

  const color = default_color ? default_color : colors.pop();
  color_picker.value = color;
  color_picker.addEventListener("input", function(event){
    set_color_func(id, event.target.value);
  });
  set_color_func(id, color);


  return color_picker;
}

function createSensorInput(name){
  const sensor_input = document.createElement("div");
  sensor_input.className = "sensor_input";
  insertP(sensor_input, "SENSOR FILE");

  const id = name + "_sensor_file_input";

  const file_input = document.createElement("input");
  file_input.className = "file_input";
  file_input.type = "file";
  file_input.id = id;
  sensor_input.append(file_input);

  function appendSensor(name){
    sensor_input.classList.add("selected");
    const p = sensor_input.getElementsByTagName("p");
    if(p){
      p[0].innerHTML = name.split('.')[0];
    }
  }

  sensor_input.onclick = function(){
    const file_input = document.getElementById(id);
    file_input.onchange = function(e){
      const files = e.target.files;
      for(const file of files){
        BOSON_FILELOADER.loadSensorFile(file, function(name, result){
          appendSensor(name);
          importSensor(name, result);
        });
      }
    };
    file_input.click();
  }

  return sensor_input;
}

function insertP(parent, text, className=""){
  const p = document.createElement("p");
  p.className = className;
  p.append(document.createTextNode(text));
  parent.append(p);
  return parent;
}

/* SATELLITE */

/* FILE DROP */

function onToggleHandler(event){
  // const parentElement = event.target.parentElement;
  // const names = parentElement.getAttribute("ephemeris_name").split(',');
  // BOSON.make_trail_visible(names);
}

function onDeleteHandeler(event){

  // TODO: Fix this. This is kinda bad lol
  const parentElement = event.target
    .parentElement
    .parentElement
    .parentElement
    .parentElement
    .parentElement
    .parentElement;
  const names = parentElement.getAttribute("ephemeris_name").split(',');
  parentElement.remove();

  for(const name of names){
    BOSON_EPHEMERIS.delete_ephemeris(name);
    deleteSatelliteNode(name);
  }

  simulation.removeOrbit(names);
  //BOSON.remove_simulation(names);
}

function onDeleteTargetHandler(event){
  // TODO: Fix this. This is kinda bad lol
  const parentElement = event.target
    .parentElement
    .parentElement
    .parentElement
    .parentElement
    .parentElement
    .parentElement;
  const names = parentElement.getAttribute("target_set_name").split(',');
  parentElement.remove();

  for(const name of names){
    BOSON_TARGETS.delete_target_set(name);
    simulation.removeTargetSet(name);
  }

  //BOSON.delete_target_set(names);
}

export function appendDropFileElement(name, satellite_names){
  if(satellite_names === undefined){
    satellite_names = [name];
  }
  const new_node = createEphemerisNode(name, satellite_names);
  new_node.setAttribute("ephemeris_name", name);

  const reference_node = document.querySelector('#file_drop_ephemeris');
  reference_node.before(new_node);
  return new_node;
}

export function appendDropFileElementPlatform(name, platform_names){
  const node = appendDropFileElement(name, platform_names);
  node.setAttribute("ephemeris_name", platform_names.join());
}

export function appendDropFileElementTarget(name, num_targets){
  const new_node = createTargetNode(name, num_targets);
  new_node.setAttribute("target_set_name", name);

  const reference_node = document.querySelector('#file_drop_target');
  reference_node.before(new_node);
  return new_node;
}

export function appendDropFileElementSchedule(name){
  console.log(name);
  const new_node = createScheduleNode(name);
  new_node.setAttribute("schedule_name", name);

  const reference_node = document.querySelector('#file_drop_schedule');
  reference_node.before(new_node);
  return new_node;
}

function importEphemeris(name, platform){
  if("position" in platform){
    BOSON_EPHEMERIS.register_ephemeris(name, platform);
    simulation.importOrbit(name);
    appendSatellite(name);
    appendDropFileElement(name);
  }
  else{
    const names = [];

    for(const id of Object.keys(platform)){
      const new_name = name + "_" + id;
      BOSON_EPHEMERIS.register_ephemeris(new_name, platform[id]);
      names.push(new_name);
      simulation.importOrbit(new_name, id);
    }
    for(const name of names){
      appendSatellite(name);
    }
    appendDropFileElementPlatform(name, names);
  }
}

function importSensor(name, sensors){
  console.log(sensors);
  for(const sensor of sensors){
    simulation.importSensor(sensor);
  }
}

function importTargetSet(name, target){
  console.log(target);
  appendDropFileElementTarget(name, Object.values(target).length);
  BOSON_TARGETS.register_target_set(name, target);
  simulation.importTargetSet(name);
}

function importSchedule(file, schedule){
  console.log(schedule);
  simulation.importSchedule(file, schedule);
  appendDropFileElementSchedule(file.name.split('.')[0]);
}

function dragOverHandler(event){
  event.preventDefault();
}
function dragStartHandler(event){
  event.preventDefault();
}
function dragEndHandler(event){
  event.preventDefault();
}

function dropHandlerEphemeris(event){
  event.preventDefault();
  if(!BOSON_FILELOADER.isValidFile(event)) return;

  const file = event.dataTransfer.items[0].getAsFile();
  // appendDropFileElement(file.name);
  BOSON_FILELOADER.loadEphemerisFile(file, importEphemeris);
}

function dropHandlerSensor(event){
  event.preventDefault();
  if(!BOSON_FILELOADER.isValidFile(event)) return;

  const file = event.dataTransfer.items[0].getAsFile();
  // appendDropFileElement(file.name);
  BOSON_FILELOADER.loadSensorFile(file, importSensor);
}

function dropHandlerTarget(event){
  event.preventDefault();
  if(!BOSON_FILELOADER.isValidFile(event)) return;
  const file = event.dataTransfer.items[0].getAsFile();
  // appendDropFileElement(file.name);
  BOSON_FILELOADER.loadTargetFile(file, importTargetSet);
}

function dropHandlerSchedule(event){
  event.preventDefault();
  if(!BOSON_FILELOADER.isValidFile(event)) return;
  const file = event.dataTransfer.items[0].getAsFile();
  BOSON_FILELOADER.loadScheduleFile(file, importSchedule);
}

const ephemeris = document.getElementById("file_drop_ephemeris");
ephemeris.ondrop = dropHandlerEphemeris;
ephemeris.ondragover = dragOverHandler;
ephemeris.ondragenter = dragStartHandler;
ephemeris.ondragleave = dragEndHandler;
ephemeris.onclick = function(){
  const input = document.getElementById("ephemeris_file_input");
  input.onchange = function(e){
    const files = e.target.files;
    for(const file of files){
      BOSON_FILELOADER.loadEphemerisFile(file, importEphemeris);
    }
  };
  input.click();
}


const target = document.getElementById("file_drop_target");
target.ondrop = dropHandlerTarget;
target.ondragover = dragOverHandler;
target.ondragenter = dragStartHandler;
target.ondragleave = dragEndHandler;
target.onclick = function(){
  const input = document.getElementById("target_file_input");
  input.onchange = function(e){
    const files = e.target.files;
    for(const file of files){
      BOSON_FILELOADER.loadTargetFile(file, importTargetSet);
    }
  };
  input.click();
}

const schedule = document.getElementById("file_drop_schedule");
schedule.ondrop = dropHandlerSchedule;
schedule.ondragover = dragOverHandler;
schedule.ondragenter = dragStartHandler;
schedule.ondragleave = dragEndHandler;
schedule.onclick = function(){
  const input = document.getElementById("schedule_file_input");
  input.onchange = function(e){
    const files = e.target.files;
    for(const file of files){
      BOSON_FILELOADER.loadScheduleFile(file, importSchedule);
    }
  };
  input.click();
}
/* FILE DROP */
