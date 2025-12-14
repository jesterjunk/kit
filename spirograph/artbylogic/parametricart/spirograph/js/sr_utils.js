// 
// Utility Functions
// 
function offset(obj) {
	var left = 0;
	var top  = 0;
	if (obj.offsetParent)
		do
		{
			left += obj.offsetLeft;
			top  += obj.offsetTop;
        } while (obj = obj.offsetParent);
	return {x: left, y: top};
} // offset
 
function getStyle(el, style) {
  if(!document.getElementById) return;
 
   var value = el.style[toCamelCase(style)];
 
  if(!value)
    if(document.defaultView)
      value = document.defaultView.
         getComputedStyle(el, "").getPropertyValue(style);
   
    else if(el.currentStyle)
      value = el.currentStyle[toCamelCase(style)];
  
   return value;
}
function setStyle(objId, style, value) {
  document.getElementById(objId).style[style] = value;
}
function toCamelCase( sInput ) {
  var oStringList = sInput.split('-');
  if(oStringList.length == 1)  
    return oStringList[0];
  var ret = sInput.indexOf("-") == 0 ?
      oStringList[0].charAt(0).toUpperCase() + oStringList[0].substring(1) : oStringList[0];
  for(var i = 1, len = oStringList.length; i < len; i++){
    var s = oStringList[i];
    ret += s.charAt(0).toUpperCase() + s.substring(1)
  }
  return ret;
}
function increaseWidth(addToWidth, whichDiv){
  var theDiv = document.getElementById(whichDiv);
  var currWidth = parseInt(getStyle(theDiv, "width"));
  var newWidth = currWidth + parseInt(addToWidth);
  setStyle(whichDiv, "width", newWidth + "px");
}

// addEvent( document.getElementById('foo'), 'click', doSomething );
// addEvent( obj, 'mouseover', function(){ alert('hello!'); } );
function jr_addEvent( obj, type, fn ) {
  if ( obj.attachEvent ) {
    obj['e'+type+fn] = fn;
    obj[type+fn] = function(){obj['e'+type+fn]( window.event );}
    obj.attachEvent( 'on'+type, obj[type+fn] );
  } else
    obj.addEventListener( type, fn, false );
}
function jr_removeEvent( obj, type, fn ) {
  if ( obj.detachEvent ) {
    obj.detachEvent( 'on'+type, obj[type+fn] );
    obj[type+fn] = null;
  } else
    obj.removeEventListener( type, fn, false );
}

//============================================================================
//  getElementsByClass(searchClass,node,tag)
//
//  This function returns an array of elements with class 'searchClass' under node 'node'.
//  It will limit the search to nodes with tag name 'tag' if passed.
//
//  This supports finding a node with class 'searchClass' where the node has multiple classes
//  each separated by a space.
//============================================================================
function getElementsByClass(searchClass,node,tag) {
	var classElements = new Array();
	if ( node == null )
		node = document;
	if ( tag == null )
		tag = '*';
	var els = node.getElementsByTagName(tag);
	var elsLen = els.length;
	var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
	//var pattern = new RegExp("\b"+searchClass+"\b");
	for (i = 0, j = 0; i < elsLen; i++) {
		if ( pattern.test(els[i].className) ) {
			classElements[j] = els[i];
			j++;
		}
	}
	return classElements;
} // getElementsByClass()
