package org.bds.chatserver;
import com.codesnippets4all.json.generators.JSONGenerator;
import com.codesnippets4all.json.parsers.JSONParser;
import com.codesnippets4all.json.parsers.JsonParserFactory;
import org.java_websocket.WebSocket;
import org.java_websocket.WebSocketImpl;
import org.java_websocket.exceptions.WebsocketNotConnectedException;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Created by bdomokos on 08/12/15.
 */
public class ChatServer extends WebSocketServer {
    ConcurrentMap<WebSocket, UserData> connections = new ConcurrentHashMap<>();
    ConcurrentMap<UserData, WebSocket> users = new ConcurrentHashMap<>();
    final Object availLock = new Object();

    private JSONParser jsonParser;

    public ChatServer(int port) throws UnknownHostException {
        super(new InetSocketAddress(port));
        JsonParserFactory jsonParserFactory = JsonParserFactory.getInstance();
        jsonParser = jsonParserFactory.newJsonParser();
    }

    public ChatServer(InetSocketAddress address) {
        super(address);
    }

    @Override
    public void onOpen(WebSocket conn, ClientHandshake handshake) {
//        this.sendToAll("new connection: " + handshake.getResourceDescriptor());
        System.out.println(conn.getRemoteSocketAddress().getAddress().getHostAddress() + " is online");
    }

    @Override
    public void onClose(WebSocket conn, int code, String reason, boolean remote) {
//        this.sendToAll(conn + " has left the room!");
        System.out.println(conn + " has gone offline");
    }

    @Override
    public void onMessage(WebSocket conn, String message) {
        Map msg = jsonParser.parseJson(message);
        String cmd = (String) msg.get("cmd");
        switch (cmd) {
            case "ON": {
                String name = (String) msg.get("name");
                if (connections.containsKey(conn)) {
                    System.out.println("warning: "+name+" was already online at:"+conn);
                    return;
                }
                System.out.println(name + " joined");
                UserData userData = new UserData(name);
                WebSocket oldConn = users.get(userData);
                StringBuilder sb;
                if (oldConn!=null) {
                    System.out.println("warning: "+name+" reconnecting");
                    synchronized (availLock) {
                        connections.remove(oldConn);
                        connections.put(conn, userData);
                        users.put(userData, conn);
                    }
                    oldConn.close();
                } else {
                    synchronized (availLock) {
                        connections.put(conn, userData);
                        users.put(userData, conn);
                    }
                    Map<String, Object> signonCmd = new HashMap<>();
                    signonCmd.put("cmd", "SIGNON");
                    signonCmd.put("name", name);
                    sb = new StringBuilder();
                    JSONGenerator.traverseObjects(signonCmd, sb, false);
                    sendToAll(name, sb.toString());
                }

                Map<String, Object> onlineCmd = new HashMap<>();
                onlineCmd.put("cmd", "OL");

                List<String> online = getOnline(name);
                if (online.size() > 0) {
                    onlineCmd.put("names", online);
                }
                sb = new StringBuilder();
                JSONGenerator.traverseObjects(onlineCmd, sb, true);
                conn.send(sb.toString());


                break;
            }
            case "MSG": {
                String to = (String) msg.get("to");
                UserData userData = connections.get(conn);
                String text = (String) msg.get("msg");
                System.out.println("msg from: "+ userData.getName()+ " to: "+to + " [" + text + "]");
                msg.put("from", userData.getName());
                if (to==null||to.equals("all")) {
                    this.sendToAll(userData.getName(), message);
                } else {
                    sendTo(userData.getName(), to, message);
                }

                break;
            }
            case "SIGNOFF":
                String name = (String) msg.get("name");

                UserData userData = new UserData(name);
                WebSocket oldConn = users.get(userData);
                if (oldConn == null) {
                    System.out.println("warning: "+name+" was not online");
                    return;
                }

                synchronized (availLock) {
                    connections.remove(oldConn);
                    users.remove(userData);
                }
                oldConn.close();

                Map<String, Object> signOffCmd = new HashMap<>();
                signOffCmd.put("cmd", "SIGNOFF");
                signOffCmd.put("name", name);
                StringBuilder sb = new StringBuilder();
                JSONGenerator.traverseObjects(signOffCmd, sb, false);
                sendToAll(name, sb.toString());

                break;
            default:
                System.out.println("unknown cmd: " + cmd);
                break;
        }
    }

    public List<String> getOnline() {
        return getOnline(null);
    }
    public List<String> getOnline(String name) {
        Stream<String> nameStream = connections.values().stream().
                            map(UserData::getName);
        if (name != null) {
            nameStream = nameStream.filter(n -> !n.equals(name));
        }
        return nameStream.collect(Collectors.toList());
    }

//    @Override
//    public void onFragment(WebSocket conn, Framedata fragment) {
//        System.out.println("received fragment: " + fragment);
//    }

    @Override
    public void onError( WebSocket conn, Exception ex ) {
        ex.printStackTrace();
        if( conn != null ) {
            // some errors like port binding failed may not be assignable to a specific websocket
        }
    }

    public static void main(String[] args) throws InterruptedException, IOException {
        WebSocketImpl.DEBUG = true;
        int port = 8887; // 843 flash policy port
        try {
            port = Integer.parseInt(args[0]);
        } catch (Exception ex) {
        }
        ChatServer s = new ChatServer(port);
        s.start();
        System.out.println("ChatServer started on port: " + s.getPort());

        BufferedReader sysin = new BufferedReader( new InputStreamReader( System.in ) );
        while ( true ) {
            String in = sysin.readLine();
//            s.sendToAll( in );
            if( in.equals( "exit" ) ) {
                s.stop();
                break;
            } else if( in.equals( "restart" ) ) {
                s.stop();
                s.start();
                break;
            } else if (in.equals("info")) {
                List<String> online = s.getOnline();
                System.out.println("online: "+online.stream().collect(Collectors.joining("; ")));
            } else {
                System.out.println("unknown cmd: "+in);
            }
        }
    }



    /**
     * Sends <var>text</var> to all currently connected WebSocket clients.
     *
     * @param msg
     *            The String to send across the network.
     * @throws InterruptedException
     *             When socket related I/O errors occur.
     */
    public void sendToAll(  String from, String msg ) {
        Set<Map.Entry<WebSocket, UserData>> entries = connections.entrySet();
        for (Map.Entry<WebSocket, UserData> entry : entries) {
            if (!entry.getValue().getName().equals(from)) {
                try {
                    entry.getKey().send(msg);
                } catch (WebsocketNotConnectedException notConnEx) {
                    System.out.println("warn: "+entry.getValue().getName()+" got disconnected");
                    // TODO remove connection
                }
            }
        }
    }

    public void sendTo( String from, String to, String text ) {
        for (Map.Entry<WebSocket, UserData> entry : connections.entrySet()) {
            if (entry.getValue().getName().equals(to)) {
                Map<String, String> cmd = new HashMap<>();
                cmd.put("cmd", "MSG");
                cmd.put("from", from);
                cmd.put("to", to);
                cmd.put("text", text);
                StringBuilder sb = new StringBuilder();
                JSONGenerator.traverseObjects(cmd, sb, false);
                entry.getKey().send(sb.toString());
            }
        }
    }
}