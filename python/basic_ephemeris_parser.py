
FILE_IN = './data/Satellite2.e'
FILE_OUT = './data/out2.csv'
DELIM = ' '

position_array = [];

with open(FILE_IN, 'r') as reader:
    for _ in range(26):
        reader.readline()

    for line in reader:
        split = line.split(DELIM)[0:4]
        new_line = ','.join(split)
        new_line = new_line + ',\n'
        position_array.append(new_line)



with open(FILE_OUT, 'w') as writer:
    for line in position_array:
        writer.write(line);
