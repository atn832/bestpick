/**
* Implementation of an ImageView. It displays an Image whose url is assumed to be static (for simplicity)
**/
define(["logger", "util", "promise", "filesystem", "transformation", "rectangle", "svg", "backbone"], function(Logger, Util, Promise, FileSystem, Transformation, Rectangle, SVG) {
    var fullResolutionGenerationTimeout = 500;
    var thumbnailPixelSize = 500; // ideally this could be dynamically computed depending on the device's capabilities
    
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
                    <image> <-- full resolution piece of image
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
            this.fullResolutionImage = document.createElementNS("http://www.w3.org/2000/svg", "image");
            this.g.setAttribute("clip-path", "url(#" + this.clipID + ")");
            this.g.appendChild(this.image);
            this.clipPath.appendChild(this.clipRect);
            this.el.appendChild(this.clipPath);
            this.el.appendChild(this.tileBackground);
            this.el.appendChild(this.g);
            this.el.appendChild(this.fullResolutionImage);
            this.el.appendChild(this.tileBorder);
            this.transformation = "";
            
            // image contains some lower resolution image
            // fullResolutionImage contains the full resolution piece of picture
            
            /*
            * Set up attributes for interaction.
            * a user click will intersect either the tile or the image
            */
            var image = this.model;
            this.image.model = image;
            this.fullResolutionImage.model = image;
            this.tileBackground.model = image;
            this.image.view = this;
            this.fullResolutionImage.view = this;
            this.tileBackground.view = this;
            
            this.width = 0;
            this.height = 0;
            this.fullImageSizePromise = this.getFullImagePromise().then(function(fullImage) {
                Logger.log("fullsize promise");
                return {
                    width: fullImage.width,
                    height: fullImage.height
                };
            }, Util.onRejected);
            
            // Set up fixed resolution image
            // we don't need the result.
            // just make sure the next thumbnail generation is done after the previous one is done
            this.getFullImagePromise().then(function(fullImage) {
                var thumbnailURI = resizeImage(fullImage, thumbnailPixelSize, thumbnailPixelSize);
                this.image.setAttributeNS('http://www.w3.org/1999/xlink','href', thumbnailURI);
            }.bind(this));
            
            this.setVisible(true);
            
            this.render();
        },
        render: function() {
            Logger.log("image.render", this.model.get("url"));
            var image = this.model;
            if (image) {
                var instance = this;
                
                var className = "tile ";
                // Note: as of Jan 2014, JQuery's addClass and removeClass
                // will not support SVG
                if (image.get("isSelected"))
                    className += "selected ";
                if (image.get("isFavorite"))
                    className += "favorite ";
                
                if (!this.isVisible()) {
                    Logger.log("hidden");
                    this.el.setAttribute("class", "hidden");
                }
                else {
                    Logger.log("visible");
                    this.el.setAttribute("class", "");
                }
                //Logger.log("classname:" + className);
                if (className !== this.className) {
                    this.className = className;
                    this.tileBorder.setAttribute("class", className);
                }
            }
        },
        /**
        * Returns a promise for the size of the full resolution image
        **/
        getFullSizePromise: function() {
            return this.fullImageSizePromise;
        },
        /**
        * Returns the tile size
        **/
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
            this.fullResolutionImage.setAttribute("width", size.width);
            this.fullResolutionImage.setAttribute("height", size.height);
            this.clipRect.setAttribute("width", size.width);
            this.clipRect.setAttribute("height", size.height);
            this.tileBorder.setAttribute("width", size.width);
            this.tileBorder.setAttribute("height", size.height);
            this.tileBackground.setAttribute("width", size.width);
            this.tileBackground.setAttribute("height", size.height);
            
            this.requestThumbnailUpdate();
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
            
            this.requestThumbnailUpdate();
        },
        /**
        * @returns the bounding rectangle of the tile
        **/
        getBoundingClientRect: function() {
            // cannot return this.el as the calculation returns the bounds
            // as if the image was not clipped
            return this.tileBorder.getBoundingClientRect();
        },
        requestThumbnailUpdate: function() {
            if (this.timer)
                clearTimeout(this.timer);

            // clear full resolution image (using a small transparent image)
            this.fullResolutionImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw== ");

            this.timer = setTimeout(
                function() {
                    // regenerate full resolution tile
                    var consolidatedTransform = this.image.transform.baseVal.consolidate();
                    // returns null when transform is empty
                    var m;
                    if (consolidatedTransform)
                        m = consolidatedTransform.matrix;
                    else 
                        m = SVG.SVGSVGElement.createSVGMatrix();

                    // no skewing, no rotation
                    Promise.all([this.getFullImagePromise(), this.getFullSizePromise()]).then(function(results) {
                        var fullImage = results[0];
                        var fullSize = results[1];
                        var fit = Transformation.getFitMatrix(fullSize, this.getSize());
                        var modelToDevice = m.multiply(fit);

                        var thumbnailURI = getSubImage(fullImage, this.getSize(), modelToDevice);
                        this.fullResolutionImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', thumbnailURI);
                    }.bind(this));
                }.bind(this), fullResolutionGenerationTimeout);
        },
        getFullImagePromise: function() {
//            if (!this.fullImagePromise) {
//                this.fullImagePromise = new Promise(function(resolve) {
                return new Promise(function(resolve) {
                    try {
                        var image = this.model;
                        var fullImage = document.createElement("img");
                        fullImage.onload = function() {
                            resolve(fullImage);
                        };
                        var url = image.get("url");
                        Logger.log("setting fullimage on img", url);
                        var uri = FileSystem.getInstance().getDataURI(url);
                        uri.then(function(uri) {
                            Logger.log("setting fullimage", url);
                            fullImage.src = uri;
                        });
                    }
                    catch (e) {
                        Logger.log(e);
                    }
                }.bind(this));
//            }
//            return this.fullImagePromise;
        },
        setVisible: function(isVisible) {
            if (this.visible === isVisible)
                return;
            
            this.visible = isVisible;
            this.render();
        },
        isVisible: function() {
            return this.visible;
        }
    });
    
    /**
    * Resize an image and return the resized image's data URI
    **/
    function resizeImage(srcImageObject, width, height) {
        Logger.log("resizeImage" + width + "," + height);
        var newWidth = width;
        var newHeight = height;
    
        // Calculate a new scale
        // The new scale will be the minimum of the two possible scales
        var scale = Math.min(newWidth / srcImageObject.width, newHeight / srcImageObject.height);
        
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
    
    /**
    * @param matrix matrix of the full transformation from src image size to device (ie it also contains fit transformation in it)
    **/
    function getSubImage(srcImageObject, thumbnailSize, matrix) {
        Logger.log("get sub image");
        // New canvas
        var dst_canvas = document.createElement('canvas');
        dst_canvas.width = thumbnailSize.width;
        dst_canvas.height = thumbnailSize.height;
        
        // full size
        var fullSize = {
            width: srcImageObject.width,
            height: srcImageObject.height
        };
        
        var devImageRect = Transformation.transform(fullSize, matrix);
        
        var thumbnailRect = {
            x: 0,
            y: 0,
            width: thumbnailSize.width,
            height: thumbnailSize.height
        };
        var destRect = Rectangle.getIntersection(devImageRect, thumbnailRect);
        
        var sourceRect = Transformation.transform(destRect, matrix.inverse());
        // Draw Image content in canvas
        var dst_ctx = dst_canvas.getContext('2d');
        dst_ctx.drawImage(srcImageObject,
                        sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height,    // source
                        destRect.x, destRect.y, destRect.width, destRect.height);           // destination
    
        // Replace source of Image
        return dst_canvas.toDataURL();
    }
    
    return ImageView;
});