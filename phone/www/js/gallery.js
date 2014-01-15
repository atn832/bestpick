define(["logger", "image"], function(Logger, Image) {
    var ProtoGallery = Backbone.Model.extend({
        images: null,
        selectedImages: null,
        favoriteImages: null,
        initialize: function() {
            // TODO support case when someone overrides images
            // or make images read only
            
            
            // handle selections
            var images = getNewImageCollection();
            this.set("images", images);
            
            var selectedImages = getNewImageCollection();
            this.set("selectedImages", selectedImages);
            
            var favoriteImages = getNewImageCollection();
            this.set("favoriteImages", favoriteImages);
            
            images.on("all", function(event, object) {
//                Logger.log("g images", event);
                this.trigger(event + ":images", object);
            }.bind(this));
            selectedImages.on("all", function(event, object) {
//                Logger.log("g selimages", event);
                this.trigger(event + ":selectedImages", object);
            }.bind(this));
            favoriteImages.on("all", function(event, object) {
//                Logger.log("g favimages", event);
                this.trigger(event + ":favoriteImages", object);
            }.bind(this));
            
            var instance = this;
            this.get("images").on("remove", function(image) {
                this.get("selectedImages").remove(image);
                this.get("favoriteImages").remove(image);
            }.bind(this));
            
            this.get("images").on("change", function(event) {
                updateSelection.call(instance);
                updateFavorite.call(instance);
            });
        }
    });
    
    function getNewImageCollection() {
        return new (Backbone.Collection.extend(
                { model: Image }
        ))();
    }
    
    function updateSelection() {
        var images = this.get("images");
        var selectedImages = [];
        images.forEach(function(image) {
            if (image.get("isSelected"))
                selectedImages.push(image);
        });
        this.get("selectedImages").set(selectedImages);
    }
    
    function updateFavorite() {
        var images = this.get("images");
        var selectedImages = [];
        images.forEach(function(image) {
            if (image.get("isFavorite"))
                selectedImages.push(image);
        });
        this.get("favoriteImages").set(selectedImages);
    }
    
    return ProtoGallery;
});
