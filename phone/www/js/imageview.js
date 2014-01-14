define([], function() {
    var ImageView = Backbone.View.extend({
        tagName: "img",
        className: "galleryImage",
        initialize: function() {
//            this.listenTo(this.model, "change", this.render);
            this.model.on("all", function(event) {
//                console.log("iv model changed", event);
                this.render();
            }.bind(this));
            this.render();
        },
        render: function() {
            console.log("image.render", this.model.get("url"));
            var image = this.model;
            if (image) {
                var instance = this;
                this.el.onload = function() {
//                    console.log("image loaded");
                    instance.width = this.width;
                    instance.height = this.height;
                };
                // why doesn't listening to onload this way work?
                this.el.addEventListener("onload", function() {
                    // update width and height
                    console.log("image finished loading", this, this.width, this.height);
                });
                
                if (this.el.src !== image.get("url"))
                    this.el.src = image.get("url");
                
                this.el.model = image;
                
                if (image.get("isSelected")) {
                    $(this.el).addClass("selected");
                }
                else {
                    $(this.el).removeClass("selected");
                }
                if (image.get("isFavorite")) {
                    $(this.el).addClass("favorite");
                }
                else {
                    $(this.el).removeClass("favorite");
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