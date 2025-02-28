// Calculate the greatest common divisor (Euclid's algorithm)
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}


// Generate the table HTML with sortable data attributes
function generateTable(rowsData) {
    var tableHTML = '<table id="resultsTable" data-sort-dir="asc"><thead><tr>';
    tableHTML += '<th onclick="sortTable(0)">Resolution</th>';
    tableHTML += '<th onclick="sortTable(1)">Aspect Ratio</th>';
    tableHTML += '<th onclick="sortTable(2)">Decimal</th>';
    tableHTML += '<th onclick="sortTable(3)">Pixel Count (MP)</th>';
    tableHTML += '</tr></thead><tbody>';
    rowsData.forEach(row => {
        tableHTML += `<tr>
            <td data-sort="${row.resSort}">${row.resolution}</td>
            <td data-sort="${row.decimal}">${row.aspectRatio}</td>
            <td data-sort="${row.decimal}">${row.decimal}</td>
            <td data-sort="${row.pixelCount}">${row.pixelCount} (${row.megapixels} MP)</td>
        </tr>`;
    });
    tableHTML += '</tbody></table>';
    return tableHTML;
}


// Process input to calculate aspect ratios, pixel counts, and megapixels
function calculateAspectRatios() {
    var input = document.getElementById('resolutionsInput').value;
    var lines = input.split('\n');
    var rowsData = [];
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;    // Skip empty lines

        // Match numbers separated by x, X, or ×
        var match = line.match(/(\d+)\s*[x×]\s*(\d+)/i);
        if (match) {
            var width = parseInt(match[1], 10);
            var height = parseInt(match[2], 10);
            var divisor = gcd(width, height);
            var simplifiedWidth = width / divisor;
            var simplifiedHeight = height / divisor;
            var aspectRatio = `${simplifiedWidth} : ${simplifiedHeight}`;
            var decimal = (width / height).toFixed(4);
            var pixelCount = width * height;
            var megapixels = (pixelCount / 1000000).toFixed(2);

            // Create a sortable numeric value for resolution (width * 10000 + height)
            var resSort = (width * 10000 + height);
            rowsData.push({
                resolution: `${width} x ${height}`,
                resSort: resSort,
                aspectRatio: aspectRatio,
                decimal: decimal,
                pixelCount: pixelCount,
                megapixels: megapixels
            });
        } else {

            // Add a row for any invalid input
            rowsData.push({
                resolution: `Invalid input: ${line}`,
                resSort: 0,
                aspectRatio: '',
                decimal: '',
                pixelCount: '',
                megapixels: ''
            });
        }
    });
    document.getElementById('results').innerHTML = generateTable(rowsData);
}


// Sort table rows based on a given column index
function sortTable(columnIndex) {
    var table = document.getElementById("resultsTable");
    var tbody = table.tBodies[0];
    var rows = Array.from(tbody.rows);

    // Toggle sort direction
    var ascending = table.getAttribute("data-sort-dir") === "asc";
    rows.sort((a, b) => {
        var aVal = a.cells[columnIndex].getAttribute("data-sort") || a.cells[columnIndex].innerText;
        var bVal = b.cells[columnIndex].getAttribute("data-sort") || b.cells[columnIndex].innerText;

        // If numeric values are available, compare as numbers
        if (!isNaN(aVal) && !isNaN(bVal)) {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        }
        if (aVal < bVal) {
            return ascending ? -1 : 1;
        } else if (aVal > bVal) {
            return ascending ? 1 : -1;
        } else {
            return 0;
        }
    });

    // Append sorted rows back into the tbody
    rows.forEach(row => tbody.appendChild(row));

    // Toggle sort direction for next click
    table.setAttribute("data-sort-dir", ascending ? "desc" : "asc");
}


// Run calculations automatically when the page loads
window.addEventListener('load', calculateAspectRatios);
