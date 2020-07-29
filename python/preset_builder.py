import json
DELIM = ','
PLATFORM_FILENAME = '../data/platform.csv'

preset = {
    "platform" : [{
        "name" : "platform.csv",
    }],
    "schedule" : None,
    "targets" : []
}

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

def parse_platform(filename):
    print(read_csv(filename))

def import_platform(platform):
    for p in platform:
        parse_platform(p['name']);

def import_preset(preset):
    import_platform(preset["platform"])

import_preset(preset)
