define(["logger"], function(Logger) {
    var ImageView = Backbone.View.extend({
        tagName: "img",
        className: "galleryImage",
        initialize: function() {
//            this.listenTo(this.model, "change", this.render);
            this.model.on("all", function(event) {
//                Logger.log("iv model changed", event);
                this.render();
            }.bind(this));
            
            var instance = this;
            this.el.onload = function() {
//                Logger.log("image loaded");
                instance.width = this.width;
                instance.height = this.height;
            };
                // why doesn't listening to onload this way work?
//                this.el.addEventListener("onload", function() {
//                    // update width and height
//                    Logger.log("image finished loading", this, this.width, this.height);
//                });
            this.render();
        },
        render: function() {
//            Logger.log("image.render", this.model.get("url"));
            var image = this.model;
            if (image) {
                var instance = this;
                
                if (this.url !== image.get("url")) {
//                    Logger.log("set src");
                    this.url = image.get("url");
                    this.el.src = image.get("url");
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
        },
        setMaxWidth: function(width) {
            this.maxWidth = width;
            this.el.style.width = width + "px";
        },
        // returns the current size, not the max one...
        getWidth: function() {
            return this.width;
        },
        getHeight: function() {
            return this.height;
        }
    });
    
    return ImageView;
});