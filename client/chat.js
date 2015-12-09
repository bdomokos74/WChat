
window.onload = function() {
    console.log("running js");
    $("#uname").keypress( function(evt) {
        if(evt.which==13) {
            chatConnect($("#uname").val())
        }
    });

    var ws;

    function chatConnect(name) {
        ws = new WebSocket("ws://localhost:8887");
        ws.onopen = function () {
            console.log("[WebSocket#onopen]\n");
            cmd = {cmd: 'ON'};
            cmd['name'] = name;
            ws.send(JSON.stringify(cmd))
            $("#msg").attr("disabled", null);
            $("#sendButton").attr("disabled", null);
        }
        ws.onmessage = function (e) {
            console.log("[WebSocket#onmessage] Message: '" + e.data + "'\n");
        }
        ws.onclose = function () {
            log("[WebSocket#onclose]\n");
            ws = null;
        }
    }

};
