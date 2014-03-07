define(function() {
    return {
        resolve: function(r, result) {
            var resolve;
            if (r.resolve) {
                // Old Promise API used in Node Webkit
                var promiseResolver = r;
                resolve = promiseResolver.resolve;
            }
            else
                resolve = r;
            resolve(result);
        }
    }
});
