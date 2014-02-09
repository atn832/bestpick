define(["backbone"], function() {
    var GalleryViewSettings = Backbone.Model.extend(
        {
            showSelected: false
        });
    return GalleryViewSettings;
});