// DIVs to be moved must have class="mo_move" and must have position:absolute or position:relative and a width and height set.
// The DIV with class="mo_move" must be a child of a DIV that contains everything to be moved if mo_moveParent is true.

// Example usage with lightbox.js HTML:
//
//	<div style="display: none;" id="blanket"></div>
//	<div style="left: 215px; top: 174px; margin-left: 0pt; margin-top: 0pt; display: none;" id="instructions">
//		<!-- set onmousedown and onselectstart to return false to prevent the text from being selectable by the mouse -->
//		<div id="closeBtn" onclick="closeInstructions(); return false;" onselectstart="return false" onmousedown="return false;">X</div>
//		<div id="hdr" style="position:absolute;width:99%;height:60px;" class="mo_move">
//			<h3>Spirograph Instructions</h3>
//		</div>
//		<div id="helpContents" style="margin-top:60px;">
//		put content here that can be scrolled...
//		</div>
//

var mo_ie = document.all; // for Internet Explorer
var mo_moveParent = true; // whether to move the node with class="mo_move" or its parent node.  Can be changed by function mo_setMoveParent()

//mo_init(); // call this from the including page


String.prototype.endsWith = function (s) {
	return this.length >= s.length && this.substr(this.length - s.length) == s;
}

// used for onmouseover and onmouseout events to tell if the mouse left the parent.
// See http://javascript.info/tutorial/mouse-events
function mo_isOutside(evt, parent) {
	var elem = evt.relatedTarget || evt.toElement || evt.fromElement;

	while ( elem && elem !== parent) {
		elem = elem.parentNode;
	}

	if ( elem !== parent) {
		return true;
	}
} // mo_isOutside


// defaults to true for moving the parent node
function mo_setMoveParent(torf) {
	mo_moveParent = torf;  // true or false
} // mo_setMoveParent

function mo_init() { mo_setupmove(); }

function mo_endmove(id) {
	var mel = document.getElementById(id);
	if (mel.moveable) {
		mel.moveable = false;
		 mel.onmousedown = "";
		 mel.onmousemove = "";
         mel.onmouseup = "";
	}
    mo_setupmove();
	return false;	
} // mo_endmove


function mo_setupmove() {
	// If when dragging, the mouse moves faster than the object can keep up and the mouse moves outside the object, 
	// then the object will stop and the mouse will move.  If the mouse then moves back over the object, then the object
	// will move again until the mouse is clicked.
	var i, me, idx;
	var moveEls = getElementsByClass('mo_move', document, 'div'); // look for divs with class="mo_move"
	for (i=0; i < moveEls.length; i++) {
		me = moveEls[i];
		idx = me.id;
		// use javascript closures so we can set event function parameters in a loop.
		me.onmousedown = (function(id) { return function(e) { return mo_startdragging(e, id); }})(idx);
		me.onmousemove = (function(id) { return function(e) { return mo_moving(e, id); }})(idx);
		me.onmouseup = (function(id) { return function(e) { return mo_release(e, id); }})(idx);
		
		me.onmouseout = function(e) { 
			e = e || event;
			if (mo_isOutside(e, this)) {
				//alert(this.id); 
				this.mouseDown = false;
			}
		}   
		
		me.moveable = true;
		me.style.cursor = "move";

	//	me.addEventListener("touchstart", mo_touchHandler, true);
	//	me.addEventListener("touchmove", mo_touchHandler, true);
	//	me.addEventListener("touchend", mo_touchHandler, true);
	//	me.addEventListener("touchcancel", mo_touchHandler, true); 
	
		if (mo_moveParent)
			mep = me.parentNode;
		else
			mep = me;
			
		// Handle CSS used to center the moveable DIV.  e.g.:  left:50%; margin-left:-450px
		var m_mleft = parseInt(getStyle(mep, "margin-left"));
		var m_left = getStyle(mep, "left");
		if (m_left.endsWith('%')) {
			m_left = parseInt(m_left);
			var bw = parseInt(window.innerWidth);
			//alert(bw);
			m_left = bw * m_left / 100;
		}
		mep.style.left = m_left + m_mleft + 'px';

		var m_mtop = parseInt(getStyle(mep, "margin-top"));
		var m_top = getStyle(mep, "top");
		if (m_top.endsWith('%')) {
			m_top = parseInt(m_top);
			var bh = parseInt(window.innerHeight);
			//alert(bh);
			m_top = bh * m_top / 100;
		}
		mep.style.top = m_top + m_mtop + 'px';
		
		mep.style.marginLeft = 0;	
		mep.style.marginTop = 0;
		
		
		
		//me.addEventListener("touchstart", mo_touchHandler, true);
		//de.addEventListener("touchmove", mo_touchHandler, true);
		//de.addEventListener("touchend", mo_touchHandler, true);
		//de.addEventListener("touchcancel", mo_touchHandler, true); 
		//me.touchstart = function(e) { 
		//	//e = e || event;
		//	return mo_touchHandler(e);
		//}   
		
	} // end for loop

	//var de = document.getElementById('moveMe');
	//de.onmousedown = mo_startdragging;
	//de.onmousemove = mo_moving;
	//de.onmouseup = mo_release;

	//document.onmousedown = mo_startdragging;
	//document.onmousemove = mo_moving;
	//document.onmouseup = mo_release;

	//document.addEventListener("mousedown", mo_startdragging, false);
	//document.addEventListener("mouseup", mo_release, false);
	//document.addEventListener("mousemove", mo_moving, false);

	//de.addEventListener("touchstart", mo_touchHandler, true);
	//de.addEventListener("touchmove", mo_touchHandler, true);
	//de.addEventListener("touchend", mo_touchHandler, true);
	//de.addEventListener("touchcancel", mo_touchHandler, true); 

	//mo_moveable = true;
	
} // mo_setupmove

function mo_touchHandler(event) {
    var touches = event.changedTouches;
	if (touches.length > 1)
		return false;
	
    var first = touches[0];
    var type = "";
    switch(event.type) {
        case "touchstart": type = "mousedown"; break;
        case "touchmove":  type="mousemove"; break;        
        case "touchend":   type="mouseup"; break;
        default: return;
    }
    var simulatedEvent = document.createEvent("MouseEvent");
	//simulatedEvent.id = 'test';  // test
    simulatedEvent.initMouseEvent(type, true, true, window, 1, 
                              first.screenX, first.screenY, 
                              first.clientX, first.clientY, false, 
                              false, false, false, 0, null);
	// ** TO DO:  Figure out how to pass the object's id to the event we dispatched.  
	// Could try passing extra parm to dispatchEvent() or could try setting an attribute of simulatedEvent:  simulatedEvent.id = id;
    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
} // mo_touchHandler


// mouseup or touchend events
function mo_release(e, id){
	var mel = document.getElementById(id);
	//mel.style.backgroundColor = 'red';
	mel.mouseDown = false;
		
	return false;
} // mo_release
 
// mousedown or touchstart events 
// only move object (set mouseDown = true) when inside object -- would be a problem for overlapping on objects that shouldn't move
function mo_startdragging(e, id) {  
	var mel = document.getElementById(id);
	mel.mouseDown = true;
    var o, w, h;
	var curX, curY;
	//var zi, maxZ = -1;
	
	if ((id == null) || (typeof id === "undefined")) {
		id = e.id;
		alert(id);
	}
	
	curX = mo_ie ? e.clientX + document.body.scrollLeft : e.pageX;
	curY = mo_ie ? e.clientY + document.body.scrollTop  : e.pageY;
	
	if (mo_moveParent)
		mep = mel.parentNode;
	else
		mep = mel;
	
	//determine if the object is under the mouse
	o = offset(mep);
	w = parseInt(getStyle(mep, "width"));
	h = parseInt(getStyle(mep, "height"));
	
	// The following commented-out "if" check is only needed if the mouse handlers are at the document level.
	//if (curX >= o.x && curX <= o.x + w && curY >= o.y && curY <= o.y + h) {
		mep.adjustX = curX - o.x;
		mep.adjustY = curY - o.y;
		
		//mel.style.backgroundColor = 'green';
		//mo_endmove(id);			
	//}
	//else
	//	mouseDown = false;
	
	// For some reason this commented code causes a problem when there are multiple divs.
	// Set the zIndex to one higher than all other mo_move DIVs
	//var moveEls = getElementsByClass('mo_move', document, 'div'); // look for divs with class="mo_move"
	//for (i=0; i < moveEls.length; i++) {
	//	zi = parseInt(getStyle(moveEls[i], "zIndex"));
	//	if (zi > maxZ)
	//		maxZ = zi;
	//}
	//mel.style.zIndex = maxZ + 1;	
	
	return false;
} // mo_startdragging
 
// mousemove or touchmove events 
function mo_moving(e, id) {
	var mel = document.getElementById(id);
	if (!mel.mouseDown) 
		return;
		 
	if (mo_ie)
		mo_draw(id, e.clientX + document.body.scrollLeft, e.clientY + document.body.scrollTop);
	else
		mo_draw(id, e.pageX, e.pageY);
	
	//mel.style.backgroundColor = 'yellow';
			
	return false;
} // mo_moving
 
function mo_draw(id, x, y) {
	var js, melp;
	var mel = document.getElementById(id);
	if (!mel)
		return;
		
	// Use parentNode to move the whole container.   This allows only having a section of the container to be the part
	// that the user can use to drag the whole.  This allows a scrollbar to work.
	if (mo_moveParent)
		melp = mel.parentNode;
	else
		melp = mel;
		
	js = melp.style;
	js.left = (x - melp.adjustX) + "px";
	js.top  = (y - melp.adjustY) + "px";		
	
} // mo_draw
