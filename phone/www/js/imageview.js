/**
* Implementation of an ImageView. It displays an Image whose url is assumed to be static (for simplicity)
**/
define(["logger", "util", "promise", "imageprocessor", "job", "filesystem", "transformation", "rectangle", "svg", "imagemetadata", "backbone"], function(Logger, Util, Promise, ImageProcessor, Job, FileSystem, Transformation, Rectangle, SVG, ImageMetadata) {
    var fullResolutionGenerationTimeout = 500;
    var BigThumbnailPixelSize = 500; // ideally this could be dynamically computed depending on the device's capabilities
    var SmallThumbnailPixelSize = 100; // ideally this could be dynamically computed depending on the device's capabilities
    var id = 0;
    var ImageView = Backbone.View.extend({
        tagName: "span",
        className: "galleryImage",
        initialize: function() {
            this.id = id++;
//            this.listenTo(this.model, "change", this.render);
            this.model.on("all", function(event) {
//                Logger.log("iv model changed", event);
                this.render();
            }.bind(this));
            
            if (this.attributes && this.attributes.thumbnailUpdateEnabled) {
                this.setThumbnailUpdateEnabled(true);
            }

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
            
            var instance = this;
            this.metadataPromise = new Promise(function(resolveMain, reject) {
                Logger.log("enqueuing job: metadata request");
                function getMetadata(resolve, reject) {
                    instance.getFullImagePromise().then(function(fullImage) {
                        Logger.log("metadata promise");
                        var metadata = new ImageMetadata();
                        metadata.set(ImageMetadata.Keys.FullSize, {
                            width: fullImage.width,
                            height: fullImage.height
                        });
                        var cover = !instance.isThumbnailUpdateEnabled();
                        var size = instance.getThumbnailSize();
                        var thumbnailURI = resizeImage(fullImage, size.width, size.height, cover);
                        metadata.set(ImageMetadata.Keys.ThumbnailURI, thumbnailURI);
                        resolveMain(metadata);
                        resolve();
                    }, Util.onRejected);
                }
                try {
                    ImageProcessor.getInstance().getQueue().enqueue(new Job({
                        priority: Job.Priority.High + (instance.isThumbnailUpdateEnabled()? 2: 0),
                        f: getMetadata
                    }));
                }
                catch(e) {
                    Logger.log("exception enqueuing metadata request", e);
                }
            });
            
            // Set up fixed resolution image
            // we don't need the result.
            // just make sure the next thumbnail generation is done after the previous one is done
            this.metadataPromise.then(function(metadata) {
                Logger.log("metadatapromise done, ready for thumbnail");
                var thumbnailURI = metadata.get(ImageMetadata.Keys.ThumbnailURI);
                instance.image.setAttributeNS('http://www.w3.org/1999/xlink','href', thumbnailURI);
            });

            this.setVisible(true);
            
            this.render();
        },
        render: function() {
            var image = this.model;
            if (image) {
                this.tileBorder.classList.add("tile");
                this.tileBorder.classList.toggle("selected", image.get("isSelected"));
                this.tileBorder.classList.toggle("favorite", image.get("isFavorite"));
                
                // from http://www.eccesignum.org/blog/solving-display-refreshredrawrepaint-issues-in-webkit-browsers
                this.tileBorder.style.display='none';
                this.tileBorder.offsetHeight; // no need to store this anywhere, the reference is enough
                this.tileBorder.style.display='block';
            }
        },
        setThumbnailUpdateEnabled: function(enabled) {
            this.thumbnailUpdateEnabled = enabled;
        },
        isThumbnailUpdateEnabled: function() {
            return this.thumbnailUpdateEnabled;
        },
        /**
        * Returns a promise for the size of the full resolution image
        **/
        getFullSizePromise: function() {
            return this.metadataPromise.then(function(metadata) {
                return metadata.get(ImageMetadata.Keys.FullSize);
            });
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
        getThumbnailSize: function() {
            var size = this.isThumbnailUpdateEnabled()? BigThumbnailPixelSize: SmallThumbnailPixelSize;
            return {
                width: size,
                height: size
            };
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
            if (!this.isThumbnailUpdateEnabled()) {
                return;
            }
            if (this.timer)
                clearTimeout(this.timer);
            if (this.currentJob) {
                ImageProcessor.getInstance().getQueue().remove(this.currentJob);
                this.currentJob = null;
            }
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
                    var instance = this;
                    var newJob = new Job({
                        priority: Job.Priority.Low + (this.isThumbnailUpdateEnabled()? 2: 0),
                        f: generateSubtile
                    });
                    function generateSubtile(resolve, reject) {
                        console.log("generate subtile");
                        Promise.all([instance.getFullImagePromise(), instance.getFullSizePromise()]).then(function(results) {
                            var fullImage = results[0];
                            var fullSize = results[1];
                            var fit = Transformation.getFitMatrix(fullSize, instance.getSize());
                            var modelToDevice = m.multiply(fit);

                            var thumbnailURI = getSubImage(fullImage, instance.getSize(), modelToDevice);
                            // only update the image if no new job has taken over this one
                            if (instance.currentJob === newJob) {
                                instance.fullResolutionImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', thumbnailURI);
                                instance.currentJob = null;
                            }
                            resolve();
                        });
                    }
                    newJob.set("f", generateSubtile);
                    Logger.log("enqueuing job: generate subtile");
                    this.currentJob = newJob;
                    ImageProcessor.getInstance().getQueue().enqueue(this.currentJob);

                }.bind(this), fullResolutionGenerationTimeout);
        },
        getFullImagePromise: function() {
            return new Promise(function(resolve) {
                try {
                    var image = this.model;
                    var fullImage = document.createElement("img");
                    fullImage.onload = function() {
                        resolve(fullImage);
                    };
                    var url = image.get("url");
                    Logger.log(this.id, "setting fullimage on img", url);
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
    * @param cover if false, will do contain instead
    **/
    function resizeImage(srcImageObject, width, height, cover) {
        Logger.log("resizeImage, cover" + cover + "," + width + "," + height);
        var newWidth = width;
        var newHeight = height;
    
        // Calculate a new scale
        // The new scale will be the max of the two possible scales
        
        var scale = cover?
            Math.max(newWidth / srcImageObject.width, newHeight / srcImageObject.height) :
            Math.min(newWidth / srcImageObject.width, newHeight / srcImageObject.height);
        
        // New canvas
        var dst_canvas = document.createElement('canvas');
        if (cover) {
            dst_canvas.width = width;
            dst_canvas.height = height;
        }
        else {
            dst_canvas.width = scale * srcImageObject.width;
            dst_canvas.height = scale * srcImageObject.height;
        }
    
        // Draw Image content in canvas
        var dst_ctx = dst_canvas.getContext('2d');
        // Center the image if it is cropped:
        // translate by -(scaled size - output size) / 2
        var dx = -(srcImageObject.width * scale - dst_canvas.width) / 2;
        var dy = -(srcImageObject.height * scale - dst_canvas.height) / 2;
        dst_ctx.drawImage(srcImageObject, dx, dy, srcImageObject.width * scale, srcImageObject.height * scale);

        // Replace source of Image
        return dst_canvas.toDataURL();
    }
    
    /**
    * @param matrix matrix of the full transformation from src image size to device (ie it also contains fit transformation in it)
    **/
    function getSubImage(srcImageObject, thumbnailSize, matrix) {
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