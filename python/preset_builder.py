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

TARGET_VERTEX_MAP = {
    "target" : "TargetID",
    "longitude" : "Longitude",
    "latitude" : "latitude"
}

DEFAULT_SATELLITE = {
    "name" : "satellite",
    "color" : "#00ff00",
    "orbitTrail" : "all"
}

DEFAULT_SENSOR = {
    "name" : "sensor constraints"
}

DEFAULT_TARGET = {
    "name" : "target",
    "color" : "#00ff00",
    "selectColor" : "#ff0000",
    "alpha" : 1
}

DEFAULT_SENSOR_PARAMETER = {
    "maxValue" : 90,
    "minValue" : 20,
    "sensorType" : "GrazeAngle"
}

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
        "target_path" : "./data/TestScenario1 Deck/target.csv",
        "target_vertices" : "./data/TestScenario1 Deck/target_vertices.csv",
        "targets" : {
            "deck_dsa" : {
                "name" : "deck_dsa",
                "color" : "#ff00ff"
            }
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


def parse_target(path):
    pass

def parse_target_vertex(path):
    csv = read_csv(path)
    header = csv[0]
    content = csv[1:]

    index_map = get_header_indices(header, TARGET_VERTEX_MAP)

    if index_map == None:
        return None

    pass

def import_platform(platform):
    parse_platform(platform);
    parse_sensor(platform["sensors"]);

def import_targets

def import_preset(preset):
    import_platform(preset["platform"])

    return json.dumps(preset);

blob = import_preset(preset)

with open(SAVE_DIR, 'w') as writer:
    writer.write(blob);
