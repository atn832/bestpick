define(["logger", "gallery", "imageview", "galleryviewsettings", "svg", "backbone"], function(Logger, Gallery, ImageView, GalleryViewSettings, SVG) {
    var cssBorderWidth = 4;
    var StandardTileSize = 100;
    
    var GalleryView = Backbone.View.extend({
        tagName: "div",
        className: "gallery",
        initialize: function() {
            Logger.log("gv init, model:", this.model);
//            this.model.on("all", function(event) {
//                Logger.log("gv model event:", event);
//                this.render();
//            }.bind(this));
            this.imageViews = {};
            
            this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
            this.svg.setAttribute("version", "1.1");
            this.el.appendChild(this.svg);
            
            if (this.model) {
                this.render();
            }
        },
        render: render,
        setShowSelected: function(b) {
            Logger.log("gv setShowSelected", b);
            this.showSelected = b;
            this.render();
            this.trigger("change:showSelected");
        },
        isShowSelected: function() {
            return this.showSelected;
        },
        zoom: zoom,
        translate: translate,
        prepend: prepend,
        resetTransformation: resetTransformation,
        setTransformation: setTransformation,
        getDisplayedImages: getDisplayedImages
    });

    function render() {
        Logger.log("gallery view render");
        var el = this.el;
        
        this.svg.setAttribute("width", "100%");
        
        // iterate over images
        var gallery = this.model;
        var showSelected = this.isShowSelected();
        var imagesToDisplay = showSelected?
            gallery.get("selectedImages") : gallery.get("images");
        var instance = this;
        var viewsToDisplay = imagesToDisplay.map(function(image) {
            var imageView = getImageElement.call(instance, image);
            return imageView;
        });
        
        var gridSize;
        var gallerySize;
        
        var parentNode = this.el.parentNode;
        if (parentNode) {
            var rect = this.el.parentNode.getBoundingClientRect();
            gallerySize = {
                width: rect.right - rect.left,
                height: rect.bottom - rect.top
            };
        }
        else {
            gallerySize = {
                width: 0,
                height: 0
            }
            return;
        }
        if (showSelected) {
            // respect ratio, fit to screen
            var imageSizes = viewsToDisplay.map(function(imageView) {
                return imageView.getFullSize();
            });
            // stretch
            gridSize = getGridSize(gallerySize, imageSizes);
            var tileSize = getTileSize(gallerySize, gridSize);
            
            viewsToDisplay.forEach(function(imageView) {
                var imageSize = {
                    width: imageView.width,
                    height: imageView.height
                };
                var stretchedSize = getStretchedSize(imageSize, tileSize);
                imageView.setSize(tileSize);
            });
        }
        else {
            // fixed tile size
            gridSize = {
                width: Math.floor(gallerySize.width / StandardTileSize),
                height: 1
            };
            
            // restore hard coded size. should match the css's
            viewsToDisplay.forEach(function(imageView) {
                imageView.setSize({width: StandardTileSize, height: StandardTileSize});
            });
        }
        var displaySettings = {
            gridSize: gridSize,
            gallerySize: gallerySize,
            displayedImages: viewsToDisplay
        };
        
        var isRedrawRequired = !isSame(this.oldDisplaySettings, displaySettings);
        if (!isRedrawRequired) {
            Logger.log("gallery view. render unnecessary");
            return;
        }
        this.oldDisplaySettings = displaySettings;
        
        Logger.log("clear gallery view");
//        Logger.log("grid size" + gridSize);
        el.innerHTML = "";
        var latestRowIndex = -1;
        var row;
        var rowHeight;
        var colWidth;
        if (showSelected) {
            rowHeight = gallerySize.height / gridSize.height;
            colWidth = gallerySize.width / gridSize.width;
        }
        else {
            rowHeight = StandardTileSize;
            colWidth = StandardTileSize;
            // reset scale and translation in displayed tiles
            this.resetTransformation();
        }
        SVG.clear(this.svg);
        viewsToDisplay.forEach(function(imageView, index) {
            var rowIndex = Math.floor(index / gridSize.width);
            var colIndex = index % gridSize.width;
            latestRowIndex = rowIndex;
            
            if (imageView.el.parentNode) {
                imageView.el.parentNode.removeChild(imageView.el);
            }
//            row.appendChild(imageView.el);
            var x = colIndex * colWidth;
            var y = rowIndex * rowHeight;
            
            imageView.el.setAttribute("transform", "translate(" + (colIndex * colWidth) + ", " + (rowIndex * rowHeight) + ")");
            this.svg.appendChild(imageView.el);
        }.bind(this));
        
        var minGalleryHeight = latestRowIndex * StandardTileSize + StandardTileSize;
        if (!showSelected && minGalleryHeight > gallerySize.height) {
            // expand the svg if we're displaying the whole gallery
            this.svg.setAttribute("height", minGalleryHeight);
        }
        else {
            this.svg.setAttribute("height", "100%");
        }
        this.el.appendChild(this.svg);
    }
    
    /**
    * Scales all the displayed images
    * @param s the scale
    * @param cx the X coordinate of the center
    * @param cy the Y coordinate of the center
    **/
    function zoom(s, _cx, _cy) {
        this.getDisplayedImages().forEach(function(image) {
            var size = image.getSize();
            // use the center if center is undefined
            var cx, cy;
            if (_cx === undefined) {
                cx = size.width / 2;
                cy = size.height / 2;
            }
            else {
                cx = _cx;
                cy = _cy;
            }
            var translateMinusC = "translate(" + -cx + ", " + -cy + ")";
            var translateC = "translate(" + cx + ", " + cy + ")";
            image.setTransformation(translateC +
                         " matrix(" + s + ", 0, 0, " + s + ", 0, 0) " +
                         translateMinusC + " " + image.getTransformation());
        });
    }
    
    function translate(dx, dy) {
        this.prepend("translate(" + dx + ", " + dy + ")");
    }
    /**
    * Prepends a SVG transformation to all the displayed images
    **/
    function prepend(transformation) {
        this.getDisplayedImages().forEach(function(image) {
            image.setTransformation(transformation + " " + image.getTransformation());
        });
    }
    
    function setTransformation(transformation) {
        this.getDisplayedImages().forEach(function(image) {
            image.setTransformation(transformation);
        });
    }
    
    function resetTransformation() {
        this.setTransformation("");
    }
    
    function getImageElement(image) {
        var cid = image.cid;
        if (!(cid in this.imageViews)) {
            // make the image element
            this.imageViews[image.cid] = new ImageView({
                model: image
            });
        }
        return this.imageViews[cid];
    }
    
    function getGridSize(gallerySize, imageSizes) {
        Logger.log("getGridSize " + JSON.stringify(gallerySize) + " " + JSON.stringify(imageSizes));
        var maxUsedSize;
        var usedSize;
        
        // default value is used only when no image is displayed
        var bestGridSize = {
            width: Number.POSITIVE_INFINITY,
            height: 1
        };
        for (var gridWidth = 1; gridWidth <= imageSizes.length; gridWidth++) {
            for (var gridHeight = Math.ceil(imageSizes.length / gridWidth); gridHeight <= imageSizes.length; gridHeight++) {
                var gridSize = {
                    width: gridWidth,
                    height: gridHeight
                };
                var tileSize = getTileSize(gallerySize, gridSize);
                
                // compute used size
                usedSize = 0;
                imageSizes.forEach(function(size) {
                    var imageSize = getStretchedSize(size, tileSize);
                    usedSize += imageSize.width * imageSize.height;
                });
                Logger.log(gridWidth + " " + gridHeight + " " + usedSize);
                if (!maxUsedSize || usedSize > maxUsedSize) {
                    bestGridSize = gridSize;
                    maxUsedSize = usedSize;
                }
            }
        }
        return bestGridSize;
    }
    
    function getTileSize(bounds, gridSize) {
        var gridWidth = gridSize.width;
        var gridHeight = gridSize.height;
        var tileSize = {
            width: bounds.width / gridWidth - 2 * cssBorderWidth,
            height: bounds.height / gridHeight - 2 * cssBorderWidth
        }
        return tileSize;
    }
    
    // returns the size of the image stretched to fit within some bounds
    function getStretchedSize(size, tileSize) {
        var imageRatio = size.width / size.height;
        // fit width
        var imageSize = {
            width: tileSize.width,
            height: tileSize.width / imageRatio
        };
        // fit height
        var scale = Math.min(1, tileSize.height / imageSize.height);
        imageSize.width *= scale;
        imageSize.height *= scale;
        return imageSize;
    }
    
    function getDisplayedImages() {
        if (!this.oldDisplaySettings ||
            !this.oldDisplaySettings.displayedImages)
            return [];
        
        return this.oldDisplaySettings.displayedImages;
    }

    function isSame(displaySettings, oldDisplaySettings) {
        if (!oldDisplaySettings && displaySettings ||
            oldDisplaySettings && !displaySettings)
            return false;
        if (!oldDisplaySettings && !displaySettings)
            return true;
        
        var isSameGridSize = displaySettings.gridSize.width === oldDisplaySettings.gridSize.width &&
            displaySettings.gridSize.height === oldDisplaySettings.gridSize.height;
        var isSameGallerySize = displaySettings.gallerySize.width === oldDisplaySettings.gallerySize.width &&
            displaySettings.gallerySize.height === oldDisplaySettings.gallerySize.height;
        var arraysIdentical = areArraysIdentical(displaySettings.displayedImages, oldDisplaySettings.displayedImages);
        var r = // compare grid size
            isSameGridSize &&
            // compare gallery size
            isSameGallerySize &&
            arraysIdentical;
        return r;
    }
    
    function areArraysIdentical(a1, a2) {
        return a1 === a2 ||
            a1.length === a2.length &&
            a1.every(function(obj, index) {
                return obj === a2[index];
            });
    }
    
    return GalleryView;
});
