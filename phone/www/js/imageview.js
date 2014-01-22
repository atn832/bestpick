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
                    
                    var img = document.createElement("img");
                    img.onload = function() {
                        Logger.log("image size" + img.width);
                        instance.width = img.width;
                        instance.height = img.height;
                    };
                    img.src = this.url;
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
                        // todo: replace hardcoded opacity attribute
                        // by css class
//                        $(this.el).addClass("selected");
                        this.el.setAttribute("opacity", ".5");
                    }
                    else {
//                        $(this.el).removeClass("selected");
                        this.el.setAttribute("opacity", "1");
                    }
                }
                
                if (this.favorite !== image.get("isFavorite")) {
                    Logger.log("update isfavorite");
                    this.favorite = image.get("isFavorite");
                    if (image.get("isFavorite")) {
                        // todo: replace hardcoded opacity attribute
                        // by css class
//                        $(this.el).addClass("favorite");
                        this.el.setAttribute("opacity", "1");
                    }
                    else {
//                        $(this.el).removeClass("favorite");
                        this.el.setAttribute("opacity", ".5");
                    }
                }
            }
//            if (this.el.parentNode)
//                this.el.parentNode.appendChild(this.image);
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
            this.el.setAttribute("width", size.width + "");
            this.el.setAttribute("height", size.height + "");
            
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
    
    return ImageView;
});