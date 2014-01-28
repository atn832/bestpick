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

            /*
                the DOM will look like this:
                <g transform="translate(...)">
                    <clipPath id=clipID>
                        <rect .../>
                    </clipPath>
                    <g clip-path=url(clipID)>
                        <image transform="matrix(...)">
                    </g>
                </g>
            */
            
            var instance = this;
            this.el = document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            this.clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
            this.clipID = _.uniqueId("clip");
            this.clipPath.setAttribute("id", this.clipID);
            
            this.clipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            this.clipRect.setAttribute("x" , "0");
            this.clipRect.setAttribute("y" , "0");
            
            this.image = document.createElementNS("http://www.w3.org/2000/svg", "image");
            this.g.setAttribute("clip-path", "url(#" + this.clipID + ")");
            this.clipPath.appendChild(this.clipRect);
            this.g.appendChild(this.image);
            this.el.appendChild(this.clipPath);
            this.el.appendChild(this.g);
            this.transformation = "";
            
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
                    this.image.setAttributeNS('http://www.w3.org/1999/xlink','href', this.url);
                    this.image.setAttribute("x", "0");
                    this.image.setAttribute("y", "0");
                    this.image.setAttribute("width", "100");
                    this.image.setAttribute("height", "100");
                    // not necessary until zoomed in
                    this.clipRect.setAttribute("width", "100");
                    this.clipRect.setAttribute("height", "100");
                    
                    var img = document.createElement("img");
                    img.onload = function() {
                        instance.width = img.width;
                        instance.height = img.height;
                    };
                    img.src = this.url;
                }
                
                if (this.el.model !== image) {
//                    Logger.log("update image view model");
                    this.image.model = image;
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
            this.image.setAttribute("width", size.width + "");
            this.image.setAttribute("height", size.height + "");
            this.clipRect.setAttribute("width", size.width + "");
            this.clipRect.setAttribute("height", size.height + "");
            
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
            this.image.setAttribute("transform", t);

            var consolidatedTransform = this.image.transform.baseVal.consolidate();
            // returns null when transform is empty
            if (!consolidatedTransform)
                return;
            var m = consolidatedTransform.matrix;
            
            var strmatrix = "matrix(" + m.a + ", " + m.c + ", " + m.b + ", " + m.d + ", " + m.e + ", " + m.f + ")";
            this.image.setAttribute("transform", strmatrix);
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