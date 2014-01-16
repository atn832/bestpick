define(function() {
    var Rectangle = Backbone.Model.extend({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        initialize: function(x, y, width, height) {
            this.set({
                x: x,
                y: y,
                width: width,
                height: height
            });
        }
    return Rectangle
});