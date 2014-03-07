define(function() {
    function createRectangle(x, y, width, height) {
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    }
    
    function getRight(r) {
        return r.x + r.width;
    }
    
    function getBottom(r) {
        return r.y + r.height;
    }
    
    /**
    * Intersects two rectangles
    **/
    function getIntersection(r1, r2) {
        var r = {
            x: Math.max(r1.x, r2.x),
            y: Math.max(r1.y, r2.y)
        }
        r.width = Math.max(0, Math.min(getRight(r1), getRight(r2)) - r.x);
        r.height = Math.max(0, Math.min(getBottom(r1), getBottom(r2)) - r.y);
        if (r.width === 0 || r.height === 0)
            return null;
        return r;
    }
    
    return {
        getIntersection: getIntersection,
        getRight: getRight,
        getBottom: getBottom,
        createRectangle: createRectangle
    }
});