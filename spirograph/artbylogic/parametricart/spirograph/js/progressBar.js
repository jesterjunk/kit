/* progressBar.js */
/*
Example HTML that is required to correspond with this javascript:

	<div id="pbar">
		<div id="progressBarWrapper"><div id="progressBar"></div></div>
	</div>

*/
function updateProgressBar(pctDone) {
	var w;
	var elw = document.getElementById('progressBarWrapper');
	if (elw) {
		var tmpW;
		if (document.defaultView) {
			tmpW = document.defaultView.getComputedStyle(elw, "").getPropertyValue("width");
			w = parseInt(tmpW);
		}
		else
			w = elw.style.width;
	}

	var el = document.getElementById('progressBar');
	if (el) {
		el.style.width = w * pctDone / 100.0 + 'px';
		if (pctDone == 0)
			el.style.visibility = 'hidden';
		else
			el.style.visibility = 'visible';
	}
}
