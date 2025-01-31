

export default class TargetSet {
  constructor(targets, scene){
    this._name = targets.name;
    this._scene = scene;

    this._targetSet = targets.targetSet;
    //const target_set = BOSON_TARGETS.get_target_set(name);
    this._scene.createTargetPrimitive(targets.name, this._targetSet);

    this.color = targets.color;
    this.alpha = targets.alpha;
    this.selectColor = targets.selectColor;

  }

  get name(){
    return this._name;
  }

  get color(){
    return this._color;
  }
  set color(color){
    this._scene.setTargetColor(this.name, color, this._alpha);
    this._color = color;
  }

  get alpha(){
    return this._alpha;
  }

  set alpha(alpha){
    this._scene.setTargetColor(this.name, this._color, alpha);
    this._alpha = alpha;
  }

  get selectColor(){
    return this._selectColor;
  }
  set selectColor(selectColor){
    this._scene.setTargetSelectColor(this.name, selectColor);
    this._selectColor = selectColor;
  }

  selectTargetByID(id){
    this._scene.selectTarget(this.name, id);
  }

  deselectTargetByID(id){
    this._scene.deselectTarget(this.name, id);
  }

  toJSON(){
    const json = {
      name : this.name,
      color : this.color,
      alpha : this.alpha,
      selectColor : this.selectColor,
      targetSet : this._targetSet
    }

    return json;
  }

  update(){

  }
};
