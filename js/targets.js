
const target_sets = {};

export function register_target_set(name, target_set){
  target_sets[name] = target_set;
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
}
