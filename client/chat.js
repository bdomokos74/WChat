
window.onload = function() {
    console.log("running js");
    $("#uname").focus();
    $("#uname").keypress( function(evt) {
        if(evt.which===13) {
            chatConnect($("#uname").val())
        }
    });
    $("#signoff").on( 'click', function(evt) {
        $("#uname").removeClass('selected');
        $("#uname").attr('disabled', false);
        $("#msgToSend").addClass('hidden');
        $("#conversation").addClass('hidden');
        $("#sendButton").addClass('hidden');
        $("#chatListContainer").addClass('hidden');
        $("#friendListContainer").addClass('hidden');
        let msg = {cmd: 'SIGNOFF'};
        msg['name'] = $("#uname").val();
        $("#uname").val('');
        ws.send(JSON.stringify(msg));
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
                let msgElem = $("<div>");
                msgElem.append($("<span>", {"class": "nick"}).html(msg.name+": ")).
                    append($("<span>").html(msg.msg));
                $("#conversation").append(msgElem);
            } else if(msg.cmd==="SIGNON") {
                let elem = $("<li>", {'data-nick': msg.name});
                elem.html(msg.name);
                $("#friendList").append(elem);
                $("#friendListContainer").removeClass('hidden');
            }  else if(msg.cmd==="SIGNOFF") {
                $("#friendList li[data-nick="+msg.name+"]").remove();
                if($("#friendList li").size()===0) {
                    $("#friendListContainer").addClass('hidden');
                }
            }

        };
        ws.onclose = function () {
            console.log("[WebSocket#onclose]\n");
            ws = null;
        }
    }

};
