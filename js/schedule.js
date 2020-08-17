
export default class Schedule {
  constructor(name, schedule){
    this._name = name;
    this._schedule = schedule.schedule;
    this._lastEvent = {};
    this._lastSecond = 0;
  }

  get schedule(){
    return this._schedule;
  }

  clearLastEventCache(){
    for(const platformID in this._lastEvent){
      this._lastEvent[platformID] = 0;
    }
    this._lastSecond = 0;
    console.log("CLEARED CACHE");
  }

  getAllPlatformIDs(){
    return Object.keys(this._schedule).filter(x => x > 0).map(x => parseInt(x));
  }

  getAllTargets(){
    return Object.values(this._schedule).map(e => e.targets).flat();
  }

  getScheduleEventContinuous(seconds){
    //todo figure out where nan is getting injected
    const target_ids = [];
    const platform_events = {};
    const delta = seconds - this._lastSecond;
    this._lastSecond = seconds;

    const platform_schedules = this._getPlatforms();

    for(const platform_schedule of platform_schedules){
      const platform_id = platform_schedule.platformID;
      const schedule_interval = platform_schedule.interval;

      if(!(platform_id in this._lastEvent)){
        this._lastEvent[platform_id] = 0;
      }

      const last_index = this._lastEvent[platform_id];
      const [is_within, current_index] = binary_search_interval(schedule_interval, seconds);

      if(is_within){
        const event = this._getEvent(platform_schedule, current_index);
        platform_events[platform_id] = event;
      }


      const min_index = Math.min(last_index, current_index);
      const max_index = Math.max(last_index, current_index);
      const target_slice = platform_schedule.targets.slice(min_index + 1, max_index + 1);
      target_ids.push(target_slice);

      this._lastEvent[platform_id] = current_index;
    }

    return {
      delta : delta,
      target_ids : target_ids.flat(),
      platform_events : platform_events
    }
  }

  getNextEventTime(seconds, satellite){

    //Array of satellites we are interested in
    const platform_schedules = this._getSubsetPlatforms(satellite);;
    const intervals = platform_schedules.map(p => p.interval);

    //Computes the next event time for each satellite.
    //If a satellite is currently on or past its last event, this
    //will wrap and return the time of its first event
    const next_events = intervals.map(inter => {
      const num_intervals = inter.length / 2;

      const [is_within, index] = binary_search_interval(inter, seconds);

      var next_index = index + 1;
      if(next_index >= num_intervals){
        next_index = 0;
      }

      const start = inter[next_index * 2] + .0001; //floating-point woes
      return start;
    })

    //computs the time difference for each next_event
    const deltas = next_events.map(e => e - seconds);

    //if all the satellite events wrapped
    if(deltas.every(d => d < 0)){
      return Math.min(...next_events);
    }
    else{
      const min_delta = Math.min(...deltas.filter(d => d > 0));
      return min_delta + seconds;
    }
  }

  getPrevEventTime(seconds, satellite){

    //Array of satellites we are interested in
    const platform_schedules = this._getSubsetPlatforms(satellite);;
    const intervals = platform_schedules.map(p => p.interval);

    //Computes the prev event time for each satellite.
    //If a satellite is currently on or before its first event, this
    //will wrap and return the time of its last event
    const prev_events = intervals.map(inter => {
      const num_intervals = inter.length / 2;

      const [is_within, index] = binary_search_interval(inter, seconds);
      var prev_index = is_within ? index - 1 : index;
      if(prev_index < 0){
        prev_index = num_intervals - 1;
      }

      const start = inter[prev_index * 2] + .0001; //floating-point woes
      return start;
    })

    //computs the time difference for each next_event
    const deltas = prev_events.map(e => e - seconds);

    //if all the satellite events wrapped
    if(deltas.every(d => d > 0)){
      return Math.max(...prev_events);
    }
    else{
      const min_delta = Math.max(...deltas.filter(d => d < 0));
      return min_delta + seconds;
    }
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

  _getSubsetPlatforms(platform){
    if(platform && platform.id in this._schedule){
      return [this._schedule[platform.id]];
    }
    return this._getPlatforms();
  }

  _getPlatforms(){
    const no_nan_platform = (p) => !isNaN(p.platformID) && p.platformID != null;
    const platform_schedules = Object.values(this._schedule)
      .filter(no_nan_platform);

    return platform_schedules;
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
      return [true, mid];
    }
    else if(seconds < interval_start){
      end = mid - 1;
    }
    else {
      start = mid + 1;
    }
  }

  //this returns -1 if seconds is before the first interval
  //this is desired behavior
  return [false, end];
}
