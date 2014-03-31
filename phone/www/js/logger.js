define(function() {
    var status = document.getElementById("status");
    var allLogs = "";
    return {
        log: function(message) {
			return;	// test production performance
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
            if (status)
                status.innerHTML = log;
            allLogs += log + "\n";
            
//            if (require !== requirejs) {
//                var gui = require('nw.gui');
//                gui.Window.get().title = message;
//            }
     },
        showAll: function() {
            alert(allLogs);
        }
    }
});