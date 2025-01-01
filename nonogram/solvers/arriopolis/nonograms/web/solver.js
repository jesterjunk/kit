function* gen_left_bounds(seg, blocks, start = 0) {
  var i = start
  for (b of blocks) {
    var ctr = 0
    while (i < seg.length) {
      if (seg[i] == 0) {
        ctr = 0
        i += 1
      } else {
        ctr += 1
        i += 1
        if (ctr == b && i < seg.length && seg[i] == 1) i += 1
        if (ctr == b) break
      }
    }
    if (ctr != b) yield false
    yield i-b
    i += 1
  }
}

function update_left_bounds(seg, blocks, left_bounds, j, p) {
  var gen = gen_left_bounds(seg, blocks.slice(j), p)
  for (const [k,oldl] of left_bounds.slice(j).entries()) {
    var newl = gen.next().value
    if (newl === false) return false
    if (oldl == newl) break
    left_bounds[k+j] = newl
  }
  return true
}

function get_left_bounds(seg, blocks) {
  var left_bounds = []
  for (var l of gen_left_bounds(seg, blocks)) {
    if (l === false) return false
    left_bounds.push(l)
  }
  return left_bounds
}

function update_right_bounds(seg, blocks, right_bounds, j, p) {
  var rev_seg = seg.slice().reverse()
  var rev_blocks = blocks.slice().reverse()
  var rev_left_bounds = right_bounds.map(x => seg.length - 1 - x).reverse()
  var res = update_left_bounds(rev_seg, rev_blocks, rev_left_bounds, blocks.length - j - 1, seg.length - p - 1)
  for (const [k,l] of rev_left_bounds.map(x => seg.length - 1 - x).reverse().entries()) {
    right_bounds[k] = l
  }
  return res
}

function get_right_bounds(seg, blocks) {
  var rev_seg = seg.slice().reverse()
  var rev_blocks = blocks.slice().reverse()
  var rev_left_bounds = get_left_bounds(rev_seg, rev_blocks)
  if (rev_left_bounds === false) return false
  return rev_left_bounds.map(x => seg.length - 1 - x).reverse()
}

function DFS(seg, blocks, left_bounds, right_bounds, parts_left) {
  if (parts_left.length > 0) {
    var p,s
    [p,s] = parts_left[parts_left.length-1]

    var possible = false
    var merged_seg = undefined
    for (var j = 0; j < blocks.length; j++) {
      var b,l,r
      [b,l,r] = [blocks[j], left_bounds[j], right_bounds[j]]
      if (l > p || r < p) continue
      if (s > b) continue

      var new_left_bounds = left_bounds.slice()
      var new_right_bounds = right_bounds.slice()
      var new_parts_left = parts_left.slice()

      l = Math.max(l, p+s-b)
      if (l > 0 && seg[l-1] == 1) l++
      if (update_left_bounds(seg, blocks, new_left_bounds, j, l) === false) continue
      r = Math.min(p+b-1, r)
      if (r < seg.length-1 && seg[r+1] == 1) r--
      if (update_right_bounds(seg, blocks, new_right_bounds, j, r) === false) continue
      new_parts_left.pop()

      var new_seg = DFS(seg, blocks, new_left_bounds, new_right_bounds, new_parts_left)
      if (new_seg === false) continue

      if (!possible) {
        possible = true
        merged_seg = new_seg
      } else {
        for (const [k,y] of new_seg.entries()) {
          var x = merged_seg[k]
          if (x == -1 || y == -1 || x != y) merged_seg[k] = -1
        }
      }
    }

    if (!possible) return false
    return merged_seg
  } else {
    var new_seg = seg.slice()

    for (var j = 0; j < blocks.length; j++) {
      var l,r,b
      [l,r,b] = [left_bounds[j], right_bounds[j], blocks[j]]
      if (r-l+1 < b) return false
      if (r-b+1 <= l+b-1) {
        for (var i=r-b+1; i<l+b; i++) {
          new_seg[i] = 1
        }
      }
    }

    for (var j = 0; j < blocks.length + 1; j++) {
      var l = (j == blocks.length ? seg.length : left_bounds[j])
      var r = (j == 0 ? -1 : right_bounds[j-1])
      if (r < l) {
        for (var i=r+1; i<l; i++) {
          new_seg[i] = 0
        }
      }
    }

    return new_seg
  }
}

function solve_segment(seg, blocks) {
  var left_bounds = get_left_bounds(seg, blocks)
  if (left_bounds === false) return false
  var right_bounds = get_right_bounds(seg, blocks)
  if (right_bounds === false) return false

  var parts_present = []
  var i = 0
  while (i < seg.length) {
    if (seg[i] == 1) {
      var part_start = i
      while (i < seg.length && seg[i] == 1) i++
      parts_present.push([part_start, i - part_start])
    }
    i++
  }
  parts_present.sort((a,b) => a[1] < b[1])

  return DFS(seg, blocks, left_bounds, right_bounds, parts_present)
}

function solve(hor_blocks, ver_blocks, state = undefined) {
  var h = hor_blocks.length
  var w = ver_blocks.length
  if (state === undefined) state = Array(h).fill(Array(w).fill(-1)).map(e => e.slice())

  var change = true
  while (change) {
    change = false
    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < h; j++) {
        var blocks = hor_blocks[j]
        var row = state[j]
        var new_row = solve_segment(row, blocks)
        if (new_row === false) return false
        for (var k = 0; k < w; k++) {
          if (new_row[k] != row[k]) {
            change = true
            state[j] = new_row
            break
          }
        }
      }

      state = state[0].map((_, colIndex) => state.map(row => row[colIndex]))
      // [hor_blocks, ver_blocks] = [ver_blocks, hor_blocks]
      // [h,w] = [w,h]
      hor_blocks = [ver_blocks, ver_blocks = hor_blocks][0] // Normal swapping appears to fail; no idea why
      h = [w,w=h][0]
    }

    if (!state.some(row => row.includes(-1))) return state
  }

  main:
  for (var i = 0; i < h; i++) {
    for (var j = 0; j < w; j++) {
      if (state[i][j] == -1) break main
    }
  }

  var new_state = state.slice().map(e => e.slice())
  new_state[i][j] = 0
  var res0 = solve(hor_blocks, ver_blocks, new_state)

  var new_state = state.slice().map(e => e.slice())
  new_state[i][j] = 1
  var res1 = solve(hor_blocks, ver_blocks, new_state)

  if (res0 === false && res1 === false) return false
  else if (res0 !== false && res1 !== false && JSON.stringify(res0) !== JSON.stringify(res1)) throw 'The solution to this puzzle is not unique.'
  else if (res0 === false) return res1
  else return res0
}

function solve_puzzle(hor_blocks, ver_blocks) {
  res = solve(hor_blocks, ver_blocks)
  if (res === false) throw 'No solution exists.'
  return res
}
