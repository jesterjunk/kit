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

window.teal = {};
window.$t = window.teal;

teal.copyto = function(obj, res) {
    if (obj == null || typeof obj !== 'object') return obj;
    if (obj instanceof Array) {
        for (var i = obj.length - 1; i >= 0; --i)
            res[i] = $t.copy(obj[i]);
    }
    else {
        for (var i in obj) {
            if (obj.hasOwnProperty(i))
                res[i] = $t.copy(obj[i]);
        }
    }
    return res;
}

teal.copy = function(obj) {
    if (!obj) return obj;
    return teal.copyto(obj, new obj.constructor());
}

teal.element = function(name, props, place, content) {
    var dom = document.createElement(name);
    if (props) for (var i in props) dom.setAttribute(i, props[i]);
    if (place) place.appendChild(dom);
    if (content !== undefined) $t.inner(content, dom);
    return dom;
}

teal.inner = function(obj, sel) {
    sel.appendChild(obj.nodeName != undefined ? obj : document.createTextNode(obj));
    return sel;
}

teal.id = function(id) {
    return document.getElementById(id);
}

teal.set = function(sel, props) {
    for (var i in props) sel.setAttribute(i, props[i]);
    return sel;
}

teal.clas = function(sel, oldclass, newclass) {
    var oc = oldclass ? oldclass.split(/\s+/) : [],
        nc = newclass ? newclass.split(/\s+/) : [],
        classes = (sel.getAttribute('class') || '').split(/\s+/);
    if (!classes[0]) classes = [];
    for (var i in oc) {
        var ind = classes.indexOf(oc[i]);
        if (ind >= 0) classes.splice(ind, 1);
    }
    for (var i in nc) {
        if (nc[i] && classes.indexOf(nc[i]) < 0) classes.push(nc[i]);
    }
    sel.setAttribute('class', classes.join(' '));
}

teal.empty = function(sel) {
    if (sel.childNodes)
        while (sel.childNodes.length)
            sel.removeChild(sel.firstChild);
}

teal.remove = function(sel) {
    if (sel) {
        if (sel.parentNode) sel.parentNode.removeChild(sel);
        else for (var i = sel.length - 1; i >= 0; --i)
            sel[i].parentNode.removeChild(sel[i]);
    }
}

teal.bind = function(sel, eventname, func, bubble) {
    if (!sel) return;
    if (eventname.constructor === Array) {
        for (var i in eventname)
            sel.addEventListener(eventname[i], func, bubble ? bubble : false);
    }
    else
        sel.addEventListener(eventname, func, bubble ? bubble : false);
}

teal.unbind = function(sel, eventname, func, bubble) {
    if (eventname.constructor === Array) {
        for (var i in eventname)
            sel.removeEventListener(eventname[i], func, bubble ? bubble : false);
    }
    else
        sel.removeEventListener(eventname, func, bubble ? bubble : false);
}

teal.one = function(sel, eventname, func, bubble) {
    var one_func = function(e) {
        func.call(this, e);
        teal.unbind(sel, eventname, one_func, bubble);
    };
    teal.bind(sel, eventname, one_func, bubble);
}

teal.raise_event = function(sel, eventname, bubble, cancelable) {
    var evt = document.createEvent('UIEvents');
    evt.initEvent(eventname, bubble == undefined ? true : bubble,
            cancelable == undefined ? true : cancelable);
    sel.dispatchEvent(evt);
}

teal.raise = function(sel, eventname, params, bubble, cancelable) {
    var ev = document.createEvent("CustomEvent");
    ev.initCustomEvent(eventname, bubble, cancelable, params);
    sel.dispatchEvent(ev);
}

if (!document.getElementsByClassName) {
    teal.get_elements_by_class = function(classes, node) {
        var node = node || document,
            list = node.getElementsByTagName('*'),
            cl = classes.split(/\s+/),
            result = [];

        for (var i = list.length - 1; i >= 0; --i) {
            for (var j = cl.length - 1; j >= 0; --j) {
                var clas = list[i].getAttribute('class');
                if (clas && clas.search('\\b' + cl[j] + '\\b') != -1) {
                    result.push(list[i]);
                    break;
                }
            }
        }
        return result;
    }
}
else {
    teal.get_elements_by_class = function(classes, node) {
        return (node || document).getElementsByClassName(classes);
    }
}

teal.rpc = function(params, callback, noparse) {
    var ajax = new XMLHttpRequest();
    ajax.open("post", 'f', true);
    ajax.onreadystatechange = function() {
        if (ajax.readyState == 4)
            callback.call(ajax, noparse ? ajax.responseText : JSON.parse(ajax.responseText));
    };
    ajax.send(JSON.stringify(params));
}

teal.uuid = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

teal.get_url_params = function() {
    var params = window.location.search.substring(1).split("&");
    var res = {};
    for (var i in params) {
        var keyvalue = params[i].split("=");
        res[keyvalue[0]] = decodeURI(keyvalue[1]);
    }
    return res;
}

teal.get_mouse_coords = function(ev) {
    var touches = ev.changedTouches;
    if (touches) return { x: touches[0].clientX, y: touches[0].clientY };
    return { x: ev.clientX, y: ev.clientY };
}

teal.deferred = function() {
    var solved = false, callbacks = [], args = [];
    function solve() {
        while (callbacks.length) {
            callbacks.shift().apply(this, args);
        }
    }
    return {
        promise: function() {
            return {
                then: function(callback) {
                    var deferred = teal.deferred(), promise = deferred.promise();
                    callbacks.push(function() {
                        var res = callback.apply(this, arguments);
                        if (res && 'done' in res) res.done(deferred.resolve);
                        else deferred.resolve.apply(this, arguments);
                    });
                    return promise;
                },
                done: function(callback) {
                    callbacks.push(callback);
                    if (solved) solve();
                    return this;
                },
                cancel: function() {
                    callbacks = [];
                }
            };
        },
        resolve: function() {
            solved = true;
            args = Array.prototype.slice.call(arguments, 0);
            solve();
        }
    };
}

teal.when = function(promises) {
    var deferred = teal.deferred();
    var count = promises.length, ind = 0;
    if (count == 0) deferred.resolve();
    for (var i = 0; i < count; ++i) {
        promises[i].done(function() {
            if (++ind == count) deferred.resolve();
        });
    }
    return deferred.promise();
}


}
/*
     FILE ARCHIVED ON 02:35:51 May 27, 2023 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 00:13:42 Dec 03, 2025.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 0.917
  exclusion.robots: 0.04
  exclusion.robots.policy: 0.025
  esindex: 0.015
  cdx.remote: 7.928
  LoadShardBlock: 2877.533 (3)
  PetaboxLoader3.resolve: 2772.567 (4)
  PetaboxLoader3.datanode: 185.869 (4)
  load_resource: 130.162
*/
