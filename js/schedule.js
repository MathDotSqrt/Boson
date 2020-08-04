
export default class Schedule {
  constructor(name, schedule){
    this._name = name;
    this._schedule = schedule.schedule;
    this._lastEvent = {};
  }

  get schedule(){
    return this._schedule;
  }

  clearLastEventCache(){
    this._lastEvent = {};
  }

  getAllPlatformIDs(){
    return Object.keys(this._schedule).filter(x => x > 0).map(x => parseInt(x));
  }

  getAllTargets(){
    return Object.values(this._schedule).map(e => e.targets).flat();
  }

  getScheduleEventContinuous(platformID, seconds){
    const platform_schedule = this._schedule[platformID];
    if(!platform_schedule)
      return null;

    if(!(platformID in this._lastEvent)){
      this._lastEvent[platformID] = {
        lastIndex : 0,
      };
    }

    //TODO PERFORMANCE IDEA: store interval inside last event to avoid
    //the binary search
    const lastIndex = this._lastEvent[platformID].lastIndex;
    const id_index = binary_search_interval(platform_schedule.interval, seconds);
    if(id_index !== -1){
      const schedule_event = this._getEvent(platform_schedule, id_index);

      const minIndex = Math.min(lastIndex, id_index);
      const maxIndex = Math.max(lastIndex, id_index);
      const target_ids = platform_schedule.targets.slice(minIndex, maxIndex);
      this._lastEvent[platformID].lastIndex = id_index;
      return {
        delta : id_index - lastIndex,
        event : schedule_event,
        targets : target_ids
      }
    }

    return null;
  }

  getScheduleEvent(platformID, seconds){
    const platform_schedule = this._schedule[platformID];
    if(platform_schedule){
      const id_index = binary_search_interval(platform_schedule.interval, seconds);
      return this._getEvent(platform_schedule, id_index);
    }

    return null;
  }

  _getEvent(platform_schedule, id_index){
    if(platform_schedule && id_index !== -1){
      const start = platform_schedule.interval[id_index * 2];
      const end = platform_schedule.interval[id_index * 2 + 1];
      const lon = platform_schedule.coords[id_index * 2];
      const lat = platform_schedule.coords[id_index * 2 + 1];
      const targetID = platform_schedule.targets[id_index];

      return {
        interval : [start, end],
        coord : [lon, lat],
        target : targetID
      }
    }
    return null;
  }

  getMaxTime(){
    const max_times = Object.values(this._schedule)
    .filter(e => e.platformID)  //make sure its not nan
    .map(e => e.interval[e.interval.length-1]);
    return Math.max(...max_times);
  }

  toJSON(){
    const json = {
      name : this._name,
      schedule : this._schedule
    };

    return json;
  }
}

function binary_search_interval(intervals, seconds){
  const length = intervals.length;
  const num_intervals = length / 2;
  var start = 0;
  var end = num_intervals - 1;
  while(start <= end){
    const mid = Math.floor((start + end) / 2);
    const interval_start = intervals[mid * 2];
    const interval_end = intervals[mid * 2 + 1];
    if(seconds >= interval_start && seconds <= interval_end){
      return mid;
    }
    else if(seconds < interval_start){
      end = mid - 1;
    }
    else {
      start = mid + 1;
    }
  }

  return -1;
}
