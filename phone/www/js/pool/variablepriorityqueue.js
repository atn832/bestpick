define(["logger", "job", "backbone"], function(Logger, Job, Backbone) {
    var Queue = Backbone.Model.extend({
        initialize: function() {
            // initialize empty buckets
            this.buckets = {};
            for (var priority in Job.Priority)
                this.buckets[Job.Priority[priority]] = [];
            
            this.jobChangeListener = jobBucketUpdate.bind(this);
        },
        enqueue: function(job) {
            job.on("change:priority", this.jobChangeListener);
            var bucket = this.buckets[job.get("priority")];
            bucket.push(job);
        },
        dequeue: function() {
            var bucket = this.buckets[Job.Priority.High].length > 0?
                this.buckets[Job.Priority.High]: this.buckets[Job.Priority.Low];
            if (bucket.length === 0)
                return null;
            var job = bucket.shift();
            job.off("change:priority", this.jobChangeListener);
            return job;
        },
        isEmpty: function() {
            return this.buckets[Job.Priority.High].length + this.buckets[Job.Priority.Low].length === 0;
        }
    });
    
    function jobBucketUpdate(job, newPriority) {
        Logger.log("changing");
        var oldPriority = job.previous("priority");
        Logger.log("old new", oldPriority, newPriority);
        var oldBucket = this.buckets[oldPriority];
        var newBucket = this.buckets[newPriority];
        oldBucket.splice(oldBucket.indexOf(job), 1);
        newBucket.push(job);
    }

    return Queue;
});