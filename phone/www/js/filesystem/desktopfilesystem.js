define(["image"], function(Image) {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
    
    var fs = require("fs");
    
    function DesktopFileSystem() {
    }
    
    DesktopFileSystem.prototype.getDir = function(path) {
        // hardcoded folder for now
        if (!path)
            path = "img";
        
        var content = fs.readdirSync(path);
        var images = content.filter(isImageName);
        
        var images = images.map(function(url) {
            return new Image({url: path + "/" + url});
        });
        return images;
    }
    
    var instance = new DesktopFileSystem();
    
    DesktopFileSystem.getInstance = function() {
        return instance;
    }
    
    /**
    * Returns an URI that an ImageElement can understand. Can be an URL or base64 encoded image data
    **/
    DesktopFileSystem.prototype.getDataURI = function(filepath) {
        var contents = fs.readFileSync(filepath);
        var extension = filepath.slice(filepath.lastIndexOf(".") + 1);
        var dataURI = "data:image/" + extension + ";base64," + Buffer(contents).toString('base64');
        return dataURI;
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