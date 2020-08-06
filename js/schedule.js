
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

  getNextEventTime(seconds){
    const platform_schedules = this._getPlatforms();

    var closest_next_interval = Number.MAX_VALUE;
    for(const platform_schedule of platform_schedules){
      const schedule_interval = platform_schedule.interval;
      const num_intervals = schedule_interval.length / 2;

      const [is_within, current_index] = binary_search_interval(schedule_interval, seconds);
      const next_index = current_index == num_intervals - 1 ? 0 : current_index + 1;

      const event = this._getEvent(platform_schedule, next_index);
      const start = event.interval[0] + .0001;  //floating-point woes
      if(start < closest_next_interval){
        closest_next_interval = start;
      }
    }

    return closest_next_interval;
  }

  getPrevEventTime(seconds){
    const platform_schedules = this._getPlatforms();

    var closest_prev_interval = 0;
    for(const platform_schedule of platform_schedules){
      const schedule_interval = platform_schedule.interval;
      const num_intervals = schedule_interval.length / 2;

      const [is_within, current_index] = binary_search_interval(schedule_interval, seconds);
      var next_index = current_index;
      if(is_within){
        next_index = next_index == 0 ? num_intervals - 1 : next_index - 1;
      }
      else if(next_index  < 0){
        //if seconds is before the first interval, wrap to the end
        next_index = num_intervals - 1;
      }

      const event = this._getEvent(platform_schedule, next_index);
      const start = event.interval[0] + .0001;  //floating-point woes
      if(start > closest_prev_interval){
        closest_prev_interval = start;
      }
    }

    return closest_prev_interval;
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
