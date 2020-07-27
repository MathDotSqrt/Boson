import * as BOSON_RENDER from "./cesium_scene.js"

export default class WindowInterval {
  constructor(parent, scene){
    this._scene = scene;

    this._parent = parent;
    console.log(this._parent);
    this._name = this._parent.name;

    this._IWInterval = null;
    this._CWInterval = null;

    this._complInterval = null;   //complement of IW or CW interval
    this._mutexIWInterval = null; //mutually exclusive image window interval
    this._mutexCWInterval = null; //mutually exclusive comm window interval
    this._mutinInterval = null;   //mutually inclusive interval

    this.DefaultColor = "#00ff00";
    this.IWColor = "#ff0000";
    this.CWColor = "#0000ff";
    this.BothColor = "#ff00ff";
  }

  setIWInterval(interval){
    this._IWInterval = interval;
    if(this._IWInterval && this._CWInterval){
      this._compute();
    }
  }

  setCWInterval(interval){
    this._CWInterval = interval;
    if(this._IWInterval && this._CWInterval){
      this._compute();
    }
  }

  isComputed(){
    return this._mutinInterval != null
      && this._mutexIWInterval != null
      && this._mutexCWInterval != null
      && this._complInterval != null;
  }

  set DefaultColor(color){
    this._defaultColor = color;
    if(this.isComputed()){
      this._scene.setOrbitColor(this._name, color, "default");
    }
  }

  get DefaultColor(){
    return this._defaultColor;
  }

  set IWColor(color){
    this._iwColor = color;
    if(this.isComputed()){
      this._scene.setOrbitColor(this._name, color, "image_window");
    }
  }

  get IWColor(){
    return this._iwColor;
  }

  set CWColor(color){
    this._cwColor = color;
    if(this.isComputed()){
      this._scene.setOrbitColor(this._name, color,  "comm_window");
    }
  }

  get CWColor(){
    return this._cwColor;
  }

  set BothColor(color){
    this._bothColor = color;
    if(this.isComputed()){
      this._scene.setOrbitColor(this._name, color, "intersection");
    }
  }

  get BothColor(){
    return this._bothColor;
  }

  get complInterval(){
    return this._complInterval;
  }

  get mutexIWInterval(){
    return this._mutexIWInterval;
  }

  get mutexCWInterval(){
    return this._mutexCWInterval;
  }

  get mutinInterval(){
    return this._mutinInterval;
  }

  _compute(){
    //hack to clone object, not really that slow but not optimal either
    const iwInterval = JSON.parse(JSON.stringify(this._IWInterval));
    const cwInterval = JSON.parse(JSON.stringify(this._CWInterval));

    const overlap = (a, b) => a[0] <= b[1] && b[0] <= a[1];
    this._mutinInterval = findIntersection(iwInterval, cwInterval);
    this._mutexIWInterval = findComplement(iwInterval, this._mutinInterval);
    this._mutexCWInterval = findComplement(cwInterval, this._mutinInterval);

    const union = findUnion([this._mutinInterval, this._mutexIWInterval, this._mutexCWInterval]);
    const interval = [0, union.slice(-1)[0][1]];
    this._complInterval = findComplement([interval], union);

    this._scene.setOrbitWindows(this._name, this._complInterval, this._mutexIWInterval, this._mutexCWInterval, this._mutinInterval);
    this._updateColors();
  }

  _updateColors(){
    if(this.isComputed()){
      this._parent.color = this._parent._color; //this is really bad
      //this._scene.setOrbitColor(this._name, this._defaultColor, "default");
      this._scene.setOrbitColor(this._name, this._iwColor, "image_window");
      this._scene.setOrbitColor(this._name, this._cwColor, "comm_window");
      this._scene.setOrbitColor(this._name, this._bothColor, "intersection");
    }
  }
}

function findUnion(interval_sets){
  const compare_interval = (a, b) => Math.sign(a[1] - b[1]);
  const union = interval_sets.flat(1).sort(compare_interval);
  return union;
}

function findIntersection(iw, cw){
  const union = [];
  var i = 0;
  var j = 0;

  while(i < iw.length && j < cw.length){
    const l = Math.max(iw[i][0], cw[j][0]);
    const r = Math.min(iw[i][1], cw[j][1]);
    if(l <= r){
      union.push([l, r]);
    }

    if(iw[i][1] < cw[j][1]){
      i += 1;
    }
    else{
      j += 1;
    }
  }
  return union;
}

function findComplement(intervals, union){
  const complement = [];
  var i = 0;
  var j = 0;

  while(i < intervals.length && j < union.length){
    const l = Math.max(intervals[i][0], union[j][0]);
    const r = Math.min(intervals[i][1], union[j][1]);

    if(l <= r){
      if(intervals[i][0] < union[j][0]){
        complement.push([intervals[i][0], union[j][0]]);
      }
      intervals[i][0] = union[j][1];
    }

    if(intervals[i][1] <= union[j][1]){
      complement.push(intervals[i]);
      i += 1;
    }
    else{
      j += 1;
    }
  }

  const is_zero_inter = inter => (inter[1]-inter[0]) == 0;
  return complement.filter(x => !is_zero_inter(x))
}
