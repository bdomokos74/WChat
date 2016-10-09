
window.onload = function() {
    console.log("running js");
    $("#uname").focus();
    $("#uname").keypress( function(evt) {
        if(evt.which===13) {
            chatConnect($("#uname").val())
        }
    });
    $("#sendButton").on( 'click', function(evt) {
        cmd = {cmd: 'MSG'};
        cmd['name'] = $("#uname").val();
        cmd['msg'] = $('#msgToSend').val();
        ws.send(JSON.stringify(cmd));
        let msgElem = $("<div>");
        msgElem.append($("<span>", {"class": "mynick"}).html($("#uname").val()+": ")).
            append($("<span>").html(cmd.msg));
        $('#msgToSend').empty();
        $("#conversation").append(msgElem);
    });

    var ws;

    function chatConnect(name) {
        ws = new WebSocket("ws://localhost:8887");
        ws.onopen = function () {
            console.log("[WebSocket#onopen]\n");
            let msg = {cmd: 'ON'};
            msg['name'] = name;
            ws.send(JSON.stringify(msg));

            $("#uname").addClass('selected');
            $("#uname").attr('disabled', true);
            $("#msgToSend").removeClass('hidden');
            $("#conversation").removeClass('hidden');
            $("#sendButton").removeClass('hidden');
            $("#chatListContainer").removeClass('hidden');
        };
        ws.onmessage = function (e) {
            console.log("[WebSocket#onmessage] Message: '" + e.data + "'\n");
            let msg = JSON.parse(e.data);
            if(msg.cmd==="OL") {
                console.log("OL: "+msg.names);
                let $friendList = $("#friendList");
                console.log(msg);
                $friendList.empty();
                if(msg.names) {
                    msg.names.forEach(function (n) {
                        let elem = $("<li>", {'data-nick': n});
                        elem.html(n);
                        console.log(elem);
                        $("#friendList").append(elem);
                    });
                    $("#friendListContainer").removeClass('hidden');
                }
            } else if(msg.cmd==="MSG") {
                console.log("msg: "+msg.msg);
                let msgElem = $("<div>");
                msgElem.append($("<span>", {"class": "nick"}).html(msg.name+": ")).
                    append($("<span>").html(msg.msg));
                $("#conversation").append(msgElem);
            }

        };
        ws.onclose = function () {
            log("[WebSocket#onclose]\n");
            ws = null;
        }
    }

};
