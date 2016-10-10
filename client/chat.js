"use strict";

window.onload = function() {
    console.log("onload called");
    var $myName = $("#uname");
    $myName.focus();
    $myName.keypress( function(evt) {
        if(evt.which===13) {
            cc.signon($("#uname").val());
        }
    });
    $("#signoff").on( 'click', function(evt) {
        cc.signoff();
    });
    $("#sendButton").on( 'click', function(evt) {
        cc.send($('#msgToSend').val());
    });
    $("#msgToSend").keypress( function(evt) {
        if(evt.which===13) {
            cc.send($('#msgToSend').val());
        }
    });

    window.cc = createClient("ws://localhost:8887");
    cc.on("signedon", function(){
        let $myName = $("#uname");
        $myName.addClass('selected');
        $myName.attr('disabled', true);
        let $msgToSend = $("#msgToSend");
        $msgToSend.removeClass('hidden');
        $msgToSend.focus();
        $("#conversation").removeClass('hidden');
        $("#sendButton").removeClass('hidden');
        $("#chatListContainer").removeClass('hidden');

    });
    cc.on("signedoff", function () {
        let $myName = $("#uname");
        $myName.removeClass('selected');
        $myName.attr('disabled', false);
        $("#msgToSend").addClass('hidden');
        $("#conversation").addClass('hidden');
        $("#sendButton").addClass('hidden');
        $("#chatListContainer").addClass('hidden');
        $("#friendListContainer").addClass('hidden');
    });

    cc.on("sent", function(myName, myMessage) {
        let msgElem = $("<div>");
        msgElem.append($("<span>", {"class": "mynick"}).html(myName+": ")).
            append($("<span>").html(myMessage));
        $("#msgToSend").val('');
        $("#conversation").append(msgElem);
    });

    cc.on("OL", function(msg) {
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
    });

    cc.on("MSG", function(msg) {
        let msgElem = $("<div>");
        msgElem.append($("<span>", {"class": "nick"}).html(msg.name+": ")).
            append($("<span>").html(msg.msg));
        $("#conversation").append(msgElem);
    });

    cc.on("SIGNON", function(msg) {
        let elem = $("<li>", {'data-nick': msg.name});
        elem.html(msg.name);
        $("#friendList").append(elem);
        $("#friendListContainer").removeClass('hidden');
    });

    cc.on("SIGNOFF", function(msg) {
        $("#friendList li[data-nick="+msg.name+"]").remove();
        if($("#friendList li").size()===0) {
            $("#friendListContainer").addClass('hidden');
        }
    });
};
