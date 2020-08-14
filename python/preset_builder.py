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

DEFAULT_PLATFORM = {
    "name" : "default_name",
    "color" : "#00ff00",
    "orbitTrail" : "all"
}

SAVE_DIR = "./data/python_preset.json"

preset = {
    "platform" : {
        "name" : "platform.csv",
        "path" : "data/platform.csv",
        "satellites" : {
            1 : {
                "name" : "platform_1",
                "color" : "#ff00ff",
                "orbitTrail" : "one_rev"
            },
            2 : {
                "name" : "platform_2",
                "color" : "#00ffff",
                "orbitTrail" : "all"
            }
        }
    },
    "schedule" : None,
    "targets" : []
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

def get_header_indices(header, column_map):
    indices = [(k, header.index(v)) for [k, v] in column_map.items() if v in header];
    if(len(indices) != len(column_map.values())):
        return None
    return dict(indices)

def parse_platform(platform):
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

    for [id, ephemeris] in ephemera.items():
        platform["satellites"][id]["id"] = id
        platform["satellites"][id]["ephemeris"] = ephemeris


def import_platform(platform):
    parse_platform(platform);

def import_preset(preset):
    import_platform(preset["platform"])

    return json.dumps(preset);

blob = import_preset(preset)

with open(SAVE_DIR, 'w') as writer:
    writer.write(blob);
