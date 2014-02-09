define(["logger", "q"], function(Logger, Q) {
    var ImageView = Backbone.View.extend({
        tagName: "span",
        className: "galleryImage",
        initialize: function() {
//            this.listenTo(this.model, "change", this.render);
            this.model.on("all", function(event) {
//                Logger.log("iv model changed", event);
                this.render();
            }.bind(this));

            /*
                the DOM will look like this:
                <g transform="translate(...)">
                    <clipPath id=clipID>
                        <rect .../>
                    </clipPath>
                    <rect> <-- background
                    <g clip-path=url(clipID)>
                        <image transform="matrix(...)">
                    </g>
                    <rect> <-- border
                </g>
            */
            
            var instance = this;
            this.el = document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
            this.clipID = _.uniqueId("clip");
            this.clipPath.setAttribute("id", this.clipID);
            
            this.clipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            
            this.tileBackground = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            this.tileBackground.setAttribute("class", "background");
            
            this.tileBorder = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            this.tileBorder.setAttribute("clip-path", "url(#" + this.clipID + ")");
            
            this.image = document.createElementNS("http://www.w3.org/2000/svg", "image");
//            this.fullResolutionImage = document.createElementNS("http://www.w3.org/2000/svg", "image");
            this.g.setAttribute("clip-path", "url(#" + this.clipID + ")");
            this.g.appendChild(this.image);
            this.clipPath.appendChild(this.clipRect);
            this.el.appendChild(this.clipPath);
            this.el.appendChild(this.tileBackground);
            this.el.appendChild(this.g);
//            this.el.appendChild(this.fullResolutionImage);
            this.el.appendChild(this.tileBorder);
            this.transformation = "";
            
            // image contains some lower resolution image
            // fullResolutionImage contains the full resolution piece of picture
            
            this.render();
        },
        render: function() {
//            Logger.log("image.render", this.model.get("url"));
            var image = this.model;
            if (image) {
                var instance = this;
                
                if (this.url !== image.get("url")) {
                    this.url = image.get("url");
                    console.log("setting url", this.url);
//                    this.image.setAttributeNS('http://www.w3.org/1999/xlink','href', this.url);
                    
                    this.fullImage = document.createElement("img");
                    this.fullImage.onload = function() {
                        instance.width = instance.fullImage.width;
                        instance.height = instance.fullImage.height;
                        
                        var size = instance.getSize();
                        var thumbnailURI = resizeImage(instance.fullImage, size.width, size.height);
                        instance.image.setAttributeNS('http://www.w3.org/1999/xlink','href', thumbnailURI);
                        this.thumnailURI = thumbnailURI;
                    };
                    this.fullImage.src = this.url;
                }
                
                if (this.el.model !== image) {
                    // a user click will intersect either the tile or the image
                    this.image.model = image;
                    this.tileBackground.model = image;
                    this.image.view = this;
                    this.tileBackground.view = this;
                }
                
                var className = "tile ";
                // Note: as of Jan 2014, JQuery's addClass and removeClass
                // will not support SVG
                if (image.get("isSelected"))
                    className += "selected ";
                if (image.get("isFavorite"))
                    className += "favorite ";
                
                //Logger.log("classname:" + className);
                if (className !== this.className) {
                    this.className = className;
                    this.tileBorder.setAttribute("class", className);
                }
            }
        },
        getSize: function() {
            return this.size;
        },
        setSize: function(size) {
            if (this.size &&
                this.size.width === size.width &&
                this.size.height === size.height)
                return;
            
            this.size = size;
            this.image.setAttribute("width", size.width);
            this.image.setAttribute("height", size.height);
            this.clipRect.setAttribute("width", size.width);
            this.clipRect.setAttribute("height", size.height);
            this.tileBorder.setAttribute("width", size.width);
            this.tileBorder.setAttribute("height", size.height);
            this.tileBackground.setAttribute("width", size.width);
            this.tileBackground.setAttribute("height", size.height);
            
            // resize the displayed image
//            resizeImage(this.fullResImg, this.el, width, Number.POSITIVE_INFINITY);
            
//             quick test
//            if (size.width === 100) {
//                if (this.thumbnailURI)
//                    this.image.setAttributeNS('http://www.w3.org/1999/xlink','href', this.thumbnailURI);
//            }
//            else {
//                this.image.setAttributeNS('http://www.w3.org/1999/xlink','href', this.url);
//            }
        },
        // returns the current size, not the max one...
        getWidth: function() {
            return this.width;
        },
        getHeight: function() {
            return this.height;
        },
        getTransformation: function() {
            return this.transformation;
        },
        setTransformation: function(t) {
            this.transformation = t;
            this.image.setAttribute("transform", t);

            // merges the whole transformation chain into just one
            var consolidatedTransform = this.image.transform.baseVal.consolidate();
            // returns null when transform is empty
            if (!consolidatedTransform)
                return;
            var m = consolidatedTransform.matrix;
            
            var strmatrix = "matrix(" + m.a + ", " + m.c + ", " + m.b + ", " + m.d + ", " + m.e + ", " + m.f + ")";
            this.image.setAttribute("transform", strmatrix);
            
            this.resizeRequired = true;
            if (this.timer)
                clearTimeout(this.timer);
            this.timer = setTimeout(
                function() {
                    console.log("resizing");
//                    if (!this.resizeRequired)
//                        return;

                    var consolidatedTransform = this.image.transform.baseVal.consolidate();
                    // returns null when transform is empty
                    var m;
                    if (consolidatedTransform)
                        m = consolidatedTransform.matrix;
                    else 
                        m = new SVGMatrix().matrix;

                    // no skewing, no rotation
                    var size = {
                        width: Math.round(m.a * this.getSize().width),
                        height: Math.round(m.d * this.getSize().height)
                    };
                    var imageBounds = this.image.getBoundingClientRect();
                    console.log("resizing to", size.width, size.height);
//                    if (Math.abs(imageBounds.width - size.width) < 1 &&
//                        Math.abs(imageBounds.height - size.height) < 1) {
//                        return;
//                    }

                    var thumbnailURI = resizeImage(this.fullImage, size.width, size.height);
                    this.image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', thumbnailURI);
//                    this.image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.url);
                    this.resizeRequired = false;
                }.bind(this), 1000);
        },
        /**
        * @returns {Rectangle} bounds
        **/
        getBounds: function() {
            return this.bounds;
        },
        /**
        * @param {Rectangle} b bounds
        **/
        setBounds: function(b) {
            this.bounds = b;
        },
        /**
        * @returns the bounding rectangle of the tile
        **/
        getBoundingClientRect: function() {
            // cannot return this.el as the calculation returns the bounds
            // as if the image was not clipped
            return this.tileBorder.getBoundingClientRect();
        }
    });
    
    /**
    * Resize an image and return the resized image's data URI
    **/
    function resizeImage(srcImageObject, width, height) {
//        Logger.log("resizeImage" + width + "," + height);
        var newWidth = width;
        var newHeight = height;
    
        // Calculate a new scale
        // The new scale will be the minimum of the two possible scales
        var scale = Math.min((newWidth / srcImageObject.width), (newHeight / srcImageObject.height));
//        Logger.log("scale" + scale);
        
        // New canvas
        var dst_canvas = document.createElement('canvas');
        dst_canvas.width = srcImageObject.width * scale;
        dst_canvas.height = srcImageObject.height * scale;
    
        // Draw Image content in canvas
        var dst_ctx = dst_canvas.getContext('2d');
        dst_ctx.drawImage(srcImageObject, 0, 0, parseInt(srcImageObject.width * scale), parseInt(srcImageObject.height * scale));
    
        // Replace source of Image
        return dst_canvas.toDataURL();
    }
    
    return ImageView;
});