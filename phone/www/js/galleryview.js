define(["logger", "gallery", "imageview"], function(Logger, Gallery, ImageView) {
    var cssBorderWidth = 4;
    
    var GalleryView = Backbone.View.extend({
        tagName: "div",
        className: "gallery",
        initialize: function() {
            Logger.log("gv init, model:", this.model);
            this.model.on("all", function(event) {
                Logger.log("gv model event:", event);
                this.render();
            }.bind(this));
            this.imageViews = {};
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
        }
    });

    function render() {
        Logger.log("gallery view render");
        var el = this.el;
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
        }
        if (showSelected) {
            var imageSizes = viewsToDisplay.map(function(imageView) {
                return {
                    width: imageView.getWidth(),
                    height: imageView.getHeight()
                }
            });
            Logger.log(imageSizes);
            // stretch
            gridSize = getGridSize(gallerySize, imageSizes);
            var tileSize = getTileSize(gallerySize, gridSize);
            
            viewsToDisplay.forEach(function(imageView) {
                var imageSize = {
                    width: imageView.width,
                    height: imageView.height
                };
                var stretchedSize = getStretchedSize(imageSize, tileSize);
                imageView.setMaxWidth(stretchedSize.width);
            });
        }
        else {
            gridSize = {
                width: Number.POSITIVE_INFINITY,
                height: 1
            };
            
            // restore hard coded size. should match the css's
            viewsToDisplay.forEach(function(imageView) {
                imageView.setMaxWidth(100);
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
        el.innerHTML = "";
        var currentRowIndex = -1;
        var row;
        viewsToDisplay.forEach(function(imageView, index) {
            var rowIndex = Math.floor(index / gridSize.width);
            if (rowIndex > currentRowIndex) {
                row = document.createElement("div");
                el.appendChild(row);
                currentRowIndex = rowIndex;
            }
            
            if (imageView.el.parentNode) {
                imageView.el.parentNode.removeChild(imageView.el);
            }
            row.appendChild(imageView.el);
        });
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
                Logger.log(gridWidth, gridHeight, usedSize);
                if (!maxUsedSize || usedSize > maxUsedSize) {
                    bestGridSize = gridSize;
                    maxUsedSize = usedSize;
                }
            }
        }
        if (!bestGridSize) {
            debugger;
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