define(["backbone"], function(Backbone) {
    var Job = Backbone.Model.extend({});
    
    Job.Priority = {
        Low: 1,
        High: 2
    };
    
    return Job;
});