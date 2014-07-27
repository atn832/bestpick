define(["backbone"], function(Backbone) {
    /**
    * Stores image metadata: thumbnail and full size
    **/
    var ImageMetadata = Backbone.Model.extend({
    });
    
    ImageMetadata.Keys = {
        FullSize: "fullsize", // stores the full size in keys width and height
        ThumbnailURI: "thumbnailURI"
    };
    
    return ImageMetadata;
});