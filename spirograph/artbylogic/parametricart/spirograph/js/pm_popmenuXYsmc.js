if (document.layers){document.captureEvents(Event.MOUSEMOVE);document.onmousemove=captureMousePosition;}else if(document.all){document.onmousemove=captureMousePosition;}else if(document.getElementById){document.onmousemove=captureMousePosition;}
var xMousePos=0,yMousePos=0,xMousePosMax=0,yMousePosMax=0,yPageOffset=0,xPageOffset=0;
var cyMenu=185;
var flag=1;var selected="";var NS4=(document.layers)?1:0;var IE4=(document.all)?1:0;var ver4=(navigator.appVersion.indexOf("MSIE 4.")>=0);
var agt=navigator.userAgent.toLowerCase();
var is_opera5=(agt.indexOf("opera 5")!= -1 ||agt.indexOf("opera/5")!= -1);
var is_opera6=(agt.indexOf("opera 6")!= -1 ||agt.indexOf("opera/6")!= -1);
function captureMousePosition(e){if(document.documentElement&&document.documentElement.scrollTop){
yPageOffset=document.documentElement.scrollTop;xPageOffset=document.documentElement.scrollLeft;}
else if(document.body){yPageOffset = document.body.scrollTop;xPageOffset = document.body.scrollLeft;}
else{yPageOffset=window.pageYOffset;xPageOffset = window.pageXOffset;}
if(document.layers){xMousePos=e.pageX;yMousePos=e.pageY;xMousePosMax=window.innerWidth+xPageOffset;yMousePosMax=window.innerHeight+yPageOffset;
}else if(document.all){
xMousePos=window.event.x+xPageOffset;
yMousePos=window.event.y+yPageOffset;
xMousePosMax=document.body.clientWidth+xPageOffset;
yMousePosMax=document.body.clientHeight+yPageOffset;
if(is_opera5){xMousePos-=xPageOffset;yMousePos=yMousePos-yPageOffset-yPageOffset;
if(xMousePos<0)xMousePos=0;if(yMousePos<0)yMousePos=0;}
else if(is_opera6){xMousePos-=xPageOffset;yMousePos=yMousePos-yPageOffset;if(xMousePos<0)xMousePos=0;if(yMousePos<0)yMousePos=0;}
}else if(document.getElementById){xMousePos=e.pageX;yMousePos=e.pageY;xMousePosMax=window.innerWidth+xPageOffset;
yMousePosMax=window.innerHeight+yPageOffset;}}
function pm_toggleMenuXY(menuName,xMice,yMice,cyMenuSet){
if (cyMenuSet) cyMenu=cyMenuSet;
if(selected==menuName)pm_clearReset();if(selected!=""){pm_hideMenu(selected);}pm_showMenuXY(menuName,xMice,yMice);selected=menuName;}
function pm_startReset(){flag=1;setTimeout(pm_resetMenu,200);}
function pm_clearReset(){flag=0;}
function pm_yMouse(){return yMousePos;}
function pm_xMouse(){return xMousePos;}
function pm_resetMenu(){if((selected!="")&&(flag==1)){pm_hideMenu(selected);selected="";}}
function pm_showMenuXY(menuName,xMice,yMice){yMouse=yMice;xMouse=xMice;if(NS4){document.layers[menuName].height=cyMenu;document.layers[menuName].top=yMouse;document.layers[menuName].left=xMouse;document.layers[menuName].visibility="show";
}else{if(ver4){document.all[menuName].style.height=cyMenu+"px";document.all[menuName].style.top=yMouse+"px";document.all[menuName].style.left=xMouse+"px";document.all[menuName].style.visibility="visible";}
else{document.getElementById(menuName).style.height=cyMenu+"px";document.getElementById(menuName).style.top=yMouse+"px";document.getElementById(menuName).style.left=xMouse+"px";document.getElementById(menuName).style.visibility="visible";}}}
function pm_hideMenu(menuName){if(NS4){document.layers[menuName].visibility="hide";document.layers[menuName].height="1";
document.layers[menuName].top="25";}else{if(ver4){ document.all[menuName].style.visibility="hidden";document.all[menuName].style.height="1px";
document.all[menuName].style.top="25px";}else{document.getElementById(menuName).style.visibility="hidden";document.getElementById(menuName).style.height="1px";document.getElementById(menuName).style.top="25px";}}}
