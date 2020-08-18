import json
import sys
import getopt
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

WINDOW_COLUMN_MAP = {
    "platformID" : "PlatformID",
    "start" : "StartTime",
    "end" : "EndTime"
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

SCHEDULE_COLUMN_MAP = {
    "platformID" : "PlatformID",
    "target" : "TargetID",
    "start" : "ImageStartTime",
    "end" : "ImageEndTime",
    "longitude" : "Longitude",
    "latitude" : "Latitude"
}

DEFAULT_PLATFORM = {
    "name" : "platform"
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

DEFAULT_IW = {
    "name" : "Image Window"
}

DEFAULT_CW = {
    "name" : "Comm Window"
}

DEFAULT_TARGET = {
    "name" : "target",
    "color" : "#00ff00",
    "selectColor" : "#ff0000",
    "alpha" : 1
}

DEFAULT_SCHEDULE = {
    "name" : "schedule operations"
}

TARGET_POINT = 1
TARGET_DSA = 3
TARGET_MCG = 5

DEFAULT_INPUT = "./example_preset.json"
DEFAULT_OUTPUT = "../data/python_preset.json"

def listdir_fullpath(d):
    return [join(d, f) for f in listdir(d)];

def get_files_in_dir(foldername):
    return [f for f in listdir_fullpath(foldername) if isfile(f)]

def get_filenames(foldernames):
    filenames = reduce(lambda a, b : a + b, map(get_files_in_dir, foldernames));
    return filenames

def read_file(filename):

    lines = []
    try:
        with open(filename, 'r') as f:
            lines = f.readlines()
        print("Read [{}]".format(filename))
        return lines
    except:
        print("FAILED TO READ", filename)
        return ["bad", "code"]

def read_json(filename):
    return json.loads(str(''.join(read_file(filename))))
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
        id = str(id)
        if not id in satellites:
            satellites[id] = DEFAULT_SATELLITE.copy()
            satellites[id]["name"] += str(id)


        satellites[id]["id"] = id
        satellites[id]["ephemeris"] = ephemeris
        set_default(satellites[id], DEFAULT_SATELLITE);

    return True

def parse_sensor(sensors):
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
    return True

def parse_window(window):
    csv = read_csv(window["path"])
    header = csv[0]
    content = csv[1:]

    index_map = get_header_indices(header, WINDOW_COLUMN_MAP)
    if(index_map == None):
        return None

    intervals = {}
    for row in content:
        platformID = int(row[index_map["platformID"]])
        start = float(row[index_map["start"]])
        end = float(row[index_map["end"]])

        if not platformID in intervals:
            intervals[platformID] = []
        intervals[platformID].append([start, end])

    window["intervals"] = intervals
    return True
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

#
# PARSE SCHEDULE
#

def parse_schedule(schedule):
    csv = read_csv(schedule["path"])
    header = csv[0]
    content = csv[1:]

    index_map = get_header_indices(header, SCHEDULE_COLUMN_MAP)

    if index_map == None:
        return None

    schedule_events = {}

    for row in content:
        platformID = int(row[index_map["platformID"]])
        targetID = row[index_map["target"]]
        start = float(row[index_map["start"]])
        end = float(row[index_map["end"]])
        lon = float(row[index_map["longitude"]])
        lat = float(row[index_map["latitude"]])

        if not platformID in schedule_events:
            schedule_events[platformID] = {
                "platformID" : platformID,
                "targets" : [],
                "interval" : [],
                "coords" : []
            }
        schedule_events[platformID]["targets"].append(targetID)
        schedule_events[platformID]["interval"].append(start)
        schedule_events[platformID]["interval"].append(end)
        schedule_events[platformID]["coords"].append(lon)
        schedule_events[platformID]["coords"].append(lat)

    schedule["schedule"] = schedule_events
    return True



#
# PARSE SCHEDULE
#

#
# IMPORTING
#

def contains_key(key, obj):
    return key in obj and obj[key] != None

def import_platform(platform):
    is_valid = parse_platform(platform);

    if not is_valid:
        return None

    if contains_key("sensors", platform):
        set_default(platform["sensors"], DEFAULT_SENSOR)
        is_valid = parse_sensor(platform["sensors"]);
        if not is_valid:
            platform.pop("sensors", None)

    if contains_key("iwWindow", platform):
        set_default(platform["iwWindow"], DEFAULT_IW)
        is_valid = parse_window(platform["iwWindow"]);
        if not is_valid:
            platform.pop("iwWindow", None)

    if contains_key("cwWindow", platform):
        set_default(platform["cwWindow"], DEFAULT_CW)
        is_valid = parse_window(platform["cwWindow"]);
        if not is_valid:
            platform.pop("cwWindow", None)

    return True


def import_targets(target_deck):
    target_positions = parse_target(target_deck["target_path"])
    target_vertices = parse_target_vertex(target_deck["target_vertices"])

    if target_positions == None or target_vertices == None:
        return None

    targets = target_deck["targets"]

    for [type, target] in targets.items():
        type = int(type)
        target = set_default(target, DEFAULT_TARGET);
        if type == TARGET_POINT:
            target["targetSet"] = create_point_targets(target_positions, type);
        else:
            target["targetSet"] = create_targets(target_positions, target_vertices, type);
    return True

def import_schedule(schedule):
    return parse_schedule(schedule);

def import_preset(preset):
    if contains_key("platform", preset):
        set_default(preset["platform"], DEFAULT_PLATFORM)
        is_valid = import_platform(preset["platform"])
        if not is_valid:
            preset.pop("platform", None)
    if contains_key("target_deck", preset):
        is_valid = import_targets(preset["target_deck"])
        if not is_valid:
            preset.pop("target_deck", None)
    if contains_key("schedule", preset):
        set_default(preset["schedule"], DEFAULT_SCHEDULE)
        is_valid = import_schedule(preset["schedule"])
        if not is_valid:
            preset.pop("schedule", None)

    return json.dumps(preset);

#
# IMPORTING
#

def main(argv):

    try:
        opts, args = getopt.getopt(argv, "i:o:")
    except getopt.GetoptError:
        print("preset_builder.py -i <input_preset> -o <output_state>")
        sys.exit(-2)

    input_file = DEFAULT_INPUT
    output_file = DEFAULT_OUTPUT
    for opt, arg in opts:
        if opt == "-i":
            input_file = arg
        elif opt == "-o":
            output_file = arg

    print("Importing...")
    blob = import_preset(read_json(input_file))


    print("Writing [{}]".format(output_file))
    with open(DEFAULT_OUTPUT, 'w') as writer:
        writer.write(blob);

if __name__ == "__main__":
    main(sys.argv[1:])
