import * as BOSON from './demo.js'
import * as BOSON_FILELOADER from './file_loader.js';

const simulation = new BOSON.Simulation(document.getElementById('view'));

/* PANEL */
function initPanel(){
  for(const element of document.getElementsByClassName("close_btn")){
    element.onclick = closeNav;
  }

  for(const element of document.getElementsByClassName("open_btn")){
    element.onclick = openNav;
  }

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
  console.log(p);
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

export function insertFollowSelect(value){
  const select = document.getElementById("follow_select");
  insertSelect(select, value);
}

export function removeFollowSelect(value){
  const select = document.getElementById("follow_select");
  removeSelect(select, value);
}

export function setSatelliteColor(){

}
/* EXPORTS */



/* NODES */
function linkGlobalControls(){
  const select = document.getElementById("follow_select");
  const save = document.getElementById("save_button");
  const preset = document.getElementById("preset_file_input");

  select.onchange = (e) => {
    simulation.follow(select.value);
  };
}

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
  }
}

function linkPlatformNode(){
  const platform_controls = document.getElementById("platform_control_grid");
  const platform_filedrop = document.getElementById("ephemeris_file_drop");
  const sensor_filedrop = document.getElementById("sensor_file_drop");
  const iw_filedrop = document.getElementById("iw_file_drop");
  const cw_filedrop = document.getElementById("cw_file_drop");

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
}

function createAndLinkSatellite(name){
  const satellite_scroll_box = document.getElementById("satellite_scroll_box");
  const dummy_satellite = document.getElementById("dummy_satellite_node");
  const satellite = dummy_satellite.cloneNode(true);


  setName(satellite, name);

  satellite.classList.remove("hide");
  satellite_scroll_box.appendChild(satellite);
}

linkGlobalControls();
linkPlatformNode();
/* NODES */


/* IMPORT */
function importPlatform(name, platform){
  const platform_controls = document.getElementById("platform_control_grid");
  const platform_filedrop = document.getElementById("ephemeris_file_drop");

  const platforms = Object.keys(platform).sort();
  console.log(name, platform);

  platforms.forEach(createAndLinkSatellite);
  platforms.forEach(insertFollowSelect);
  setName(platform_controls, name);
  hideContainer(platform_filedrop, true);
  hideContainer(platform_controls, false);
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
/* IMPORT */






















//
