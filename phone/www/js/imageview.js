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
            this.tileRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            this.tileRect.setAttribute("x", "0");
            this.tileRect.setAttribute("y", "0");
            
            this.clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
            this.clipID = _.uniqueId("clip");
            this.clipPath.setAttribute("id", this.clipID);
            
            this.clipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            this.clipRect.setAttribute("x" , "0");
            this.clipRect.setAttribute("y" , "0");
            
            this.image = document.createElementNS("http://www.w3.org/2000/svg", "image");
            this.g.setAttribute("clip-path", "url(#" + this.clipID + ")");
            this.g.appendChild(this.image);
            this.clipPath.appendChild(this.clipRect);
            this.el.appendChild(this.tileRect);
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
                
                var firstRender = false;
                if (this.url !== image.get("url")) {
                    firstRender = true;
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
                    this.tileRect.setAttribute("width", "100");
                    this.tileRect.setAttribute("height", "100");
                    
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
                
                var className = "tile ";
                var classNameChanged = false;
                // Note: as of Jan 2014, JQuery's addClass and removeClass
                // will not support SVG
                if (firstRender || this.selected !== image.get("isSelected"))
                {
                    Logger.log("update isselected");
                    classNameChanged = true;
                    this.selected = image.get("isSelected");
                    if (image.get("isSelected")) {
                        Logger.log("add is selected class");
                        className += "selected ";
                    }
                }
                
                if (firstRender || classNameChanged || this.favorite !== image.get("isFavorite")) {
                    classNameChanged = true;
                    Logger.log("update isfavorite");
                    this.favorite = image.get("isFavorite");
                    if (image.get("isFavorite")) {
                        className += "favorite ";
                    }
                }
                //Logger.log("classname:" + className);
                if (classNameChanged || firstRender)
                    this.tileRect.setAttribute("class", className);
            }
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
            this.image.setAttribute("width", size.width);
            this.image.setAttribute("height", size.height);
            this.clipRect.setAttribute("width", size.width);
            this.clipRect.setAttribute("height", size.height);
            this.tileRect.setAttribute("width", size.width);
            this.tileRect.setAttribute("height", size.height);
            
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

            // merges the whole transformation chain into just one
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