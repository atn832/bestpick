/**
* Returns a SVG context to expose factory methods for matrices, etc.
**/
define(function() {
    var svg;
    function getSVG() {
        if (!svg) {
            svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
            svg.setAttribute("version", "1.1");
        }
        return svg;
    }

    return getSVG();
});