
export default class Schedule {
  constructor(schedule){
    this._schedule = schedule;
  }

  get schedule(){
    return this._schedule;
  }

  getAllPlatformIDs(){
    return Object.keys(this._schedule).filter(x => x > 0).map(x => parseInt(x));
  }

  getScheduleEvent(platformID, seconds){
    const platform_schedule = this._schedule[platformID];
    if(platform_schedule){
      const id_index = binary_search_interval(platform_schedule.interval, seconds);
      if(id_index !== -1){
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
