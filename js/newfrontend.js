/* PANEL */
export function openNav(){
  document.getElementById("side_panel_1").style.width = "285px";
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
