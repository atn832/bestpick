define(["logger"], function(Logger) {
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
            var job = queue.dequeue();
            var f = job.get("f");
            
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
        queue.on("enqueue", function(event) {
            if (!isRunning)
                startRun();
        });
    }
    
    return Pool;
});