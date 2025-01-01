import itertools as it

def gen_left_bounds(seg, blocks, start = 0):
    i = start
    for b in blocks:
        ctr = 0
        while i < len(seg):
            if seg[i] == 0:
                ctr = 0
                i += 1
            else:
                ctr += 1
                i += 1
                if ctr == b and i < len(seg) and seg[i] == 1: i += 1
                if ctr == b: break
        else: yield False
        yield i-b
        i += 1

def update_left_bounds(seg, blocks, left_bounds, j, p):
    for (k,oldl),newl in zip(list(enumerate(left_bounds))[j:],gen_left_bounds(seg, blocks[j:], start = p)):
        if newl is False: return False
        if oldl == newl: break
        left_bounds[k] = newl
    return True

def get_left_bounds(seg, blocks):
    left_bounds = []
    for l in gen_left_bounds(seg,blocks):
        if l is False: return False
        left_bounds.append(l)
    return left_bounds

def update_right_bounds(seg, blocks, right_bounds, j, p):
    rev_seg = list(reversed(seg))
    rev_blocks = list(reversed(blocks))
    rev_left_bounds = [len(seg) - 1 - x for x in reversed(right_bounds)]
    res = update_left_bounds(rev_seg, rev_blocks, rev_left_bounds, len(blocks)-j-1, len(seg)-p-1)
    right_bounds[:] = [len(seg) - 1 - x for x in reversed(rev_left_bounds)]
    return res

def get_right_bounds(seg, blocks):
    rev_seg = list(reversed(seg))
    rev_blocks = list(reversed(blocks))
    rev_left_bounds = get_left_bounds(rev_seg, rev_blocks)
    if rev_left_bounds is False: return False
    return [len(seg) - 1 - x for x in reversed(rev_left_bounds)]

def DFS(seg, blocks, left_bounds, right_bounds, parts_left):
    # print("Running DFS with parameters:")
    # print(f" - seg: {seg}")
    # print(f" - blocks: {blocks}")
    # print(f" - left_bounds: {left_bounds}")
    # print(f" - right_bounds: {right_bounds}")
    # print(f" - parts_left: {parts_left}")

    # Check if there are parts left to assign
    if len(parts_left) > 0:
        # Take the next largest part
        p,s = parts_left[-1]

        # Iterate over all blocks that it could be assigned to
        possible = False
        merged_seg = None
        for j,(b,l,r) in enumerate(zip(blocks,left_bounds,right_bounds)):
            if l > p or r < p: continue
            if s > b: continue

            # Branch
            new_left_bounds = left_bounds.copy()
            new_right_bounds = right_bounds.copy()
            new_parts_left = parts_left.copy()

            # Update
            l = max(l, p+s-b)
            if l > 0 and seg[l-1] == 1: l += 1
            if update_left_bounds(seg, blocks, new_left_bounds, j, l) is False: continue
            r = min(p+b-1, r)
            if r < len(seg)-1 and seg[r+1] == 1: r -= 1
            if update_right_bounds(seg, blocks, new_right_bounds, j, r) is False: continue
            new_parts_left.pop()

            # Recurse
            new_seg = DFS(seg, blocks, new_left_bounds, new_right_bounds, new_parts_left)
            if new_seg is False: continue

            # Merge
            if not possible:
                possible = True
                merged_seg = new_seg
            else:
                for k,(x,y) in enumerate(zip(merged_seg, new_seg)):
                    if x == -1 or y == -1 or x != y: merged_seg[k] = -1

        # Pass the merge info on
        if not possible: return False
        return merged_seg
    else:
        # Branch
        new_seg = seg.copy()

        # Fill in the segment with the new information
        for l,r,b in zip(left_bounds, right_bounds, blocks):
            if r-l+1 < b: return False
            if r-b+1 <= l+b-1:
                for i in range(r-b+1,l+b):
                    new_seg[i] = 1

        for l,r in zip(left_bounds + [len(seg)], [-1] + right_bounds):
            if r < l:
                for i in range(r+1,l):
                    new_seg[i] = 0

        return new_seg

# Make progress on one given row or column, called a segment
def solve_segment(seg, blocks):
    # print("Running solve segment with parameters:")
    # print(f" - seg: {seg}")
    # print(f" - blocks: {blocks}")

    # Find the left and right bounds for all of the blocks
    left_bounds = get_left_bounds(seg, blocks)
    if left_bounds is False: return False
    right_bounds = get_right_bounds(seg, blocks)
    if right_bounds is False: return False

    # Find the parts that are already present in the segment
    parts_present = []
    i = 0
    while i < len(seg):
        if seg[i] == 1:
            part_start = i
            while i < len(seg) and seg[i] == 1: i += 1
            parts_present.append((part_start, i - part_start))
        i += 1
    parts_present.sort(key = lambda x : x[1])

    # Assign the blocks to the parts that are already present via a DFS
    return DFS(seg, blocks, left_bounds, right_bounds, parts_present)

# DFS solver
def solve(hor_blocks, ver_blocks, state = None):
    h = len(hor_blocks)
    w = len(ver_blocks)
    if state is None: state = [[-1]*w for _ in range(h)]

    change = True
    while change:
        change = False
        for _ in range(2):
            # Iterate on the rows
            for j, (blocks,row) in enumerate(zip(hor_blocks, state)):
                new_row = solve_segment(row, blocks)
                if new_row is False: return False
                if tuple(new_row) != tuple(row):
                    change = True
                    state[j] = new_row

            # Transpose the puzzle
            state = [[state[j][i] for j in range(h)] for i in range(w)]
            hor_blocks, ver_blocks = ver_blocks, hor_blocks
            h,w = w,h

        # Check if we are done
        if not any(c == -1 for r in state for c in r): return state

    # If we have not managed to solve it yet, make a guess in an empty square
    # This piece can probably be improved by heuristics,
    # but in worst-case complexity it's not clear whether this can be easily improved.
    for i,j in it.product(range(h),range(w)):
        if state[i][j] == -1: break

    # Try filling in a 0
    new_state = [s.copy() for s in state]
    new_state[i][j] = 0
    res0 = solve(hor_blocks, ver_blocks, new_state)

    # Try filling in a 1
    new_state = [s.copy() for s in state]
    new_state[i][j] = 1
    res1 = solve(hor_blocks, ver_blocks, new_state)

    # Relay the result
    if res0 is False and res1 is False: return False
    elif not (res0 is False) and not (res1 is False) and tuple(map(tuple,res0)) != tuple(map(tuple,res1)): raise ValueError("Multiple solutions exist.")
    elif res0 is False: return res1
    else: return res0

# Small wrapper to catch the case where there are no solutions
def solve_puzzle(hor_blocks, ver_blocks):
    res = solve(hor_blocks, ver_blocks)
    if res is False: raise ValueError("No solution exists.")
    return res

if __name__ == "__main__":
    # Simple test case
    seg2str = lambda y : ''.join(map(lambda x : '.' if x == 0 else '#' if x == 1 else ' ', y))
    test_puzzle = ([[4], [2], [2], [2], [3]], [[2], [2], [1,1,1], [1,3], [2]])
    res = solve(*test_puzzle)
    for r in res: print(seg2str(r))
