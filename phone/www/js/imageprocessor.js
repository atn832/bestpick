define(["pool", "variablepriorityqueue"], function(Pool, VariablePriorityQueue) {
    function ImageProcessor() {
        this.queue = new VariablePriorityQueue();
        this.pool = new Pool();
    }
    
    ImageProcessor.prototype.getQueue = function() {
        return this.queue;
    }
    
    var instance = null;
    return {
        getInstance: function() {
            if (!instance)
                instance = new ImageProcessor();
            return instance;
        }
    }
});