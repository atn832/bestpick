define(["logger", "promise", "gallery", "imageview", "galleryviewsettings", "svg", "backbone"], function(Logger, Promise, Gallery, ImageView, GalleryViewSettings, SVG) {
    var TileSpacing = 2;
    var StandardTileSize = 100;
    var id = 0;
    var GalleryView = Backbone.View.extend({
        tagName: "div",
        className: "gallery",
        initialize: function() {
            this.renderCount = 0;
            this.id = id++;
            Logger.log("gv init, model:", this.model);
           this.model.on("all", function(event) {
               // Logger.log("gv model event:", event);
               this.render();
           }.bind(this));
            this.imageViews = {};
            this.visible = true;

            this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            this.svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
            this.svg.setAttribute("version", "1.1");
            // this.svg.classList.add("h-100");
            this.svg.classList.add("w-100");
            this.el.appendChild(this.svg);
            if (this.attributes && this.attributes.showSelected) {
                this.setShowSelected(true);
            }

            var instance = this;
            window.addEventListener("resize", function() {
                window.requestAnimationFrame(render.bind(instance));
            });

            if (this.model) {
                this.render();
            }
        },
        render: render,
        setVisible: function(isVisible) {
            this.visible = isVisible;
            this.render();
            this.trigger("change:isVisible");
        },
        isVisible: function() {
            return this.visible;
        },
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
        getDisplayedImages: getDisplayedImages,
        getAllGalleryImages: function() {
            var gallery = this.model;
            var allImages = gallery.get("images");
            return allImages;
        },
        getSelectedGalleryImages: function() {
            var gallery = this.model;
            var selectedImages = gallery.get("selectedImages");
            return selectedImages;
        },
        /*
        * Removes images that have been deleted or should not be displayed from the cache and the DOM
        */
        removeOrphanImages: function(imagesToDisplay) {
            var allImages = this.getAllGalleryImages();
            var imageViewsToRemove = [];
            for (var cid in this.imageViews) {
                var value = this.imageViews[cid];
                if (!(value instanceof ImageView)) continue;

                var imageView = value;
                var image = imageView.model;
                if (allImages.indexOf(image) < 0 || imagesToDisplay.indexOf(image) < 0)
                    imageViewsToRemove.push(imageView);
            }
            imageViewsToRemove.forEach(function(imageView) {
                imageView.el.parentElement.removeChild(imageView.el);
                var image = imageView.model;
                var cid = image.cid;
                delete this.imageViews[cid];
            }.bind(this));
        }
    });

    function render() {
         Logger.log("gallery view render");
        var currentRenderCount = ++this.renderCount;

        var el = this.el;
        el.classList.toggle("d-n", !this.visible);

        this.svg.setAttribute("width", "100%");

        // iterate over images
        var showSelected = this.isShowSelected();
        var allGalleryImages = this.getAllGalleryImages();
        var imagesToDisplay = showSelected?
            this.getSelectedGalleryImages() : allGalleryImages;
        // Logger.log(imagesToDisplay.length, " to display", this.id);
        var instance = this;

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
        if (gallerySize.width === 0 || gallerySize.height === 0) {
            // avoid compute errors
            return;
        }

        var viewsToDisplay = imagesToDisplay.map(getImageView.bind(this));

        this.removeOrphanImages(imagesToDisplay);

        var gridAndTileSizePromise = new Promise(function(resolve, reject) {
            try{
            var gridSize;
            var tileSize;
            if (showSelected) {
                // respect ratio, fit to screen
                Promise.all(viewsToDisplay.map(function(imageView) {
                    return imageView.getFullSizePromise();
                })).then(function(fullImageSizes) {
                    try{
                    // stretch
                    gridSize = getGridSize(gallerySize, fullImageSizes);
                    tileSize = getTileSize(gallerySize, gridSize);
                    resolve({
                        gridSize: gridSize,
                        tileSize: tileSize
                    });
                    } catch (e) {
                        Logger.log(e);
                    }
                });
            }
            else {
                var maxGalleryWidth = viewsToDisplay.length * (StandardTileSize + TileSpacing) - TileSpacing;
                if (maxGalleryWidth < gallerySize.width) {
                    // the whole gallery fits in one line. use standard tile size
                    gridSize = {
                        width: viewsToDisplay.length,
                        height: 1
                    }
                    tileSize = {
                        width: StandardTileSize,
                        height: StandardTileSize
                    };
                }
                else {
                    // fixed tile size
                    var gridWidth = Math.floor(gallerySize.width / StandardTileSize);
                    gridSize = {
                        width: gridWidth,
                        height: 1
                    };

                    tileSize = getTileSize(gallerySize, gridSize);
                    tileSize.height = tileSize.width;
                }
                resolve({
                    gridSize: gridSize,
                    tileSize: tileSize
                });
            }
            }
            catch(e) {
                Logger.log(e);
            }
        });
        gridAndTileSizePromise.then(function(result) {
            // for some racing issues, we may be trying to render an old state
            if (currentRenderCount < this.renderCount) {
                 Logger.log("aborted render, " + currentRenderCount + " vs " + this.renderCount)
                return;
            }
			try{
			var tileSize = result.tileSize;
			var gridSize = result.gridSize;
            var displaySettings = {
                gridSize: gridSize,
                gallerySize: gallerySize,
                displayedImages: viewsToDisplay
            };

            viewsToDisplay.forEach(function(imageView) {
                imageView.setSize(tileSize);
            });
            var isRedrawRequired = !isSame(this.oldDisplaySettings, displaySettings);
            if (!isRedrawRequired) {
                Logger.log("gallery view. render unnecessary");
                return;
            }
            this.oldDisplaySettings = displaySettings;

            Logger.log("clear gallery view");
    //        Logger.log("grid size" + gridSize);
            var latestRowIndex = -1;
            var row;

            if (!showSelected) {
                // reset scale and translation in displayed tiles
                this.resetTransformation();
            }
            viewsToDisplay.forEach(function(imageView, index) {
                if (imageView.el.parentElement !== this.svg) {
                    this.svg.appendChild(imageView.el);
                }

                imageView.setVisible(false);

                var rowIndex = Math.floor(index / gridSize.width);
                var colIndex = index % gridSize.width;
                latestRowIndex = rowIndex;

                var x = colIndex * (tileSize.width + TileSpacing);
                var y = rowIndex * (tileSize.height + TileSpacing);

                imageView.el.setAttribute("transform", "translate(" + x + ", " + y + ")");
                imageView.setVisible(true);
            }.bind(this));

            var minGalleryHeight = latestRowIndex * StandardTileSize + StandardTileSize;
            if (!showSelected && minGalleryHeight > gallerySize.height) {
                // expand the svg if we're displaying the whole gallery
                this.svg.setAttribute("height", minGalleryHeight);
            }
            else {
                this.svg.setAttribute("height", "100%");
            }
			}
			catch(e) {
				Logger.log(e);
			}
        }.bind(this));
    }

    /**
    * Scales all the displayed images
    * @param s the scale
    * @param c the position of the center
    **/
    function zoom(s, c) {
        this.getDisplayedImages().forEach(function(image) {
            // use the center if center is undefined
            if (c === undefined) {
                var size = image.getSize();
                c = {
                    x: size.width / 2,
                    y: size.height / 2
                };
            }
            var translateMinusC = "translate(" + -c.x + ", " + -c.y + ")";
            var translateC = "translate(" + c.x + ", " + c.y + ")";
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

    function getImageView(image) {
        var cid = image.cid;
        var imageView;
        if (!(cid in this.imageViews)) {
            // make the image element
            console.log(this.id, "new image");
            imageView = new ImageView({
                model: image,
                attributes: { thumbnailUpdateEnabled: this.isShowSelected() }
            });
            this.imageViews[image.cid] = imageView;
        }
        imageView = this.imageViews[cid];
        return imageView;
    }

    function getGridSize(gallerySize, imageSizes) {
        // Logger.log("getGridSize " + JSON.stringify(gallerySize) + " " + JSON.stringify(imageSizes));
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
                // Logger.log("griddimensions (width, height, usedsize", gridWidth + " " + gridHeight + " " + usedSize);
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
            width: Math.floor((bounds.width - (gridWidth - 1) * TileSpacing) / gridWidth) ,
            height: Math.floor((bounds.height - (gridHeight - 1) * TileSpacing) / gridHeight)
        }
        return tileSize;
    }

    // returns the size of the image stretched to fit within some bounds
    function getStretchedSize(size, tileSize) {
        // Logger.log("getStretchedSize ", JSON.stringify(size), JSON.stringify(tileSize));
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
