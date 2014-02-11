define(["svg"], function(SVG) {    
    return {
        transform: function (rect, m) {
            var x = rect.x === undefined? 0: rect.x;
            var y = rect.y === undefined? 0: rect.y;
            var width = rect.width === undefined? 0: rect.width;
            var height = rect.height === undefined? 0: rect.height;

            return {
                x: m.a * x + m.e,
                y: m.d * y + m.f,
                width: m.a * width,
                height: m.d * height
            }
        },
        getFitMatrix: function (fullSize, thumbnailSize) {
            var fitWidth = thumbnailSize.width / fullSize.width;
            var fitHeight = thumbnailSize.height / fullSize.height;
            var scale = Math.min(fitWidth, fitHeight);

            var renderedThumbnailSize = {
                width: scale * fullSize.width,
                height: scale * fullSize.height
            };

            //center
            var dx = (thumbnailSize.width - renderedThumbnailSize.width) / 2;
            var dy = (thumbnailSize.height - renderedThumbnailSize.height) / 2;

            var m = SVG.SVGSVGElement.createSVGMatrix();
            m.a = scale;
            m.d = scale;
            m.e = dx;
            m.f = dy;
            return m;
        }
    }
});