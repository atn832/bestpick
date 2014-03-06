define(["image", "util"], function(Image, Util) {
    var DefaultPath = "../../../img/";
    
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
    
    var fs;
    if (require !== requirejs) {
        // if require (from nodejs) is defined, use it
        fs = require("fs");
    }
    
    function DesktopFileSystem() {
        if (!fs)
            throw "The application is not running node.js";
    }
    
    DesktopFileSystem.prototype.getDir = function(path) {
        // hardcoded folder for now
        if (!path)
            path = DefaultPath;
        
        var content = fs.readdirSync(path);
        var images = content.filter(isImageName);
        
        var images = images.map(function(url) {
            return new Image({url: path + "/" + url});
        });
        return images;
    }
    
    DesktopFileSystem.isValid = function() {
        return fs != undefined;
    }
    
    var instance;
    DesktopFileSystem.getInstance = function() {
        if (!instance)
            instance = new DesktopFileSystem();
        return instance;
    }
    
    /**
    * Returns a promise for an URI that an ImageElement can understand. Can be an URL or base64 encoded image data
    **/
    DesktopFileSystem.prototype.getDataURI = function(filepath) {
        var p = new Promise(function(resolve) {
            fs.readFile(filepath, function(err, data) {
                var extension = filepath.slice(filepath.lastIndexOf(".") + 1);
                var dataURI = "data:image/" + extension + ";base64," + Buffer(data).toString('base64');
                Util.resolve(resolve, dataURI);
            });
        });
        return p;
    }
    
    var imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp"];
    function isImageName(filename) {
        filename = filename.toLowerCase();
        return imageExtensions.some(function(ext) {
            return filename.endsWith(ext);
        });
    }
        
    return DesktopFileSystem;
});