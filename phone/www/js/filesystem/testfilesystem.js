define(["logger", "promise", "image"], function(Logger, Promise, Image) {
    var files = [
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
        "img/IMG_20140108_174406969.jpg"
    ];
    
    function TestFileSystem() {
    }
    
    TestFileSystem.isValid = function() {
        return true;
    }
    
    TestFileSystem.prototype.getDir = function() {
        var images = files.map(function(url) {
            return new Image({url: url});
        });
        return images;
    }
    
    TestFileSystem.prototype.remove = function(url) {
        Logger.log("removing " + url);
    }
    
    /**
    * Returns an URI that an ImageElement can understand. Can be an URL or base64 encoded image data
    **/
    TestFileSystem.prototype.getDataURI = function(url) {
        // nothing to do, these are links directly usable by image element
        // could use Promise.cast if not using Promise/A+
        var p = new Promise(function(resolve) {
            resolve(url);
        });
        return p;
    };
    
    var instance = new TestFileSystem();
    
    TestFileSystem.getInstance = function() {
        return instance;
    }
    
    return TestFileSystem;
});