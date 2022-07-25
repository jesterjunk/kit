var fadeTimer;

/*  Fade the background of an element from (by default) yellow to white (only works for browsers that support rgb)
    @public
    @param object el DOM element
    @param string color RGB color
    @requires jQuery
    @return void
*/
function fadeIt(el, color) {
    var diffs;
    
    color = color || { r : 242, g : 206, b : 68 }; // yellow
    diffs = {
        r : Math.ceil((255 - color.r) / 10),
        g : Math.ceil((255 - color.g) / 10),
        b : Math.ceil((255 - color.b) / 10)
    };
    
    function color2rgb(color) {
        return 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
    }
    
    function setColor(rgb) {
        $(el).css({ background : rgb });
    }
    
    function fade(color) {
        clearTimeout(fadeTimer);
        
        color.r += diffs.r;
        color.g += diffs.g;
        color.b += diffs.b;
        
        if (color.r > 255) color.r = 255;
        if (color.g > 255) color.g = 255;
        if (color.b > 255) color.b = 255;
        
        setColor(color2rgb(color));
        
        if (color.r < 255 || color.g < 255 || color.b < 255) {
            fadeTimer = setTimeout(function () {
                fade(color);
/*             }, 100); */
            }, 50);
        }
    }
    
    setColor(color2rgb(color));
    fade(color);
}