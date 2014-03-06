var bowerPath = "../bower_components/";
requirejs.config({
    baseUrl: "js",
    paths: {
        backbone: bowerPath + "backbone/backbone",
        underscore: bowerPath + "underscore/underscore",
        jquery: bowerPath + "jquery/dist/jquery.min",
        "jquery.mousewheel": bowerPath + "jquery-mousewheel/jquery.mousewheel",
        filesystem: "filesystem/filesystem",
        testfilesystem: "filesystem/testfilesystem",
        desktopfilesystem: "filesystem/desktopfilesystem",
        mobilefilesystem: "filesystem/mobilefilesystem"
    },
    shim: {
        backbone: ["underscore"]
    }
});