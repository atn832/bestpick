define(["backbone"], function() {
    var Image = Backbone.Model.extend({
        url: null,
        isSelected: false,
        isFavorite: false,
        hasBeenSeen: false,
    });

    return Image;
});
