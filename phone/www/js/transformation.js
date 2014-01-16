define(function() {
    var Transformation = Backbone.Model.extend(
        xx: 1,
        xy: 0,
        yx: 0,
        yy: 1,
        initialize: function(xx, xy, yx, yy) {
            if (xx !== undefined) {
                this.set({
                    xx: xx,
                    xy: xy,
                    yx: yx,
                    yy: yy
                });
            }
        }
    );
    
    return Transformation;
});