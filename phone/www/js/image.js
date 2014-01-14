define(function() {
    var ProtoImage = Backbone.Model.extend({
        url: null,
        isSelected: false,
        isFavorite: false
    });
    
    return ProtoImage;
});