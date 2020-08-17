import json
from os import listdir
from os.path import isfile, join, basename
from functools import reduce

DELIM = ','

PLATFORM_COLUMN_MAP = {
    "platformID" : "PlatformID",
    "time" : "Time",
    "posx" : "PositionX",
    "posy" : "PositionY",
    "posz" : "PositionZ",
    "velx" : "VelocityX",
    "vely" : "VelocityY",
    "velz" : "VelocityZ",
}

SENSOR_COLUMN_MAP = {
    "platformID" : "PlatformID",
    "constraint" : "Constraint Type",
    "minValue" : "Min Value",
    "maxValue" : "Max Value"
}

TARGET_COLUMN_MAP = {
    "target" : "TargetID",
    "type" : "TypeID",
    "longitude" : "CentroidLongitude",
    "latitude" : "CentroidLatitude",
    "size" : "Size"
}

TARGET_VERTEX_MAP = {
    "target" : "TargetID",
    "longitude" : "Longitude",
    "latitude" : "Latitude"
}

DEFAULT_SATELLITE = {
    "name" : "satellite",
    "color" : "#00ff00",
    "orbitTrail" : "all"
}

DEFAULT_SENSOR = {
    "name" : "sensor constraints"
}

DEFAULT_SENSOR_PARAMETER = {
    "maxValue" : 90,
    "minValue" : 20,
    "sensorType" : "GrazeAngle"
}

DEFAULT_TARGET = {
    "name" : "target",
    "color" : "#00ff00",
    "selectColor" : "#ff0000",
    "alpha" : 1
}

TARGET_POINT = 1
TARGET_DSA = 3
TARGET_MCG = 5
DEFAULT_TARGET_TYPES = [TARGET_POINT, TARGET_DSA, TARGET_MCG]

SAVE_DIR = "./data/python_preset.json"

preset = {
    "platform" : {
        "name" : "platform.csv",
        "path" : "data/platform.csv",
        "satellites" : {
            1 : {
                "name" : "platform_1",
                "color" : "#ff00ff"
            },
            2 : {
                "name" : "platform_2",
                "color" : "#00ffff",
                "orbitTrail" : "all"
            }
        },
        "sensors" : {
            "path" : "./data/sensor_constraints.csv"
        }
    },
    "schedule" : None,
    "targets" : {
        "target_path" : "./data/TestScenario1 Deck/targets.csv",
        "target_vertices" : "./data/TestScenario1 Deck/target_vertices.csv",
        "targets" : {
            3 : {
                "name" : "deck_dsa",
                "color" : "#ff00ff"
            },
            1 : {
                "name" : "deck_point",
                "color" : "#ffffff",
                "alpha" : .7
            },

            5 : {
                "name" : "deck_mcg",
                "color" : "#0000ff",
                "alpha" : .5
            },
        }
    }
}

def listdir_fullpath(d):
    return [join(d, f) for f in listdir(d)];

def get_files_in_dir(foldername):
    return [f for f in listdir_fullpath(foldername) if isfile(f)]

def get_filenames(foldernames):
    filenames = reduce(lambda a, b : a + b, map(get_files_in_dir, foldernames));
    return filenames


def read_file(filename):
    lines = []
    with open(filename, 'r') as f:
        lines = f.readlines()
    return lines

def read_json(filename):
    lines = read_file(filename)
def read_csv(filename):
    lines = read_file(filename)
    columns = [line.strip().split(DELIM) for line in lines]
    return columns;

def set_default(obj, default):
    for [key, value] in default.items():
        if not key in obj:
            obj[key] = value
    return obj

def get_header_indices(header, column_map):
    indices = [(k, header.index(v)) for [k, v] in column_map.items() if v in header];
    if(len(indices) != len(column_map.values())):
        return None
    return dict(indices)

#
# Parse Platform
#

def parse_platform(platform):
    if platform == None:
        return None

    csv = read_csv(platform["path"]);
    header = csv[0];
    content = csv[1:];
    index_map = get_header_indices(header, PLATFORM_COLUMN_MAP)

    if(index_map == None):
        return None

    ephemera = {};
    for row in content:
        id = int(row[index_map["platformID"]]);
        if not id in ephemera:
            ephemera[id] = {
                "position" : [],
                "time" : [],
                "velocity" : []
            }

        ephemeris = ephemera[id];
        ephemeris["time"].append(float(row[index_map["time"]]));
        # convert km to meters
        ephemeris["position"].append(float(row[index_map["posx"]]) * 1000);
        ephemeris["position"].append(float(row[index_map["posy"]]) * 1000);
        ephemeris["position"].append(float(row[index_map["posz"]]) * 1000);

        ephemeris["velocity"].append(float(row[index_map["velx"]]) * 1000);
        ephemeris["velocity"].append(float(row[index_map["vely"]]) * 1000);
        ephemeris["velocity"].append(float(row[index_map["velz"]]) * 1000);

    satellites = platform["satellites"]
    for [id, ephemeris] in ephemera.items():
        if not id in satellites:
            satellites[id] = DEFAULT_SATELLITE.copy()

        satellites[id]["id"] = id
        satellites[id]["ephemeris"] = ephemeris
        set_default(satellites[id], DEFAULT_SATELLITE);

def parse_sensor(sensors):
    if sensors == None:
        return None

    csv = read_csv(sensors["path"])
    header = csv[0]
    content = csv[1:]

    index_map = get_header_indices(header, SENSOR_COLUMN_MAP)
    if index_map == None:
        return None

    parameters = []
    for row in content:
        parameters.append({
            "platformID" : int(row[index_map["platformID"]]),
            "sensorType" : row[index_map["constraint"]],
            "minValue" : float(row[index_map["minValue"]]),
            "maxValue" : float(row[index_map["maxValue"]]),
        })

    sensors["parameters"] = parameters
    set_default(sensors, DEFAULT_SENSOR);

#
# Parse Platform
#

#
# PARSE TARGET
#
def parse_target(path):
    csv = read_csv(path)
    header = csv[0]
    content = csv[1:]
    index_map = get_header_indices(header, TARGET_COLUMN_MAP)

    if index_map == None:
        return None

    targets = []
    for row in content:
        targets.append({
            "targetID" : row[index_map["target"]],
            "typeID" : int(row[index_map["type"]]),
            "lon" : float(row[index_map["longitude"]]) * 180 / 3.1415926,
            "lat" : float(row[index_map["latitude"]]) * 180 / 3.1415926,
            "size" : float(row[index_map["size"]])
        })
    return targets

def parse_target_vertex(path):
    csv = read_csv(path)
    header = csv[0]
    content = csv[1:]
    index_map = get_header_indices(header, TARGET_VERTEX_MAP)

    if index_map == None:
        return None

    targets = {}
    target = {"id" : content[0][1], "coords" : []}
    for row in content:
        current_target = row[index_map["target"]]
        coord = [
            float(row[index_map["longitude"]]) * 180 / 3.1415926,
            float(row[index_map["latitude"]]) * 180 / 3.1415926
        ]
        if current_target != target["id"]:
            targets[target["id"]] = target
            target = {"id" : current_target, "coords" : []}
        target["coords"] += coord

    targets[target["id"]] = target
    return targets

def create_point_vertices(lon, lat, size):
    size = .1;
    return [
        lon + size, lat + size,
        lon - size, lat + size,
        lon - size, lat - size,
        lon + size, lat - size
    ]


def create_point_targets(targets, type):
    target_set = {}

    is_type = lambda x: x["typeID"] == type
    for target in filter(is_type, targets):
        target_set[target["targetID"]] = {
            "targetID" : target["targetID"],
            "coords" : create_point_vertices(target["lon"], target["lat"], target["size"])
        }
    return target_set

def create_targets(targets, vertices, type):
    target_set = {}

    is_type = lambda x: x["typeID"] == type
    for target in filter(is_type, targets):
        target_set[target["targetID"]] = {
            "targetID" : target["targetID"],
            "coords" : vertices[target["targetID"]]["coords"]
        }
    return target_set

#
# PARSE TARGET
#

def import_platform(platform):
    parse_platform(platform);
    parse_sensor(platform["sensors"]);

def import_targets(target_deck):
    target_positions = parse_target(target_deck["target_path"])
    target_vertices = parse_target_vertex(target_deck["target_vertices"])

    targets = target_deck["targets"]


    for type in targets.keys():
        target = targets.get(type, None);
        if None:
            continue

        target = set_default(target, DEFAULT_TARGET);
        if type == TARGET_POINT:
            target["targetSet"] = create_point_targets(target_positions, type);
        else:
            target["targetSet"] = create_targets(target_positions, target_vertices, type);


def contains_key(key, obj):
    return key in obj and obj[key] != None

def import_preset(preset):
    if contains_key("platform", preset):
        import_platform(preset["platform"])
    if contains_key("targets", preset):
        import_targets(preset["targets"]);

    return json.dumps(preset);

blob = import_preset(preset)

with open(SAVE_DIR, 'w') as writer:
    writer.write(blob);
