var _a;
var worker = new Worker('worker.js');
worker.addEventListener('message', workerCallback, false);
document.addEventListener('DOMContentLoaded', function (event) {
    initPage();
});
function initPage() {
    var $webpbnCounter = document.querySelector('#webpbnCounter');
    var $nonogramsOrgCounter = document.querySelector('#nonogramsOrgCounter');
    var $nonoSrcInput = document.querySelector('#nonoSrc');
    var $solveButton = document.querySelector('#solve');
    setKeyHandlerForLoading($webpbnCounter);
    setKeyHandlerForLoading($nonogramsOrgCounter);
    $nonoSrcInput.value = '';
    initFromArgs();
    $solveButton.addEventListener('click', function (event) {
        worker.postMessage({
            cmd: 'initBoard',
            content: $nonoSrcInput.value
        });
    });
    document.querySelector('#share').addEventListener('click', function (event) {
        var content = $nonoSrcInput.value;
        if (content) {
            var encoded = encodeURIComponent(content);
            history.pushState(null, document.title, '?s=' + encoded);
        }
    });
    document.querySelector('#webpbnButton').addEventListener('click', function (event) {
        loadPuzzle(WEBPBN_SOURCE_URL, $webpbnCounter.valueAsNumber);
    });
    document.querySelector('#nonogramsOrgButton').addEventListener('click', function (event) {
        loadPuzzle(NONOGRAMS_SOURCE_URL, $nonogramsOrgCounter.valueAsNumber);
    });
    document.querySelector('body').addEventListener('keydown', function (event) {
        if (event.ctrlKey && event.keyCode === 13) {
            $solveButton.click();
        }

        // ===== NEW: +/- keys adjust pixel size (main keyboard and numpad) =====
        var key = event.key;
        var code = event.keyCode || event.which;

        // main '+': key === '+', code 187 with shift (US); numpad '+': code 107
        var isPlus = (key === '+') || (code === 107) || (code === 187 && event.shiftKey);
        // main '-': key === '-', code 189; numpad '-': code 109
        var isMinus = (key === '-') || (code === 109) || (code === 189);

        if (isPlus || isMinus) {
            event.preventDefault();
            var delta = isPlus ? 1 : -1;
            var newSize = Math.max(2, Math.min(200, CELL_SIZE + delta));
            if (newSize !== CELL_SIZE) {
                CELL_SIZE = newSize;
                var inputEl = document.getElementById('pixelSizeInput');
                if (inputEl) inputEl.value = String(CELL_SIZE);
                recomputeLayout();
                rerender();
                saveSettingsIfNeeded(); // <<< NEW
            }
        }
    });

    // ===== NEW: load saved settings before building UI =====
    loadSavedSettings();

    // ===== NEW: add simple on-page checkboxes for solution / clues / grid + pixel size =====
    (function addViewToggles() {
        var container = document.createElement('div');
        container.id = 'viewToggles';
        container.style.margin = '8px 0';
        container.style.display = 'flex';
        container.style.gap = '12px';
        container.style.flexWrap = 'wrap';

        function mk(label, checked, onChange) {
            var wrap = document.createElement('label');
            wrap.style.display = 'inline-flex';
            wrap.style.alignItems = 'center';
            wrap.style.gap = '6px';
            var input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = checked;
            input.addEventListener('change', function (e) { onChange(e.target.checked); saveSettingsIfNeeded(); }); // <<< NEW save
            var span = document.createElement('span');
            span.textContent = label;
            wrap.appendChild(input); wrap.appendChild(span);
            return wrap;
        }

        container.appendChild(mk('Show solution', SHOW_SOLUTION, function (v) { SHOW_SOLUTION = v; rerender(); }));
        container.appendChild(mk('Show clues',    SHOW_CLUES,    function (v) { SHOW_CLUES = v; rerender(); }));
        container.appendChild(mk('Show grid',     SHOW_GRID,     function (v) { SHOW_GRID = v; recomputeLayout(); rerender(); }));

        // ===== NEW: Pixel size number input (default 20) + Canvas size label =====
        (function mkPixelSize() {
            var wrap = document.createElement('label');
            wrap.style.display = 'inline-flex';
            wrap.style.alignItems = 'center';
            wrap.style.gap = '6px';
            var span = document.createElement('span');
            span.textContent = 'Pixel size';
            var input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.max = '160';
            input.step = '1';
            input.value = String(CELL_SIZE); // default 20 or loaded
            input.id = 'pixelSizeInput'; // so keyboard handler can sync this
            input.style.width = '5rem';
            input.addEventListener('change', function (e) {
                var v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v > 0) {
                    CELL_SIZE = v;
                    recomputeLayout();
                    rerender();
                    saveSettingsIfNeeded(); // <<< NEW
                } else {
                    // reset invalid value back to current CELL_SIZE
                    e.target.value = String(CELL_SIZE);
                }
            });

            var sizeLabel = document.createElement('span'); // canvas resolution label
            sizeLabel.id = 'canvasSizeLabel';
            sizeLabel.style.marginLeft = '8px';
            sizeLabel.textContent = ' Canvas size 0x0';

            wrap.appendChild(span);
            wrap.appendChild(input);
            wrap.appendChild(sizeLabel); // show to the right of the Pixel size input
            container.appendChild(wrap);

            // initialize label based on current canvas (if any)
            updateCanvasSizeLabel();
        })();

        // ===== NEW: Background color picker + contrast-aware UI text =====
        (function mkBackgroundPicker() {
            var wrap = document.createElement('label');
            wrap.style.display = 'inline-flex';
            wrap.style.alignItems = 'center';
            wrap.style.gap = '6px';
            var span = document.createElement('span');
            span.textContent = 'Background';
            var input = document.createElement('input');
            input.type = 'color';
            input.value = BG_COLOR; // <<< NEW: use loaded/default bg
            input.addEventListener('input', function (e) {
                var hex = e.target.value;
                BG_COLOR = hex; // <<< NEW
                document.body.style.backgroundColor = hex;
                var rgb = hexToRgb(hex);
                var textColor = getContrastYIQ(rgb.r, rgb.g, rgb.b);
                // Apply contrast color to interface text
                document.body.style.color = textColor;
                container.style.color = textColor;
                saveSettingsIfNeeded(); // <<< NEW
            });
            // Apply defaults immediately
            document.body.style.backgroundColor = input.value;
            (function initTextColor() {
                var rgb = hexToRgb(input.value);
                var textColor = getContrastYIQ(rgb.r, rgb.g, rgb.b);
                document.body.style.color = textColor;
                container.style.color = textColor;
            })();

            wrap.appendChild(span);
            wrap.appendChild(input);
            container.appendChild(wrap);
        })();

        // ===== NEW: Remember/Reset settings controls =====
        (function mkPersistenceControls() {
            // Remember settings checkbox
            var wrap = document.createElement('label');
            wrap.style.display = 'inline-flex';
            wrap.style.alignItems = 'center';
            wrap.style.gap = '6px';
            var span = document.createElement('span');
            span.textContent = 'Remember settings';
            var input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'rememberSettings';
            input.checked = REMEMBER_SETTINGS;
            input.addEventListener('change', function (e) {
                REMEMBER_SETTINGS = !!e.target.checked;
                if (REMEMBER_SETTINGS) {
                    saveSettingsIfNeeded();
                }
            });
            wrap.appendChild(input);
            wrap.appendChild(span);
            container.appendChild(wrap);

            // Reset settings button
            var resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.textContent = 'Reset settings';
            resetBtn.addEventListener('click', function () {
                resetSettings();
            });
            container.appendChild(resetBtn);
        })();

        var canvas = document.querySelector('#nonoCanvas');
        if (canvas && canvas.parentNode) {
            canvas.parentNode.insertBefore(container, canvas);
        } else {
            document.body.insertBefore(container, document.body.firstChild || null);
        }
    })();

    // ===== NEW (minimal): place the time message below the Share and Solve buttons =====
    (function placeTimeMsgBelowButtons() {
        var timeEl = document.querySelector('#timeToSolve');
        var shareBtn = document.querySelector('#share');
        var solveBtn = document.querySelector('#solve');
        if (!timeEl) return;

        // Pick whichever button appears LAST in DOM order, then insert after it.
        var anchor = null;
        if (shareBtn && solveBtn) {
            anchor = (solveBtn.compareDocumentPosition(shareBtn) & Node.DOCUMENT_POSITION_FOLLOWING) ? shareBtn : solveBtn;
        } else {
            anchor = shareBtn || solveBtn;
        }
        if (anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(timeEl, anchor.nextSibling);
        }
    })();
}
function setKeyHandlerForLoading(input) {
    input.addEventListener('keypress', function (event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13 || event.which === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            var counter = event.target;
            var value = counter.valueAsNumber;
            if (value) {
                var sourceUrl = counter.name;
                loadPuzzle(sourceUrl, parseInt(value));
            }
        }
    });
}
function initFromArgs() {
    var parameters = searchParams();
    var content = parameters.get('s');
    if (content) {
        document.querySelector('#nonoSrc').value = content;
    }
    else {
        var webPbnId = parseInt(parameters.get('id'));
        var nonogramsOrgId = parseInt(parameters.get('noid'));
        if (webPbnId) {
            console.log('Loading webpbn.com from query: ' + webPbnId);
            document.querySelector('#webpbnCounter').value = webPbnId.toString();
            loadPuzzle(WEBPBN_SOURCE_URL, webPbnId);
        }
        else if (nonogramsOrgId) {
            console.log('Loading nonograms.org from query: ' + nonogramsOrgId);
            document.querySelector('#nonogramsOrgCounter').value = nonogramsOrgId.toString();
            loadPuzzle(NONOGRAMS_SOURCE_URL, nonogramsOrgId);
        }
    }
}
function workerCallback(e) {
    var data = e.data;
    console.log('Got response from worker: ', data);
    if (data.error) {
        console.error(data.error);
    }
    var hash = data.hash;
    switch (data.result) {
        case 'init':
            break;
        case 'initBoard': {
            worker.postMessage({
                cmd: 'renderDescriptions',
                hash: hash
            });
            var solveMsg = {
                cmd: 'solvePuzzle',
                hash: hash
            };
            var maxSolutions = intValFromQuery('solutions');
            if (!isNaN(maxSolutions)) {
                solveMsg['maxSolutions'] = maxSolutions; /* eslint-disable-line dot-notation */
            }
            worker.postMessage(solveMsg);
            document.querySelector('#timeToSolve').innerHTML = 'Solving puzzle with hash ' + hash + '...';
            break;
        }
        case 'renderDescriptions':
            // ===== CHANGED: store and re-render based on toggles =====
            LAST_DESC = data.obj;
            rerender();
            break;
        case 'renderCells':
            // ===== CHANGED: store and re-render based on toggles =====
            LAST_CELLS = data.obj;
            rerender();
            break;
        case 'solvePuzzle': {
            var timeMs = +data.time.toFixed(2);
            var timeAsStr = timeMs + 'ms';
            if (timeMs > 1000) {
                timeAsStr = (timeMs / 1000.0).toFixed(3) + ' seconds';
            }
            var msg = `Puzzle hash: ${hash}<br><br>`
                    + `&nbsp;&nbsp;`
                    + `Solve time: ${timeAsStr}`;
            document.querySelector('#timeToSolve').innerHTML = msg;
            worker.postMessage({
                cmd: 'renderCells',
                hash: hash
            });
            break;
        }
        default:
            console.error('Unknown response from worker: ', data.result);
    }
}
// ========================= HTTP =========================
var CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
var WEBPBN_SOURCE_URL = 'https://webpbn.com';
var NONOGRAMS_SOURCE_URL = 'http://nonograms.org';
var sourceUrlToPuzzleUrl = (_a = {},
    _a[WEBPBN_SOURCE_URL] = WEBPBN_SOURCE_URL + '/export.cgi',
    _a[NONOGRAMS_SOURCE_URL] = NONOGRAMS_SOURCE_URL + '/nonograms2/i/',
    _a);
var NONOGRAMS_ENCODED_SRC_RE = /var d=(\[[[\]\d, ]+\]);/gm;
function successCallback(sourceUrl, puzzleUrl) {
    return function (xhttp) {
        var data = xhttp.responseText;
        var src = data;
        if (sourceUrl === NONOGRAMS_SOURCE_URL) {
            var match = null;
            while ((match = NONOGRAMS_ENCODED_SRC_RE.exec(data)) !== null) {
                src = match[0];
            }
        }
        document.querySelector('#nonoSrc').value = src;
        document.querySelector('#originalUrl').innerHTML = '<a href=' + puzzleUrl + '>Original puzzle URL</a>';
        // clearCanvas();
    };
}
function failCallback(msg) {
    return function (xhttp) {
        document.querySelector('#originalUrl').innerHTML = 'Failed to get ' + msg + '.';
        console.error(xhttp);
    };
}
function requestWithCallbacks(successCallback, errorCallback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4) {
            if (Math.floor(this.status / 100) === 2) {
                successCallback(this);
            }
            else {
                errorCallback(this);
            }
        }
    };
    return xhttp;
}
function doGet(url, successCallback, errorCallback) {
    var xhttp = requestWithCallbacks(successCallback, errorCallback);
    xhttp.open('GET', url, true);
    xhttp.send(null);
}
function doPost(url, body, successCallback, errorCallback) {
    var xhttp = requestWithCallbacks(successCallback, errorCallback);
    xhttp.open('POST', url, true);
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhttp.send(body);
}
function loadPuzzle(sourceUrl, id) {
    if (!id) {
        console.log('Bad puzzle id: ', id);
        return;
    }
    var msg = 'puzzle #' + id + ' from ' + sourceUrl;
    document.querySelector('#originalUrl').innerHTML = 'Retrieving ' + msg + '...';
    var url = sourceUrlToPuzzleUrl[sourceUrl];
    var puzzleUrl;
    if (sourceUrl === WEBPBN_SOURCE_URL) {
        puzzleUrl = sourceUrl + '/?id=' + id;
        doPost(CORS_PROXY + url, 'fmt=olsak&go=1&id=' + id, successCallback(sourceUrl, puzzleUrl), failCallback(msg));
    }
    else {
        url = url + id;
        puzzleUrl = url;
        doGet(CORS_PROXY + url, successCallback(sourceUrl, puzzleUrl), function (xhttp) {
            if (xhttp.status === 404) {
                var fixedUrl = url.replace('nonograms2', 'nonograms');
                console.log('Try to find the puzzle #' + id + ' on another URL: ' + fixedUrl);
                doGet(CORS_PROXY + fixedUrl, successCallback(sourceUrl, fixedUrl), failCallback(msg));
            }
            else {
                failCallback(msg)(xhttp);
            }
        });
    }
}
// ========================= RENDERING =========================
// ========================= RENDERING =========================
var CELL_SIZE = 20; // px

// Turn grid/dots off for pure pixel art
var SHOW_GRID = false;
var SHOW_WHITE_DOTS = false;

var GRID_COLOR = '#000000';
var ALMOST_ZERO = 5;

// ===== NEW: runtime view toggles & last-known data =====
var SHOW_SOLUTION = true;
var SHOW_CLUES = true;
var LAST_DESC = null;
var LAST_CELLS = null;

// ===== NEW: persistence state & bg color =====
var REMEMBER_SETTINGS = false;
var BG_COLOR = '#ffffff';
var LS_KEY = 'nonoSettingsV1';

// Derived layout values (no gaps when SHOW_GRID = false)
var GAP = SHOW_GRID ? 1 : 0;
var STEP = CELL_SIZE + GAP;
var OFFSET = SHOW_GRID ? 1 : 0;

// ===== NEW: recompute when SHOW_GRID changes =====
function recomputeLayout() {
    GAP = SHOW_GRID ? 1 : 0;
    STEP = CELL_SIZE + GAP;
    OFFSET = SHOW_GRID ? 1 : 0;
}

// Add this helper (anywhere above renderBlock is fine)
function getContrastYIQ(r, g, b) {
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? 'hsl(0, 0%, 5%)' : 'hsl(0, 0%, 95%)';
}

// Replace your current renderBlock with this version
function renderBlock(ctx, value, intColor, x, y) {
    var verticalOffset = CELL_SIZE * 0.8;
    var horizontalOffset = CELL_SIZE * 0.15;

    // Fill the block
    var blockColor = '#' + intColor.toString(16).padStart(6, '0');
    if (blockColor === '#ffffff') {
        // for more visual attention
        blockColor = '#cccccc';
    }
    ctx.fillStyle = blockColor;
    ctx.fillRect(x * STEP + OFFSET, y * STEP + OFFSET, CELL_SIZE, CELL_SIZE);

    // Compute high-contrast text color using YIQ
    var r = (intColor >> 16) & 0xff;
    var g = (intColor >> 8) & 0xff;
    var b = intColor & 0xff;
    var textColor = getContrastYIQ(r, g, b);

    ctx.fillStyle = textColor;
    ctx.fillText(value, x * STEP + OFFSET + horizontalOffset, y * STEP + OFFSET + verticalOffset);
}

function renderPuzzleDesc(desc) {
    if (!SHOW_CLUES) return; // ===== NEW: allow hiding clues =====

    var height = desc.fullHeight;
    var width = desc.fullWidth;
    var canvas = document.querySelector('#nonoCanvas');

    // No extra border; size exactly to the grid in use
    canvas.height = STEP * height;
    canvas.width = STEP * width;

    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    var rowsNumber = desc.rows.length;
    var colsNumber = desc.cols.length;
    var rowsSideSize = width - colsNumber;
    var colsHeaderSize = height - rowsNumber;

    // Skip drawing the grid for pure pixel art
    if (SHOW_GRID) {
        drawGrid(ctx, rowsSideSize, colsHeaderSize, width, height);
    }

    ctx.beginPath();
    var fontSize = CELL_SIZE * 0.7;
    ctx.font = fontSize + 'px Verdana';

    // Row clues
    for (var i = 0; i < rowsNumber; i++) {
        var row = desc.rows[i];
        var rowColors = desc.rowsColors[i];
        var rowOffset = rowsSideSize - row.length;
        var rowIndex = colsHeaderSize + i;
        for (var j = 0; j < row.length; j++) {
            var colIndex = rowOffset + j;
            renderBlock(ctx, row[j], rowColors[j], colIndex, rowIndex);
        }
    }

    // Column clues
    for (var k = 0; k < colsNumber; k++) {
        var col = desc.cols[k];
        var colColors = desc.colsColors[k];
        var colOffset = colsHeaderSize - col.length;
        var colIndex = rowsSideSize + k;
        for (var m = 0; m < col.length; m++) {
            var rowIndex = colOffset + m;
            renderBlock(ctx, col[m], colColors[m], colIndex, rowIndex);
        }
    }
    // No ctx.stroke() — avoids any unintended outlines
}

function renderPuzzleCells(desc) {
    var height = desc.fullHeight;
    var width = desc.fullWidth;
    var rowsNumber = desc.rowsNumber;
    var colsNumber = desc.colsNumber;

    // ===== CHANGED: offsets depend on whether clues are shown =====
    var rowsSideSize = SHOW_CLUES ? (width - colsNumber) : 0;
    var colsHeaderSize = SHOW_CLUES ? (height - rowsNumber) : 0;

    var cells = desc.cellsAsColors;

    var whiteColorCode = desc.whiteColorCode;

    var canvas = document.querySelector('#nonoCanvas');
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Draw only filled pixels; no grid, no dots
    for (var i = 0; i < rowsNumber; i++) {
        var rowStartIndex = i * colsNumber;
        var y = colsHeaderSize + i;
        for (var j = 0; j < colsNumber; j++) {
            var index = rowStartIndex + j;
            var intColor = cells[index];
            var x = rowsSideSize + j;

            if (intColor >= 0) {
                var blockColor = '#' + intColor.toString(16).padStart(6, '0');
                ctx.fillStyle = blockColor;
                ctx.fillRect(x * STEP + OFFSET, y * STEP + OFFSET, CELL_SIZE, CELL_SIZE);
            } else if (intColor === whiteColorCode) {
                // In pure pixel mode, do NOTHING for empty/white cells.
                if (SHOW_WHITE_DOTS) {
                    // (kept for optional fallback)
                    var whiteDotSize = CELL_SIZE / 10;
                    var whiteDotOffset = (CELL_SIZE - whiteDotSize) / 2;
                    ctx.fillStyle = 'black';
                    ctx.fillRect(x * STEP + OFFSET + whiteDotOffset, y * STEP + OFFSET + whiteDotOffset, whiteDotSize, whiteDotSize);
                }
            }
            // Any other negative sentinel values are also ignored (stay transparent)
        }
    }
    // No ctx.stroke()
}

function drawGrid(ctx, xStart, yStart, width, height) {
    if (!SHOW_GRID) return; // short-circuit when disabled

    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;
    var lastX = width * STEP + OFFSET;
    var lastY = height * STEP + OFFSET;

    // Vertical lines.
    for (var i = xStart; i <= width; i++) {
        var currentX = i * STEP + OFFSET;
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, lastY);
        if ((i - xStart) % 5 === 0 && GAP === 1) {
            ctx.moveTo(currentX + 1, 0);
            ctx.lineTo(currentX + 1, lastY);
        }
    }
    // Horizontal lines.
    for (var j = yStart; j <= height; j++) {
        var currentY = j * STEP + OFFSET;
        ctx.moveTo(0, currentY);
        ctx.lineTo(lastX, currentY);
        if ((j - yStart) % 5 === 0 && GAP === 1) {
            ctx.moveTo(0, currentY + 1);
            ctx.lineTo(lastX, currentY + 1);
        }
    }
    ctx.stroke();
}

// ===== NEW: central re-render based on toggles, including canvas resize rules =====
function rerender() {
    recomputeLayout();

    var canvas = document.querySelector('#nonoCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    // Decide canvas size
    if (SHOW_SOLUTION && !SHOW_CLUES && LAST_CELLS) {
        // Solution-only => size exactly to the solution image
        canvas.width = STEP * LAST_CELLS.colsNumber;
        canvas.height = STEP * LAST_CELLS.rowsNumber;
    } else {
        // With clues (or no cells yet) => use full puzzle size if we know it
        var basis = LAST_DESC || LAST_CELLS;
        if (basis) {
            canvas.width = STEP * basis.fullWidth;
            canvas.height = STEP * basis.fullHeight;
        }
    }

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid for the current geometry when clues are hidden
    if (SHOW_GRID) {
        if (SHOW_SOLUTION && !SHOW_CLUES && LAST_CELLS) {
            drawGrid(ctx, 0, 0, LAST_CELLS.colsNumber, LAST_CELLS.rowsNumber);
        }
    }

    // Draw clues (also handles grid when SHOW_CLUES is true)
    if (SHOW_CLUES && LAST_DESC) {
        renderPuzzleDesc(LAST_DESC);
    }

    // Draw solution
    if (SHOW_SOLUTION && LAST_CELLS) {
        renderPuzzleCells(LAST_CELLS);
    }

    // update canvas size label
    updateCanvasSizeLabel();
}

// small helper to sync the "Canvas size WxH" label
function updateCanvasSizeLabel() {
    var label = document.getElementById('canvasSizeLabel');
    if (!label) return;
    var canvas = document.querySelector('#nonoCanvas');
    if (!canvas) {
        label.textContent = ' Canvas size 0x0';
        return;
    }
    label.textContent = ` Canvas size ${canvas.width}x${canvas.height}`;
}

// ===== NEW: hex -> rgb helper for background picker =====
function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return { r: 255, g: 255, b: 255 };
    return {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16)
    };
}

// ===== NEW: settings persistence helpers =====
function currentSettings() {
    return {
        remember: REMEMBER_SETTINGS,
        cellSize: CELL_SIZE,
        showSolution: SHOW_SOLUTION,
        showClues: SHOW_CLUES,
        showGrid: SHOW_GRID,
        background: BG_COLOR
    };
}
function saveSettingsIfNeeded() {
    if (!REMEMBER_SETTINGS) return;
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(currentSettings()));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
}
function loadSavedSettings() {
    try {
        var raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        var s = JSON.parse(raw);
        REMEMBER_SETTINGS = !!s.remember;
        if (!REMEMBER_SETTINGS) return; // don't apply if user opted out
        if (typeof s.cellSize === 'number' && s.cellSize > 0) CELL_SIZE = s.cellSize;
        if (typeof s.showSolution === 'boolean') SHOW_SOLUTION = s.showSolution;
        if (typeof s.showClues === 'boolean') SHOW_CLUES = s.showClues;
        if (typeof s.showGrid === 'boolean') SHOW_GRID = s.showGrid;
        if (typeof s.background === 'string') BG_COLOR = s.background;
        recomputeLayout();
    } catch (e) {
        console.warn('Failed to load settings:', e);
    }
}
function resetSettings() {
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    REMEMBER_SETTINGS = false;
    var rem = document.getElementById('rememberSettings');
    if (rem) rem.checked = false;
    // (intentionally do not change current UI state; only clear stored data)
}

// ========================= HELPERS =========================
function searchParams() {
    return new URL(window.location.href).searchParams;
}
function intValFromQuery(arg) {
    var parameters = searchParams();
    return parseInt(parameters.get(arg));
}
