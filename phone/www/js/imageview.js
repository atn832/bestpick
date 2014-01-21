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
            
            var instance = this;
            this.el = document.createElementNS("http://www.w3.org/2000/svg", "image");
            
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
                    this.el.setAttributeNS('http://www.w3.org/1999/xlink','href', this.url);
                    this.el.setAttribute("x", "0");
                    this.el.setAttribute("y", "0");
                    this.el.setAttribute("width", "100");
                    this.el.setAttribute("height", "100");
                }
                
                if (this.el.model !== image) {
//                    Logger.log("update image view model");
                    this.el.model = image;
                }
                
                if (this.selected !== image.get("isSelected"))
                {
                    Logger.log("update isselected");
                    this.selected = image.get("isSelected");
                    if (image.get("isSelected")) {
                        Logger.log("add is selected class");
                        $(this.el).addClass("selected");
                    }
                    else {
                        $(this.el).removeClass("selected");
                    }
                }
                
                if (this.favorite !== image.get("isFavorite")) {
                    Logger.log("update isfavorite");
                    this.favorite = image.get("isFavorite");
                    if (image.get("isFavorite")) {
                        $(this.el).addClass("favorite");
                    }
                    else {
                        $(this.el).removeClass("favorite");
                    }
                }
            }
//            if (this.el.parentNode)
//                this.el.parentNode.appendChild(this.image);
        },
        getMaxWidth: function() {
            return this.maxWidth;
        },
        setMaxWidth: function(width) {
            if (this.maxWidth === width)
                return;
            
            this.maxWidth = width;
            this.el.style.width = width + "px";
            
            // resize the displayed image
//            resizeImage(this.fullResImg, this.el, width, Number.POSITIVE_INFINITY);
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
        }
    });
    
    function resizeImage(srcImageObject, dstImageObject, width, height) {
        Logger.log("resizeImage" + width + "," + height);
        var newWidth = width;
        var newHeight = height;
    
        // Calculate a new scale
        // The new scale will be the minimum of the two possible scales
        var scale = Math.min((newWidth / srcImageObject.width), (newHeight / srcImageObject.height));
        Logger.log("scale" + scale);
        
        // New canvas
        var dst_canvas = document.createElement('canvas');
        dst_canvas.width = srcImageObject.width * scale;
        dst_canvas.height = srcImageObject.height * scale;
    
        // Draw Image content in canvas
        var dst_ctx = dst_canvas.getContext('2d');
        dst_ctx.drawImage(srcImageObject, 0, 0, parseInt(srcImageObject.width * scale), parseInt(srcImageObject.height * scale));
    
        // Replace source of Image
        dstImageObject.src = dst_canvas.toDataURL();
    }
    
    return ImageView;
});