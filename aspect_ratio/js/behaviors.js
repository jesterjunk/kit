(function (window, document, $, undefined) {

    var lastTarget;

    function round() {
        return $('input[name=round]:checked').length === 1;
    }

    function reset() {
        lastTarget = undefined;
        var x1v = window.localStorage.getItem('x1v') || 1920;
        var y1v = window.localStorage.getItem('y1v') || 1080;
        setRatio(x1v, y1v);
    }

    function setRatio(x1, y1) {
        // ratios
        $('#arc input[name=x1]').val(x1);
        $('#arc input[name=y1]').val(y1);
        $('#arc input[name=x2]').val('');
        $('#arc input[name=y2]').val('');

        onKeyup({});
    }

    /**
     * Reduce a numerator and denominator to it's smallest, integer ratio using Euclid's Algorithm
     */
    function reduceRatio(numerator, denominator) {
        var gcd, temp, divisor;

        // from: http://pages.pacificcoast.net/~cazelais/euclid.html
        gcd = function (a, b) { 
            if (b === 0) return a;
            return gcd(b, a % b);
        }

        // take care of the simple case
        if (numerator === denominator) return '1 : 1';

        // make sure numerator is always the larger number
        if (+numerator < +denominator) {
            temp        = numerator;
            numerator   = denominator;
            denominator = temp;
        }

        divisor = gcd(+numerator, +denominator);

        return 'undefined' === typeof temp ? (numerator / divisor) + ' : ' + (denominator / divisor) : (denominator / divisor) + ' : ' + (numerator / divisor);
    }

    function ratio2css(numerator, denominator) {
        var width, height;
        if (+numerator > +denominator) {
            width  = 200;
            height = solve(width, undefined, numerator, denominator);
        }
        else {
            height = 200;
            width  = solve(undefined, height, numerator, denominator);
        }
        return {
            width      : width + 'px',
            height     : height + 'px',
            lineHeight : height + 'px'
        };
    }

    /**
     * Determine whether a value is a positive integer (i.e. only numbers)
     */
    function isInteger(value) {
        return /^[0-9]+$/.test(value);
    }

    /**
     * Determine whether a value is a positive, optionally floating point, number
     * FIXME make \d* required when a decimal is present
     */
    function isPositiveNumber(value) {
        return /^\d+\.?\d*$/.test(value);
    }

    /**
     * Solve for the 4th value
     * @param Number width       Numerator from the right side of the equation
     * @param Number height      Denominator from the right side of the equation
     * @param Number numerator   Numerator from the left side of the equation
     * @param Number denominator Denominator from the left side of the equation
     * @return Number
     */
    function solve(width, height, numerator, denominator) {
        // solve for width
        if (undefined !== width) {
            return round() ? Math.round(width / (numerator / denominator)) : width / (numerator / denominator);
        }
        // solve for height
        else if (undefined !== height) {
            return round() ? Math.round(height * (numerator / denominator)) : height * (numerator / denominator);
        }
        else {
	        return undefined;
        }
    }

    /**
     * Handle a keyup event
     */
    function onKeyup(evt) {
        var x1, y1, x2, y2, x1v, y1v, x2v, y2v, ratio;

        lastTarget = evt.target;

        x1 = $('#arc input[name=x1]');
        y1 = $('#arc input[name=y1]');

        x2 = $('#arc input[name=x2]');
        y2 = $('#arc input[name=y2]');

		x1vr = x1.val();
		y1vr = y1.val();

        x1v = parseFloat(x1vr);
        y1v = parseFloat(y1vr);

		x2vr = x2.val();
		y2vr = y2.val();

        x2v = parseFloat(x2vr);
        y2v = parseFloat(y2vr);

		if (isNaN(x1v) || isNaN(y1v) || (isNaN(x2v) && '' !== x2vr) || (isNaN(y2v) && '' !== y2vr)) {
            document.getElementById('errors').innerHTML = 'Please enter only numbers.';
	        return;
		}
		else {
			document.getElementById('errors').innerHTML = '';
		}

		// make the select list match the values in the lefthand boxes
		// if a preset is present that matches
		var optVal = x1v + 'x' + y1v;
		$('#ratios option').each(function () {
			if (this.value === optVal) {
				this.selected = true
				return
			}
		})

		// save current entry in localStorage
		window.localStorage.setItem('x1v', x1v);
		window.localStorage.setItem('y1v', y1v);

        var stop = 0;
        var maxIterations = 10;
        while (!isInteger(x1v) || !isInteger(y1v)) {
            x1v *= 10;
            y1v *= 10;
            ++stop;
            if (stop > maxIterations) {
                break;
            }
        }

        // display new ratio
        ratio = reduceRatio(x1v, y1v);
        $('#ratio').html(ratio);
        $('#visual-ratio').css(ratio2css(x1v, y1v));

        resizeSample();

        switch (evt.target) {
            case x1[0]:
                if (!isPositiveNumber(x1v) || !isPositiveNumber(y1v) || !isPositiveNumber(y2v)) return;
                x2.val(solve(undefined, y2v, x1v, y1v));
                fadeIt(x2);
            break;
            case y1[0]:
                if (!isPositiveNumber(y1v) || !isPositiveNumber(x1v) || !isPositiveNumber(x2v)) return;
                y2.val(solve(x2v, undefined, x1v, y1v));
                fadeIt(y2);
            break;
            case x2[0]:
                if (!isPositiveNumber(x2v) || !isPositiveNumber(x1v) || !isPositiveNumber(y1v)) return;
                y2.val(solve(x2v, undefined, x1v, y1v));
                fadeIt(y2);
            break;
            case y2[0]:
                if (!isPositiveNumber(y2v) || !isPositiveNumber(x1v) || !isPositiveNumber(y1v)) return;
                x2.val(solve(undefined, y2v, x1v, y1v));
                fadeIt(x2);
            break;
        }
    };
    // END: onKeyup

    $('#arc input').keyup(onKeyup);

    // recalculate when the user changes the rounding
    $('input[name=round]:checked').click(function (evt) {
        onKeyup({ target : lastTarget });
    });

    // reset values
    $('a.reset').click(function (evt) {
        evt.preventDefault();
        reset();
    });

    function hideSample() {
        $('#visual-ratio').html('Example').css({ backgroundImage : 'none' });
    }

    function showSample() {
        var img;
        img     = document.createElement('IMG');
        img.src = $('input[name=sample-url]').val();
        img.onload = resizeSample;
        $('#visual-ratio').html('').append(img);
    }

    function resizeSample() {
        var img, imgRatio, width, height, boxRatio, imgW, imgH, css;
        if (0 === $('input[name=sample-display]:checked').length) {
            return;
        }
        img = $('#visual-ratio img');
        imgRatio = img.width() / img.height();
        width  = $('#visual-ratio').width();
        height = $('#visual-ratio').height();
        boxRatio = width / height;
        function cropToWidth() {
            img.css({ width  : width + 'px', height : 'auto' });
            img.css({ top  : 0 - Math.round((img.height() - height) / 2) + 'px', left : 0 });
        }
        function cropToHeight() {
            img.css({ width  : 'auto', height : height + 'px' });
            img.css({ top  : 0, left : 0 - Math.round((img.width() - width) / 2) + 'px' });
        }
        function boxToWidth() {
            img.css({ width  : width + 'px', height : 'auto' });
            img.css({ top  : Math.round((height - img.height()) / 2) + 'px', left : 0 });
        }
        function boxToHeight() {
            img.css({ width  : 'auto', height : height + 'px' });
            img.css({ top  : 0, left : Math.round((width - img.width()) / 2) + 'px' });
        }
        if ('crop' === $('input[name=crop]:checked').val()) {
            if (imgRatio > boxRatio) {
                cropToHeight();
            }
            else {
                cropToWidth();
            }
        }
        else { // box
            if (imgRatio > boxRatio) {
                boxToWidth();
            }
            else {
                boxToHeight();
            }
        }
    }

    // show sample
    $('input[name=sample-display]').click(function (evt) {
        if (true === this.checked) {
            $('#croptions').show();
            showSample();
        }
        else {
            $('#croptions').hide();
            hideSample();
        }
    });

    $('input[name=crop]').click(function (evt) {
        resizeSample();
    });

    $('input[name=sample-url]').keyup(function (evt) {
        hideSample();
        showSample();
    });

    $('#ratios').change(function (evt) {
        var vals = $(this).val().split('x');
        setRatio(vals[0], vals[1]);
    })

	// get the initial values from localStorage (defaults to 1920x1080)
	// also calls `onKeyup({});` to get things in the right state
	reset();

}(this, this.document, jQuery));

// fix google ads display
var ads = document.getElementById('aswift_0_expand');
if (ads) {
    ads.style.position = 'absolute';
}
