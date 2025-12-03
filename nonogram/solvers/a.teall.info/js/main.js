var _____WB$wombat$assign$function_____=function(name){return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name))||self[name];};if(!self.__WB_pmw){self.__WB_pmw=function(obj){this.__WB_source=obj;return this;}}{
let window = _____WB$wombat$assign$function_____("window");
let self = _____WB$wombat$assign$function_____("self");
let document = _____WB$wombat$assign$function_____("document");
let location = _____WB$wombat$assign$function_____("location");
let top = _____WB$wombat$assign$function_____("top");
let parent = _____WB$wombat$assign$function_____("parent");
let frames = _____WB$wombat$assign$function_____("frames");
let opens = _____WB$wombat$assign$function_____("opens");
"use strict";

function nonogram_calc_dimentions(nonogram) {
    var max_width = 0, max_height = 0;
    for (var i in nonogram.ver)
        if (max_width < nonogram.ver[i].length)
            max_width = nonogram.ver[i].length;
    for (var j in nonogram.hor)
        if (max_height < nonogram.hor[j].length)
            max_height = nonogram.hor[j].length;
    nonogram.dim = {
        width: nonogram.hor.length,
        height: nonogram.ver.length,
        w: max_width,
        h: max_height
    }
    nonogram.sol = new Array(nonogram.dim.width);
    for (var i = 0; i < nonogram.dim.width; ++i) {
        nonogram.sol[i] = new Array(nonogram.dim.height);
        for (var j = 0; j < nonogram.dim.height; ++j)
            nonogram.sol[i][j] = [2];
    }
    nonogram.ids = new Array(nonogram.dim.width * nonogram.dim.height);
}

function nonogram_auto_cellsize(nonogram, width, height, border) {
    nonogram.dim.cellsize = Math.min(
        (width - border) / (nonogram.dim.width + nonogram.dim.w),
        (height - border) / (nonogram.dim.height + nonogram.dim.h));
}

function nonogram_draw_grid(svg, nonogram) {
    for (var i = -nonogram.dim.w; i < nonogram.dim.width + 1; ++i)
        $t.svg.svg('line', {
            x1: (nonogram.dim.w + i) * nonogram.dim.cellsize,
            y1: 0,
            x2: (nonogram.dim.w + i) * nonogram.dim.cellsize,
            y2: (nonogram.dim.height + nonogram.dim.h) * nonogram.dim.cellsize,
            style: 'stroke: black; stroke-width: ' +
                (i != -nonogram.dim.w && (i < 0 || i % 5) ? 0.4 : 1.3) + 'px'
        }, svg);
    for (var j = -nonogram.dim.h; j < nonogram.dim.height + 1; ++j)
        $t.svg.svg('line', {
            x1: 0,
            y1: (nonogram.dim.h + j) * nonogram.dim.cellsize,
            x2: (nonogram.dim.width + nonogram.dim.w) * nonogram.dim.cellsize,
            y2: (nonogram.dim.h + j) * nonogram.dim.cellsize,
            style: 'stroke: black; stroke-width: ' +
                (j != -nonogram.dim.h && (j < 0 || j % 5) ? 0.4 : 1.3) + 'px'
        }, svg);

    svg.nonogram = nonogram;
    svg.grid = $t.svg.svg('g', {}, svg);
    svg.field = $t.svg.svg('g', {}, svg);
    for (var i = 0; i < nonogram.dim.width; ++i)
        for (var j = 0; j < nonogram.dim.height; ++j) {
            var rect = $t.svg.svg('rect', {
                x: (nonogram.dim.w + i) * nonogram.dim.cellsize,
                y: (nonogram.dim.h + j) * nonogram.dim.cellsize,
                width: nonogram.dim.cellsize, height: nonogram.dim.cellsize,
                style: 'opacity: 0.01'
            }, svg.field);
            rect.grid_x = i;
            rect.grid_y = j;
            $t.bind(rect, 'mousedown', nonogram_on_grid_click);
            $t.bind(rect, 'mousemove', nonogram_on_grid_move);
            $t.bind(rect, 'mouseup', nonogram_on_grid_stopmove);
        }
}

function nonogram_draw_legend(svg, nonogram) {
    for (var i = 0; i < nonogram.dim.width; ++i) {
        for (var j = 0; j < nonogram.hor[i].length; ++j) {
            $t.svg.svg('text', {
                x: (i + nonogram.dim.w + 0.5) * nonogram.dim.cellsize,
                y: (nonogram.dim.h - j - 0.5) * nonogram.dim.cellsize,
                class: 'nonogram-text',
                style: 'font-size: ' + (nonogram.dim.cellsize / 1.5)
            }, svg).appendChild(document.createTextNode(nonogram.hor[i][nonogram.hor[i].length - 1 - j]));
        }
        var selector = $t.svg.svg('rect', {
            x: (nonogram.dim.w + i) * nonogram.dim.cellsize,
            y: 0,
            width: nonogram.dim.cellsize,
            height: nonogram.dim.h * nonogram.dim.cellsize,
            class: 'nonogram-selector'
        }, svg);
        selector.nonogram_place = nonogram.hor[i];
        selector.nonogram = nonogram;
        $t.bind(selector, 'click', nonogram_on_selector_click);
    }
    for (var j = 0; j < nonogram.dim.height; ++j) {
        for (var i = 0; i < nonogram.ver[j].length; ++i) {
            $t.svg.svg('text', {
                x: (nonogram.dim.w - i - 0.5) * nonogram.dim.cellsize,
                y: (j + nonogram.dim.h + 0.5) * nonogram.dim.cellsize,
                class: 'nonogram-text',
                style: 'font-size: ' + (nonogram.dim.cellsize / 1.5)
            }, svg).appendChild(document.createTextNode(nonogram.ver[j][nonogram.ver[j].length - 1 - i]));
        }
        var selector = $t.svg.svg('rect', {
            x: 0,
            y: (nonogram.dim.h + j) * nonogram.dim.cellsize,
            width: nonogram.dim.w * nonogram.dim.cellsize,
            height: nonogram.dim.cellsize,
            class: 'nonogram-selector'
        }, svg);
        selector.nonogram_place = nonogram.ver[j];
        selector.nonogram = nonogram;
        $t.bind(selector, 'click', nonogram_on_selector_click);
    }
}

function nonogram_draw_clear(svg, nonogram, x, y) {
    if (nonogram.ids[x + nonogram.dim.width * y]) {
        $t.remove(nonogram.ids[x + nonogram.dim.width * y]);
        nonogram.ids[x + nonogram.dim.width * y] = undefined;
    }
}

function nonogram_draw_black(svg, nonogram, x, y) {
    nonogram_draw_clear(svg, nonogram, x, y);
    nonogram.ids[x + nonogram.dim.width * y] = $t.svg.svg('rect', {
        'class': 'nonogram_element',
        x: (nonogram.dim.w + x) * nonogram.dim.cellsize,
        y: (nonogram.dim.h + y) * nonogram.dim.cellsize,
        width: nonogram.dim.cellsize,
        height: nonogram.dim.cellsize,
        style: 'fill: rgba(0, 0, 0, 0.6)'
    }, svg.grid);
}

function nonogram_draw_cross(svg, nonogram, x, y) {
    var xx = (nonogram.dim.w + x) * nonogram.dim.cellsize + nonogram.dim.cellsize * 0.3;
    var yy = (nonogram.dim.h + y) * nonogram.dim.cellsize + nonogram.dim.cellsize * 0.3;
    nonogram_draw_clear(svg, nonogram, x, y);
    nonogram.ids[x + nonogram.dim.width * y] = $t.svg.svg('path', {
        'class': 'nonogram_element',
        d: 'M ' + xx + ' ' + yy + ' l' + nonogram.dim.cellsize * 0.4 + ' '
            + nonogram.dim.cellsize * 0.4 + ' m 0 -' + nonogram.dim.cellsize * 0.4
            + ' l-' + nonogram.dim.cellsize * 0.4 + ' ' + nonogram.dim.cellsize * 0.4,
        style: 'stroke: silver; stroke-width: 2px'
    }, svg.grid);
}

function nonogram_on_grid_click(e) {
    var svg = e.target.parentNode.parentNode, i = e.target.grid_x, j = e.target.grid_y;
    if (svg.nonogram.sol[i][j][0] == 2) {
        svg.nonogram.sol[i][j][0] = svg.grid_move = 1;
        nonogram_draw_black(svg, svg.nonogram, i, j);
    }
    else if (svg.nonogram.sol[i][j][0] == 1) {
        svg.nonogram.sol[i][j][0] = svg.grid_move = 0;
        nonogram_draw_cross(svg, svg.nonogram, i, j);
    }
    else if (svg.nonogram.sol[i][j][0] == 0) {
        svg.nonogram.sol[i][j][0] = svg.grid_move = 2;
        nonogram_draw_clear(svg, svg.nonogram, i, j);
    }
}

function nonogram_on_grid_move(e) {
    var svg = e.target.parentNode.parentNode, i = e.target.grid_x, j = e.target.grid_y;
    if (svg.grid_move != undefined) {
        svg.nonogram.sol[i][j][0] = svg.grid_move;
        if (svg.grid_move == 2) nonogram_draw_clear(svg, svg.nonogram, i, j);
        else if (svg.grid_move == 1) nonogram_draw_black(svg, svg.nonogram, i, j);
        else if (svg.grid_move == 0) nonogram_draw_cross(svg, svg.nonogram, i, j);
    }
}

function nonogram_on_grid_stopmove(e) {
    var svg = e.target.parentNode.parentNode;
    svg.grid_move = undefined;
}

function nonogram_on_selector_click(e) {
    var dialog = $t.id('nonogram_dialog');
    dialog.style.display = 'block';
    dialog.style.left = e.pageX + 'px';
    dialog.style.top = e.pageY + 'px';

    var text = $t.id('selector_text');
    text.value = this.nonogram_place.join(' ');
    text.focus();

    var ok = $t.id('selector_ok');
    ok.nonogram_place = this.nonogram_place;
    ok.nonogram = this.nonogram;

    e.stopPropagation();
}

function nonogram_resolve(svg, nonogram, call_back, onestep) {
    function get_scheme(im) {
        var res = [2];
        for (var i = 0; i < im.length; ++i) {
            for (var j = 0; j < im[i]; ++j) res.push(1);
            if (i != im.length - 1) res.push(0);
            if (res.length > 1) res.push(2);
        }
        return res;
    }
    var machine = [
        [[[1, 1, 0]], [], [[1, 1, 0]]],
        [[], [[1, 1, 1]], [[1, 1, 1]]],
        [[[0, 1, 0]], [[1, 0, 2]], [[0, 1, 0], [1, 0, 2]]]
    ];
    function machine_apply(product, scheme, input, s, i, callback) {
        if (s == scheme.length && i == input.length - 1) { callback(true); return; }
        if (s == scheme.length - 1 && i == input.length) { callback(true); return; }
        if (s == scheme.length || i == input.length) { callback(false); return; }
        if (product[s][i] != undefined) { callback(true); return; }
        var actions = machine[scheme[s]][input[i]];
        var path_found = false;
        for (var p = 0; p < actions.length; ++p) {
            var ac = actions[p];
            machine_apply(product, scheme, input, s + ac[0], i + ac[1], function(cr) {
                if (cr) {
                    if (ac[2] != 2) product[s][i] = ac[2];
                    path_found = true;
                }
            });
        }
        callback(path_found);
    }
    function machine_get_product(scheme, input, callback) {
        var product = new Array(scheme.length);
        for (var s = 0; s < scheme.length; ++s)
            product[s] = new Array(input.length);
        machine_apply(product, scheme, input, 0, 0, function() { callback(product); });
    }
    function apply_product(product, input) {
        var success = 0;
        for (var i = 0; i < input.length; ++i) {
            var result = 2;
            for (var s = 0; s < product.length && result < 3; ++s) {
                var prod = product[s][i];
                if (prod == undefined) continue;
                if (result == 2) result = prod;
                if (result != prod) result = 3;
            }
            if (result == 2) return 2;
            if (result < 2 && input[i][0] == 2) {
                input[i][0] = result;
                success = 1;
            }
        }
        return success;
    }

    function clear_sol() {
        for (var i = 0; i < nonogram.dim.width; ++i)
            for (var j = 0; j < nonogram.dim.height; ++j)
                nonogram.sol[i][j][0] = 2;
    }

    var vsol = new Array(nonogram.dim.height);
    for (var j = 0; j < nonogram.dim.height; ++j) {
        vsol[j] = new Array(nonogram.dim.width);
        for (var i = 0; i < nonogram.dim.width; ++i)
            vsol[j][i] = nonogram.sol[i][j];
    }

    var hh = new Array(nonogram.dim.width);
    for (var i = 0; i < nonogram.dim.width; ++i)
        hh[i] = get_scheme(nonogram.hor[i]);
    var vv = new Array(nonogram.dim.height);
    for (var j = 0; j < nonogram.dim.height; ++j)
        vv[j] = get_scheme(nonogram.ver[j]);

    var solver_loop = function() {
        var success = 0, timeout = 10;
        var i = 0, j = 0;
        function width_loop() {
            machine_get_product(hh[i], nonogram.sol[i], function(product) {
                success |= apply_product(product, nonogram.sol[i]);
                nonogram_draw_solution(svg, nonogram);
                if (++i < nonogram.dim.width) setTimeout(width_loop, timeout);
                else setTimeout(height_loop, timeout);
            });
        }
        function height_loop() {
            machine_get_product(vv[j], vsol[j], function(product) {
                success |= apply_product(product, vsol[j]);
                if (++j < nonogram.dim.height) setTimeout(height_loop, timeout);
                else {
                    if (success == 2) {
                        call_back(false); return;
                    }
                    if (success == 0) {
                        for (var m = 0; m < nonogram.sol.length; ++m)
                            for (var n = 0; n < nonogram.sol[m].length; ++n) {
                                if (nonogram.sol[m][n][0] == 2) { call_back(false); return; }
                            }
                        call_back(true); return;
                    }
                    nonogram_draw_solution(svg, nonogram);
                    if (onestep !== true) setTimeout(solver_loop, timeout);
                    else (call_back(true));
                }
            });
        }
        setTimeout(width_loop, timeout);
    }
    setTimeout(solver_loop, 1);
}

function nonogram_draw_solution(svg, nonogram) {
    $t.remove($t.get_elements_by_class('nonogram_element'));
    for (var i = 0; i < nonogram.sol.length; ++i)
        for (var j = 0; j < nonogram.sol[i].length; ++j) {
            if (nonogram.sol[i][j][0] == 1)
                nonogram_draw_black(svg, nonogram, i, j);
            else if (nonogram.sol[i][j][0] == 0)
                nonogram_draw_cross(svg, nonogram, i, j);
        }
}

var nonogram_rose = {
    ver: [
        [4], [2, 1], [1, 4, 2], [3, 2, 3, 1, 3], [2, 1, 2, 3, 2],
        [1, 1, 1, 6, 1, 1], [2, 2, 2, 2, 2, 1], [1, 3, 3, 2, 1], [2, 6, 5, 2], [1, 2, 5, 2],
        [3, 3, 5], [1, 2, 2, 2], [8, 1, 1], [1, 2, 2], [1, 4],
        [4, 3], [5, 4], [4, 9], [1, 2, 6, 1, 1], [7, 1],
        [5, 5, 3], [8, 4, 7], [1, 11, 5, 2], [1, 7, 3, 3, 2], [7, 12],
        [2, 4, 4], [2, 3], [2, 4], [5], [2, 5],
        [3, 4, 2, 1], [10, 2], [4, 4], [4], [2]
    ],
    hor: [
        [4], [2, 4], [2, 2, 2, 1], [3, 2, 5], [2, 1, 1, 5],
        [1, 2, 2, 1, 5], [1, 2, 1, 2, 1, 5, 1], [1, 3, 1, 3, 3, 1, 1], [1, 4, 1, 3, 3, 1, 5], [2, 2, 1, 5, 1, 9],
        [1, 1, 1, 1, 1, 15], [1, 1, 1, 2, 2, 2, 10, 2], [1, 2, 2, 1, 1, 1, 7, 1, 2], [1, 1, 1, 1, 2, 6, 2, 2], [1, 2, 1, 1, 2, 5, 1, 3],
        [1, 2, 1, 4, 4, 2, 3], [1, 2, 2, 1, 3, 3, 3, 1, 2], [1, 3, 1, 6, 5, 1, 2], [4, 1, 1, 2, 2, 2, 2, 2, 1], [1, 2, 2, 1, 2, 1, 2, 2, 3],
        [1, 2, 1, 2, 1, 2, 2, 1], [1, 2, 5, 1, 2, 1], [2, 4, 4], [5, 1, 3], [2]
    ]
};

function redraw(nonogram) {
    nonogram_calc_dimentions(nonogram);
    nonogram.dim.cellsize = 16;
    var width = nonogram.dim.cellsize * (nonogram.dim.width + nonogram.dim.w);
    var height = nonogram.dim.cellsize * (nonogram.dim.height + nonogram.dim.h);
    var border = 15.5;

    teal.remove($t.id('svg_canvas'));
    var svg = $t.svg.svg('svg', {
            version: '1.1',
            id: 'svg_canvas',
            viewBox: '-' + border + '-' + border +
                ' ' + (width + border * 2) + ' ' + (height + border * 2),
            width: width + border * 2, height: height + border * 2
        },
        $t.id('svg'));

    nonogram_draw_grid(svg, nonogram);
    nonogram_draw_legend(svg, nonogram);
    $t.id('solve_status').innerHTML = "";
}

function initialize() {
    var nonogram = nonogram_rose;
    nonogram_calc_dimentions(nonogram);

    var panel = $t.id('status');
    $t.id('width').value = nonogram.dim.width;
    $t.id('height').value = nonogram.dim.height;

    $t.bind($t.id('reset'), 'click', function () {
        var width = parseInt($t.id('width').value);
        var height = parseInt($t.id('height').value);
        nonogram.hor = new Array(width);
        for (var i = 0; i < width; ++i)
            nonogram.hor[i] = [0];
        nonogram.ver = new Array(height);
        for (var j = 0; j < height; ++j)
            nonogram.ver[j] = [0];

        nonogram_calc_dimentions(nonogram);
        redraw(nonogram);
    });

    $t.bind($t.id('solve'), 'click', function () {
        $t.id('solve_status').innerHTML = "Solving...";
        setTimeout(function() {
            nonogram_resolve($t.id('svg_canvas'), nonogram, function(res) {
                $t.id('solve_status').innerHTML = res ? "Solution found." :
                "Bad luck. To help, change current solution manualy and then try again.";
            });
        }, 1);
    });

    $t.bind($t.id('onestep'), 'click', function () {
        $t.id('solve_status').innerHTML = "Doing one step...";
        setTimeout(function() {
            nonogram_resolve($t.id('svg_canvas'), nonogram, function(res) {
                $t.id('solve_status').innerHTML = res ? "Step is done." :
                "Bad luck. To help, change current solution manualy and then try again.";
            }, true);
        }, 1);
    });

    function hide_selector_dialog() {
        $t.id('nonogram_dialog').style.display = 'none';
    }

    $t.bind(document.body, 'click', hide_selector_dialog);
    $t.bind($t.id('selector_cancel'), 'click', hide_selector_dialog);
    $t.bind($t.id('selector_ok'), 'click', function () {
        var line = $t.id('selector_text').value.split(' ');
        this.nonogram_place.length = line.length;
        for (var i = 0; i < line.length; ++i)
            this.nonogram_place[i] = parseInt(line[i]);
        redraw(this.nonogram);
        hide_selector_dialog();
    });
    $t.bind($t.id('selector_text'), 'keydown', function (e) {
        if (e.keyCode == 13) $t.raise_event($t.id('selector_ok'), 'click');
        else if (e.keyCode == 27) $t.raise_event($t.id('selector_cancel'), 'click');
    });
    $t.bind($t.id('nonogram_dialog'), 'click', function(e) {
        e.stopPropagation();
    });

    $t.bind($t.id('save'), 'click', function(e) {
        window.prompt('Your serialized puzzle here. Copy it to text file for future use.',
            JSON.stringify({ ver: nonogram.ver, hor: nonogram.hor }));
    });

    $t.bind($t.id('load'), 'click', function(e) {
        var res = window.prompt('Paste you puzzle here.');
        if (!res) return;
        try {
            nonogram = JSON.parse(res);
            nonogram_calc_dimentions(nonogram);
            redraw(nonogram);
        }
        catch (e) { alert(e); }
    });

    redraw(nonogram);
}

}
/*
     FILE ARCHIVED ON 02:35:51 May 27, 2023 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 00:13:39 Dec 03, 2025.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 1.039
  exclusion.robots: 0.045
  exclusion.robots.policy: 0.028
  esindex: 0.017
  cdx.remote: 6.466
  LoadShardBlock: 66.121 (3)
  PetaboxLoader3.datanode: 74.151 (4)
  PetaboxLoader3.resolve: 225.045 (2)
  load_resource: 260.876
*/
