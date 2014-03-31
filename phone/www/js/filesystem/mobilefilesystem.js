define(["image"], function(Image) {
    function MobileFileSystem() {
    }
    
    MobileFileSystem.isValid = function() {
        return false;
    }
    
    MobileFileSystem.prototype.getDir = function() {
        return [];
    }
    
    /**
    * Returns an URI that an ImageElement can understand. Can be an URL or base64 encoded image data
    **/
    MobileFileSystem.prototype.getDataURI = function(url) {
        throw "Not Implemented Yet";
    };
    
    var instance;
    MobileFileSystem.getInstance = function() {
        if (!instance)
            instance = new MobileFileSystem();
        return instance;
    }

    return MobileFileSystem;
});