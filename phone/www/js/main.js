var bowerPath = "../bower_components/";
require.config({
    baseUrl: "js",
    paths: {
        backbone: bowerPath + "backbone/backbone",
        underscore: bowerPath + "underscore/underscore",
        jquery: bowerPath + "jquery/dist/jquery.min"
    },
    shim: {
        backbone: ["underscore"]
    }
});