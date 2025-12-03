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
            style: 'stroke: black; stroke-width: ' + (i % 5 ? 0.4 : 1.4) + ' px'
        }, svg);
    for (var j = -nonogram.dim.h; j < nonogram.dim.height + 1; ++j)
        $t.svg.svg('line', {
            x1: 0,
            y1: (nonogram.dim.h + j) * nonogram.dim.cellsize,
            x2: (nonogram.dim.width + nonogram.dim.w) * nonogram.dim.cellsize,
            y2: (nonogram.dim.h + j) * nonogram.dim.cellsize,
            style: 'stroke: black; stroke-width: ' + (j % 5 ? 0.4 : 1.4) + ' px'
        }, svg);
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
        $t.bind(selector, 'click', nomogram_on_selector_click);
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
        $t.bind(selector, 'click', nomogram_on_selector_click);
    }
}

function nonogram_draw_black(svg, nonogram, x, y) {
    $t.svg.svg('rect', {
        'class': 'nonogram_element',
        x: (nonogram.dim.w + x) * nonogram.dim.cellsize,
        y: (nonogram.dim.h + y) * nonogram.dim.cellsize,
        width: nonogram.dim.cellsize,
        height: nonogram.dim.cellsize,
        style: 'fill: rgba(0, 0, 0, 0.6)'
    }, svg);
}

function nonogram_draw_cross(svg, nonogram, x, y) {
    var xx = (nonogram.dim.w + x) * nonogram.dim.cellsize + nonogram.dim.cellsize * 0.3;
    var yy = (nonogram.dim.h + y) * nonogram.dim.cellsize + nonogram.dim.cellsize * 0.3;
    $t.svg.svg('path', {
        'class': 'nonogram_element',
        d: 'M ' + xx + ' ' + yy + ' l' + nonogram.dim.cellsize * 0.4 + ' '
            + nonogram.dim.cellsize * 0.4 + ' m 0 -' + nonogram.dim.cellsize * 0.4
            + ' l-' + nonogram.dim.cellsize * 0.4 + ' ' + nonogram.dim.cellsize * 0.4,
        style: 'stroke: silver; stroke-width: 2px'
    }, svg);
}

function nomogram_on_selector_click(e) {
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

function nonogram_resolve(svg, nonogram, call_back) {
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
    function machine_apply(product, scheme, input, s, i) {
        if (s == scheme.length && i == input.length - 1) return true;
        if (s == scheme.length - 1 && i == input.length) return true;
        if (s == scheme.length || i == input.length) return false;
        if (product[s][i] != undefined) return true;
        var actions = machine[scheme[s]][input[i]];
        var path_found = false;
        for (var p = 0; p < actions.length; ++p) {
            var ac = actions[p];
            if (machine_apply(product, scheme, input, s + ac[0], i + ac[1])) {
                if (ac[2] != 2) product[s][i] = ac[2];
                path_found = true;
            }
        }
        return path_found;
    }
    function machine_get_product(scheme, input) {
        var product = new Array(scheme.length);
        for (var s = 0; s < scheme.length; ++s)
            product[s] = new Array(input.length);
        machine_apply(product, scheme, input, 0, 0);
        return product;
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
                ++nonogram.painted_count;
                success = 1;
            }
        }
        return success;
    }

    function clear_sol() {
        nonogram.painted_count = 0;
        for (var i = 0; i < nonogram.dim.width; ++i)
            for (var j = 0; j < nonogram.dim.height; ++j)
                nonogram.sol[i][j][0] = 2;
    }

    nonogram.sol = new Array(nonogram.dim.width);
    for (var i = 0; i < nonogram.dim.width; ++i) {
        nonogram.sol[i] = new Array(nonogram.dim.height);
        for (var j = 0; j < nonogram.dim.height; ++j)
            nonogram.sol[i][j] = [2];
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

    nonogram.painted_count = 0;
    var guess = { i: 0, j: 0, c: 2 };

    function reguess() {
        if (guess.i == nonogram.dim.width) return true;
        clear_sol();
        guess.c = guess.c != 1 ? 1 : 0;
        nonogram.sol[guess.i][guess.j][0] = guess.c;
        if (!guess.c) ++guess.j;
        if (guess.j == nonogram.dim.height) {
            guess.j = 0;
            ++guess.i;
        }
        ++nonogram.painted_count;
        return false;
    }

    var solver_loop = function() {
        var success = 0, to = 1;
        for (var i = 0; i < nonogram.dim.width; ++i)
            success |= apply_product(machine_get_product(hh[i], nonogram.sol[i]), nonogram.sol[i]);
        for (var j = 0; j < nonogram.dim.height; ++j)
            success |= apply_product(machine_get_product(vv[j], vsol[j]), vsol[j]);
        if (success == 2) {
            if (reguess()) { call_back(false); return; }
        }
        if (success == 0) {
            if (nonogram.painted_count == nonogram.dim.width * nonogram.dim.height) {
                call_back(true); return;
            }
            if (reguess()) { call_back(false); return; }
        }
        nonogram_draw_solution(svg, nonogram);
        setTimeout(solver_loop, 1);
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
                $t.id('solve_status').innerHTML = res ? "Solution found." : "Solution impossible.";
            });
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
