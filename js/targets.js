
const target_sets = {};

var ids = [];

export function register_target_set(name, target_set){
  target_sets[name] = target_set;
  ids = null;
}

export function has_target_set(name){
  return name in target_sets;
}

export function get_target_set(name){
  console.log(name);
  return target_sets[name];
}

export function delete_target_set(name){
  if(has_target_set(name)){
    delete target_sets[name];
  }
  ids = null;
}

export function get_all_target_ids(){
    if(!ids){
      ids = [];
      for(const target_set of Object.values(target_sets)){
        for(const id of Object.keys(target_set)){
          ids.push(id);
        }
      }
    }
    return ids;
}
