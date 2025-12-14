/* lightbox.js */
/*
Example HTML that is required to correspond with this javascript:

	<div id="blanket"></div>
	<div id="instructions">
		<div id="closeBtn" onclick="closeInstructions()">X</div>
		<!-- application specific content here -->
	</div>

*/
function openInstructions() {
	var el = document.getElementById('instructions');
	if (el) {
		el.style.display = 'block';
		
		el = document.getElementById('lb_blanket');
		if (el)
			el.style.display = 'block';
		
		
	}
}
function closeInstructions() {
	var el = document.getElementById('instructions');
	if (el) {
		el.style.display = 'none';
		
		el = document.getElementById('lb_blanket');
		if (el)
			el.style.display = 'none';
		
	}
}
