var _____WB$wombat$assign$function_____=function(name){return (self._wb_wombat && self._wb_wombat.local_init && self._wb_wombat.local_init(name))||self[name];};if(!self.__WB_pmw){self.__WB_pmw=function(obj){this.__WB_source=obj;return this;}}{
let window = _____WB$wombat$assign$function_____("window");
let self = _____WB$wombat$assign$function_____("self");
let document = _____WB$wombat$assign$function_____("document");
let location = _____WB$wombat$assign$function_____("location");
let top = _____WB$wombat$assign$function_____("top");
let parent = _____WB$wombat$assign$function_____("parent");
let frames = _____WB$wombat$assign$function_____("frames");
let opens = _____WB$wombat$assign$function_____("opens");
"use strict";

(function(svg) {

    this.svg = function(name, props, place) {
        var dom = document.createElementNS('http://www.w3.org/2000/svg', name);
        for (var i in props) {
            if (i != 'href') dom.setAttributeNS(null, i, props[i]);
            else dom.setAttributeNS('http://www.w3.org/1999/xlink', i, props[i]);
        }
        if (place) place.appendChild(dom);
        return dom;
    }

}).apply(teal.svg = teal.svg || {});

}
/*
     FILE ARCHIVED ON 02:35:51 May 27, 2023 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 00:13:39 Dec 03, 2025.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 1.025
  exclusion.robots: 0.047
  exclusion.robots.policy: 0.028
  esindex: 0.016
  cdx.remote: 6.742
  LoadShardBlock: 131.121 (3)
  PetaboxLoader3.resolve: 85.953 (4)
  PetaboxLoader3.datanode: 92.112 (4)
  load_resource: 91.172
*/
