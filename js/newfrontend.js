import * as BOSON from './demo.js'
import * as BOSON_FILELOADER from './file_loader.js';

const simulation = new BOSON.Simulation(document.getElementById('view'));

/* PANEL */
function initPanel(){
  const close_nav_element = document.getElementById("close_nav");
  const open_nav_element = document.getElementById("open_nav");

  close_nav_element.onclick = closeNav;
  open_nav_element.onclick = openNav;

  const tabs = document.getElementsByClassName("tab");
  for(const tab of tabs){
    tab.onclick = () => selectTab(tab.id);
  }
}

function openNav(){
  const panel = document.getElementById("side_panel_1");
  panel.style.width = "300px";
}
function closeNav(){
  const panel = document.getElementById("side_panel_1");
  panel.style.width = "0px"
}

function selectTab(id){
  const SELECTED = "selected";

  const tab = document.getElementById(id);
  if(tab){
    const tabs = document.getElementsByClassName("tab");
    for(const tab of tabs){
      tab.classList.remove(SELECTED);
    }

    tab.classList.add(SELECTED);

    const side_panel_elements = document.getElementsByClassName("side_panel_element");
    const tab_content = document.querySelector("[tabID='" + id + "']");

    for(const element of side_panel_elements){
      //TODO: add sticky mode
      //if(element.getAttribute("tabid")==="controls") continue;
      element.classList.add("hide");
    }
    tab_content.classList.remove("hide");
  }
}

initPanel();
/* PANEL */

/* WIDGETS */
function insertSelect(select, value){
  const p = document.createElement("p");
  p.innerHTML = value;

  const option = document.createElement("option");
  option.value = value;
  option.appendChild(p);
  select.add(option);
  return option;
}

function removeSelect(select, value){
  for(const option of select){
    if(option.value === value){
      option.remove();
      return true;
    }
  }
  return false;
}

function setName(element, name){
  const p = element.getElementsByClassName("name")[0];
  p.innerHTML = name;
}

function fileDropSelected(element, name){
  element.classList.add("selected");
  const p = element.getElementsByTagName("p")[0];
  p.innerHTML = name;
}

function fileDropDeselected(element, name){
  element.classList.remove("selected");
  const p = element.getElementsByTagName("p")[0];
  p.innerHTML = name;
}

function hideContainer(element, hide=true){
  if(hide){
    element.classList.add("hide");
  }
  else{
    element.classList.remove("hide");
  }
}
/* WIDGETS */

/* EXPORTS */
export function saveState(){
  const json = JSON.stringify(simulation.toJSON());
  const blob = new Blob([json], {type: "text/plain;"});
  saveAs(blob, "preset.json"); //from FileSaver.js
}

export function insertFollowSelect(value){
  const select = document.getElementById("follow_select");
  insertSelect(select, value);
}

export function removeFollowSelect(value){
  const select = document.getElementById("follow_select");
  removeSelect(select, value);
  select.onchange();
}

export function setSatelliteColor(id, color){
  const satellite = document.getElementById(id);
  if(satellite){
    const color_picker = document.getElementsByClassName("color_picker")[0];
    color_picker.value = color;
    simulation.setOrbitColor(id, color);
  }
}

export function setSatelliteTrail(id, orbit_trail){
  const global_select = document.getElementById("global_orbit_trail_select");
  const satellite = document.getElementById(id);
  if(satellite){
    global_select.value = "";
    const select = satellite.getElementsByClassName("orbit_trail_select")[0];
    select.value = orbit_trail;
    simulation.setOrbitTrail(id, orbit_trail);
  }
}

export function setAllSatelliteTrail(names, orbit_trail){
  for(name of names){
      const node = document.getElementById(name);
      if(node){
        const select = node.getElementsByClassName("orbit_trail_select")[0];
        select.value = orbit_trail;
        simulation.setOrbitTrail(name, orbit_trail);
      }
  }
}
/* EXPORTS */



/* NODES */
function linkFileDrop(element, load_file_func){
  const prevent_default = (e)=>e.preventDefault();
  const load_file = (e) => {if(e.target.files.length > 0) load_file_func(e.target.files);};

  const input = element.getElementsByTagName("input")[0];
  input.oninput = load_file;

  element.ondrop = load_file;
  element.ondragover = prevent_default;
  element.ondragenter = prevent_default;
  element.ondragleave = prevent_default;
  element.onclick = () => {
    input.click();
    //reset input so it will trigger again
    //when user selects same file
    input.value = null;
  }
}

function linkGlobalControls(){
  const select = document.getElementById("follow_select");
  const save = document.getElementById("save_button");
  const preset = document.getElementById("preset_file_drop");

  select.onchange = (e) => {
    simulation.follow(select.value);
  };

  save.onclick = (e) => {
    saveState();
  }

  linkFileDrop(preset, (e) => {
    BOSON_FILELOADER.loadPresetJSON(e[0], importPreset);
  });
}

function linkPlatformNode(){
  const platform_controls = document.getElementById("platform_control_grid");
  const platform_filedrop = document.getElementById("ephemeris_file_drop");
  const sensor_filedrop = document.getElementById("sensor_file_drop");
  const iw_filedrop = document.getElementById("iw_file_drop");
  const cw_filedrop = document.getElementById("cw_file_drop");
  const remove_all = document.getElementById("platform_delete_all");

  linkFileDrop(platform_filedrop, (e) => {
    BOSON_FILELOADER.loadEphemerisFile(e[0], importPlatform);
  });

  linkFileDrop(sensor_filedrop, (e) => {
    BOSON_FILELOADER.loadSensorFile(e[0], importSensors);
  });

  linkFileDrop(iw_filedrop, (e) => {
    BOSON_FILELOADER.loadWindowFile(e[0], (name, window)=>importWindow(name, window, true));
  });

  linkFileDrop(cw_filedrop, (e) => {
    BOSON_FILELOADER.loadWindowFile(e[0], (name, window)=>importWindow(name, window, false));
  });

  remove_all.onclick = (e) => {
    removeAllSatellites();
  }
}

function linkTargetNode(){
  const target_filedrop = document.getElementById("target_file_drop");
  const remove_all = document.getElementById("target_delete_all");

  linkFileDrop(target_filedrop, (e) => {
    BOSON_FILELOADER.loadTargetFile(e, importTargetSet);
  });

  remove_all.onclick = (e) => {
    removeAllTargetSets();
  }
}

function linkScheduleNode(){
  const schedule_filedrop = document.getElementById("schedule_file_drop");
  const remove_all = document.getElementById("schedule_delete_all");

  linkFileDrop(schedule_filedrop, (e) => {
    BOSON_FILELOADER.loadScheduleFile(e[0], importSchedule);
  });

  remove_all.onclick = (e) => {
    removeSchedule();
  }
}

function createAndLinkSatellite(name, platform){
  const satellite_scroll_box = document.getElementById("satellite_scroll_box");
  const dummy_satellite = document.getElementById("dummy_satellite_node");
  const satellite = dummy_satellite.cloneNode(true);
  const control = satellite.getElementsByClassName("light_container")[0];
  const color_picker = satellite.getElementsByClassName("color_picker")[0];
  const orbit_trail_select = satellite.getElementsByClassName("orbit_trail_select")[0];

  satellite.id = name;

  setName(satellite, name);
  satellite.onclick = (e) => {
    if(e.target.classList.contains("showable")){
      control.classList.toggle("hide");
    }
  };

  color_picker.value = platform.color;
  color_picker.oninput = () => {
    //just pass in color_picker value because it set when manually picked
    setSatelliteColor(name, color_picker.value);
  };

  orbit_trail_select.value = platform.orbitTrail;
  orbit_trail_select.onchange = (e) => {
    setSatelliteTrail(name, orbit_trail_select.value);
  }

  satellite.classList.remove("hide");
  satellite_scroll_box.appendChild(satellite);
}

function createAndLinkTargetSet(name, target_set){
  const target_scroll_box = document.getElementById("target_scroll_box");
  const dummy_target = document.getElementById("dummy_target_node");
  const target = dummy_target.cloneNode(true);
  const control = target.getElementsByClassName("light_container")[0];

  const target_color = control.getElementsByClassName("color_picker")[0];
  const select_color = control.getElementsByClassName("color_picker")[1];
  const alpha_slider = control.getElementsByClassName("slider")[0];

  target.id = name;
  target.classList.remove("hide");

  setName(target, name);

  target.onclick = (e) => {
    if(e.target.classList.contains("showable")){
      control.classList.toggle("hide");
    }
  };


  target_color.value = target_set.color;
  select_color.value = target_set.selectColor;
  alpha_slider.value = target_set.alpha;
  target_color.oninput = (e) => {
    simulation.setTargetColor(name, target_color.value, parseFloat(alpha_slider.value));
  }
  select_color.oninput = (e) => {
    simulation.setTargetSelectColor(name, select_color.value);
  }
  alpha_slider.oninput = (e) => {
    simulation.setTargetColor(name, target_color.value, parseFloat(alpha_slider.value));
  }

  target_scroll_box.appendChild(target);
}

linkGlobalControls();
linkPlatformNode();
linkTargetNode();
linkScheduleNode();
/* NODES */


/* IMPORT */
function importPreset(name, json){
  console.log(name, json);

  removeAllSatellites();
  removeAllTargetSets();

  if(json.platform){
    const platform = json.platform[0];

    importPlatform(platform.name, platform.satellites);

    const sensors = platform.sensors;
    const iw = platform.iwWindow;
    const cw = platform.cwWindow;

    if(sensors){
      importSensors(sensors.name, sensors.parameters);
    }
    if(iw){
      importWindow(iw.name, iw, true);
    }
    if(cw){
      importWindow(cw.name, cw, false);
    }
  }

  const targets = json.targets;
  targets.forEach(target => importTargetSet(target.name, target));

  const schedule = json.schedule;
  if(schedule){
    importSchedule(schedule.name, schedule);
  }

  const preset_filedrop = document.getElementById("preset_file_drop");
  fileDropSelected(preset_filedrop, name);
}

function importPlatform(name, platform){
  const platform_controls = document.getElementById("platform_control_grid");
  const platform_filedrop = document.getElementById("ephemeris_file_drop");
  const global_orbit_select = document.getElementById("global_orbit_trail_select");
  const platforms = Object.values(platform).sort((a, b) => a.id > b.id).map(p => p.name);

  console.log(name, platform);

  platforms.forEach(name => createAndLinkSatellite(name, platform[name]));
  platforms.forEach(insertFollowSelect);
  setName(platform_controls, name);
  hideContainer(platform_filedrop, true);
  hideContainer(platform_controls, false);
  global_orbit_select.value = "";
  global_orbit_select.onchange = () => {
    setAllSatelliteTrail(platforms, global_orbit_select.value);
  }
  simulation.importPlatform(name, platform);
}

function importSensors(name, sensors){
  const sensor_file_drop = document.getElementById("sensor_file_drop");

  console.log(name, sensors);

  fileDropSelected(sensor_file_drop, name);
  simulation.importSensors(name, sensors);
}

function importWindow(name, window, isIW=true){
  const file_drop = document.getElementById(isIW ? "iw_file_drop" : "cw_file_drop");

  console.log(name, window);

  fileDropSelected(file_drop, name);
  simulation.importWindow(window, isIW);
}

function importTargetSet(name, target_set){
  const target_filedrop = document.getElementById("target_file_drop");

  console.log(name, target_set);

  createAndLinkTargetSet(name, target_set);
  hideContainer(target_filedrop, true);

  simulation.importTargetSet(name, target_set);
}

function importSchedule(name, schedule){
  const schedule_filedrop = document.getElementById("schedule_file_drop");
  const schedule_controls = document.getElementById("schedule_control_grid");
  console.log(name, schedule);

  hideContainer(schedule_filedrop, true);
  hideContainer(schedule_controls, false);

  simulation.importSchedule(name, schedule);
}
/* IMPORT */


/* DELETES */
function removeAllChildren(element){
  while(element.firstChild){
    element.removeChild(element.lastChild);
  }
}

function removeAllSatellites(){
  const platform_controls = document.getElementById("platform_control_grid");
  const platform_filedrop = document.getElementById("ephemeris_file_drop");
  const sensor_filedrop = document.getElementById("sensor_file_drop");
  const iw_filedrop = document.getElementById("iw_file_drop");
  const cw_filedrop = document.getElementById("cw_file_drop");
  const satellite_scroll_box = document.getElementById("satellite_scroll_box");


  hideContainer(platform_controls, true);
  hideContainer(platform_filedrop, false);

  fileDropDeselected(sensor_filedrop, "Load Sensor");
  fileDropDeselected(iw_filedrop, "Load IW");
  fileDropDeselected(cw_filedrop, "Load CW");
  removeAllChildren(satellite_scroll_box);
  simulation.getAllPlatformNames().forEach(removeFollowSelect);
  simulation.removeAllOrbits();

}

function removeAllTargetSets(){
  const target_filedrop = document.getElementById("target_file_drop");
  const traget_scroll_box = document.getElementById("target_scroll_box");

  hideContainer(target_filedrop, false);

  removeAllChildren(target_scroll_box);
  simulation.removeAllTargetSets();
}

function removeSchedule(){
  const schedule_filedrop = document.getElementById("schedule_file_drop");
  const schedule_controls = document.getElementById("schedule_control_grid");

  hideContainer(schedule_filedrop, false);
  hideContainer(schedule_controls, true);
  simulation.removeSchedule();
}
/* DELETES */
