require.config({
    baseUrl: "../js/"
});

test("hello test", function() {
    ok(1 == "1", "Passed");
});

require(["imageview"], function(ImageView) {
    test("hello test", function() {
        ok(1 == "1", "Passed");
    });
});