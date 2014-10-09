define(["backbone"], function(Backbone) {
    var Job = Backbone.Model.extend({});
    
    Job.Priority = {
        Low: 1,
        High: 2,
        Higher: 3,
        Highest: 4
    };
    
    return Job;
});