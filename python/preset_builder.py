DELIM = ','
PLATFORM_FILENAME = '../data/platform.csv'

def read_csv(filename):
    lines = []
    with open(filename, 'r') as f:
        lines = f.readlines()

    columns = [line.strip().split(DELIM) for line in lines]
    return columns;

print(read_csv(PLATFORM_FILENAME)[:3])
