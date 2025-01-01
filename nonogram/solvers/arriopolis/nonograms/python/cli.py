from solve import solve_puzzle

def print_puzzle(hor_blocks, ver_blocks, state = None):
    h = len(hor_blocks)
    w = len(ver_blocks)
    if state is None: state = [[-1]*w for _ in range(h)]

    ss = []
    for r in hor_blocks:
        ss.append(' '.join(map(str,r)))
    ho = max(len(s) for s in ss) + 1
    vo = max(len(c) for c in ver_blocks)
    for i in range(vo):
        print(' '*ho, end = '')
        for j in range(w):
            if len(ver_blocks[j]) >= vo-i:
                s = str(ver_blocks[j][len(ver_blocks[j])-(vo-i)])
                print(s + (' ' if len(s) == 1 else ''), end = '')
            else:
                print('  ', end = '')
        print()

    for s,r in zip(ss,state):
        print(s.rjust(ho-1), end = ' ')
        print(' '.join(map(lambda x : '.' if x == 0 else '#' if x == 1 else ' ', r)))

h,w = map(int, input().strip('\n').split(' '))
hor_blocks, ver_blocks = [], []
for _ in range(h): hor_blocks.append(list(map(int, input().strip('\n').split(' '))))
for _ in range(w): ver_blocks.append(list(map(int, input().strip('\n').split(' '))))

print("Attempting to solve the following puzzle:")
print_puzzle(hor_blocks, ver_blocks)

try:
    res = solve_puzzle(hor_blocks, ver_blocks)
except ValueError as e:
    print(e)
else:
    print("Found the solution:")
    print_puzzle(hor_blocks, ver_blocks, res)
