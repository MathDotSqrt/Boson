
FILE_IN = './data/ephemeris_platform.csv'
FILE_OUT = './data/platform.csv'
DELIM = ','

position_array = [];

def kilo_to_meter(unit):
    return str(float(unit) * 1000)

with open(FILE_IN, 'r') as reader:
    #skip header
    for _ in range(1):
        reader.readline()

    for line in reader:
        split = line.split(DELIM)
        id = split[2]
        coords = split[4:11]
        coords[1] = kilo_to_meter(coords[1])
        coords[2] = kilo_to_meter(coords[2])
        coords[3] = kilo_to_meter(coords[3])
        new_line = id + ',' + ','.join(coords) + ',\n'
        position_array.append(new_line)



with open(FILE_OUT, 'w') as writer:
    writer.write("platform\n");
    for line in position_array:
        writer.write(line);
