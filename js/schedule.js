
export default class Schedule {
  constructor(schedule){
    this._schedule = schedule;
  }

  get schedule(){
    return this._schedule;
  }

  getTargetID(platformID, seconds){
    const platform_schedule = this._schedule[platformID];
    if(platform_schedule){
      const id_index = binary_search_interval(platform_schedule.interval, seconds);
      if(id_index !== -1){
        return platform_schedule.targets[id_index];
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
