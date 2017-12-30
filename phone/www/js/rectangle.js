define(["logger"], function(Logger) {
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

    function getIntegerRectangle(r, bounds) {
        const x = Math.max(0, Math.round(r.x));
        const y = Math.max(0, Math.round(r.y));
        const width = Math.min(Math.max(0, Math.round(r.width)), bounds.width - x);
        const height = Math.min(Math.max(0, Math.round(r.height)), bounds.height - y);
        Logger.log(JSON.stringify(r));
        const result = createRectangle(
          x,
          y,
          width,
          height);
        Logger.log(JSON.stringify(result));
        return result;
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
        getIntegerRectangle: getIntegerRectangle,
        getRight: getRight,
        getBottom: getBottom,
        createRectangle: createRectangle
    }
});
