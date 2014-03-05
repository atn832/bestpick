//define(["testfilesystem", "desktopfilesystem"], function(TestFileSystem, DesktopFileSystem) {
define(["testfilesystem"], function(FileSystem) {
    return {
        getInstance: FileSystem.getInstance
    }
});