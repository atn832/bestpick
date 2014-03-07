define(["logger", "image", "promise"], function(Logger, Image, Promise) {
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
    
    var deletedFolder = "todelete";
    
    DesktopFileSystem.prototype.remove = function(filepath) {
        var newpath;
        var newfilepath;
        var lastSlashPos = filepath.lastIndexOf("/");
        if (lastSlashPos > 0) {
            var folder = filepath.slice(0, lastSlashPos);
            var filename = filepath.slice(lastSlashPos + 1);
            newpath = folder + deletedFolder;
        }
        else {
            newpath = deletedFolder;
        }
        newfilepath = newpath + "/" + filename;
        
        // move file
        fs.mkdir(newpath, function() {
            fs.rename(filepath, newfilepath, function(result) {
                Logger.log(result);
            });
        });
        
        // delete file
        //fs.unlink(filepath);
    };
    
    /**
    * Returns a promise for an URI that an ImageElement can understand. Can be an URL or base64 encoded image data
    **/
    DesktopFileSystem.prototype.getDataURI = function(filepath) {
        var p = new Promise(function(resolve) {
            fs.readFile(filepath, function(err, data) {
                var extension = filepath.slice(filepath.lastIndexOf(".") + 1);
                var dataURI = "data:image/" + extension + ";base64," + Buffer(data).toString('base64');
                resolve(dataURI);
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