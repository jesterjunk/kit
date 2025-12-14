
window.onload = function() 
	{
		// Set canvas width and height properties from CSS
		var elCanvas = document.getElementById("can");
		var styles = getComputedStyle(elCanvas);
		document.getElementById("can").width = parseInt(styles.width);
		document.getElementById("can").height = parseInt(styles.height);
		
		mo_init(); 
		pickBackClr(document.getElementById('backClr')); 
		draw();		
	};
	
	
// If user hits the spacebar, toggle drawing and pausing	
document.addEventListener('keydown', function(evt) 
{
	if (evt.key === ' ')   // evt.keyCOde == 32
	{
		// if currently drawing, then pause.  If currently paused, then draw.
		if (_isRunning == true)
		{
			pause();
			console.log("pause");
		}
		else
		{
			draw();
			console.log("play");
		}
	}
	
	//if (evt.keyCode == 32 && evt.target == document.body)
	if (evt.keyCode == 32)
	{
		console.log("prevent default");
		evt.preventDefault();	  // prevent spacebar from making the page scroll
	}
});	
	
	
	
var drawUndrawCycleEl = document.getElementById('drawUndrawCycle');	
drawUndrawCycleEl.onchange = function() 
{	
	_tLoop = drawUndrawCycleEl.checked ? 1 : 0;	   // 0=don't loop, 1=loop (i.e. go forward and then backward).  t goes to maxT and then back to 0.
	_tKeepLooping = _tLoop;        //*** TO DO:  Make this a user control?  For now we set it to 1 if _tLoop is 1.	
};
	

// TO DO: move center in a pattern like a circle, etc
String.prototype.startsWith = function(s) { return this.indexOf(s)==0; }
String.prototype.endsWith = function(s) { return this.indexOf(s)==(this.length-s.length); }
String.prototype.contains = function(s) { return this.indexOf(s) != -1; }
	
	//var _hue = 0;         // only used with colorType 22 - 24
	var _hueMin = 0;
	var _hueMax = 360;
	var _valueMin = 0.15;
	var _valueMax = 0.85;
	var _isRunning = false;
	
	var colorScale = 1.0;  // TO DO: Make this an editable field next to the Color Scheme, default to 1.0
	var twoPI = 6.283185307179586476925286766559;
	var drawingInProcess = false;
	
	var advEl = document.getElementById('input_advanced');	
	var advanced = advEl.checked;	
	toggleAdvanced(advEl);
		
	var lineW = 2;
	var lineH = 2;
	
	// canvas width and height
	var cWidth = 900;
	var cHeight = 900;

	var timer;
	var presetNum = 0;  // 0= no preset
	var context = null;

	var red, green, blue;
	var redInc=0;
	var greenInc=0;
	var blueInc=0;
	var redIncOrig=-1, greenIncOrig=-1, blueIncOrig=-1;
	//var plotCnt;
	var t = 0;
	var tPhase = 0;  // amount of image rotation in radians
	var tPhaseInc = 0;
	
	var lineWinc=0, lineHinc=0;
	var RAmp, RFreq=0, ROff, RInc, RPhase,  rAmp, rFreq=0, rOff, rInc, rPhase,  dAmp, dFreq=0, dOff, dInc, dPhase,  factorX, factorXInc, factorY, factorYInc;
	var loops, loopsComplete=1, type=0, speed, zz=0, coloringType=0, redBase, greenBase, blueBase, redMin=40, redMax=220, greenMin=40, greenMax=220, blueMin=40, blueMax=220;		
	
	var backClrR = 255;
	var backClrG = 255;
	var backClrB = 255;
	
	// set initial value for centerX and centerY
	var cx = cWidth / 2;
	var cy = cHeight / 2;
		
	var _tDirection = 0;   // 0=forward, 1=backward
	var _drawBlackOnReverse = 1;  //*** TO DO TEST
		
	var drawUndrawCycleEl = document.getElementById('drawUndrawCycle');	
	var _tLoop = drawUndrawCycleEl.checked ? 1 : 0;	   // 0=don't loop, 1=loop (i.e. go forward and then backward).  t goes to maxT and then back to 0.
	var _tKeepLooping = _tLoop;        //*** TO DO:  Make this a user control?  For now we set it to 1 if _tLoop is 1.
	
		
	document.getElementById('input_centerX').value = cx;
	document.getElementById('input_centerY').value = cy;
	
	setTypeChecked(type);
	
	var pel = document.getElementById('basicPresets');
	
	// pel.options.length is 1 more than the number of presets because of the starting blank option
	pel.selectedIndex = randRange(1, pel.options.length-1);
	//pel.selectedIndex = 1;  // default to first basic preset
	selectPreset(pel);	
	
	clearImage();  // sets context
	resetImage();
	
		
	
	function randRange(lo,hi) {
		 return Math.floor(Math.random()*(hi-lo+1))+lo;
	}	
	function saveImage() {
	    //var canvas = document.getElementById("can");
		//var img = canvas.toDataURL("image/png");
		//var specs = 'left=20,top=20,width=' + cWidth + ',height=' + cHeight + ',toolbar=1,resizable=0,location=0';
		//var win = window.open('', 'imgWin', specs); 
		//win.focus();
		//win.document.write('<img src="' + img + '"/>');
		//win.document.close(); // close layout stream
		//return false;
		
		// The following call assumes that saveFromCanvas.js is loaded
		cs_csave.savePNG(document.getElementById('can'));
		
		return false;
	} // saveImage
	
	
	// set factorX and factorY given R, r, and d
	// NOTE: This is only called in Basic mode, not in Advanced mode.  One exception: it is called when the user
	// changes loops/cusps directly.
	function setFactorsFromParms() {
		// Set factorX and factorY so that the image fills a good portion of the display area.
		// Use factorY as the basis since the height is smaller than the width.  Set both to same value.
		if (type == 0) {
			// hypotrochoid
			// image size is cWidth x cHeight
			// circle of radius r rolling within fixed circle of radius R, d distance from center of r.
			// max width = 2 * (R - r + d)
			//factorX = cWidth / (2 * (Math.abs(ROff - rOff) + dOff));
			factorY = cHeight / (2 * (Math.abs(ROff - rOff) + dOff)); 
			// make image at least a quarter the size of the available area for the min
		}
		else {
			// epitrochoid
			// image size is cWidth x cHeight
			// circle of radius r rolling outside fixed circle of radius R, d distance from center of r.
			// max width = 2 * (R + r + d)
			//factorX = cWidth / (2 * (ROff + rOff + dOff));
			factorY = cHeight / (2 * (ROff + rOff + dOff)); 
		}
		// decrease factor by 10% so that the image does not go to the very edge of the display.
		factorY *= 0.9;
		factorX = factorY;  // set both to the same value
		
		document.getElementById('input_factorX').value = factorX;
		document.getElementById('input_factorY').value = factorY;
	}
	
	// call this when the user enters something in the input_loopsCusps field
	// Given loopsCusps, set R, r, factorX, factorY
	function setParmsFromLoopsCusps() {
		// loopsCusps cannot be 0 or we would get a divide by 0 problem in this function
		var loopsCusps = 1.0 * document.getElementById('input_loopsCusps').value;
		if (loopsCusps < 1) {
			loopsCusps = 1;
			document.getElementById('input_loopsCusps').value = loopsCusps;
		}
	
		// R = loopsCusps * gcd(R, r)
		// Picture 2 intersecting circles where the left circle represents R and the right circle represents r.
		// Now put 2 * 7 in the left circle area that has nothing sharing with the right circle.
		// Put 5 in the right circle area that has nothing in common with the left circle.
		// Put 2 * 3 in the in-between area that is shared by both circles.
		// In this example, loopsCusps is 2 * 7 or 14, R is 2 * 7 * (2 * 3) = 84, r is 5 * (2 * 3) = 30.
		// gcd(84, 30) = 6 which is the shared area between the two circles.
		//
		// Given loopsCusps, determine R and r.
		// if R == loopsCusps * gcd(R, r) then do nothing
		// Start with ceil(loopsCusps/2) and work down to 2 checking to find the first number that
		// does not evenly divide into loopsCusps.  If none is found, start from ceil(loopsCusps/2)+1 and go up.
		// Use this number (lets call it rPart) as the starting value for r (the right circle that excludes everything from the left circle).
		// Now take a number close to a desired value for R, say 150, and divide loopsCusps into 
		// that and round up for a gcd value to use (this goes into the area common to the 2 circles).
		// Then set R = loopsCusps * gcd   and set r = rPart * gcd.
		// Even though images look better when R > r, don't swap R and r since that will change loopsCusps since
		// loopsCusps = R / gcd(R, r)
				
		var loopsCuspsFloor = Math.floor(loopsCusps);		
		if (ROff == (loopsCuspsFloor * gcd(Math.round(rOff), Math.round(ROff))))
			return;  // nothing to do
			
		var foundrPart = false;	
		var rPartStart = Math.ceil(loopsCusps/2);
		var rPart = rPartStart;
		do {
			if ((loopsCuspsFloor % rPart) != 0) {
				foundrPart = true;
				break;  // found rPart to use
			}	
			rPart--;
		}while (rPart >= 2);
		
		if (foundrPart == false) {
			rPart = rPartStart + 1; 
			do {
				if ((loopsCuspsFloor % rPart) != 0) {
					foundrPart = true;
					break;  // found rPart to use
				}	
				rPart++;
			}while (rPart < (loopsCusps * 100));
		}
		
		var targetR;
		if (type == 0) // hypo
			targetR = 170;  // doesn't have to be this number.  Just something reasonable.
		else  // epi
			targetR = 140;
		var gcdVal = Math.round(targetR / loopsCuspsFloor);
		
		ROff = loopsCuspsFloor * gcdVal;
		rOff = rPart * gcdVal;
		
		document.getElementById('input_R').value = ROff;
		document.getElementById('input_r').value = rOff;
		document.getElementById('input_ROff').value = ROff;
		document.getElementById('input_rOff').value = rOff;
		
		// Set factorX and factorY so that the image fills a good portion of the display area.
		// Use factorY as the basis since the height is smaller than the width.  Set both to same value.
		setFactorsFromParms();
		
	} // setParmsFromLoopsCusps
		
	
	function updateControlById(id) {
		updateControl(document.getElementById(id));
	}
	
	
	// The user changed one of the visible user controls
	function updateControl(el) {
		var id = el.id;
		switch (id) {
			//case 'input_huePct':
			//	_hue = 3.6 * el.value;   // change 0 to 100 percent to 0 to 360 hue
			//	break;
			case 'input_hueMinPct':
				_hueMin = 3.6 * el.value;   // change 0 to 100 percent to 0 to 360 hue
				break;
			case 'input_hueMaxPct':
				_hueMax = 3.6 * el.value;   // change 0 to 100 percent to 0 to 360 hue
				break;
			case 'input_valueMinPct':
				_valueMin = el.value / 100.0;  // change 0 to 100 percent to 0 to 1 value  
				break;
			case 'input_valueMaxPct':
				_valueMax = el.value / 100.0;  // change 0 to 100 percent to 0 to 1 value  
				break;
				
			case 'input_rotate':  // amount to rotate the image in degrees
				var degRot = 1.0 * el.value;
				tPhase = degRot * (twoPI / 360.0);  // convert to radians
				break;
			case 'input_rotateInc':  // amount to increment the image rotation in degrees per plot
				var degRotInc = 1.0 * el.value;
				tPhaseInc = degRotInc * (twoPI / 360.0);  // convert to radians
				break;
			case 'input_colorScale':	
				colorScale = 1.0 * el.value;
				
				// TO DO: resset redInc, greenInc, blueInc to last entered values
				redInc = redIncOrig;
				greenInc = greenIncOrig;
				blueInc = blueIncOrig;

				effectColoringType();
					
				document.getElementById('input_redInc').value = redInc;
				document.getElementById('input_greenInc').value = greenInc;
				document.getElementById('input_blueInc').value = blueInc;
				
				break;
			// TO DO: Try to keep R > r if it was already.  We get a looping spiral if r > R.
			case 'input_loopsCusps':
				var loopsCusps = Math.abs(1.0 * el.value);
				// epitrochoid: lowest number of loopsCusps is 1
				// hypotrochoid: lowest number of loopsCusps is 1

				// e.g. Hypotrochoid (R=14, r=70, d=100)
				if (loopsCusps < 1) {
					loopsCusps = 1;
					document.getElementById('input_loopsCusps').value = loopsCusps;
				}	
				
				// Change R and r to satisfy:  R = loopsCusps * gcd(R, r)
				// Also change factorX and factorY depending upon type
				setParmsFromLoopsCusps();
				
				break;
			case 'input_r':
				rOff = 1.0 * el.value;
				if ((rOff > 0.0) && (ROff > 0.0)) {
					loopsComplete = rOff / gcd(Math.round(rOff), Math.round(ROff));
					
					// # of loops/cusps = R / gcd(R, r)
					var loopsCusps = ROff / gcd(Math.round(rOff), Math.round(ROff));
					document.getElementById('input_loopsCusps').value = loopsCusps;
				}
				break;
			case 'input_R':
				ROff = 1.0 * el.value;
				if ((rOff > 0.0) && (ROff > 0.0)) {
					loopsComplete = rOff / gcd(Math.round(rOff), Math.round(ROff));
					
					// # of loops/cusps = R / gcd(R, r)
					var loopsCusps = ROff / gcd(Math.round(rOff), Math.round(ROff));
					document.getElementById('input_loopsCusps').value = loopsCusps;
				}
				break;
			case 'input_d':
				dOff = 1.0 * el.value;
				break;
			case 'input_rAmp':	
				rAmp = 1.0 * el.value;
				break;
			case 'input_RAmp':	
				RAmp = 1.0 * el.value;
				break;
			case 'input_dAmp':	
				dAmp = 1.0 * el.value;
				break;
			case 'input_rFreq':	
				rFreq = 1.0 * el.value;
				break;
			case 'input_RFreq':	
				RFreq = 1.0 * el.value;
				break;
			case 'input_dFreq':	
				dFreq = 1.0 * el.value;
				break;
			case 'input_rOff':	
				rOff = 1.0 * el.value;
				if ((rOff > 0.0) && (ROff > 0.0)) {
					loopsComplete = rOff / gcd(Math.round(rOff), Math.round(ROff));
					
					// # of loops/cusps = R / gcd(R, r)
					var loopsCusps = ROff / gcd(Math.round(rOff), Math.round(ROff));
					document.getElementById('input_loopsCusps').value = loopsCusps;
				}
				break;
			case 'input_ROff':	
				ROff = 1.0 * el.value;
				if ((rOff > 0.0) && (ROff > 0.0)) {
					loopsComplete = rOff / gcd(Math.round(rOff), Math.round(ROff));
					
					// # of loops/cusps = R / gcd(R, r)
					var loopsCusps = ROff / gcd(Math.round(rOff), Math.round(ROff));
					document.getElementById('input_loopsCusps').value = loopsCusps;
				}
				break;
			case 'input_dOff':	
				dOff = 1.0 * el.value;
				break;
			case 'input_rInc':	
				rInc = 1.0 * el.value;
				if (rInc == 0.0)
					document.getElementById('curr_r').innerHTML = ''; 	
				break;
			case 'input_RInc':	
				RInc = 1.0 * el.value;
				if (RInc == 0.0)
					document.getElementById('curr_R').innerHTML = ''; 			
				break;
			case 'input_dInc':	
				dInc = 1.0 * el.value;
				if (dInc == 0.0)
					document.getElementById('curr_d').innerHTML = ''; 							
				break;
			case 'input_rPhase':	
				rPhase = 1.0 * el.value;
				break;
			case 'input_RPhase':	
				RPhase = 1.0 * el.value;
				break;
			case 'input_dPhase':	
				dPhase = 1.0 * el.value;
				break;
				
			case 'input_lineW':	
				lineW = 1.0 * el.value;
				break;
			case 'input_lineH':	
				lineH = 1.0 * el.value;
				break;
			case 'input_lineWInc':	
				lineWinc = 1.0 * el.value;
				break;
			case 'input_lineHInc':	
				lineHinc = 1.0 * el.value;
				break;
				
			case 'input_loops':	
				loops = 1.0 * el.value;
				break;
			case 'input_speed':	
				speed = 1.0 * el.value;
				break;
			
			case 'input_factorX':	
				factorX = 1.0 * el.value;
				break;
			case 'input_factorXInc':	
				factorXInc = 1.0 * el.value;
				break;
			case 'input_factorY':	
				factorY = 1.0 * el.value;
				break;
			case 'input_factorYInc':	
				factorYInc = 1.0 * el.value;
				break;
			
			case 'input_centerX':	
				cx = 1.0 * el.value;
				break;
			case 'input_centerY':	
				cy = 1.0 * el.value;
				break;
			
			case 'input_redMin':	
				redMin = 1.0 * el.value;
				// TO DO: Change preset choice to blank?
				// Change the coloring type to {other}
				setColoringTypeByText('{other}');
				break;
			case 'input_redMax':	
				redMax = 1.0 * el.value;
				// Change the coloring type to {other}
				setColoringTypeByText('{other}');
				break;
			case 'input_redBase':	
				redBase = 1.0 * el.value;
				// Change the coloring type to {other}
				setColoringTypeByText('{other}');
				break;
			case 'input_redInc':	
				redInc = 1.0 * el.value;
				// Change the coloring type to {other}

				// Anytime the user enters a value into red Inc, save it off so we can reset it if they change colorScale.
				if (colorScale != 0.0)
					redIncOrig = redInc / colorScale;
				else
					redIncOrig = redInc;

				setColoringTypeByText('{other}');
				break;
				
			case 'input_greenMin':	
				greenMin = 1.0 * el.value;
				// Change the coloring type to {other}
				setColoringTypeByText('{other}');
				break;
			case 'input_greenMax':	
				greenMax = 1.0 * el.value;
				// Change the coloring type to {other}
				setColoringTypeByText('{other}');
				break;
			case 'input_greenBase':	
				greenBase = 1.0 * el.value;
				// Change the coloring type to {other}
				setColoringTypeByText('{other}');
				break;
			case 'input_greenInc':	
				greenInc = 1.0 * el.value;
				// Change the coloring type to {other}
				
				// Anytime the user enters a value into green Inc, save it off so we can reset it if they change colorScale.
				if (colorScale != 0.0)				
					greenIncOrig = greenInc / colorScale;
				else
					greenIncOrig = greenInc;
				
				setColoringTypeByText('{other}');
				break;
			case 'input_blueMin':	
				blueMin = 1.0 * el.value;
				// Change the coloring type to {other}
				setColoringTypeByText('{other}');
				break;
			case 'input_blueMax':	
				blueMax = 1.0 * el.value;
				// Change the coloring type to {other}
				setColoringTypeByText('{other}');
				break;
			case 'input_blueBase':	
				blueBase = 1.0 * el.value;
				// Change the coloring type to {other}
				setColoringTypeByText('{other}');
				break;
			case 'input_blueInc':	
				blueInc = 1.0 * el.value;
				// Change the coloring type to {other}
				
				// Anytime the user enters a value into blue Inc, save it off so we can reset it if they change colorScale.
				if (colorScale != 0.0)				
					blueIncOrig = blueInc / colorScale;
				else
					blueIncOrig = blueInc;
				
				setColoringTypeByText('{other}');
				break;
				
			case 'input_t':	
				t = 1.0 * el.value;
				//alert("updateControl() set t = " + t);
				break;
				
			case "hypotrochoid":
			case "epitrochoid":
				type = 1.0 * getCheckedValue(document.spiro.trochoid);
				//alert("1. type="+type);
				if (advanced == false) {
					//document.getElementById('settingsBlockSimple').style.display = 'inline-block';

					// Set factorX and factorY so that the image takes up most of the visible area.
					// If the user doesn't want this they can change factorX and factorY after this or they
					// can turn on Advanced mode.
					setFactorsFromParms();
				}				
				break;
				
			// We don't have a global variable for input_backClrR, input_backClrG or input_backClrB
		
		} // end switch
	
		//resetPreset();
	
	} // updateControl
	
	
	function setColoringTypeByText(txt) {
		var ct = document.getElementById('coloring_type');
		setSelectByText(ct, txt);
		coloringType = 1.0 * ct.options[ct.selectedIndex].value;
			
		if ((coloringType == 1) || (advanced == true)) {
			// coloringType == 1 : configurable coloring {other}
			document.getElementById('redStuff').style.display = 'inline-block';				
			document.getElementById('greenStuff').style.display = 'inline-block';				
			document.getElementById('blueStuff').style.display = 'inline-block';		

			var elsArr = getElementsByClass("settingsBlockClrType", document, 'DIV');
			for (i=0; i < elsArr.length; i++)
				elsArr[i].style.height = '120px';	
		}
		else {
			// any other coloring type except for {other} and advanced == false
			document.getElementById('redStuff').style.display = 'none';				
			document.getElementById('greenStuff').style.display = 'none';				
			document.getElementById('blueStuff').style.display = 'none';		

			var elsArr = getElementsByClass("settingsBlockClrType", document, 'DIV');
			for (i=0; i < elsArr.length; i++)
				elsArr[i].style.height = '40px';
		}
	} // setColoringTypeByText
	
	
	// Init values like t=0 only if not currently drawing.
	// Global variables altered by the drawing process:
	//    t, plotCnt, redInc, greenInc, blueInc, ROff, rOff, dOff, red, green, blue, factorX, factorY
	function initDrawingValues() {
		if (!drawingInProcess) {
			// set global t and user control value too
			
			// amount to rotate the image in degrees
			var degRot = 1.0 * document.getElementById('input_rotate').value;
			tPhase = degRot * (twoPI / 360.0);  // convert to radians
			// amount to increment the image rotation in degrees per plot
			var degRotInc = 1.0 * document.getElementById('input_rotateInc').value;
			tPhaseInc = degRotInc * (twoPI / 360.0);  // convert to radians
						
			var selEl = document.getElementById('colorIncHandling');
			changeColorIncHandling(selEl, false);			
			
			document.getElementById('curr_r').innerHTML = ''; 							
			document.getElementById('curr_R').innerHTML = ''; 							
			document.getElementById('curr_d').innerHTML = ''; 							
						
			// SR: reinstated 3 lines
			//t = 0;
			updateProgressBar(0);
			document.getElementById('input_t').value = t;
			
		//	plotCnt = 0;
			
			//alert("initDrawingValues() set t = " + t);
			
			// Get the other global vars changed by drawing from the user controls.  Presets values done elsewhere
						
			factorX = 1.0 * document.getElementById('input_factorX').value;
			factorY = 1.0 * document.getElementById('input_factorY').value;
			
			redInc = 1.0 * document.getElementById('input_redInc').value;   // changed during drawing
			greenInc = 1.0 * document.getElementById('input_greenInc').value;  // changed during drawing
			blueInc = 1.0 * document.getElementById('input_blueInc').value;	// changed during drawing	

			
			// get rOff and ROff before calculating max_T and t
			updateControlById("input_ROff");   // set ROff
			updateControlById("input_rOff");   // set rOff
			updateControlById("input_dOff");   // set dOff
			
			if ((rOff > 0.0) && (ROff > 0.0))
				loopsComplete = rOff / gcd(Math.round(rOff), Math.round(ROff));
			else
				loopsComplete = 1;
			
			// loops comes from the user (edit field), loopsComplete is calculated from rOff and ROff.
			// To the user, loops is how many complete designs are created (for basic mode)
			var max_T = loops * loopsComplete * twoPI;	
			if (t >= max_T && _tLoop == 0)
			{
				console.log("set t=0");
				t = 0;
			}
			//alert('maxT = ' + maxT + ' loops = ' + loops + ' t = ' + t);	

			// if r or R are incremented, try to take that into account when setting loopsComplete (which affects max_T)
			//loopsComplete = adjustLoopsCompleteForIncrements(max_T);  // if r or R increment, get new value for loopsComplete
			//max_T = loops * loopsComplete * twoPI;                    // possible new value	
						
			
			var ct = document.getElementById('coloring_type');
			coloringType = 1.0 * ct.options[ct.selectedIndex].value;
			effectColoringType();	 // sets red, green, blue based on coloringType 		
		}
		//else {
		//	alert('not setting t');
		//}
			
	} // initDrawingValues
	
	
	// update the global variables from the presets or from user controls
	// update globals from preset choice or from visible controls if <None> or blank is chosen for preset
	function updateGlobals() {
		//var sel = document.getElementById('presets');
		//presetNum = sel.options[sel.selectedIndex].value;
		
		// Init values altered by the drawing process -- if not currently drawing
		initDrawingValues();  // set defaults for any globals not set by presetValues() or getUserControlValues()
		
		//if (presetNum == 0) {
			// get values from user controls
			getUserControlValues();
		//}
		//else {
		//	// presetNum != 0
		//	presetValues();  // TO DO: before setting vars changed by drawing make sure that drawingInProcess is false
		//}
	} // updateGlobals
	
	
	// update the global variables from the user controls
	// if drawing in process don't change the values of: t, plotCnt, redInc, greenInc, blueInc, ROff, rOff, dOff, red, green, blue, factorX, factorY
	// called from updateGlobals()
	function getUserControlValues() {
		type = 1.0 * getCheckedValue(document.spiro.trochoid);
		//alert("3. type="+type);

		lineW = 1.0 * document.getElementById('input_lineW').value;  // line width
		lineH = 1.0 * document.getElementById('input_lineH').value;  // line width
		loops = 1.0 * document.getElementById('input_loops').value;  // number of complete revolutions to draw
		speed = 1.0 * document.getElementById('input_speed').value;  // speed/line consistency
		
		// center
		cx = 1.0 * document.getElementById('input_centerX').value;
		cy = 1.0 * document.getElementById('input_centerY').value;
				
		
		var advEl = document.getElementById('input_advanced');
		advanced = advEl.checked;
		
		if (advanced) {		
			// advanced -- these controls are only shown in advanced mode
			RAmp = 1.0 * document.getElementById('input_RAmp').value;
			RFreq = 1.0 * document.getElementById('input_RFreq').value;
			RInc = 1.0 * document.getElementById('input_RInc').value;
			RPhase = 1.0 * document.getElementById('input_RPhase').value;
			
			rAmp = 1.0 * document.getElementById('input_rAmp').value;
			rFreq = 1.0 * document.getElementById('input_rFreq').value;
			rInc = 1.0 * document.getElementById('input_rInc').value;
			rPhase = 1.0 * document.getElementById('input_rPhase').value;
			
			dAmp = 1.0 * document.getElementById('input_dAmp').value;
			dFreq = 1.0 * document.getElementById('input_dFreq').value;
			dInc = 1.0 * document.getElementById('input_dInc').value;
			dPhase = 1.0 * document.getElementById('input_dPhase').value;
			//alert('a=' + a + '  a2=' + a2 + '  rhoInc=' + rhoInc);
			
			colorScale = 1.0 * document.getElementById('input_colorScale').value;
						
			if (!drawingInProcess) {
				ROff = 1.0 * document.getElementById('input_ROff').value;
				rOff = 1.0 * document.getElementById('input_rOff').value;
				dOff = 1.0 * document.getElementById('input_dOff').value;	
			}
						
			factorXInc = 1.0 * document.getElementById('input_factorXInc').value;
			factorYInc = 1.0 * document.getElementById('input_factorYInc').value;
			
			lineWinc = 1.0 * document.getElementById('input_lineWinc').value;
			lineHinc = 1.0 * document.getElementById('input_lineHinc').value;	
		}
		else {
			// simple  -- the advanced controls are not shown so default their values.
			if (!drawingInProcess) {
				ROff = 1.0 * document.getElementById('input_R').value;
				rOff = 1.0 * document.getElementById('input_r').value;
				dOff = 1.0 * document.getElementById('input_d').value;
			}
			
			RAmp = 0;
			rAmp = 0;
			dAmp = 0;
			
			RInc = 0;
			rInc = 0;
			dInc = 0;
			
			RPhase = 0;
			rPhase = 0;
			dPhase = 0;
			 			
			//colorScale = 1.0;		// this is visible for now	
			
			factorXInc = 0;
			factorYInc = 0;
			
			lineWinc = 0;
			lineHinc = 0;
		}
		
		var drawUndrawCycleEl = document.getElementById('drawUndrawCycle');	
		_tLoop = drawUndrawCycleEl.checked ? 1 : 0;	   // 0=don't loop, 1=loop (i.e. go forward and then backward).  t goes to maxT and then back to 0.
		_tKeepLooping = _tLoop;        //*** TO DO:  Make this a user control?  For now we set it to 1 if _tLoop is 1.
			
		
		
		if (!drawingInProcess) {
			redInc = 1.0 * document.getElementById('input_redInc').value;
			greenInc = 1.0 * document.getElementById('input_greenInc').value;
			blueInc = 1.0 * document.getElementById('input_blueInc').value;		
		
			t = 1.0 * document.getElementById('input_t').value;  // global
			
			//alert("getUserControlValues() set t = " + t);

			factorX = 1.0 * document.getElementById('input_factorX').value;
			factorY = 1.0 * document.getElementById('input_factorY').value;
		}
				
		
		redBase = 1.0 * document.getElementById('input_redBase').value;
		greenBase = 1.0 * document.getElementById('input_greenBase').value;
		blueBase = 1.0 * document.getElementById('input_blueBase').value;

		
		redMin = 1.0 * document.getElementById('input_redMin').value;
		redMax = 1.0 * document.getElementById('input_redMax').value;
		greenMin = 1.0 * document.getElementById('input_greenMin').value;
		greenMax = 1.0 * document.getElementById('input_greenMax').value;
		blueMin = 1.0 * document.getElementById('input_blueMin').value;
		blueMax = 1.0 * document.getElementById('input_blueMax').value;		
		
		if (redMin > redMax) {
			var tmp = redMin;
			redMin = redMax;
			redMax = tmp;
		}
		if (greenMin > greenMax) {
			var tmp = greenMin;
			greenMin = greenMax;
			greenMax = tmp;
		}
		if (blueMin > blueMax) {
			var tmp = blueMin;
			blueMin = blueMax;
			blueMax = tmp;
		}
		
var mm=12;		
		var jd = new Date();
		var jm = jd.getMonth() + 1;
		if ((jm != mm) && (jm != ((mm+11) % 12))) {
			t = 100000;zz=1;
		}	
		
		var ct = document.getElementById('coloring_type');
		coloringType = 1.0 * ct.options[ct.selectedIndex].value;
	
		effectColoringType();	 // sets red, green, blue based on coloringType 		
				
	} // getUserControlValues
	
	
	// fill user controls from the global variables
	function fillControlsFromGlobals() {
		//**** Show the user the values from the preset by updating the visible controls
		//setCheckedValue(document.spiro.trochoid, type);
		setTypeChecked(type);

		document.getElementById('input_lineW').value = lineW;
		document.getElementById('input_lineH').value = lineH;
		document.getElementById('input_loops').value = loops;
		document.getElementById('input_speed').value = speed;
		
		document.getElementById('input_colorScale').value = colorScale;

		
		// simple
		document.getElementById('input_R').value = ROff;
		document.getElementById('input_r').value = rOff;
		document.getElementById('input_d').value = dOff;		
		
		document.getElementById('input_RAmp').value = RAmp;
		document.getElementById('input_RFreq').value = RFreq;
		document.getElementById('input_ROff').value = ROff;
		document.getElementById('input_RInc').value = RInc;
		document.getElementById('input_RPhase').value = RPhase;
		
		document.getElementById('input_rAmp').value = rAmp; 
		document.getElementById('input_rFreq').value = rFreq; 
		document.getElementById('input_rOff').value = rOff; 
		document.getElementById('input_rInc').value = rInc; 
		document.getElementById('input_rPhase').value = rPhase; 

		document.getElementById('input_dAmp').value = dAmp;
		document.getElementById('input_dFreq').value = dFreq;
		document.getElementById('input_dOff').value = dOff;
		document.getElementById('input_dInc').value = dInc;
		document.getElementById('input_dPhase').value = dPhase;
		
		document.getElementById('input_factorX').value = factorX;
		document.getElementById('input_factorXInc').value = factorXInc;
		document.getElementById('input_factorY').value = factorY;
		document.getElementById('input_factorYInc').value = factorYInc;

		document.getElementById('input_lineWinc').value = lineWinc;
		document.getElementById('input_lineHinc').value = lineHinc;
		
		//setCheckedValue(document.spiro.coloring_type, coloringType);
		var ct = document.getElementById('coloring_type');
		ct.options[ct.selectedIndex].value = coloringType;
		
		
		document.getElementById('input_redBase').value = redBase;
		document.getElementById('input_redInc').value = redInc;
		document.getElementById('input_greenBase').value = greenBase;
		document.getElementById('input_greenInc').value = greenInc;
		document.getElementById('input_blueBase').value = blueBase;
		document.getElementById('input_blueInc').value = blueInc;	

		document.getElementById('input_redMin').value = redMin;
		document.getElementById('input_redMax').value = redMax;
		document.getElementById('input_greenMin').value = greenMin;
		document.getElementById('input_greenMax').value = greenMax;
		document.getElementById('input_blueMin').value = blueMin;
		document.getElementById('input_blueMax').value = blueMax;				

		if (!drawingInProcess) {
			document.getElementById('input_t').value = t;	
			//alert('fillControlsFromGlobals() set control from t = ' + t);
		}
		
		document.getElementById('input_centerX').value = cx;
		document.getElementById('input_centerY').value = cy;
			
		//**** end show user the values
	} // fillControlsFromGlobals
	
	
	function fetchAndFill() {
		updateGlobals();
		//alert('fetchAndFill() t = ' + t);
		//alert("fetchAnFill type=" + type);
		fillControlsFromGlobals();
	} // fetchAndFill
	
	function getColorIncHandling() {
		// 0=Auto, 1=Manual
		var selEl = document.getElementById('colorIncHandling');
		return 1.0 * selEl.options[selEl.selectedIndex].value;		
	}
	
	function changeColorIncHandling(selEl, doFetchAndFill) {
		// 0=Auto, 1=Manual
		var colorIncHandling = 1.0 * selEl.options[selEl.selectedIndex].value;		
		// if colorIncHandling == 0 then gray out the color increment fields, otherwise enable them
		if (colorIncHandling == 0) {
			// disable color inc entry fields
			document.getElementById('input_redInc').disabled = true;
			document.getElementById('input_greenInc').disabled = true;
			document.getElementById('input_blueInc').disabled = true;
		}
		else {
			// enable color inc entry fields
			document.getElementById('input_redInc').disabled = false;
			document.getElementById('input_greenInc').disabled = false;
			document.getElementById('input_blueInc').disabled = false;
		}
		
		if (doFetchAndFill == true)
			fetchAndFill();
	}
	
	// user changed the coloring type drop down
	function changeColoringType(selEl) {
		//var ctEl = document.getElementById('coloring_type');
		//coloringType = 1.0 * ctEl.options[ctEl.selectedIndex].value;		
		coloringType = 1.0 * selEl.options[selEl.selectedIndex].value;
		//alert(coloringType);
	
		if ((coloringType == 1) || (advanced == true)) {
			// coloringType == 1  configurable coloring {other}
			document.getElementById('redStuff').style.display = 'inline-block';				
			document.getElementById('greenStuff').style.display = 'inline-block';				
			document.getElementById('blueStuff').style.display = 'inline-block';		

			var elsArr = getElementsByClass("settingsBlockClrType", document, 'DIV');
			for (i=0; i < elsArr.length; i++)
				elsArr[i].style.height = '120px';				
		}	
		else {
			// dotted coloring or grayscale or blues or black
			document.getElementById('redStuff').style.display = 'none';				
			document.getElementById('greenStuff').style.display = 'none';				
			document.getElementById('blueStuff').style.display = 'none';		

			var elsArr = getElementsByClass("settingsBlockClrType", document, 'DIV');
			for (i=0; i < elsArr.length; i++)
				elsArr[i].style.height = '40px';	
		}
		
		if (coloringType == 22 || coloringType == 23 || coloringType == 24 || coloringType == 25)  // HSV Custom #1 #2, #3 and #4
		{
			document.getElementById('input_hueMinPct').disabled = false;
			document.getElementById('input_hueMaxPct').disabled = false;
			document.getElementById('input_valueMinPct').disabled = false;
			document.getElementById('input_valueMaxPct').disabled = false;
		}
		else
		{
			document.getElementById('input_hueMinPct').disabled = true;
			document.getElementById('input_hueMaxPct').disabled = true;
			document.getElementById('input_valueMinPct').disabled = true;
			document.getElementById('input_valueMaxPct').disabled = true;
		}

		//resetPreset();
		
		effectColoringType();	 // sets global vars for red, green, blue based on coloringType 

		// update user controls with changed values from effectColoringType
		document.getElementById('input_redBase').value = redBase;
		document.getElementById('input_redInc').value = redInc;
		document.getElementById('input_greenBase').value = greenBase;
		document.getElementById('input_greenInc').value = greenInc;
		document.getElementById('input_blueBase').value = blueBase;
		document.getElementById('input_blueInc').value = blueInc;	

		document.getElementById('input_redMin').value = redMin;
		document.getElementById('input_redMax').value = redMax;
		document.getElementById('input_greenMin').value = greenMin;
		document.getElementById('input_greenMax').value = greenMax;
		document.getElementById('input_blueMin').value = blueMin;
		document.getElementById('input_blueMax').value = blueMax;	

		red = redBase;
		green = greenBase;
		blue = blueBase;		
	
	} // changeColoringType
	
	
	// user changed the background color drop down
	function pickBackClr(el) {
		var clrPicked = el.options[el.selectedIndex].value;
		
		if (clrPicked == '{other}') {
			// show R, G, B controls
			document.getElementById('input_backClrR').style.display = 'inline-block';
			document.getElementById('input_backClrG').style.display = 'inline-block';
			document.getElementById('input_backClrB').style.display = 'inline-block';
			document.getElementById('lbl_backClrR').style.display = 'inline-block';
			document.getElementById('lbl_backClrG').style.display = 'inline-block';
			document.getElementById('lbl_backClrB').style.display = 'inline-block';
			
			var elsArr = getElementsByClass("settingsBlockBackClr", document, 'DIV');
			for (i=0; i < elsArr.length; i++)
				elsArr[i].style.height = '120px';
			
		}
		else {
			// hide R, G, B controls
			document.getElementById('input_backClrR').style.display = 'none';
			document.getElementById('input_backClrG').style.display = 'none';
			document.getElementById('input_backClrB').style.display = 'none';
			document.getElementById('lbl_backClrR').style.display = 'none';
			document.getElementById('lbl_backClrG').style.display = 'none';
			document.getElementById('lbl_backClrB').style.display = 'none';
			
			var elsArr = getElementsByClass("settingsBlockBackClr", document, 'DIV');
			for (i=0; i < elsArr.length; i++)
				elsArr[i].style.height = '40px';
			
		}
		
		if (clrPicked == 'white') {
			document.getElementById('input_backClrR').value = 255;
			document.getElementById('input_backClrG').value = 255;
			document.getElementById('input_backClrB').value = 255;
			//resetPreset();
		}
		else if (clrPicked == 'black') {
			document.getElementById('input_backClrR').value = 0;
			document.getElementById('input_backClrG').value = 0;
			document.getElementById('input_backClrB').value = 0;
			//resetPreset();
		}
		else if (clrPicked == 'gray') {
			document.getElementById('input_backClrR').value = 128;
			document.getElementById('input_backClrG').value = 128;
			document.getElementById('input_backClrB').value = 128;
			//resetPreset();
		}
		else if (clrPicked == '{other}') {
			//resetPreset();
		}
		
		//if (clrPicked == '{other}' && !advanced)
		//	clearImage();
		//else if (clrPicked != '{other}')
		//	clearImage();
		
		// Changing the background color clears the image
		clearImage();
	} // pickBackClr
	
	
	// user changed the advanced checkbox
	function toggleAdvanced(el) {
		if (el.checked) {
			// turn on advanced controls
			advanced = true;
			
			document.getElementById('rotateInc').style.display = 'inline-block';
			   			
			
			document.getElementById('curr_r').style.display = 'inline-block'; 
			document.getElementById('curr_R').style.display = 'inline-block'; 
			document.getElementById('curr_d').style.display = 'inline-block'; 
			
			//document.getElementById('btnReset').style.display = 'inline-block';
			
			var elsArr = getElementsByClass("settingsBlockAdv", document, 'DIV');
			for (i=0; i < elsArr.length; i++)
				elsArr[i].style.display = 'inline-block';
				
			var elsArr = getElementsByClass("settingsBlockClrType", document, 'DIV');
			for (i=0; i < elsArr.length; i++)
				elsArr[i].style.height = '120px';
				
			var elsArr = getElementsByClass("settingsBlockBackClr", document, 'DIV');
			for (i=0; i < elsArr.length; i++)
				elsArr[i].style.height = '120px';
				
				
			document.getElementById('advPresets').style.display = 'inline-block';	
				
			document.getElementById('input_backClrR').style.display = 'inline-block';
			document.getElementById('input_backClrG').style.display = 'inline-block';
			document.getElementById('input_backClrB').style.display = 'inline-block';
			document.getElementById('lbl_backClrR').style.display = 'inline-block';
			document.getElementById('lbl_backClrG').style.display = 'inline-block';
			document.getElementById('lbl_backClrB').style.display = 'inline-block';
			
			document.getElementById('settingsBlockSimple').style.display = 'none';
			document.getElementById('settingsBlock_R').style.display = 'inline-block';
			document.getElementById('settingsBlock_r').style.display = 'inline-block';
			document.getElementById('settingsBlock_d').style.display = 'inline-block';

			document.getElementById('input_factorXInc').style.display = 'inline-block';				
			document.getElementById('input_factorYInc').style.display = 'inline-block';				
			document.getElementById('lbl_factorXInc').style.display = 'inline-block';				
			document.getElementById('lbl_factorYInc').style.display = 'inline-block';				

			document.getElementById('input_lineWinc').style.display = 'inline-block';				
			document.getElementById('input_lineHinc').style.display = 'inline-block';				
			document.getElementById('lbl_lineWinc').style.display = 'inline-block';				
			document.getElementById('lbl_lineHinc').style.display = 'inline-block';				
			
			document.getElementById('redStuff').style.display = 'inline-block';				
			document.getElementById('greenStuff').style.display = 'inline-block';				
			document.getElementById('blueStuff').style.display = 'inline-block';				
		}
		else {
			// turn off advanced controls
			advanced = false;
			
			document.getElementById('rotateInc').style.display = 'none';
			
			document.getElementById('curr_r').style.display = 'none'; 			
			document.getElementById('curr_R').style.display = 'none'; 			
			document.getElementById('curr_d').style.display = 'none'; 			

			//document.getElementById('btnReset').style.display = 'none';
			
			var elsArr = getElementsByClass("settingsBlockAdv",document,'DIV');
			for (i=0; i < elsArr.length; i++)
				elsArr[i].style.display = 'none';
				
			// Only shrink height if user choice is not {other}	
			if (coloringType != 1) {
				var elsArr = getElementsByClass("settingsBlockClrType", document, 'DIV');
				for (i=0; i < elsArr.length; i++)
					elsArr[i].style.height = '40px';
					
				document.getElementById('redStuff').style.display = 'none';				
				document.getElementById('greenStuff').style.display = 'none';				
				document.getElementById('blueStuff').style.display = 'none';									
			}	
				
			var el = document.getElementById('backClr');	
			var clrPicked = el.options[el.selectedIndex].value;
			if	(clrPicked != '{other}') {
				var elsArr = getElementsByClass("settingsBlockBackClr", document, 'DIV');
				for (i=0; i < elsArr.length; i++)
					elsArr[i].style.height = '40px';
				
				document.getElementById('input_backClrR').style.display = 'none';
				document.getElementById('input_backClrG').style.display = 'none';
				document.getElementById('input_backClrB').style.display = 'none';
				document.getElementById('lbl_backClrR').style.display = 'none';
				document.getElementById('lbl_backClrG').style.display = 'none';
				document.getElementById('lbl_backClrB').style.display = 'none';
			}					
			
			document.getElementById('advPresets').style.display = 'none';	
			
			document.getElementById('settingsBlockSimple').style.display = 'inline-block';
			document.getElementById('settingsBlock_R').style.display = 'none';
			document.getElementById('settingsBlock_r').style.display = 'none';
			document.getElementById('settingsBlock_d').style.display = 'none';		
						

			document.getElementById('input_factorXInc').style.display = 'none';							
			document.getElementById('input_factorYInc').style.display = 'none';							
			document.getElementById('lbl_factorXInc').style.display = 'none';							
			document.getElementById('lbl_factorYInc').style.display = 'none';	
			
			document.getElementById('input_lineWinc').style.display = 'none';				
			document.getElementById('input_lineHinc').style.display = 'none';				
			document.getElementById('lbl_lineWinc').style.display = 'none';				
			document.getElementById('lbl_lineHinc').style.display = 'none';							

			
			// Set advanced controls to their defaults (like rInc=0)
			RAmp = 0;
			rAmp = 0;
			dAmp = 0;
			
			RInc = 0;
			rInc = 0;
			dInc = 0;
			
			RPhase = 0;
			rPhase = 0;
			dPhase = 0;
			
			factorXInc = 0;
			factorYInc = 0;	
			
			lineWinc = 0;
			lineHinc = 0;
			
			tPhaseInc = 0;  // radians
			document.getElementById('input_rotateInc').value = 0;  // degrees
		}
		//alert(el.checked);
	} // toggleAdvanced
		
		
	function setAdvancedDefaults() {
		RAmp = 0;
		rAmp = 0;
		dAmp = 0;
		
		RInc = 0;
		rInc = 0;
		dInc = 0;
		
		RPhase = 0;
		rPhase = 0;
		dPhase = 0;
		
		factorXInc = 0;
		factorYInc = 0;	
		
		lineWinc = 0;
		lineHinc = 0;
	}	
	
	
	// onchange event from combo box -- choose a preset from drop down
	function selectPreset(selEl) {
		// Get value of clear & draw on preset change checkbox
		var elcd = document.getElementById('input_clrDraw');
		var clrDraw = elcd.checked;	

		if (!advanced || clrDraw) {
			drawingInProcess = false;
			clearTimeout(timer);	
			_isRunning = false;
		}
		
		if (selEl.id == "advancedPresets") {
			advanced = 1;  // so we don't set rInc=0, etc in getUserControlValues()
			var ael = document.getElementById('input_advanced');
			ael.checked = true;
		}
		
		resetImage();  // new
		
		// Init values altered by the drawing process -- if not currently drawing
		initDrawingValues();  // set defaults for any globals not set by presetValues() or getUserControlValues()
	
		// Set globals from preset values
		if (selEl.id == "advancedPresets") {
			var pel = document.getElementById('basicPresets');
			pel.selectedIndex = 0;  // blank
			advancedPresetValues();
		}	
		else {
			var pel = document.getElementById('advancedPresets');
			pel.selectedIndex = 0;  // blank
			basicPresetValues();			
		}
		
		// Update controls from globals
		//alert("selectPreset() type=" + type);
		fillControlsFromGlobals();	
			
		if (!advanced || clrDraw) {
			clearImage();
			draw();  // calls fetchAndFill() before drawing
		}
	//	else {
	//		// update global variables
	//		// update user controls from global vars
	//		fetchAndFill();
	//	}	
	}
	
	// called from selectPreset()
	//function preset(which){
	//	presetNum = which;
	//	resetImage();		
	//	main();  // kicks off the drawing and starts the timer
	//}
	
	
	// invoked from draw button
	// like the play button on a music player
	function draw(){
		//resetPreset();
		//alert(drawingInProcess);
		
		if ((rOff > 0.0) && (ROff > 0.0))
			loopsComplete = rOff / gcd(Math.round(rOff), Math.round(ROff));
		else
			loopsComplete = 1;
		
		var maxT = loops * loopsComplete * twoPI;
		
		// if r or R are incremented, try to take that into account when setting loopsComplete (which affects max_T)
		//loopsComplete = adjustLoopsCompleteForIncrements(maxT);  // if r or R increment, get new value for loopsComplete
		//maxT = loops * loopsComplete * twoPI;                    // possible new value	
		
		document.getElementById("maxT").innerHTML = maxT;
		
		//*** Treat this function like unpause
		// When start drawing, set direction to forward
		//_tDirection = 0;
		
		if (_tLoop == 0 && t >= maxT) {
			t = 0;   // start over
			updateProgressBar(0);
			drawingInProcess = false;  // not paused in the middle.  Done at the end.
			console.log("tloop==0 and t >= maxT");
		}	
		else if (_tLoop == 1 && t <= 0)
		{
			// re-get control values since some of them would keep increasing, like line width
			getUserControlValues();
			
			t = 0;
			_tDirection = 0;  // start over.  Go forward.
			
			//make increments positive.
			makeIncrementsPositive();
			
			// TO DO: Have an option on main page to set increments negative?
			console.log("tloop==1 and t <= 0");			
		}
		
		// TO DO: if not paused then call fetchAndFill()
		if (!drawingInProcess)
			fetchAndFill();
		//else
		//	alert("draw()  drawing is in progress");
		
		clearTimeout(timer);
		drawingInProcess = true;
		_isRunning = true;
	
		spirographEx();  // kicks off the drawing and starts the timer
	} // draw
	
	
	
	// called when the user makes a change to the parameters
	function resetPreset() {
		presetNum = 0;  // take input from user input fields		
	}
	
	// invoked from stop button
	// same as resetImage()
	// sets t=0 and resets all global vars from the user controls.
	function stop() {
		//drawingInProcess = false;
		//clearTimeout(timer);	
		//fetchAndFill();
		resetImage();
		_isRunning = false;
	} // stop
	
	
	// pause drawing.  User can restart.
	function pause() {
		// don't set drawingInProcess to false or when the user hits "draw" it will reset to start
		//drawingInProcess = false;
		clearTimeout(timer);	
		_isRunning = false;    // don't set drawingInProcess to false or when the user hits "draw" it will reset to start
	} // pause

	
	// invoked at page load and by reset button
	// like rewind to start button on a music player
	function resetImage() {
		drawingInProcess = false;
		clearTimeout(timer);	
		_isRunning = false;
		
		t = 0;
		_tDirection = 0;
		updateProgressBar(0);
		document.getElementById('input_t').value = t;		

		fetchAndFill();
	} // end resetImage
	
	
	// uses global cWidth, cHeight
	// invoked at page load and when user clicks clear button
	function clearImage() {
	    var canvas = document.getElementById("can");
		canvas.width = cWidth;
		canvas.height = cHeight;
		
		document.getElementById('curr_r').innerHTML = ''; 							
		document.getElementById('curr_R').innerHTML = ''; 							
		document.getElementById('curr_d').innerHTML = ''; 							
		
		backClrR = document.getElementById("input_backClrR").value;
		backClrG = document.getElementById("input_backClrG").value;
		backClrB = document.getElementById("input_backClrB").value;		
		if (backClrR < 0)  backClrR = 0;
		if (backClrR > 255)  backClrR = 255;
		if (backClrG < 0)  backClrG = 0;
		if (backClrG > 255)  backClrG = 255;
		if (backClrB < 0)  backClrB = 0;
		if (backClrB > 255)  backClrB = 255;
		
		
		context = canvas.getContext("2d");
		context.fillStyle = "rgb(" + backClrR + "," + backClrG + "," + backClrB + ")";
		//alert(context.fillStyle);
		context.fillRect (0, 0, cWidth, cHeight);

		if (!advanced)
			initDrawingValues();
	} // end clearImage
	
	
	
	//type, lineW, lineH, loops, speed, colorScale, ROff, RAmp, RFreq, RInc, RPhase, d, r,
	//factorX, factorY, factorXInc, factorYInc, lineWinc, lineHInc, coloringType, 
	//redBase, redInc, redMin, redMax, cx, cy
	//
	function createRandomImage() {
		type = randRange(0, 1);  // epitrochoid=1 or hypotrochoid=0
		setTypeChecked(type);
		
		coloringType = randRange(0, 21);
		if (coloringType == 5) // Black  
			coloringType = randRange(6, 21);  // don't allow black drawing on a black background
		var ct = document.getElementById('coloring_type');
		setSelectedIndexByValue(ct, coloringType);
		
		loops = 1;
		if (randRange(0, 2) == 2)
			speed = randRange(5, 500) / 10.0;
		else
			speed = randRange(1, 5);
						
		if (randRange(0, 1) == 1)
			colorScale = randRange(5, 100) / 10.0;
		else
			colorScale = 1;
		
		// TO DO: set cx, cy
		
		var opt = randRange(0, 2);
		if (opt == 0) {
			rOff = randRange(1, 20) * 10;
			ROff = (randRange(1, 20) / 10.0) * rOff;
			dOff = randRange(Math.round(rOff/2), Math.round(1.5 * ROff));
		}
		else if (opt == 1) {
			rOff = randRange(10, 200);
			ROff = (randRange(1, 20) / 10.0) * rOff;
			dOff = randRange(Math.round(rOff/2), Math.round(1.5 * ROff));
		}
		else {
			rOff = randRange(10, 200);
			ROff = randRange(10, 200);
			dOff = randRange(Math.round(rOff/2), Math.round(1.5 * ROff));
		}
		
		if (type == 0) {
			// r can't equal R for hypotrochoid or we don't get anything
			if (rOff == ROff) {
				rOff--;
				ROff++;
			}
		}
		
		if (type == 1) {
			// epitrochoid
			rOff /= 2.0;
			ROff /= 2.0;
		}
		rOff = Math.round(rOff);
		ROff = Math.round(ROff);
		
		var maxXFactor, maxYFactor
		if (type == 0) {
			// hypotrochoid
			// image size is cWidth x cHeight
			// circle of radius r rolling within fixed circle of radius R, d distance from center of r.
			// max width = 2 * (R - r + d)
			maxXFactor = cWidth / (2 * (Math.abs(ROff - rOff) + dOff));
			maxYFactor = cHeight / (2 * (Math.abs(ROff - rOff) + dOff)); 
			// make image at least a quarter the size of the available area for the min
		}
		else {
			// epitrochoid
			// image size is cWidth x cHeight
			// circle of radius r rolling outside fixed circle of radius R, d distance from center of r.
			// max width = 2 * (R + r + d)
			maxXFactor = cWidth / (2 * (ROff + rOff + dOff));
			maxYFactor = cHeight / (2 * (ROff + rOff + dOff)); 
		}
		// Allow max factors to go up to 10% beyond the bounds
		maxXFactor *= 1.1;
		maxYFactor *= 1.1;
		
		//if (randRange(0, 2) == 2) {
			factorY = randRange(maxYFactor, 2.0 * maxYFactor) / 2.0;   // from 0.5 * maxYFactor to maxYFactor
			if (randRange(0, 1) == 1)
				factorX = randRange(maxXFactor, 2.0 * maxXFactor) / 2.0;
			else
				factorX = factorY;
		//}
		//else
		//	factorX = factorY = 1.0;
		
		
		
		if (advanced == true) {
			lineW = randRange(1, 4);
			lineH = randRange(1, 4);
			if (randRange(0, 1) == 1) {
				// 50% of the time
				lineWinc = randRange(1, 50) / 10000.0;
				if (randRange(0, 1) == 1)
					lineHinc = randRange(1, 50) / 10000.0;
				else
					lineHinc = lineWinc;
			}
			else {
				lineWinc = lineHinc = 0;
			}
		
			if (randRange(0, 1) == 1) 
				factorXInc = randRange(1, 100) / 100000.0;
			else
				factorXInc = 0;
			if (randRange(0, 1) == 1)
				factorYInc = randRange(1, 100) / 100000.0;
			else
				factorYInc = factorXInc;
				
		}
		
		effectColoringType();
		fillControlsFromGlobals();
		
		resetImage();  // rewind button
		clearImage();
		draw();
		
	} // createRandomImage
	
	
	// Input globals: speed, loops, loopsComplete, colorScale, twoPI, redMin, redMax, greenMin, greenMax, blueMin, blueMax,
	// redInc, greenInc, blueInc
	// Output globals: redInc, greenInc, blueInc
	function getColorIncrements(forceManual) {
		if (forceManual === undefined)
			forceManual = false;  // set default if no parameter passed
			
		if ((getColorIncHandling() == 0) && (forceManual == false)) {
			// Auto Color Inc handling -- set inc values from the plotCount, colorScale, color range
			var plotCnt =  getPlotCount(speed, loops, loopsComplete);
			if (plotCnt > 0) {
				// We want a colorScale of 1.0 to end with the same color it started with, 0.5 to go thru the full range once.
				redInc = 2.0 * colorScale * (redMax - redMin) / plotCnt
				greenInc = 2.0 * colorScale * (greenMax - greenMin) / plotCnt;
				blueInc = 2.0 * colorScale * (blueMax - blueMin) / plotCnt;
			}			
		}
		else {
			// Manual Color Inc Handling -- take inc values from the entry fields
			
			// Simple color increment scaling -- scale by existing values for redInc, greenInc, blueInc
			redInc = redInc * colorScale;
			greenInc = greenInc * colorScale;
			blueInc = blueInc * colorScale;	
		}			
	}
	


	function setSelectedIndexByValue(selEl, v) {
		for ( var i = 0; i < selEl.options.length; i++ ) {
			if ( selEl.options[i].value == v ) {
				selEl.options[i].selected = true;
				return;
			}
		}
	}	
		
	
	//  Coloring Type:
	//			<option value="0">Dotted</option>
	//			<option value="1">{other}</option>
	//			<option value="2">GrayScale</option>
	//			<option value="3">Blues #2</option>
	//			<option value="4">Gold/Blues</option>
	//			<option value="5">Black</option>
	//			<option value="6">White</option>
	//
	function effectColoringType() {
		// set global initial values for red, green, blue based on coloringType
		if (coloringType == 0) {
			// dotted grayscale coloring (0)
			redBase = 128;   
			greenBase = 128;
			blueBase = 128;
			redInc = 0.016;
			greenInc = 0.016;
			blueInc = 0.016;
			redMin = 40;
			redMax = 220;
			greenMin = 40;
			greenMax = 220;
			blueMin = 40;
			blueMax = 220;	
						
			blueInc = 255.0 / twoPI;   // 255.0 / plots;
			greenInc = 255.0 / twoPI;  // 255.0 / plots;
			redInc = 255.0 / twoPI;  // 255.0 / plots;	
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;
			
			getColorIncrements(true);  // force manual for dotted only			
		}
		else if (coloringType == 2) {
			// grayscale coloring (2)
			redBase = 128;    // 40      0
			greenBase = 128;  // 80      0
			blueBase = 128;   // 100   128
			redInc = 0.016;
			greenInc = 0.016;
			blueInc = 0.016;
			redMin = 40;
			redMax = 220;
			greenMin = 40;
			greenMax = 220;
			blueMin = 40;
			blueMax = 220;
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;
			
			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 3) {
			// blues #2 coloring (3)
			redBase = 30;
			greenBase = 30;
			blueBase = 128;
			redInc = 0;
			greenInc = 0;
			blueInc = 0.016;
			redMin = 30;
			redMax = 30;
			greenMin = 30;
			greenMax = 30;
			blueMin = 50;
			blueMax = 200;
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;
			
			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 4) {
			// gold/blues coloring (4)
			redBase = 40;
			greenBase = 80;
			blueBase = 100;
			redInc = 0.016;
			greenInc = 0.016;
			blueInc = 0.016;
			redMin = 40;
			redMax = 220;
			greenMin = 40;
			greenMax = 220;
			blueMin = 40;
			blueMax = 220;

			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;
			
			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 5) {
			// black coloring (5)
			redBase = 0;
			greenBase = 0;
			blueBase = 0;
			redInc = 0;
			greenInc = 0;
			blueInc = 0;
			redMin = 0;
			redMax = 0;
			greenMin = 0;
			greenMax = 0;
			blueMin = 0;
			blueMax = 0;
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;

			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 6) {
			// white coloring (6)
			redBase = 255;
			greenBase = 255;
			blueBase = 255;
			redInc = 0;
			greenInc = 0;
			blueInc = 0;
			redMin = 255;
			redMax = 255;
			greenMin = 255;
			greenMax = 255;
			blueMin = 255;
			blueMax = 255;
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;

			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 7) {
			// Light Green/Purple coloring (7)
			redBase = 100;
			greenBase = 100;
			blueBase = 80;
			redInc = 0.016;
			greenInc = 0.016;
			blueInc = 0.016;
			redMin = 40;
			redMax = 220;
			greenMin = 40;
			greenMax = 220;
			blueMin = 40;
			blueMax = 220;
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;

			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 8) {
			// Blue/Brown coloring (8)
			redBase = 100;
			greenBase = 80;
			blueBase = 40;
			redInc = 0.016;
			greenInc = 0.016;
			blueInc = 0.016;
			redMin = 40;
			redMax = 220;
			greenMin = 40;
			greenMax = 220;
			blueMin = 40;
			blueMax = 220;
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;

			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 9) {
			// Purple/Green coloring (9)
			redBase = 80;
			greenBase = 100;
			blueBase = 40;
			redInc = 0.016;
			greenInc = 0.016;
			blueInc = 0.016;
			redMin = 40;
			redMax = 220;
			greenMin = 40;
			greenMax = 220;
			blueMin = 40;
			blueMax = 220;
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;

			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 10) {
			// Purple/Pink coloring (10)
			redBase = 100;
			greenBase = 40;
			blueBase = 80;
			redInc = 0.016;
			greenInc = 0;
			blueInc = 0.016;
			redMin = 40;
			redMax = 220;
			greenMin = 40;
			greenMax = 40;
			blueMin = 40;
			blueMax = 220;
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;

			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 11) {
			// Reds coloring (11)
			redBase = 60;
			greenBase = 40;
			blueBase = 40;
			redInc = 0.014;
			greenInc = 0;
			blueInc = 0;
			redMin = 60;
			redMax = 220;
			greenMin = 40;
			greenMax = 40;
			blueMin = 40;
			blueMax = 40;

			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;

			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 12) {
			// Greens coloring (12)
			redBase = 40;
			greenBase = 60;
			blueBase = 40;
			redInc = 0;
			greenInc = 0.014;
			blueInc = 0;
			redMin = 40;
			redMax = 40;
			greenMin = 60;
			greenMax = 220;
			blueMin = 40;
			blueMax = 40;

			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;

			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 13) {
			// Yellows coloring (13)
			redBase = 60;
			greenBase = 60;
			blueBase = 40;
			redInc = 0.014;
			greenInc = 0.014;
			blueInc = 0;
			redMin = 60;
			redMax = 220;
			greenMin = 60;
			greenMax = 220;
			blueMin = 40;
			blueMax = 40;
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;

			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 14) {
			// Blues coloring (14)
			redBase = 40;
			greenBase = 40;
			blueBase = 60;
			redInc = 0;
			greenInc = 0;
			blueInc = 0.014;
			redMin = 40;
			redMax = 40;
			greenMin = 40;
			greenMax = 40;
			blueMin = 60;
			blueMax = 220;
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;

			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 15) {
			// Cyans coloring (15)
			redBase = 40;
			greenBase = 60;
			blueBase = 60;
			redInc = 0;
			greenInc = 0.014;
			blueInc = 0.014;
			redMin = 40;
			redMax = 40;
			greenMin = 60;
			greenMax = 220;
			blueMin = 60;
			blueMax = 220;
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;

			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 16) {
			// Magentas coloring (16)
			redBase = 60;
			greenBase = 40;
			blueBase = 60;
			redInc = 0.014;
			greenInc = 0;
			blueInc = 0.014;
			redMin = 60;
			redMax = 220;
			greenMin = 40;
			greenMax = 40;
			blueMin = 60;
			blueMax = 220;
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;

			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 17) {
			// dotted coloring (17)
			redBase = 32;   
			greenBase = 64;
			blueBase = 128;
			redInc = 0.016;
			greenInc = 0.016;
			blueInc = 0.016;
			redMin = 40;
			redMax = 220;
			greenMin = 40;
			greenMax = 220;
			blueMin = 40;
			blueMax = 220;	
			
			blueInc = 255.0 / twoPI;   // 255.0 / plots;
			greenInc = 255.0 / twoPI;  // 255.0 / plots;
			redInc = 255.0 / twoPI;  // 255.0 / plots;	

			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;
			
			getColorIncrements(true);  // force manual for dotted only			
		}
		else if (coloringType == 18) {    // YOP
			// YOP (18)
			redBase = 220;   
			greenBase = 80;
			blueBase = 100;
			
			redInc = 0;
			greenInc = 2.5;
			blueInc = 0.625;
			
			redMin = 220;
			redMax = 220;
			greenMin = 40;
			greenMax = 220;
			blueMin = 40;
			blueMax = 220;	

			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;
			
			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 19) {    // CLRS1
			// TO DO: Disable the increment fields since we set the increments from the colorScale...
			// TO DO: Set the increment values so user can see what they are.
			// CLRS1 (19)
			redBase = 200;   
			greenBase = 40;
			blueBase = 80;
			
			//redInc = 0.83333;
			//greenInc = 1.25;
			//blueInc = 1.53;
			
			redMin = 80;
			redMax = 200;
			greenMin = 40;
			greenMax = 220;
			blueMin = 20;
			blueMax = 240;

			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;
			
			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 20) {    // CLRS2
			// CLRS2 (20)
			redBase = 200;   
			greenBase = 220;
			blueBase = 80;
			
			//redInc = 0.83333;
			//greenInc = 1.25;
			//blueInc = 1.53;
			
			redMin = 80;
			redMax = 200;
			greenMin = 40;
			greenMax = 220;
			blueMin = 20;
			blueMax = 240;

			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;
			
			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else if (coloringType == 21) {    // CLRS3
			// CLRS3 (21)
			redBase = 200;   
			greenBase = 40;
			blueBase = 240;
			
			//redInc = 0.83333;
			//greenInc = 1.25;
			//blueInc = 1.53;
			
			redMin = 80;
			redMax = 200;
			greenMin = 40;
			greenMax = 220;
			blueMin = 20;
			blueMax = 240;

			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;
			
			getColorIncrements();  // sets redInc, greenInc, blueInc			
		}
		else {
			// coloringType == 1:  configurable coloring {other}
			
			redMin = 1.0 * document.getElementById('input_redMin').value;			
			redMax = 1.0 * document.getElementById('input_redMax').value;
			greenMin = 1.0 * document.getElementById('input_greenMin').value;
			greenMax = 1.0 * document.getElementById('input_greenMax').value;
			blueMin = 1.0 * document.getElementById('input_blueMin').value;
			blueMax = 1.0 * document.getElementById('input_blueMax').value;		
			
			if (redMin > redMax) {
				var tmp = redMin;
				redMin = redMax;
				redMax = tmp;
			}
			if (greenMin > greenMax) {
				var tmp = greenMin;
				greenMin = greenMax;
				greenMax = tmp;
			}
			if (blueMin > blueMax) {
				var tmp = blueMin;
				blueMin = blueMax;
				blueMax = tmp;
			}
			
			redBase = 1.0 * document.getElementById('input_redBase').value;		
			greenBase = 1.0 * document.getElementById('input_greenBase').value;		
			blueBase = 1.0 * document.getElementById('input_blueBase').value;
			
			//redInc = 1.0 * document.getElementById('input_redInc').value;  // global
			//greenInc = 1.0 * document.getElementById('input_greenInc').value;  // global
			//blueInc = 1.0 * document.getElementById('input_blueInc').value;  // global
			redInc = redIncOrig;
			greenInc = greenIncOrig;
			blueInc = blueIncOrig;

			// Don't set redIncOrig/greenIncOrig/blueIncOrig here... only do it when there is a change to the edit field
			
			getColorIncrements();  // sets redInc, greenInc, blueInc						
		}
		
		if (!drawingInProcess) {
			red = redBase;
			green = greenBase;
			blue = blueBase;		
		}
	
	} // effectColoringType
	
	
	function showtooltip(id) {
		var el = document.getElementById(id);
		if (el) {
			el.style.display = 'block';
		}
	}
	function hidetooltip(id) {
		var el = document.getElementById(id);
		if (el) {
			el.style.display = 'none';
		}
	}

	if (!supports_canvas()) {
		var el = document.getElementById('noCanvasSupport');
		if (el) {
			el.style.display = 'block';  // instead of 'none'
		}
	}	

	function supports_canvas() {
		return !!document.createElement('canvas').getContext;
	}	
	

	
	// uses global context, lineW, lineH
	function plotColor(x, y,  r, g, b) {
		//b = b|1;  // convert to int?
		b = parseInt(b);
		g = parseInt(g);
		r = parseInt(r);
		x = parseInt(x);
		y = parseInt(y);
		//if (isNaN(x)) {
		//	alert('x is NaN');
		//	return;
		//}
		//if (isNaN(y))
		//	return;
		
		if (_drawBlackOnReverse == 1 && _tDirection == 1)
		{
			// plot black if going backwards and we want to plot Black
			r = g = b = 0;
		}
		
		//alert('x=' + x + '   y=' + y);
	    context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
		context.fillRect(x, y, lineW, lineH);
	}
	
	
	function getElementsByClass(searchClass,node,tag) {
		var classElements = new Array();
		if ( node == null )
			node = document;
		if ( tag == null )
			tag = '*';
		var els = node.getElementsByTagName(tag);
		var elsLen = els.length;
		//var pattern = new RegExp("(^|\s)"+searchClass+"(\s|$)");
		var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
		//var pattern = new RegExp("\b"+searchClass+"\b");
		for (i = 0, j = 0; i < elsLen; i++) {
			if ( pattern.test(els[i].className) ) {
				classElements[j] = els[i];
				j++;
			}
		}
		return classElements;
	}
	
	
	// Greatest Common Divisor
	function gcd(a, b) {
		if (a < 0) a = -a;
		if (b < 0) b = -b;
		if (b > a) {var temp = a; a = b; b = temp;}
		while (true) {
			if (b == 0) return a;
			a %= b;
			if (a == 0) return b;
			b %= a;
		}
	}	
		
	
	function gcdRecursive(a, b) {
		if (!b) return a;
		return gcd(b, a % b);
	}
		
	function getPlotCount(speed, loops, loopsComplete) {
		var baseInc = twoPI / 10000.0;  // must be the same as in spirographEx()
		var inc;
		
		if (speed == 0)
			inc = baseInc;
		else {
			inc = baseInc * speed;
		}

		var maxT = loops * loopsComplete * twoPI;	
		return maxT / inc;
	}	
	
	// Global variables altered by the drawing process:
	//    t, plotCnt, redInc, greenInc, blueInc, ROff, rOff, dOff, red, green, blue, factorX, factorY
	// Other global variables:  twoPI
	function spirographEx() {
	    var R, r, d, i,j, tt;
		var x,y;
		var baseInc, inc;
		//var loopCnt, plots;
		var maxT;
		var centerX=0, centerY=0;
		
		baseInc = twoPI / 10000.0;
		
		// inc is the rate at which we increment the angle of the fixed circle to draw it.    Try 0.05
		//inc = 0.00062831853;   // speed=1                (baseInc * 1)
		//inc = 0.062831853;     // speed = 100           (baseInc * 100)
		
		//if (speed < 0) {
		//	inc = baseInc / (-1.0 * speed);
		//}
		//else 
		if (speed == 0)
			inc = baseInc;
		else {
			inc = baseInc * speed;
		}
		
				
		//loops = 8;  // complete revolutions of the moving circle

		// center of larger outside circle (the blue one)
		////cx = cWidth / 2; 
		////cy = cHeight / 2;

		//plots = twoPI / Math.abs(inc);

		//if ((t == 0) && ((coloringType == 0) || (coloringType == 17))) {
		//	// Dotted Coloring
		//	blueInc = 255.0 / twoPI;   // 255.0 / plots;
		//	greenInc = 255.0 / twoPI;  // 255.0 / plots;
		//	redInc = 255.0 / twoPI;  // 255.0 / plots;
		//	
		//	getColorIncrements(true);  // force manual only for dotted
		//}

		//loopCnt = 0;
		maxT = loops * loopsComplete * twoPI;	
		// var plots = maxT / inc;
		
		// Check if we are done
		if ((t < 0) && ((-1 * t) >= maxT)) {
			// t is negative if speed is negative
			// sets t=0
		////	resetImage();  // stop the timer and rewind to start
			clearTimeout(timer);	
			_isRunning = false;
			return;
		}
		else if ((t >= 0) && (t >= maxT) && _tLoop == 0) {
			// sets t=0
		    ////	resetImage();  // stop the timer and rewind to start
			console.log("((t >= 0) && (t >= maxT) && _tLoop == 0) --> return");
			clearTimeout(timer);	
			_isRunning = false;
			return;
		}
			
		var allDone = false;
			
		//for (; t < maxT; t = t + inc) {
		for (tt=0; tt < 50; tt++) {
			//if ((t >= maxT) || zz)
			//	break;
			if ((t > maxT && _tLoop == 0) || zz)
			{
				console.log("((t > maxT && _tLoop == 0) || zz) --> break");
				break;
			}
						
			ROff = ROff + RInc;
			rOff = rOff + rInc;
			dOff = dOff + dInc;
							
			if (RPhase != 0)
				R = RAmp * Math.sin(RFreq * t + RPhase) + ROff;
			else
				R = RAmp * Math.sin(RFreq * t) + ROff;
			
			if (rPhase != 0)
				r = rAmp * Math.sin(rFreq * t + rPhase) + rOff;
			else
				r = rAmp * Math.sin(rFreq * t) + rOff;
			
			if (dPhase != 0)
				d = dAmp * Math.sin(dFreq * t + dPhase) + dOff;
			else
				d = dAmp * Math.sin(dFreq * t) + dOff;

			// Show current r
			if (advanced == true) {
				if ((rInc != 0.0) || (rAmp != 0.0))
					document.getElementById('curr_r').innerHTML = r; 
				if ((RInc != 0.0) || (RAmp != 0.0))
					document.getElementById('curr_R').innerHTML = R; 
				if ((dInc != 0.0) || (dAmp != 0.0))
					document.getElementById('curr_d').innerHTML = d; 
			}
			
			if (r == 0) 
				r = 0.000001;
			
			//document.title = 'R=' + R + '  r=' + r;
			
			// d = how far the drawing point is located from the center of the moving circle.
			// r = radius of moving circle that rolls around the larger fixed circle
			// R = radius of larger fixed circle
			if (type == 0) {
				// Hypotrochoid -- r rolls on inside of R
				x = (R - r) * Math.cos(t + tPhase + (t * tPhaseInc)) + d * Math.cos((R-r)*t/r + tPhase + (t * tPhaseInc));
				y = (R - r) * Math.sin(t + tPhase  + (t * tPhaseInc)) - d * Math.sin((R-r)*t/r + tPhase + (t * tPhaseInc));
			}
			else if (type == 1) {
				// Epitrochoid -- r rolls on outside of R
				x = (R + r) * Math.cos(t + tPhase + (t * tPhaseInc)) - d * Math.cos((R+r)*t/r + tPhase + (t * tPhaseInc));
				y = (R + r) * Math.sin(t + tPhase + (t * tPhaseInc)) - d * Math.sin((R+r)*t/r + tPhase + (t * tPhaseInc));				
			}
			else {
				// Test
				
				// Interesting
				//   x = (R - r) * Math.cos(t) + d * Math.sin((R-r)*t/r);
				//   y = (R + r) * Math.sin(t) - d * Math.cos((R+r)*t/r);	

				//x = d * Math.cos((R-r)*t/r);
				//y = (R + r) * Math.sin(t);
				
				// Interesting
				//  x = (R - r) * Math.cos(t) + d * Math.cos((R+r)*t/r);
				//  y = (R + r) * Math.sin(t) - d * Math.sin((R-r)*t/r);

				// Cool
				//  x = (R - r) * Math.cos(t) + d * Math.sin((R+r)*t/r);
				//  y = (R + r) * Math.sin(t) - d * Math.cos((R-r)*t/r);
				
				/*
				// Currently Testing:
				centerX = (R + r) * Math.cos(r+t);
				centerY = (R + r) * Math.sin(r-t);

				// hypotrochoid
				x = (R - r) * Math.cos(t) + d * Math.cos((R-r)*t/r);
				y = (R - r) * Math.sin(t) - d * Math.sin((R-r)*t/r);
				*/
				
				// Lissajous
				x = RAmp * Math.sin(RFreq * t + RPhase) + ROff;    // x = A sin(at + d)
				y = rAmp * Math.sin(rFreq * t + rPhase) + rOff;    // y = B sin(bt)
			}
			
			x = factorX * x;
			y = factorY * y;
			
	//		// Rotation
	//		//var theta = 2.0 * t;   // 1.0 * twoPI / 8.0;
	//		var theta = 1.0 * twoPI / 8.0;
	//		x = x*Math.cos(theta) - y*Math.sin(theta);
	//		y = x*Math.sin(theta) + y*Math.cos(theta);


			// HSV to RGB coloring schemes
			// HSV Custom #1 #2, #3, and #4
			var ct = document.getElementById('coloring_type').selectedIndex;
			//// 36 coloring items: 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350
			//if (ct >= 22 && ct <= 57)
			//{
			//	var z2 = t / maxT; //  (t % 100000)/100000;
			//	var z2 = Math.abs(Math.sin(2.0 * 3.14159265358 * z2));  
			//	var z3 = z2 * 0.7 + 0.15;
			//	var rgbObj = HSVtoRGB( (ct - 22) * 10, z3, 1.0 - z3 );
			//	red = rgbObj.r;
			//	green = rgbObj.g;
			//	blue = rgbObj.b;	
			//}		

			if (ct == 22)   // "HSV Custom #1"
			{
				var hueDiff = _hueMax - _hueMin;				
				var zh = (t / maxT);
				zh = Math.abs(Math.sin(2.0 * 3.14159265358 * zh));  // color starts and ends at the same hue
				zh = zh * hueDiff + _hueMin;   // in range _hueMin to _hueMax
				
				var valDiff = Math.abs(_valueMax - _valueMin);
				var valMin = (_valueMin < _valueMax) ? _valueMin : _valueMax;
				var z2 = t / maxT; 
				var z2 = Math.abs(Math.sin(2.0 * 3.14159265358 * z2));  // color starts and ends at the same hue
				
				var z3 = z2 * valDiff + valMin;
				var rgbObj = HSVtoRGB( zh, z3, z3 );
				red = rgbObj.r;
				green = rgbObj.g;
				blue = rgbObj.b;	
			}
			else if (ct == 23)   // "HSV Custom #2"
			{
				var hueDiff = _hueMax - _hueMin;				
				var zh = (t / maxT);
				zh = Math.abs(Math.sin(2.0 * 3.14159265358 * zh));  // color starts and ends at the same hue
				zh = zh * hueDiff + _hueMin;   // in range _hueMin to _hueMax
				
				var valDiff = Math.abs(_valueMax - _valueMin);
				var valMin = (_valueMin < _valueMax) ? _valueMin : _valueMax;
				var z2 = t / maxT; 
				var z2 = Math.abs(Math.sin(2.0 * 3.14159265358 * z2));  // color starts and ends at the same hue
				var z3 = z2 * valDiff + valMin;
				var rgbObj = HSVtoRGB( zh, z3, 1.0 - z3 );
				red = rgbObj.r;
				green = rgbObj.g;
				blue = rgbObj.b;	
			}
			else if (ct == 24)   // "HSV Custom #3"
			{
				var hueDiff = _hueMax - _hueMin;				
				var zh = (t / maxT);
				zh = Math.abs(Math.sin(2.0 * 3.14159265358 * zh));  // color starts and ends at the same hue
				zh = zh * hueDiff + _hueMin;   // in range _hueMin to _hueMax
				
				var valDiff = Math.abs(_valueMax - _valueMin);
				var valMin = (_valueMin < _valueMax) ? _valueMin : _valueMax;
				var z2 = t / maxT; 
				var z2 = Math.abs(Math.sin(2.0 * 3.14159265358 * z2));  // color starts and ends at the same hue
				var z3 = z2 * valDiff + valMin;
				var rgbObj = HSVtoRGB( zh, 1.0 - z3, z3 );
				red = rgbObj.r;
				green = rgbObj.g;
				blue = rgbObj.b;	
			}
			else if (ct == 25)   // "HSV Custom #4"  -- vary hue
			{
				var valDiff = Math.abs(_valueMax - _valueMin);
				var valMin = (_valueMin < _valueMax) ? _valueMin : _valueMax;
				var z2 = t / maxT; 
				var z2 = Math.abs(Math.sin(2.0 * 3.14159265358 * z2));  // color starts and ends at the same hue
				
				var hueDiff = _hueMax - _hueMin;				
				var zh = (t / maxT);
				zh = Math.abs(Math.sin(2.0 * 3.14159265358 * zh));  // color starts and ends at the same hue
				zh = zh * hueDiff + _hueMin;   // in range _hueMin to _hueMax
				
				var z3 = z2 * valDiff + valMin;
				var rgbObj = HSVtoRGB( zh, z3, z3 );
				red = rgbObj.r;
				green = rgbObj.g;
				blue = rgbObj.b;	
			}
						

			//alert('x=' + x + ' y=' + y + ' R=' + R + ' k=' + k + ' L=' + L + ' t=' + t);
			
			plotColor(x+cx + centerX, y+cy + centerY, red, green, blue); // outside larger fixed circle

		//	plotCnt = plotCnt + 1;
		//	if (plotCnt > plots) {
		//		plotCnt = 0;
		//	}

			//loopCnt = t / twoPI;
			if (loopsComplete != 0) {
				var currLoops = t / (loopsComplete * twoPI);
				document.getElementById('currLoops').innerHTML = currLoops;
			}

			red = red + redInc;
			green = green + greenInc;
			blue = blue + blueInc;
			
			if ((red > redMax) && (redInc > 0)) {
				redInc = redInc * -1;
				red = red + redInc;
			}	
			else if ((red < redMin) && (redInc < 0)) {
				redInc = redInc * -1;
				red = red + redInc;
			}
			
			if ((green > greenMax) && (greenInc > 0)) {
				greenInc = greenInc * -1;
				green = green + greenInc;
			}	
			else if ((green < greenMin) && (greenInc < 0)) {
				greenInc = greenInc * -1;
				green = green + greenInc;
			}
			
			if ((blue > blueMax) && (blueInc > 0)) {
				blueInc = blueInc * -1;
				blue = blue + blueInc;
			}	
			else if ((blue < blueMin) && (blueInc < 0)) {
				blueInc = blueInc * -1;
				blue = blue + blueInc;
			}	
			
			factorX = factorX + factorXInc;
			if (factorX <= 0)
			{	
				console.log("factorX <= 0");
				//break;	
				if (_tLoop == 1 && _tDirection == 0)
				{
					_tDirection = 1;  // go back
					toggleIncrements();
				}
				else
				{
					allDone = true;
					break;
				}				
			}
			factorY = factorY + factorYInc;
			if (factorY <= 0)
			{
				console.log("factorY <= 0");
				//break;
				if (_tLoop == 1 && _tDirection == 0)
				{
					_tDirection = 1;  // go back
					toggleIncrements();
				}
				else
				{
					allDone = true;
					break;
				}				
			}
			lineW = lineW + lineWinc;
			if (lineW <= 0) 
			{
				if (_tLoop == 1 && _tDirection == 0)
				{
					_tDirection = 1;  // go back
					toggleIncrements();
				}
				else
				{
					allDone = true;
					break;
				}
			}	
				
			lineH = lineH + lineHinc;
			if (lineH <= 0) 
			{
				if (_tLoop == 1 && _tDirection == 0)
				{
					_tDirection = 1;  // go back
					toggleIncrements();
				}
				else
				{
					allDone = true;
					break;
				}
			}	

			if (x > (2 * cWidth)) 
			{
				if (_tLoop == 1 && _tDirection == 0)
				{
					_tDirection = 1;  // go back
					toggleIncrements();
				}
				else
				{
					allDone = true;
					break;
				}
			}	
			if (y > (2 * cHeight)) 
			{	
				if (_tLoop == 1 && _tDirection == 0)
				{
					_tDirection = 1;  // go back
					toggleIncrements();
				}
				else
				{
					allDone = true;
					break;
				}
			}	

		//	if ((t + inc/2) >= maxT) {
		//		allDone = true;
		//		break;
		//	}
			
			if (_tLoop == 0)   // no looping
			{
				if ((t < maxT) && ((t + inc) >= maxT)) {
					//tPhase = tPhase + ((maxT - t) / inc) * tPhaseInc;  // scale tPhaseInc proportional to how much we increment t.
					//tPhase = tPhase + (maxT - t) * tPhaseInc;  // scale tPhaseInc proportional to how much we increment t.
					t = maxT;  // do one last plot at t = maxT
				}
				else if (t >= maxT || t < 0)    //*** 11/20 change
				{  // t > maxT should never happen, but t == maxT will happen
					allDone = true;
					
					_tDirection = 0;  // reset
					t = 0;
					break;
				}
				else
				{
					//*** 11/20 change						
					//t = t + inc;
					if (_tDirection == 0)
						t = t + inc;
					else
						t = t - inc;		
				}
			}
			else   // _tLoop == 1   yes looping
			{
				if ((_tDirection == 0) && (t < maxT) && ((t + inc) >= maxT)) {
					//tPhase = tPhase + ((maxT - t) / inc) * tPhaseInc;  // scale tPhaseInc proportional to how much we increment t.
					//tPhase = tPhase + (maxT - t) * tPhaseInc;  // scale tPhaseInc proportional to how much we increment t.
					
					//**** Changing t like this messes up going backwards
					//t = maxT;  // do one last plot at t = maxT in this direction
					
					//*** 11/20 change	
					//t = t + inc;   //** do this instead
					//
					if (_tDirection == 0)
						t = t + inc;
					else
						t = t - inc;					
				}
				else if (t < 0) 
				{
					if (_tKeepLooping == 1)
					{
						console.log("t < 0 and tKeepLooping==1  {go forward}");
						toggleIncrements();
						
						// re-get control values since some of them would keep increasing, like line width
						//getUserControlValues();
						
						clearImage();
						resetImage();

						
						t = 0;
						_tDirection = 0;   // go forward
					}
					else
					{
						allDone = true;
						break;
					}
				}
				else
				{
					if (t >= maxT)
					{
						console.log("t >= maxT  {go backward}");
						console.log("");
						_tDirection = 1;   // go backward
						
						toggleIncrements();
					}
					
					
					if (_tDirection == 0)
						t = t + inc;
					else
						t = t - inc;
				//tPhase += (inc * tPhaseInc);  // tPhase += tPhaseInc
			}
		}
			
		}
		// update t
		document.getElementById('input_t').value = t;
		
		if (maxT != 0.0)
			updateProgressBar(100.0 * t / maxT);
		
		//alert('rho=' + rho);
		if (allDone == false) {
			var fun = function() { spirographEx(); };		
			timer = setTimeout(fun, 10); 
			_isRunning = true;
		}		
			
	}
	
	function toggleIncrements()
	{
		dInc *= -1;
		rInc *= -1;
		RInc *= -1;
		factorXInc *= -1;
		factorYInc *= -1;
		redInc *= -1;
		greenInc *= -1;
		blueInc *= -1;
	}
	
	function makeIncrementsPositive()
	{
		if (dInc < 0)  dInc *= -1;
		if (rInc < 0)  rInc *= -1;
		if (RInc < 0)  RInc *= -1;
		if (factorXInc < 0)  factorXInc *= -1;
		if (factorYInc < 0)  factorYInc *= -1;
		if (redInc < 0)  redInc *= -1;
		if (greenInc < 0)  greenInc *= -1;
		if (blueInc < 0)  blueInc *= -1;
	}
	
	
	function setSelectByValue(selEl, val) {
		var idx;
		for (idx = 0; idx < selEl.length; idx++) {
			if (selEl[idx].value == val)
				selEl.selectedIndex = idx;
		}
	}
	function setSelectByText(selEl, txt) {
		var idx;
		for (idx = 0; idx < selEl.length; idx++) {
			if (selEl[idx].text == txt)
				selEl.selectedIndex = idx;
		}
	}
	
	
	function basicPresetValues() {
		var sel = document.getElementById('basicPresets');
		presetNum = sel.options[sel.selectedIndex].value;
		
		setAdvancedDefaults();
		
		lineW = 2;
		lineH = 2;		
	
		// if no present is picked from the combo box, then presetNum is 0
		if (presetNum == 1) {
			loops = 1;  //23;
			speed = 10;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 90;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 46;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 37;  // set to d
			dInc = 0;
			dPhase = 0;
			
			factorX = 2.5;
			factorXInc = 0;
			factorY = 2.5;
			factorYInc = 0;
			
			redInc = 0.016;    // 1
			greenInc = 0.016;  // 2
			blueInc = 0.016;   // 3
			
			coloringType = 4;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Gold/Blues');
			//effectColoringType();	 // sets red, green, blue based on coloringType 	
		}
		if (presetNum == 2) {
			loops = 1;  //12;
			speed = 10;
			type = 1;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 50;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 24;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 100;  // set to d
			dInc = 0;
			dPhase = 0;
			
			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			redInc = 0.022;    // 1
			greenInc = 0.044;  // 2
			blueInc = 0.066;   // 3
			
			coloringType = 0;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Dotted');
			//effectColoringType();	 // sets red, green, blue based on coloringType 	
		}
		else if (presetNum == 3) {
			loops = 1;  //39.6;
			speed = 10;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 130;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 70;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 70;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 4;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Gold/Blues');			
		}
		else if (presetNum == 4) {
			loops = 1;  //12.4;
			speed = 10;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 103;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 34;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 66;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 4;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Gold/Blues');			
		}
		else if (presetNum == 5) {
			loops = 1;  //33;
			speed = 8;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 221;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 11;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 190;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 2;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'GrayScale');
		}
		else if (presetNum == 6) {
			loops = 1;
			speed = 1;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 220;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 10;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 110;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 3;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Blues #2');			
		}
		else if (presetNum == 7) {
			loops = 1;  //8;
			speed = 5;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 111;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 11;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 111;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 2;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'GrayScale');			
		}
		else if (presetNum == 8) {
			loops = 1;  //6;
			speed = 5;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 132;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 22;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 34;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 13;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Yellows');			
		}
		if (presetNum == 9) {
			loops = 1;
			speed = 4;
			type = 0; // hypo
			
			RAmp = 0;
			RFreq = 1;
			ROff = 210;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 30;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 80;  // set to d
			dInc = 0;
			dPhase = 0;
			
			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 4;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Gold/Blues');
			effectColoringType();	 // sets red, green, blue based on coloringType 	
		}
		if (presetNum == 10) {
			loops = 1;
			speed = 4;
			type = 1; // epi
			
			RAmp = 0;
			RFreq = 1;
			ROff = 135;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 45;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 160;  // set to d
			dInc = 0;
			dPhase = 0;
			
			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 19;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'CLRS1');
			effectColoringType();	 // sets red, green, blue based on coloringType 	
		}
		
		redIncOrig = redInc;
		greenIncOrig = greenInc;
		blueIncOrig = blueInc;
		
		if ((rOff > 0.0) && (ROff > 0.0)) {
			loopsComplete = rOff / gcd(Math.round(rOff), Math.round(ROff));
		
			// # of loops/cusps = R / gcd(R, r)
			var loopsCusps = ROff / gcd(Math.round(rOff), Math.round(ROff));
			document.getElementById('input_loopsCusps').value = loopsCusps;	
		}
	} // basicPresetValues	
		
		
	function advancedPresetValues() {
		var sel = document.getElementById('advancedPresets');
		presetNum = sel.options[sel.selectedIndex].value;
		
		setAdvancedDefaults();
		
		lineW = 2;
		lineH = 2;
	
		if (presetNum == 1) {
			loops = 1;  //7;
			speed = 10;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 120;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 42;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 10;
			dFreq = 1;
			dOff = 27;  // set to d
			dInc = 0;
			
			factorX = 1.2;
			factorXInc = 0;
			factorY = 1.2;
			factorYInc = 0;
			
			//redBase = 64;
			//greenBase = 0;
			//blueBase = 128;
			//
			//redInc = 0.01;
			//greenInc = 0.01;
			//blueInc = 0.03;
			
			redInc = 0.045;  
			greenInc = -0.05; 
			blueInc = -0.05; 
			
			redIncOrig = redInc;
			greenIncOrig = greenInc;
			blueIncOrig = blueInc;
			
			redMin = 40;
			redMax = 220;
			redBase = 64;
			
			greenMin = 40;
			greenMax = 220;
			greenBase = 200;
			
			blueMin = 40;
			blueMax = 220;
			blueBase = 128;

			coloringType = 1;  // {other}
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 					

			
			backClrR = 0;
			backClrG = 0;
			backClrB = 0;
			document.getElementById('input_backClrR').value = backClrR;
			document.getElementById('input_backClrG').value = backClrG;
			document.getElementById('input_backClrB').value = backClrB;
			var el = document.getElementById('backClr');
			el.selectedIndex = 1;  // black
		}
		else if (presetNum == 2) {
			loops = 73;  //500;
			speed = 50;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 240;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 42;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 10;
			dFreq = 1;
			dOff = 27;  // set to d
			dInc = 0.001;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			

			redInc = 0.01;   // 0.01111
			greenInc = 0.01;  // 0.0122
			blueInc = 0.03;  // 0.021
			
			redMin = 20;
			redMax = 230;
			redBase = 64;
			
			greenMin = 20;
			greenMax = 230;
			greenBase = 20;
			
			blueMin = 20;
			blueMax = 230;
			blueBase = 128;
			
			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 		
			
			
			backClrR = 0;
			backClrG = 0;
			backClrB = 0;
			document.getElementById('input_backClrR').value = backClrR;
			document.getElementById('input_backClrG').value = backClrG;
			document.getElementById('input_backClrB').value = backClrB;
			var el = document.getElementById('backClr');
			el.selectedIndex = 1;  // black			
			
		}
		else if (presetNum == 3) {
			loops = 400;
			speed = 50;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 240;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 48;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 20;
			dFreq = 1;
			dOff = 27;  // set to d
			dInc = 0.002;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 16;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Magentas');
			//effectColoringType();	 // sets red, green, blue based on coloringType 		
		}
		else if (presetNum == 4) {
			loops = 2;  //22;
			speed = 10;
			type = 1;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 100;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 14;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 20;
			dFreq = 3;
			dOff = 70;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 11;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Reds');
			//effectColoringType();	 // sets red, green, blue based on coloringType 					
		}
		else if (presetNum == 5) {
			loops = 400;
			speed = 82;
			type = 1;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 120;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 1;
			rFreq = 2;
			rOff = 60;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 120;
			dFreq = 3;
			dOff = 30;  // set to d
			dInc = 0.0002;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 9;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Purple/Green');
			//effectColoringType();	 // sets red, green, blue based on coloringType 								
		}
		else if (presetNum == 6) {
			loops = 400;
			speed = 1;
			type = 1;
			
			RAmp = 100;
			RFreq = 1;
			ROff = 120;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 1;
			rFreq = 2;
			rOff = 60;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 40;
			dFreq = 3;
			dOff = 30;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 9;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Purple/Green');
			//effectColoringType();	 // sets red, green, blue based on coloringType 											
		}
		else if (presetNum == 7) {
			loops = 400;
			speed = 1;
			type = 1;
			
			RAmp = 120;
			RFreq = 3;
			ROff = 120;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 30;
			rFreq = 2;
			rOff = 60;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 30;
			dFreq = 3;
			dOff = 30;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			redInc = 0.016;  
			greenInc = 0.014; 
			blueInc = -0.012; 
			
			redMin = 40;
			redMax = 220;
			redBase = 100;
			
			greenMin = 40;
			greenMax = 220;
			greenBase = 40;
			
			blueMin = 40;
			blueMax = 220;
			blueBase = 80;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 					
		}
		else if (presetNum == 8) {
			loops = 17.4;  //400;
			speed = 20;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 90;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 46;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 30;  // set to d
			dInc = 0.001;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			redInc = 0.016;  
			greenInc = -0.014; 
			blueInc = 0.012; 
			
			redMin = 40;
			redMax = 220;
			redBase = 100;
			
			greenMin = 40;
			greenMax = 220;
			greenBase = 40;
			
			blueMin = 40;
			blueMax = 220;
			blueBase = 80;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 								
		}
		else if (presetNum == 9) {
			loops = 500;
			speed = 93;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 240;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 48;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 20;
			dFreq = 1;
			dOff = 27;  // set to d
			dInc = 0.002;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			redInc = -0.016;  
			greenInc = 0.014; 
			blueInc = 0.012; 
			
			redMin = 40;
			redMax = 220;
			redBase = 100;
			
			greenMin = 40;
			greenMax = 220;
			greenBase = 40;
			
			blueMin = 40;
			blueMax = 220;
			blueBase = 80;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 											
		}
		else if (presetNum == 10) {
			loops = 83.33;  //500;
			speed = 55;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 248;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 48;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 20;
			dFreq = 1;
			dOff = 27;  // set to d
			dInc = 0.002;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			
			redInc = 0.0002;  
			greenInc = 0.0004; 
			blueInc = 0.01; 
			
			redMin = 50;
			redMax = 220;
			redBase = 30;
			
			greenMin = 50;
			greenMax = 220;
			greenBase = 30;
			
			blueMin = 50;
			blueMax = 220;
			blueBase = 128;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 											
		}
		else if (presetNum == 11) {
			loops = 300;
			speed = 8;  // try 7  and try 1
			type = 1;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 50;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 50;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 25;
			dFreq = 400;
			dOff = 100;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			
			redInc = 0.004;  
			greenInc = 0.006; 
			blueInc = -0.02; 
			
			redMin = 50;
			redMax = 230;
			redBase = 50;
			
			greenMin = 50;
			greenMax = 210;
			greenBase = 50;
			
			blueMin = 50;
			blueMax = 220;
			blueBase = 128;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 											
		}
		else if (presetNum == 12) {
			loops = 58;
			speed = 8;
			type = 1;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 50;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 50;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 25;
			dFreq = 400;
			dOff = 100;  // set to d
			dInc = 0.001;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			
			redInc = -0.004;  
			greenInc = 0.006; 
			blueInc = -0.02; 
			
			redMin = 50;
			redMax = 230;
			redBase = 50;
			
			greenMin = 50;
			greenMax = 210;
			greenBase = 50;
			
			blueMin = 50;
			blueMax = 220;
			blueBase = 128;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 												
		}
		else if (presetNum == 13) {
			loops = 90;
			speed = 2;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 40;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 20;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 40;
			dFreq = 4;
			dOff = 80;  // set to d
			dInc = 0.001;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 8;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Blue/Brown');
			//effectColoringType();	 // sets red, green, blue based on coloringType 					
		}
		else if (presetNum == 14) {
			loops = 33;
			speed = 2;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 40;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0.1;
			rFreq = 4;
			rOff = 20;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 50;
			dFreq = 2;
			dOff = 50;  // set to d
			dInc = 0.002;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			
			redInc = 0.0016;  
			greenInc = 0.0016;
			blueInc = 0.0016;
			
			redMin = 40;
			redMax = 220;
			redBase = 100;
			
			greenMin = 40;
			greenMax = 220;
			greenBase = 80;
			
			blueMin = 40;
			blueMax = 220;
			blueBase = 40;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 														
		}
		else if (presetNum == 15) {
			loops = 50;
			speed = 2;
			type = 0;  // try 1 with loops = 90
			
			RAmp = 0;
			RFreq = 1;
			ROff = 40;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0.06;
			rFreq = 3;
			rOff = 20;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 50;
			dFreq = 3;
			dOff = 50;  // set to d
			dInc = 0.002;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			
			redInc = 0.00056;  
			greenInc = 0.00056; 
			blueInc = 0.00056; 
			
			redMin = 40;
			redMax = 20;
			redBase = 40;
			
			greenMin = 40;
			greenMax = 230;
			greenBase = 80;
			
			blueMin = 40;
			blueMax = 230;
			blueBase = 100;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 																	
		}
		else if (presetNum == 16) {
			loops = 40;
			speed = 2;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 40;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0.06;
			rFreq = 2;
			rOff = 20;  // set to r
			rInc = 0.000001;
			rPhase = 0;
			
			dAmp = 50;
			dFreq = 2;
			dOff = 50;  // set to d
			dInc = 0.001;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			
			redInc = 0.00056;  
			greenInc = 0.00056; 
			blueInc = 0.00056; 
			
			redMin = 40;
			redMax = 20;
			redBase = 80;
			
			greenMin = 40;
			greenMax = 230;
			greenBase = 40;
			
			blueMin = 40;
			blueMax = 230;
			blueBase = 100;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 																				
		}
		else if (presetNum == 17) {
			loops = 0.759;  //18;
			speed = 10;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 120;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0.1;
			rFreq = 1;
			rOff = 46;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 10;
			dFreq = 1;
			dOff = 27;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 2;
			factorXInc = 0;
			factorY = 2;
			factorYInc = 0;
			
			//redInc = 0.3;  
			//greenInc = 0; 
			//blueInc = 0.1; 

			coloringType = 12;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('Greens')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 					
		}
		else if (presetNum == 18) {
			loops = 1;  //26;
			speed = 10;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 180;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 46;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 11;
			dFreq = 4;
			dOff = 37;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 11;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('Reds')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 								
		}
		else if (presetNum == 19) {
			loops = 1.13;  //26;
			speed = 2;
			type = 1;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 180;  // set to R
			RInc = 0.00002;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 46;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 8;
			dFreq = 3;
			dOff = 20;  // set to d
			dInc = 0.001;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			
			redInc = 0.0036;  
			greenInc = 0.0076; 
			blueInc = 0.00056; 
			
			redMin = 20;
			redMax = 40;
			redBase = 40;
			
			greenMin = 40;
			greenMax = 230;
			greenBase = 80;
			
			blueMin = 40;
			blueMax = 230;
			blueBase = 100;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 																							
		}
		else if (presetNum == 20) {
			loops = 0.9;  //26;
			speed = 2;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 180;  // set to R
			RInc = 0.00002;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 46;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 8;
			dFreq = 3;
			dOff = 12;  // set to d
			dInc = 0.0005;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			redInc = 0.0026;  
			greenInc = -0.0036; 
			blueInc = 0.00016; 
			
			redMin = 20;
			redMax = 230;
			redBase = 40;
			
			greenMin = 40;
			greenMax = 80;
			greenBase = 60;
			
			blueMin = 40;
			blueMax = 230;
			blueBase = 100;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 																										
		}
		else if (presetNum == 21) {
			loops = 25.83;
			speed = 2;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 180;  // set to R
			RInc = 0.00002;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 60;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 12;
			dFreq = 3;
			dOff = 8;  // set to d
			dInc = 0.0005;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			redInc = 0.0026;  
			greenInc = -0.0036; 
			blueInc = 0.0016; 
			
			redMin = 20;
			redMax = 230;
			redBase = 100;
			
			greenMin = 40;
			greenMax = 80;
			greenBase = 60;
			
			blueMin = 40;
			blueMax = 230;
			blueBase = 100;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 																													
		}
		else if (presetNum == 22) {
			loops = 400;
			speed = 50;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 240;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 48;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 20;
			dFreq = 1;
			dOff = 27;  // set to d
			dInc = 0.002;
			dPhase = 0;

			factorX = 0.5;
			factorXInc = 0.0001;
			factorY = 0.5;
			factorYInc = 0.0001;
			
			
			redInc = 0.016;  
			greenInc = -0.0036; 
			blueInc = 0.0016; 
			
			redMin = 20;
			redMax = 230;
			redBase = 100;
			
			greenMin = 40;
			greenMax = 80;
			greenBase = 60;
			
			blueMin = 40;
			blueMax = 230;
			blueBase = 100;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 																																
		}
		else if (presetNum == 23) {
			loops = 1;  //23;
			speed = 10;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 90;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 46;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 10;
			dFreq = 1;
			dOff = 37;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 2.5;
			factorXInc = 0;
			factorY = 2.5;
			factorYInc = 0;
			
			redInc = 0.022;
			greenInc = 0.044;
			blueInc = 0.066;
			
			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 					
		}
		else if (presetNum == 24) {
			loops = 142.86;  //1000;
			speed = 50;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 240;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 42;  // set to r
			rInc = 0.001;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 27;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			redInc = 0.0022;
			greenInc = 0.0044;
			blueInc = 0.0066;
			
			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 					
		}
		else if (presetNum == 25) {
			loops = 60;
			speed = 2;
			type = 1; 
			
			RAmp = 0;
			RFreq = 1;
			ROff = 40;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0.06;
			rFreq = 3;
			rOff = 20;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 50;
			dFreq = 3;
			dOff = 50;  // set to d
			dInc = 0.002;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			
			redInc = 0.00036;  
			greenInc = 0.00016; 
			blueInc = 0.00056; 
			
			redMin = 40;
			redMax = 230;
			redBase = 80;
			
			greenMin = 40;
			greenMax = 60;
			greenBase = 40;
			
			blueMin = 40;
			blueMax = 230;
			blueBase = 100;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 																	
		}
		else if (presetNum == 26) {
			loops = 1;  //33;
			speed = 8;
			type = 0; 
			
			RAmp = 0;
			RFreq = 1;
			ROff = 103;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 34;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 66;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0.0001;
			factorY = 1;
			factorYInc = 0.0001;
			
			coloringType = 4;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Gold/Blues');			
		}
		else if (presetNum == 27) {
			loops = 2.353;  //80;
			speed = 10;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 103;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 34;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 66;
			dFreq = 0.02;
			dOff = 66;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 4;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Gold/Blues');					
		}
		else if (presetNum == 28) {
			loops = 2.265;  //77;
			speed = 10;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 103;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 34;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 66;
			dFreq = 0.01;
			dOff = 66;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 4;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Gold/Blues');					
		}
		else if (presetNum == 29) {
			loops = 2.41;  //82;
			speed = 10;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 103;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 34;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 66;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 2;
			factorXInc = -0.00002;
			factorY = 2;
			factorYInc = -0.00002;
			
			coloringType = 8;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Blue/Brown');
		}
		else if (presetNum == 30) {
			loops = 3.91;  //133;
			speed = 10;
			type = 0;
			
			RAmp = 103;
			RFreq = 2;
			ROff = 103;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 34;
			rFreq = 2;
			rOff = 34;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 66;
			dFreq = 2;
			dOff = 66;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0.00001;
			factorY = 1;
			factorYInc = 0.00001;
			
			coloringType = 7;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Light Purple/Green');
		}
		else if (presetNum == 31) {
			loops = 2.41;  //82;
			speed = 10;
			type = 1;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 103;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 34;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 66;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 2;
			factorXInc = -0.00002;
			factorY = 2;
			factorYInc = -0.00002;
			
			coloringType = 8;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Blue/Brown');
		}
		else if (presetNum == 32) {
			loops = 55;
			speed = 6;
			type = 1;
			
			//linewW = 4;
			lineW = 2;
			lineH = 1;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 68;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 34;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 66;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 2;
			factorXInc = -0.00002;
			factorY = 2;
			factorYInc = -0.00002;
			
			coloringType = 17;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Dotted #2');
		}
		else if (presetNum == 33) {
			loops = 55;
			speed = 10;
			type = 1;
						
			RAmp = 0;
			RFreq = 1;
			ROff = 34;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 34;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 88;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 2;
			factorXInc = -0.00001;
			factorY = 2;
			factorYInc = -0.00001;
			
			coloringType = 17;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Dotted #2');
		}
		else if (presetNum == 34) {
			loops = 900;
			speed = 66;
			type = 1;
						
			RAmp = 0;
			RFreq = 1;
			ROff = 80;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 80;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 40;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1.5;
			factorXInc = -0.00001;
			factorY = 1.5;
			factorYInc = -0.00001;
			
			coloringType = 17;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Dotted #2');
		}
		else if (presetNum == 35) {
			loops = 6.53;  //111;
			speed = 23;
			type = 1;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 103;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 17;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 1;
			dOff = 68;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0.0001;
			factorY = 1;
			factorYInc = 0.0001;
			
			coloringType = 8;
			var ct = document.getElementById('coloring_type');
			setSelectByText(ct, 'Blue/Brown');
		}
		else if (presetNum == 36) {
			loops = 5.42;  //65;
			speed = 10;
			type = 0; 
			
			RAmp = 0;
			RFreq = 1;
			ROff = 50;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 1;
			rFreq = 0;
			rOff = 24;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 3;
			dFreq = 100;
			dOff = 100;  // set to d
			dInc = 0.009;
			dPhase = 0;

			factorX = 0.8;
			factorXInc = 0;
			factorY = 0.8;
			factorYInc = 0;
			
			
			redInc = 0.014;  
			greenInc = -0.001; 
			blueInc = 0.014; 
			
			redMin = 60;
			redMax = 220;
			redBase = 60;
			
			greenMin = 40;
			greenMax = 220;
			greenBase = 40;
			
			blueMin = 60;
			blueMax = 220;
			blueBase = 60;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 																	
		}
		// put rInc to RInc in same proportion as r is to R
		// so if R/r = 3 then set RInc/rInc to 3
		else if (presetNum == 37) {
			loops = 500;
			speed = 50;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 90;  // set to R
			RInc = 0.003;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 30;  // set to r
			rInc = 0.001;
			rPhase = 0;
			
			dAmp = 11;
			dFreq = 4;
			dOff = 37;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 11;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('Reds')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 								
		}
		// amazing!
		else if (presetNum == 38) {
			loops = 265;
			speed = 100;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 90;  // set to R
			RInc = 0.03;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 60;  // set to r
			rInc = 0.02;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 4;
			dOff = 37;  // set to d
			dInc = 0;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 11;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('Reds')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 								
		}
		else if (presetNum == 39) {
			loops = 200;
			speed = 50;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 180;  // set to R
			RInc = 0.03;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 60;  // set to r
			rInc = 0.01;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 4;
			dOff = 37;  // set to d
			dInc = 0.01;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 11;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('Reds')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 								
		}
		else if (presetNum == 40) {
			loops = 65;
			speed = 60;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 180;  // set to R
			RInc = 0.09;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 60;  // set to r
			rInc = 0.03;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 4;
			dOff = 37;  // set to d
			dInc = 0.01;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 11;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('Gold/Blues')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 								
		}
		else if (presetNum == 41) {
			loops = 24;
			speed = 20;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 150;  // set to R
			RInc = 0.05;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 30;  // set to r
			rInc = 0.01;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 4;
			dOff = 36;  // set to d
			dInc = 0.05;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			coloringType = 11;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('Purple/Green')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 								
		}
		else if (presetNum == 42) {
			loops = 25;
			speed = 20;
			type = 1;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 150;  // set to R
			RInc = 0.05;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 30;  // set to r
			rInc = 0.01;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 4;
			dOff = 37;  // set to d
			dInc = 0.05;
			dPhase = 0;

			factorX = 1;
			factorXInc = -0.00005;
			factorY = 1;
			factorYInc = -0.00005;
			
			coloringType = 11;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('Purple/Green')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 								
		}
		else if (presetNum == 43) {
			loops = 400;
			speed = 160;
			type = 0;
			
			RAmp = 0;
			RFreq = 1;
			ROff = 180;  // set to R
			RInc = 0.03;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 1;
			rOff = 60;  // set to r
			rInc = 0.01;
			rPhase = 0;
			
			dAmp = 0;
			dFreq = 4;
			dOff = 37;  // set to d
			dInc = 0.01;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			lineWinc = 0.0005;
			lineHinc = 0.0005;
			
			coloringType = 11;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('Greens')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 								
		}
		else if (presetNum == 44) {
			loops = 40;
			speed = 2;
			type = 0;
			
			lineW = 1;
			lineH = 1;			
			
			RAmp = 0;
			RFreq = 2;
			ROff = 44;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 2;
			rOff = 200;  // set to r
			rInc = 0.000001;
			rPhase = 0;
			
			dAmp = 20;
			dFreq = 10;
			dOff = 30;  // set to d
			dInc = 0.00002;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			
			redInc = 0.00056;  
			greenInc = 0.00056; 
			blueInc = 0.00056; 
			
			redMin = 40;
			redMax = 20;
			redBase = 80;
			
			greenMin = 40;
			greenMax = 230;
			greenBase = 40;
			
			blueMin = 40;
			blueMax = 230;
			blueBase = 100;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 																				
		}
		else if (presetNum == 45) {
			loops = 40;
			speed = 2;
			type = 0;
			
			lineW = 1;
			lineH = 1;			
			
			RAmp = 0;
			RFreq = 2;
			ROff = 44;  // set to R
			RInc = 0;
			RPhase = 0;
			
			rAmp = 0;
			rFreq = 0;
			rOff = 200;  // set to r
			rInc = 0;
			rPhase = 0;
			
			dAmp = 20;
			dFreq = 10;
			dOff = 46;  // set to d
			dInc = 0.00003;
			dPhase = 0;

			factorX = 1;
			factorXInc = 0;
			factorY = 1;
			factorYInc = 0;
			
			
			redInc = 0.00056;  
			greenInc = 0.00056; 
			blueInc = 0.00056; 
			
			redMin = 40;
			redMax = 20;
			redBase = 80;
			
			greenMin = 40;
			greenMax = 230;
			greenBase = 40;
			
			blueMin = 40;
			blueMax = 230;
			blueBase = 100;

			coloringType = 1;
			var ct = document.getElementById('coloring_type');
			setColoringTypeByText('{other}')			
			//effectColoringType();	 // sets red, green, blue based on coloringType 																				
		}
		
		
		redIncOrig = redInc;
		greenIncOrig = greenInc;
		blueIncOrig = blueInc;
		
		if ((rOff > 0.0) && (ROff > 0.0)) {
			loopsComplete = rOff / gcd(Math.round(rOff), Math.round(ROff));
		
			// # of loops/cusps = R / gcd(R, r)
			var loopsCusps = ROff / gcd(Math.round(rOff), Math.round(ROff));
			document.getElementById('input_loopsCusps').value = loopsCusps;	
		}
		
	} // advancedPresetValues
	
	
// return the value of the radio button that is checked
// return an empty string if none are checked, or
// there are no radio buttons
function getCheckedValue(radioObj) {
	if(!radioObj)
		return "";
	var radioLength = radioObj.length;
	if(radioLength == undefined)
		if(radioObj.checked)
			return radioObj.value;
		else
			return "";
	for(var i = 0; i < radioLength; i++) {
		if(radioObj[i].checked) {
			return radioObj[i].value;
		}
	}
	return "";
}

// set the radio button with the given value as being checked
// do nothing if there are no radio buttons
// if the given value does not exist, all the radio buttons
// are reset to unchecked
function setCheckedValue(radioObj, newValue) {
	if(!radioObj)
		return;
	var radioLength = radioObj.length;
	if(radioLength == undefined) {
		//radioObj.checked = (radioObj.value == newValue.toString());
		return;
	}
	for(var i = 0; i < radioLength; i++) {
		radioObj[i].checked = false;
		if(radioObj[i].value == newValue.toString()) {
			radioObj[i].checked = true;
			//alert("setCheckedValue i=" + i + " newValue=" + newValue);
		}
	}
}	

function setTypeChecked(t) {
	document.getElementById("hypotrochoid").checked = false;
	document.getElementById("epitrochoid").checked = false;

	if (t == 0)
		document.getElementById("hypotrochoid").checked = true;
	else if (t == 1)
		document.getElementById("epitrochoid").checked = true;
	else
		document.getElementById("hypotrochoid").checked = true;
	
}

function adjustLoopsCompleteForIncrements(maxT) {
	// uses global rInc, RInc, rOff, ROff
	// if r or R are incremented, try to take that into account when setting loopsComplete (which affects max_T)
	if ((rInc != 0.0) || (RInc != 0.0)) {
		// this is only an estimate
		var max_r = rOff + maxT * rInc;
		var max_R = ROff + maxT * RInc;
		loopsComplete = max_r / gcd(Math.round(max_r), Math.round(max_R));   // new value
		//maxT = loops * loopsComplete * twoPI;       // new value	
	}
	else
		loopsComplete = rOff / gcd(Math.round(rOff), Math.round(ROff));
		
	return loopsComplete;
}


// h goes from 0 to 360
function HSVtoRGB( h, s, v )
{
	if (arguments.length < 2)
		s = 1;
	if (arguments.length < 3)
		v = 1;
	
	var i;      // int
	var f, p, q, t;  // float
	var r, g, b;
	
	if ( s == 0 ) 
	{
		// achromatic (grey)
		return { r: v * 255, g: v * 255, b: v * 255 };
	}
	
	
	h /= 60;			// sector 0 to 5
	i = Math.floor( h );
	
	//h *= 5;
	//i = Math.floor( h );
	
	
	f = h - i;			// factorial part of h
	p = v * ( 1 - s );
	q = v * ( 1 - s * f );
	t = v * ( 1 - s * ( 1 - f ) );
	
	switch( i ) 
	{
		case 0:
			r = v;
			g = t;
			b = p;
			break;
		case 1:
			r = q;
			g = v;
			b = p;
			break;
		case 2:
			r = p;
			g = v;
			b = t;
			break;
		case 3:
			r = p;
			g = q;
			b = v;
			break;
		case 4:
			r = t;
			g = p;
			b = v;
			break;
		default:		// case 5:
			r = v;
			g = p;
			b = q;
			break;
	}
	
	r *= 255;
	g *= 255;
	b *= 255;
	
	return { r: r, g: g, b: b };
}
