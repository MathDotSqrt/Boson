/* PANEL */
function initPanel(){
  for(const element of document.getElementsByClassName("close_btn")){
    element.onclick = closeNav;
  }

  for(const element of document.getElementsByClassName("open_btn")){
    element.onclick = openNav;
  }

  const tabs = document.getElementsByClassName("selector");
  for(const tab of tabs){
    tab.onclick = () => selectTab(tab.id);
  }
}

function openNav(){
  document.getElementById("side_panel_1").style.width = "285px";
}
function closeNav(){
  document.getElementById("side_panel_1").style.width = "0px";
}

function selectTab(id){
  const SELECTED = "selected";

  const tab = document.getElementById(id);
  if(tab){
    const tabs = document.getElementsByClassName("selector");
    for(const tab of tabs){
      tab.classList.remove(SELECTED);
    }

    tab.classList.add(SELECTED);
  }
}

initPanel();
/* PANEL */
