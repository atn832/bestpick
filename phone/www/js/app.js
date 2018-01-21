var Page = {
    Select: "select",
    Compare: "compare"
};
var containerID = "container";
var compareContainerID = "compareContainer";
var deleteBtnID = "btnDelete";
var compareBtnID = "btnCompare";
var cancelCompareBtnID = "btnCancelCompare";
var keepBtnID = "btnKeep";
var dirdropID = "dirdrop";
var deleteBtn;
var compareBtn;
var cancelCompareBtn;
var keepBtn;
var dirdrop;

var gallery;
var galleryView;
var compareGalleryView;
var currentPage;

document.addEventListener("DOMContentLoaded", function(event) {
    console.log("DOM fully loaded and parsed");
    requirejs(["logger"], initialize);
});

function initialize(Logger) {
    dirdrop = document.getElementById(dirdropID);
    if (dirdrop) {
        dirdrop.addEventListener("change", function(evt) {
            var dir = evt.target.files[0].path;
            Logger.log(dir);
            openFolder(dir);
        });
    }

    compareBtn = document.getElementById(compareBtnID);
    compareBtn.addEventListener("click", compare);
    function compare() {
        showPage(Page.Compare);
    }

    deleteBtn = document.getElementById(deleteBtnID);
    deleteBtn.addEventListener("click", deleteImages);
    function deleteImages() {
        var selectedImages = gallery.get("selectedImages").slice();
        gallery.get("images").remove(selectedImages);
        requirejs(["filesystem"], function(FileSystem) {
            selectedImages.forEach(function(image) {
                var url = image.get("url");
                FileSystem.getInstance().remove(url);
            });
            resetFlag(gallery.get("selectedImages"), "isSelected");
            galleryView.render();
        });
    }

    keepBtn = document.getElementById(keepBtnID);
    keepBtn.addEventListener("click", keep);
    document.addEventListener("keydown", event => {
      switch(event.key) {
        case "c":
          compare();
          break;
        case "k":
          keep();
          break;
        case "Escape":
          cancelCompare();
          break;
        case "Backspace":
        case "d":
          deleteImages();
          break;
        default:
          console.log(event);
      }
    });
    function keep() {
        // remove selected images that are not favorites
        var toRemove = [];
        var selectedImages = gallery.get("selectedImages");
        selectedImages.forEach(function(selectedImage) {
            if (!selectedImage.get("isFavorite"))
                toRemove.push(selectedImage);
        });
        console.log("removing", toRemove);
        gallery.get("images").remove(toRemove);
        requirejs(["filesystem"], function(FileSystem) {
            toRemove.forEach(function(image) {
                var url = image.get("url");
                FileSystem.getInstance().remove(url);
            });
        });

        // unselect all:
        // two-way setting of these is not implemented
//        gallery.get("selectedImages").reset();
//        gallery.get("favoriteImages").reset();
        resetFlag(gallery.get("favoriteImages"), "isFavorite");
        if (selectedImages.length == 1) {
          resetFlag(gallery.get("selectedImages"), "isSelected");
          showPage(Page.Select);
        }
    }

    cancelCompareBtn = document.getElementById(cancelCompareBtnID);
    cancelCompareBtn.addEventListener("click", cancelCompare);
    function cancelCompare() {
        // reset favorites
        resetFlag(gallery.get("selectedImages"), "isSelected");
        resetFlag(gallery.get("favoriteImages"), "isFavorite");
        // view all
        showPage(Page.Select);
    }

    requirejs(["filesystem", "gallery", "galleryview", "image", "logger", "jquery.mousewheel"], function(FileSystem, Gallery, GalleryView, Image, Logger, m) {
        Logger.log("initializing gallery");
        var container = document.getElementById(containerID);
        var compareContainer = document.getElementById(compareContainerID);

        var g = new Gallery();
        gallery = g;
        // var dir = FileSystem.getInstance().getDir();
        // g.get("images").add(dir);

        // display images
        var gv = new GalleryView({
            model: g,
            container: container
        });
        galleryView = gv;
        var cgv = new GalleryView({
            model: g,
            container: compareContainer,
            // have to set it at initialization, or it will load all images
            attributes: {showSelected: true}
        });
        compareGalleryView = cgv;

        container.appendChild(gv.el);
        compareContainer.appendChild(cgv.el);
        // todo: make gv listen to events so it can rerender
        // itself when added to a new parent
        gv.render();

        var prevSelectedImageIndexStart;
        var prevSelectedImageIndexEnd;
        // put listeners on to images:
        // if touch on it, toggle

        function handleTap(event) {
            var shiftKey = event.gesture.touches[0].shiftKey;
            var el = event.target;
//            Logger.log("tap" + event.shiftKey + event);
            if (el.model) {
                var image = el.model;
                var images = g.get("images");
                var selectedImageIndex = images.indexOf(image);
                var imagesToProcess = [];
                var imagesToClearout = [];
                /*
                * Utility slice that works even if from > to, and includes to and from
                */
                function inclusiveSlice(array, from, to) {
                    var min = Math.min(from, to);
                    var max = Math.max(from, to);
                    return array.slice(min, max + 1);
                }
                if (shiftKey && prevSelectedImageIndexStart != null) {
                    // only update prevSelectedImageIndex on the first selected item
                    // as we shift select, we do not update the starting index
                    imagesToProcess = inclusiveSlice(images, prevSelectedImageIndexStart, selectedImageIndex);
                    imagesToClearout = inclusiveSlice(images, prevSelectedImageIndexStart, prevSelectedImageIndexEnd);
                    prevSelectedImageIndexEnd = selectedImageIndex;
                }
                else {
                    // toggle the selected image
                    imagesToProcess.push(image);
                    prevSelectedImageIndexStart = selectedImageIndex;
                    prevSelectedImageIndexEnd = selectedImageIndex;
                }
                var propertyName = getPage() === Page.Compare? "isFavorite":  "isSelected";
                var newPropertyValue = !shiftKey?
                    !image.get(propertyName) : // alternate
                    images.at(prevSelectedImageIndexStart).get(propertyName); // copy from selection start
//                Logger.log("setting " + propertyName + " to " + newPropertyValue);
                imagesToClearout.forEach(function(image) {
                    image.set(propertyName, !newPropertyValue)
                });
                imagesToProcess.forEach(function(image) {
                    image.set(propertyName, newPropertyValue)
                });
            }
        }
        Hammer(gv.el, {prevent_default: true}).on("tap", handleTap);
        Hammer(cgv.el, {prevent_default: true}).on("tap", handleTap);

        var lastPinchScale;

        Hammer(cgv.el, {prevent_default:true}).on("transformstart", function(event) {
            lastPinchScale = event.gesture.scale;
        });

        Hammer(cgv.el, {prevent_default:true}).on("pinch", function(event) {
            var newScale = event.gesture.scale;
//            Logger.log("pinch " + newScale);

            var relScale = newScale / lastPinchScale;
            lastPinchScale = newScale;
            var gestureCenter = event.gesture.center;
            var center;
            try {
                center = getPosition(gestureCenter.pageX, gestureCenter.pageY, event.target);
            }
            catch (e) {
                Logger.log(e);
            }
//            Logger.log("pinch " + relScale);
            cgv.zoom(relScale, center);
        });

        var lastDragCenter;

        Hammer(cgv.el, {prevent_default:true}).on("dragstart", function(event) {
            lastDragCenter = event.gesture.center;
        });

        Hammer(cgv.el, {prevent_default:true}).on("drag", function(event) {
            var newCenter = event.gesture.center;
            var dx = newCenter.pageX - lastDragCenter.pageX;
            var dy = newCenter.pageY - lastDragCenter.pageY;
            cgv.translate(dx, dy);
//            Logger.log("drag " + dx + " " + dy);
            lastDragCenter = newCenter;
        });

        $(cgv.el).on('mousewheel', function(event) {
            var gestureCenter = event;
            var center;
            try {
                center = getPosition(gestureCenter.pageX, gestureCenter.pageY, event.target);
            } catch (e) {
                Logger.log("mousewheel out of image", e);
            }
            var factor = 1 + Math.sqrt(Math.abs(event.deltaY)) / 10;
            if (event.deltaY > 0)
                factor = 1 / factor;
            cgv.zoom(factor, center);
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
            updateButtons();
        });
        g.on("add:favoriteImages remove:favoriteImages reset:favoriteImages", function() {
            updateButtons();
        });
        updateButtons();

        // hardCodedTest();
    });
}

function hardCodedTest() {
    openFolder("test");
    setTimeout(function() {
        requirejs(["logger"], function(Logger) {
            Logger.log("document.body.innerHTML");
            Logger.log(document.body.innerHTML);
        });
    }, 000);
}

function showPage(page) {
    if (page === Page.Compare) {
        $(".carousel").carousel("next");
        compareGalleryView.render();
    }
    else {
        $(".carousel").carousel("prev");
        galleryView.render();
    }
    currentPage = page;
    updateButtons();
}
function getPage() {
    // TODO: retrieve info from carousel instance
    return currentPage;
}

function updateButtons() {
    var page = getPage();
    var disabled;
    if (page !== Page.Compare) {
        var selectedImages = gallery.get("selectedImages");
        disabled = selectedImages.length == 0
        compareBtn.disabled = disabled;
        $(compareBtn).parent().toggleClass("disabled", disabled);
        deleteBtn.disabled = disabled;
        $(deleteBtn).parent().toggleClass("disabled", disabled);
    }
    else {
        var favoriteImages = gallery.get("favoriteImages");
        disabled = favoriteImages.length === 0;
        keepBtn.disabled = disabled;
        $(keepBtn).parent().toggleClass("disabled", disabled);
    }
}

function resetFlag(collection, flagname) {
    var items = collection.slice();
    items.forEach(function(item) {
        item.set(flagname, false);
    });
}

function openFolder(path) {
    requirejs(["filesystem", "bootstrap"], function(FileSystem) {
        $(".carousel").carousel("next");
        var images = FileSystem.getInstance().getDir(path);
        gallery.get("images").set(images);
        galleryView.render();
    });
}
