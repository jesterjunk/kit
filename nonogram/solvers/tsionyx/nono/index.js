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
    });
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
            renderPuzzleDesc(data.obj);
            break;
        case 'renderCells':
            renderPuzzleCells(data.obj);
            break;
        case 'solvePuzzle': {
            var timeMs = +data.time.toFixed(2);
            var timeAsStr = timeMs + 'ms';
            if (timeMs > 1000) {
                timeAsStr = (timeMs / 1000.0).toFixed(3) + ' seconds';
            }
            var msg = 'Time to solve the puzzle with hash ' + hash + ': ' + timeAsStr;
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

// Derived layout values (no gaps when SHOW_GRID = false)
var GAP = SHOW_GRID ? 1 : 0;
var STEP = CELL_SIZE + GAP;
var OFFSET = SHOW_GRID ? 1 : 0;

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
    var rowsSideSize = width - colsNumber;
    var colsHeaderSize = height - rowsNumber;
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
// ========================= HELPERS =========================
function searchParams() {
    return new URL(window.location.href).searchParams;
}
function intValFromQuery(arg) {
    var parameters = searchParams();
    return parseInt(parameters.get(arg));
}
