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
        mobilefilesystem: "filesystem/mobilefilesystem",
        promise: "promise-3.2.0", // necessary for webkit on MacOS
        pool: "pool/pool",
        variablepriorityqueue: "pool/variablepriorityqueue",
        job: "pool/job"
    },
    shim: {
        backbone: ["underscore"]
    }
});