define(function() {
    var status = document.getElementById("status");
    var allLogs = "";
    return {
        log: function(message) {
//            if (console && console.log)
//                console.log(arguments);
            
            var allmessages = "";
            for (var i = 0; i < arguments.length; i++)
                allmessages += arguments[i] + " ";
            message = allmessages;
            
            var d = new Date();
            var n = d.toLocaleTimeString();
            var log = n + ": " + message;
            console.log(log);
            status.innerHTML = log;
            allLogs += log + "\n";
            
            if (require !== requirejs) {
                var gui = require('nw.gui');
                gui.Window.get().title = message;
            }
     },
        showAll: function() {
            alert(allLogs);
        }
    }
});