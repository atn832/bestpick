define([], function() {
    function Pool() {
    };
    
    Pool.prototype.process = function(queue) {
        if (this.queue)
            throw "Cannot process more than one queue";
        
        this.queue = queue;
        // dummy promise to start the promise queue
        
        var isRunning = false;
        
        function dequeueAndRun(result) {
            if (queue.isEmpty()) {
                isRunning = false;
                return;
            }
            
            // get the top priority item
            var f = queue.dequeue();
            
            // run it
            var p = new Promise(f);
            p.then(dequeueAndRun);
        }
        
        function startRun() {
            new Promise(function(resolve) {
                isRunning = true;
                resolve();
            }).then(dequeueAndRun);
        }
        
        startRun();
        
        // dequeue only when the only promise handled finishes
        queue.on("all", function() {
            if (!isRunning)
                startRun();
        });
        
        /*
        // execution list
        var f = queue.dequeue();
        var p = new Promise(f);
        //p.then(do it again);
        var p2 = p.then(function(result) {
            var f = queue.dequeue();
            var p = new Promise(f);
            return p;
            //.then(again);
        })
        var p3 = p2.then(function(promise) {
            var p = promise.then(dequeue);
            return p;
        });
        p3.then(function(promise) {
            //...
        });

        // equivalent to
        function dequeue(result) {
            var f = queue.dequeue();
            var p = new Promise(f);
            p.then(dequeue);
        }
        
        new Promise(function(resolve) {
            resolve();
        }).then(dequeue);
        
        // on queue event, run a new promise if it is not already running
        
        */
    }
    
    return Pool;
});