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
            Logger.log("enqueue job");
            job.on("change:priority", this.jobChangeListener);
            var bucket = this.buckets[job.get("priority")];
            bucket.push(job);
            this.trigger("enqueue", job);
            Logger.log("queue size", this.getSize());
        },
        /**
        * Removes the first in line
        */
        dequeue: function() {
            Logger.log("dequeue job");
            var bucket = this.buckets[Job.Priority.High].length > 0?
                this.buckets[Job.Priority.High]: this.buckets[Job.Priority.Low];
            if (bucket.length === 0)
                return null;
            var job = bucket.shift();
            job.off("change:priority", this.jobChangeListener);
            this.trigger("dequeue", job);
            Logger.log("queue size", this.getSize());
            return job;
        },
        /**
        * Removes a given job
        */
        remove: function(job) {
            Logger.log("remove job");
            var bucket = this.buckets[job.get("priority")];
            if (bucket.indexOf(job) < 0) {
                Logger.log("job not found");
                return;
            }
            job.off("change:priority", this.jobChangeListener);
            // remove the job
            bucket.splice(bucket.indexOf(job), 1);
            this.trigger("remove", job);
            Logger.log("queue size", this.getSize());
            return job;
        },
        getSize: function() {
            var size = 0;
            for (var priority in Job.Priority)
                size += this.buckets[Job.Priority[priority]].length;
            return size;
        },
        isEmpty: function() {
            return this.buckets[Job.Priority.High].length + this.buckets[Job.Priority.Low].length === 0;
        }
    });
    
    function jobBucketUpdate(job, newPriority) {
        var oldPriority = job.previous("priority");
        var oldBucket = this.buckets[oldPriority];
        var newBucket = this.buckets[newPriority];
        oldBucket.splice(oldBucket.indexOf(job), 1);
        newBucket.push(job);
    }

    return Queue;
});