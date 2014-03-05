define(["testfilesystem", "desktopfilesystem"], function(TestFileSystem, DesktopFileSystem) {
    return {
        getInstance: DesktopFileSystem.getInstance
//        getInstance: TestFileSystem.getInstance
    }
});