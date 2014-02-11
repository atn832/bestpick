var bowerPath = "../bower_components/";
require.config({
    baseUrl: "js",
    paths: {
        backbone: bowerPath + "backbone/backbone-min",
        underscore: bowerPath + "underscore/underscore-min"
    },
    shim: {
        backbone: ["underscore"]
    }
});