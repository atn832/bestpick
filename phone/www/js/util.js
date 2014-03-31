define(["logger"], function(Logger) {
    return {
        onRejected: function(e) {
            Logger.log("Promise failed", e);
        }
    }
});
