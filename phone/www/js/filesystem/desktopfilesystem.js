define(["logger", "image", "promise"], function(Logger, Image, Promise) {
    var DefaultPath = ".";

    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };

    var fs, path;
    if (require !== requirejs) {
        // if require (from nodejs) is defined, use it
        fs = require("fs");
        path = require("path");
    }

    function DesktopFileSystem() {
        if (!fs)
            throw "The application is not running node.js";
    }

    DesktopFileSystem.prototype.getDir = function(dir) {
        // hardcoded folder for now
        if (!dir)
            dir = DefaultPath;

        if (fs.lstatSync(dir).isFile())
            dir = path.dirname(dir);

        var content = fs.readdirSync(dir);
//        var content = fs.readdirSync(dir);
        var imagePaths = content.filter(isImageName);

        var images = imagePaths.map(function(url) {
            return new Image({url: path.join(dir, url)});
        });
		/*for (var i = 0; i < 10; i++) {
			images = images.concat(imagePaths.map(function(url) {
				return new Image({url: path.join(dir, url)});
			}));
		}*/

        return images;
    }

    DesktopFileSystem.isValid = function() {
        // return false;
        return fs != undefined;
    }

    var instance;
    DesktopFileSystem.getInstance = function() {
        if (!instance)
            instance = new DesktopFileSystem();
        return instance;
    }

    var DeletedFolderName = "todelete";

    DesktopFileSystem.prototype.remove = function(filepath) {
        var folder = path.dirname(filepath);
        var ext = path.extname(filepath);
        var filebasename = path.basename(filepath, ext);

        // find all files with same name (to move raws along)
        var files = fs.readdirSync(folder).filter(function(f) {
            var ext = path.extname(f);
            var basename = path.basename(f, ext);
            return basename === filebasename;
        })

        var newpath = path.join(folder, DeletedFolderName);

        files.forEach(function(f) {
            this.move(path.join(folder, f), newpath);
        }.bind(this));
    };

    DesktopFileSystem.prototype.move = function(filepath, newpath) {
//        Logger.log("moving" + filepath);
        var filename = path.basename(filepath);
        var newfilepath = path.join(newpath, filename);
        // move file
        fs.mkdir(newpath, function() {
            fs.rename(filepath, newfilepath, function(result) {
                Logger.log(result);
            });
        });
    };

    /**
    * Returns a promise for an URI that an ImageElement can understand. Can be an URL or base64 encoded image data
    **/
    DesktopFileSystem.prototype.getData = function(filepath) {
        var p = new Promise(function(resolve) {
            fs.readFile(filepath, function(err, data) {
              resolve(data);
            });
        });
        return p;
    }

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
