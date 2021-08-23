import * as React from "react";
import useStore from "../../store";
import { useState } from "react";
import io from "socket.io-client";
import { useRef } from "react";
import { useEffect } from "react";
import Video from "./video";
import "./signalling.css";

const Signalling: React.FC = () => {
  // Get active users from store
  let activeUsers = {};
  let userSpecificId = "";
  // let [userConnectionGradients, setUserConnectionGradients] = useState({});
  // useStore.subscribe(
  //   () => {
  //     setUserConnectionGradients(useStore.getState().userConnectionGradients);
  //     // console.log(userConnectionGradients);
  //   },
  //   (state) => state.userConnectionGradients
  // );
  let [displayUsers, setDisplayUsers] = useState<any>([]);
  let userConnectionGradients: any = null;
  useStore.subscribe(
    () => {
      // console.log(useStore.getState().activeUsers);
      activeUsers = useStore.getState().activeUsers;
    },
    (state) => state.activeUsers
  );
  setInterval(() => {
    // console.log(users, "helllooo");
    userConnectionGradients = useStore.getState().userConnectionGradients;
    // console.log(userConnectionGradients);
    // let connectedUsers: any = (userConnectionGradients);
    let connectionStatus: any;
    let webId: any;
    let currentDisplayWebIds = displayUsers.map((user) => user.id);
    // const webIds = users.map(user => user.id)
    for ([webId, connectionStatus] of Object.entries(userConnectionGradients)) {
      const otherUser = users.find((user) => user.id === webId);
      if (otherUser) {
        let whereInArray = currentDisplayWebIds.indexOf(otherUser.id);
        console.log(whereInArray);
        if (connectionStatus > 0) {
          if (whereInArray === -1) {
            console.log("hello");
            setDisplayUsers((oldUsers) => [...oldUsers, otherUser]);
            // console.log(displayUsers);
          }
        } else {
          if (whereInArray !== -1) {
            setDisplayUsers((oldUsers) =>
              oldUsers.filter((user) => user.id !== webId)
            );
          }
        }
      }
    }
    // console.log(displayUsers);
  }, 1500);

  const [socket, setSocket] = useState<any>();
  const [users, setUsers] = useState<Array<any>>([]); // Array of users' data (socket id, MediaStream)

  let localVideoRef = useRef<HTMLVideoElement>(null); // ref of the video on which you want to print your MediaStream

  let sendPC: RTCPeerConnection; // RTCPeerConnetion to send to MediaStream to the server
  let receivePCs: { [socketId: string]: RTCPeerConnection }; // List of RTCPeerConnections to receive MediaStream from other users in same room from server (receivePCs[socketid] = RTCPeerConnection)

  // RTCPeerConnection setting to STUN Server
  const pc_config = {
    iceServers: [
      // {
      //   urls: 'stun:[STUN_IP]:[PORT]',
      //   'credentials': '[YOR CREDENTIALS]',
      //   'username': '[USERNAME]'
      // },
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  useEffect(() => {
    let newSocket = io("http://localhost:3001/webRTCNamespace");
    let localStream: MediaStream;

    newSocket.on("connection", () => {
      console.log("connection");
    });

    // Generates RTCPeerConnection to receive MediaStream then sent to server (needs to be in userJoined in client.js)
    newSocket.on("userEnter", (data: { id: string }) => {
      createReceivePC(data.id, newSocket);
    });

    // Generates RTC PeerConnection to receive MediaStream fromm those users, sends to server
    newSocket.on("allUsers", (data: { users: Array<{ id: string }> }) => {
      data.users.forEach((user) => createReceivePC(user.id, newSocket));
    });

    // Close RTCPeerConnection that you connected to receive MediaStream for that user, then delete it from list
    newSocket.on("userExit", (data: { id: string }) => {
      receivePCs[data.id].close();
      delete receivePCs[data.id];
      setUsers((users) => users.filter((user) => user.id !== data.id));
    });

    /// NOT READING
    // specify SDP as remoteDescription of corresponding RTCPeerConneciton
    newSocket.on(
      "getSenderAnswer",
      async (data: { sdp: RTCSessionDescription }) => {
        try {
          await sendPC.setRemoteDescription(
            new RTCSessionDescription(data.sdp)
          );
        } catch (error) {
          console.log(error);
        }
      }
    );

    // Add RTCIceCandidate to corresponding RTCPeerConnection
    newSocket.on(
      "getSenderCandidate",
      async (data: { candidate: RTCIceCandidateInit }) => {
        try {
          if (!data.candidate) return;
          sendPC.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.log(error);
        }
      }
    );

    // specify SDP as remoteDescription of corresponding RTCPeerConneciton
    newSocket.on(
      "getReceiverAnswer",
      async (data: { id: string; sdp: RTCSessionDescription }) => {
        try {
          let pc: RTCPeerConnection = receivePCs[data.id];
          await pc.setRemoteDescription(data.sdp);
        } catch (error) {
          console.log(error);
        }
      }
    );

    // Add RTCIceCandidate to corresponding RTCPeerConnection
    newSocket.on(
      "getReceiverCandidate",
      async (data: { id: string; candidate: RTCIceCandidateInit }) => {
        try {
          let pc: RTCPeerConnection = receivePCs[data.id];
          if (!data.candidate) return;
          pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.log(error);
        }
      }
    );

    setSocket(newSocket);

    // +++++++ MediaStream Settings +++++++ //

    // calls navigator.mediaDevices.getUserMedia() to obtain your own MediaStream and register with localVideoRef
    // Create RTCPeerConnection to transfer your MediaStream and send offer to server
    // Server informs server that you are participating in the room
    // (afterwards, the answer will be given to allUsersocket event)

    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          width: 240,
          height: 240,
        },
      })
      .then((stream) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        localStream = stream;

        sendPC = createSenderPeerConnection(newSocket, localStream);
        createSenderOffer(newSocket);

        newSocket.emit("joinRoom", {
          id: newSocket.id,
          roomID: "1234",
        });
      })
      .catch((error) => {
        console.log(`getUserMedia error: ${error}`);
      });
  }, []);

  // +++++++ Functions +++++++ //

  // Created RTCPeerConnection to receive MediaStream from other users in the room
  // sends offer to the server

  const createReceivePC = (id: string, newSocket: any) => {
    try {
      console.log(`socketID(${id}) user entered`);
      let pc = createReceiverPeerConnection(id, newSocket);
      createReceiverOffer(pc, newSocket, id);
    } catch (error) {
      console.log(error);
    }
  };

  // Create an offer of RTCPeerConnection to send MediaStream to the server
  // Specifies RTCSessionDescription in the localDescription of the corresponding RTCPeerConnection
  // Send RTCSessionDescription via socket to server

  const createSenderOffer = async (newSocket: any) => {
    try {
      let sdp = await sendPC.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      await sendPC.setLocalDescription(new RTCSessionDescription(sdp));

      newSocket.emit("senderOffer", {
        sdp,
        senderSocketID: newSocket.id,
        roomID: "1234",
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Create an offer of RTCPeerConnection to receive MediaStream from server
  // Specifies RTCSessionDescription in the localDescription of the corresponding RTCPeerConnection
  // Send RTCSessionDescription via socket to server

  const createReceiverOffer = async (
    pc: RTCPeerConnection,
    newSocket: any,
    senderSocketID: string
  ) => {
    try {
      // change createOffer to createAnswer?
      let sdp = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(new RTCSessionDescription(sdp));

      newSocket.emit("receiverOffer", {
        sdp,
        receiverSocketID: newSocket.id,
        senderSocketID,
        roomID: "1234",
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Create an RTCPeerConnection to send your MediaStream to the server and register localStream

  const createSenderPeerConnection = (
    newSocket: any,
    localStream: MediaStream
  ): RTCPeerConnection => {
    let pc = new RTCPeerConnection(pc_config);

    // Your RTCIceCandidate information event occurred after you created the offer or answer signal.
    // Sends RTCIceCandidate information to the server via Socket
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        newSocket.emit("senderCandidate", {
          candidate: e.candidate,
          senderSocketID: newSocket.id,
        });
      }
    };

    // Log when ICE connection status is changed
    // pc.oniceconnectionstatechange = (e) => {
    //   console.log(e);
    // };

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    } else {
      console.log("no local stream");
    }

    // return generated RTCPeerConnection
    return pc;
  };

  // Create RTCPeerConnection to receive MediaStream from socketID user
  // Store RTCPeerConnection created as key-value format in receivePCs variable

  const createReceiverPeerConnection = (
    socketID: string,
    newSocket: any
  ): RTCPeerConnection => {
    let pc = new RTCPeerConnection(pc_config);

    // add pc to peerConnections object
    receivePCs = { ...receivePCs, [socketID]: pc };

    // Your RTCIceCandidate information event occurred after you created the offer or answer signal
    // Send your RTCIceCandidate information to the server via Socket
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        newSocket.emit("receiverCandidate", {
          candidate: e.candidate,
          receiverSocketID: newSocket.id,
          senderSocketID: socketID,
        });
      }
    };

    // Specifying other users' RTCSessionDescription as remoteSessionDescription in their RTCPeerConnection results in an event about the other user's track data.
    // register stream in users variable
    pc.ontrack = (e) => {
      setUsers((oldUsers) => oldUsers.filter((user) => user.id !== socketID));
      setUsers((oldUsers) => [
        ...oldUsers,
        {
          id: socketID,
          stream: e.streams[0],
        },
      ]);
    };

    // return generated RTCPeerConnection
    return pc;
  };

  // Insert opacity values into users array

  const opacity = 0.5;
  // let temp = activeUsers[userSpecificId].connectionGradients
  // opacity={user.connectionGradients.userId}

  // +++++++ VIDEO RENDERING +++++++ //
  return (
    <div className="Signalling">
      <div className="usersVideosBox">
        {users.map((user, index) => {
          return (
            <Video
              key={index}
              stream={user.stream}
              opacity={opacity}
              userConnectionGradients={userConnectionGradients}
            />
          );
        })}
      </div>
      <div className="userVideo">
        <div className="videoBox">
          <video
            className="videoTile"
            muted
            ref={localVideoRef}
            autoPlay
          ></video>
        </div>
      </div>
    </div>
  );
};

export default Signalling;
