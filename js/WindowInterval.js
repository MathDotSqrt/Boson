import * as BOSON_RENDER from "./cesium_scene.js"

export default class WindowInterval {
  constructor(scene){
    this._scene = scene;

    this._IWInterval = null;
    this._CWInterval = null;

    this._complInterval = [];   //complement of IW or CW interval
    this._mutexIWInterval = []; //mutually exclusive image window interval
    this._mutexCWInterval = []; //mutually exclusive comm window interval
    this._mutinInterval = [];   //mutually inclusive interval
  }

  setIWInterval(interval){
    console.log(interval);
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
    const overlap = (a, b) => a[0] <= b[1] && b[0] <= a[1];
    this._mutinInterval = findIntersection(this._IWInterval, this._CWInterval);
    this._mutexIWInterval = findComplement(this._IWInterval, this._mutinInterval);
    this._mutexCWInterval = findComplement(this._CWInterval, this._mutinInterval);

    const union = findUnion([this._mutinInterval, this._mutexIWInterval, this._mutexCWInterval]);
    const interval = [union[0][0], union.slice(-1)[0][1]];
    this._complInterval = findComplement([interval], union);
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
