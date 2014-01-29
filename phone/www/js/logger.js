define(function() {
    var status = document.getElementById("status");
    var allLogs = "";
    return {
        log: function(message) {
//            if (console && console.log)
//                console.log(arguments);
            var d = new Date();
            var n = d.toLocaleTimeString();
            var log = n + ": " + message;
            console.log(log);
            status.innerHTML = log;
            allLogs += log + "\n";
        },
        showAll: function() {
            alert(allLogs);
        }
    }
});