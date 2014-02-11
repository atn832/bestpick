var containerID = "container";
var selectBtnID = "btnSelect";
var keepBtnID = "btnKeep";
var logsBtnID = "btnLogs";
var zoomInBtnID = "btnZoomIn";
var zoomOutBtnID = "btnZoomOut";
var selectBtn;
var keepBtn;
var zoomInBtn;
var zoomOutBtn;

var gallery;
var galleryView;

var links =
    [
    "img/SAM_1615.JPG",
    "img/SAM_1616.JPG",
    "img/SAM_1617.JPG",
    "img/SAM_1618.JPG",
    "img/SAM_1640.JPG",
    "img/SAM_1641.JPG",
    "img/SAM_1642.JPG",
    "img/IMG_20140113_133216553.jpg",
    "img/IMG_20140113_133147585.jpg",
    "img/IMG_20140113_133208878.jpg",
    "img/IMG_20140113_133150398.jpg",
    "img/IMG_20140113_133157183.jpg",
    "img/IMG_20140113_133135059_HDR.jpg",
    "img/IMG_20140113_133138099.jpg",
    "img/IMG_20140111_123826003.jpg",
    "img/IMG_20140111_123823790.jpg",
    "img/IMG_20140108_174405213.jpg",
    "img/IMG_20140108_174406969.jpg",
    ];

document.addEventListener("DOMContentLoaded", function(event) {
    console.log("DOM fully loaded and parsed");
    require(["logger"], initialize);
});

function initialize(Logger) {
    selectBtn = document.getElementById(selectBtnID);
    
    selectBtn.addEventListener("click", function() {
        var showSelected = !galleryView.isShowSelected();
        galleryView.setShowSelected(showSelected);
        if (!showSelected) {
            // view all
            // reset favorites
            resetFlag(gallery.get("selectedImages"), "isSelected");
            resetFlag(gallery.get("favoriteImages"), "isFavorite");
        }
    });
    
    keepBtn = document.getElementById(keepBtnID);
    keepBtn.addEventListener("click", function() {
        // remove selected images that are not favorites
        var toRemove = [];
        var selectedImages = gallery.get("selectedImages");
        selectedImages.forEach(function(selectedImage) {
            if (!selectedImage.get("isFavorite"))
                toRemove.push(selectedImage);
        });
        console.log("removing", toRemove);
        gallery.get("images").remove(toRemove);
        
        // unselect all:
        // two-way setting of these is not implemented
//        gallery.get("selectedImages").reset();
//        gallery.get("favoriteImages").reset();
        resetFlag(gallery.get("selectedImages"), "isSelected");
        resetFlag(gallery.get("favoriteImages"), "isFavorite");
        
        // view all again
        galleryView.setShowSelected(false);
    });
    
    require(["gallery", "galleryview", "image", "logger"], function(Gallery, GalleryView, Image, Logger) {
        var logsBtn = document.getElementById(logsBtnID);
        if (logsBtn) {
            logsBtn.addEventListener("click", function() {
                Logger.showAll();
            });
        }
        
        zoomInBtn = document.getElementById(zoomInBtnID);
        zoomOutBtn = document.getElementById(zoomOutBtnID);
        var ratio = 1.1;
        zoomInBtn.addEventListener("click", function() {
            galleryView.zoom(ratio);
        });
        zoomOutBtn.addEventListener("click", function() {
            galleryView.zoom(1/ratio);
        });

        Logger.log("initializing gallery");
        var container = document.getElementById(containerID);
        
        var images = links.map(function(url) {
            return new Image({url: url});
        });
        
        var g = new Gallery();
        gallery = g;
        g.on("all", function(event) {
            Logger.log(event);
        });
//        console.log("g model", g.get("images"));
        g.get("images").add(images);
        
        // display images
        var gv = new GalleryView({
            model: g,
            container: container
        });
        galleryView = gv;
        
        container.appendChild(gv.el);
        // todo: make gv listen to events so it can rerender
        // itself when added to a new parent
        gv.render();
        
        // put listeners on to images:
        // if touch on it, toggle
        Hammer(gv.el, {prevent_default: true}).on("tap", function(event) {
            Logger.log("tap", event);
            var el = event.target;
            if (el.model) {
                var image = el.model;
                if (galleryView.isShowSelected()) {
                    // toggle favorites
                    var isFavorite = !el.model.get("isFavorite");
                    image.set("isFavorite", isFavorite);
                }
                else {
                    var isSelected = !el.model.get("isSelected");
                    Logger.log("setting is selected");
                    image.set("isSelected", isSelected);
                }
            }
        });
        
        
        var lastPinchScale;
        
        Hammer(gv.el, {prevent_default:true}).on("transformstart", function(event) {
            lastPinchScale = event.gesture.scale;
        });
        
        Hammer(gv.el, {prevent_default:true}).on("pinch", function(event) {
            var newScale = event.gesture.scale;
            Logger.log("pinch " + newScale);
            
            if (!gv.isShowSelected())
                return;
            
            var relScale = newScale / lastPinchScale;
            lastPinchScale = newScale;
            var gestureCenter = event.gesture.center;
            var center;
            try {
                center = getPosition(gestureCenter.pageX, gestureCenter.pageY, event.target);
            }
            catch (e) {
                Logger.log(e);
                center = {x: undefined, y: undefined};
            }
//            Logger.log("pinch " + relScale);
            gv.zoom(relScale, center.x, center.y);
        });

        var lastDragCenter;
        
        Hammer(gv.el, {prevent_default:true}).on("dragstart", function(event) {
            lastDragCenter = event.gesture.center;
        });
        
        Hammer(gv.el, {prevent_default:true}).on("drag", function(event) {
            if (!gv.isShowSelected())
                return;
            
            var newCenter = event.gesture.center;
            var dx = newCenter.pageX - lastDragCenter.pageX;
            var dy = newCenter.pageY - lastDragCenter.pageY;
            gv.translate(dx, dy);
            Logger.log("drag " + dx + " " + dy);
            lastDragCenter = newCenter;
        });
        
        $(gv.el).on('mousewheel', function(event) {
            if (!gv.isShowSelected())
                return;
            
            var gestureCenter = event.gesture.center;
            var center = getPosition(gestureCenter.pageX, gestureCenter.pageY, event.target);
            var factor = 1 + Math.sqrt(Math.abs(event.deltaY)) / 10;
            if (event.deltaY > 0)
                factor = 1 / factor;
            gv.zoom(factor, center.x, center.y);
        });
        
        /**
        * Returns the position relative to an image view's top left corner.
        * target has to be part of the ImageView
        **/
        function getPosition(pageX, pageY, target) {
            var model = target.model;
            if (!(model instanceof Image))
                throw "target is not part of an ImageView";
            
            var imageView = target.view;
            // warning: getBoundingClientRect is implemented by our own view
            // do not call it on imageView.el
            var bounds = imageView.getBoundingClientRect();
            var cx = pageX - bounds.left;
            var cy = pageY - bounds.top;
            return {x: cx, y: cy};
        }
        
        // listener to selected images
        g.on("add:selectedImages remove:selectedImages reset:selectedImages", function() {
            updateSelectButtonState(g, gv);
        });
        g.on("add:favoriteImages remove:favoriteImages reset:favoriteImages", function() {
            updateKeepButtonState(g);
        });
        gv.on("change:showSelected", function() {
            updateSelectButtonState(g, gv);
            updateKeepButtonState(g);
        });
        updateSelectButtonState(g, gv);
        updateKeepButtonState(g);
        
//        hardCodedTest();
    });
}

function hardCodedTest() {
//    gallery.get("images").at(0).set("isSelected", true);
//    gallery.get("images").at(1).set("isSelected", true);
//    galleryView.setShowSelected(true);
//    gallery.get("images").at(0).set("isFavorite", true);
    
}

function updateSelectButtonState() {
    var selectedImages = gallery.get("selectedImages");
    selectBtn.disabled = selectedImages.length == 0;
    var showSelected = galleryView.isShowSelected();
    selectBtn.value = showSelected? "View All": "Select";
    
    zoomInBtn.disabled = !showSelected;
    zoomOutBtn.disabled = !showSelected;
}

function updateKeepButtonState(gallery) {
//    console.log("updateKeepButtonState");
    var favoriteImages = gallery.get("favoriteImages");
    var keepBtnEnabled = favoriteImages.length > 0;
    var keepBtnDisabled = !keepBtnEnabled;
    keepBtn.disabled = keepBtnDisabled;
}
                                                 
function resetFlag(collection, flagname) {
    var items = collection.slice();
    items.forEach(function(item) {
        item.set(flagname, false);
    });
}