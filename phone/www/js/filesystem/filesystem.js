define(["testfilesystem", "desktopfilesystem", "mobilefilesystem"], function(TestFileSystem, DesktopFileSystem, mobilefilesystem) {
    var fileSystem;
    for (var i = arguments.length - 1; i >= 0; i--) {
        var fs = arguments[i];
        if (fs.isValid()) {
            fileSystem = fs;
            break;
        }
    }
    
//    fileSystem = TestFileSystem;
    
    return fileSystem;
});