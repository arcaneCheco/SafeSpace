/// LAST NIGHT

import React, { useState } from 'react';
import io from 'socket-io';
import { useRef } from 'react';
import { useEffect } from 'react';
import Video from './video';
import { Socket } from 'net';

const Signaling = () => {

  // const [socket, setSocket] = useState<SocketIOClient.Socket>();
  // const [users, setUsers] = useState<Array<IWebRTCUser>>([]);
  // let localVideoRef = useRef<HTMLVideoElement>(null);

  const [socket, setSocket] = useState();
  const [users, setUsers] = useState([]); // Array of users' data (socket id, MediaStream)

  let localVideoRef = useRef(null);  // ref of the video on which you want to print your MediaStream
  let sendPC: RTCPeerConnection; // RTCPeerConnetion to send to MediaStream to the server
  let receivePCs: { [socketId: string]: RTCPeerConnection }; // List of RTCPeerConnections to receive MediaStream from other users in same room from server (receivePCs[socketid] = RTCPeerConnection)

  // RTCPeerConnection setting to STUN Server
  const pc_config = {
    "iceServers": [
      // {
      //   urls: 'stun:[STUN_IP]:[PORT]',
      //   'credentials': '[YOR CREDENTIALS]',
      //   'username': '[USERNAME]'
      // },
      {
        urls: 'stun:stun.l.google.com:19302'
      }
    ]
  }

  useEffect(() => {
    let newSocket = io.connect('http://localhost:8080');
    let localStream: MediaStream;

    // Generates RTCPeerConnection to receive MediaStream then sent to server (needs to be in userJoined in client.js)
    newSocket.on('userEnter', (data: { id: string }) => {
      createReceivePC(data.id, newSocket);
    });

    // Generates RTC PeerConnection to receive MediaStream fromm those users, sends to server
    newSocket.on('allUsers', (data: { users: Array<{ id: string }> }) => {
      let len = data.users.length;
      for (let i = 0; i < len; i++) {
        createReceivePC(data.users[i].id, newSocket);
      }
    });

    // Close RTCPeerConnection that you connected to receive MediaStream for that user, then delete it from list
    newSocket.on('userExit', (data: { id: string }) => {
      receivePCs[data.id].close(); // move this over into removePlayer
      delete receivePCs[data.id]; // move this over into removePlayer
      setUsers(users => users.filter(user => user.id !== data.id));
    });

    // specify SDP as remoteDescription of corresponding RTCPeerConneciton
    newSocket.on('getSenderAnswer', async (data: { sdp: RTCSessionDescription }) => {
      try {
        console.log('get sender answer');
        console.log(data.sdp);
        await sendPC.setRemoteDescription(new RTCSessionDescription(data.sdp));
      } catch (error) {
        console.log(error);
      }
    });

    // Add RTCIceCandidate to corresponding RTCPeerConnection
    newSocket.on('getSenderCandidate', async (data: { candidate: RTCIceCandidateInit }) => {
      try {
        console.log('get sender candidate');
        if (!data.candidate) return;
        sendPC.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('candidate add success');
      } catch (error) {
        console.log(error);
      }
    });

    // specify SDP as remoteDescription of corresponding RTCPeerConneciton
    newSocket.on('getReceiverAnswer', async (data: { id: string, sdp: RTCSessionDescription }) => {
      try {
        console.log(`get socketID(${data.id})'s answer`);
        let pc: RTCPeerConnection = receivePCs[data.id];
        await pc.setRemoteDescription(data.sdp);
        console.log(`socketID(${data.id})'s set remote sdp success`);
      } catch (error) {
        console.log(error);
      }
    });

    // Add RTCIceCandidate to corresponding RTCPeerConnection
    newSocket.on('getReceiverCandidate', async (data: { id: string, candidate: RTCIceCandidateInit }) => {
      try {
        console.log(data);
        console.log(`get socketID(${data.id})'s candidate`);
        let pc: RTCPeerConnection = receivePCs[data.id];
        if (!data.candidate) return;
        pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log(`socketID(${data.id})'s candidate add success`);
      } catch (error) {
        console.log(error);
      }
    });

    setSocket(newSocket);

    // +++++++ MediaStream Settings +++++++ //

    // calls navigator.mediaDevices.getUserMedia() to obtain your own MediaStream and register with localVideoRef
    // Create RTCPeerConnection to transfer your MediaStream and send offer to server
    // Server informs server that you are participating in the room
    // (afterwards, the answer will be given to allUsersocket event)

    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: 240,
        height: 240
      }
    }).then(stream => {
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      localStream = stream;

      sendPC = createSenderPeerConnection(newSocket, localStream);
      createSenderOffer(newSocket);

      newSocket.emit('joinRoom', {
        id: newSocket.id,
        roomID: '1234'
      });
    }).catch(error => {
      console.log(`getUserMedia error: ${error}`);
    });
  }, []);


  // +++++++ Functions +++++++ //

  // Create an RTCPeerConnection to send your MediaStream to the server and register localStream

  const createSenderPeerConnection = (newSocket, localStream: MediaStream): RTCPeerConnection => {

    let pc = new RTCPeerConnection(pc_config);

    // Your RTCIceCandidate information event occurred after you created the offer or answer signal.
    // Sends RTCIceCandidate information to the server via Socket
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('sender PC onicecandidate');
        newSocket.emit('senderCandidate', {
          candidate: e.candidate,
          senderSocketID: newSocket.id
        });
      }
    }

    // Log when ICE connection status is changed
    pc.oniceconnectionstatechange = (e) => {
      console.log(e);
    }

    if (localStream) {
      console.log('localstream add');
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    } else {
      console.log('no local stream');
    }

    // return generated RTCPeerConnection
    return pc;
  }

  // Create an offer of RTCPeerConnection to send your MediaStream to the server
  // Specifies RTCSessionDescription in the localDescription of the corresponding RTCPeerConnection
  // Send RTCSessionDescription via socket to server

  const createSenderOffer = async (newSocket) => {
    try {
      let sdp = await sendPC.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
      console.log('create sender offer success');
      await sendPC.setLocalDescription(new RTCSessionDescription(sdp));

      newSocket.emit('senderOffer', {
        sdp,
        senderSocketID: newSocket.id,
        roomID: '1234'
      });
    } catch (error) {
      console.log(error);
    }
  }


  // Created RTCPeerConnection to receive MediaStream from other users in the room
  // sends offer to the server

  const createReceivePC = (id: string, newSocket) => {
    try {
      console.log(`socketID(${id}) user entered`);
      let pc = createReceiverPeerConnection(id, newSocket);
      createReceiverOffer(pc, newSocket, id);
    } catch (error) {
      console.log(error);
    }
  }


  // Create RTCPeerConnection to receive MediaStream from socketID user
  // Store RTCPeerConnection created as key-value format in receivePCs variable

  const createReceiverPeerConnection = (socketID: string, newSocket): RTCPeerConnection => {
    let pc = new RTCPeerConnection(pc_config);

    // add pc to peerConnections object
    receivePCs = { ...receivePCs, [socketID]: pc };

    // Your RTCIceCandidate information event occurred after you created the offer or answer signal
    // Send your RTCIceCandidate information to the server via Socket
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('receiver PC onicecandidate');
        newSocket.emit('receiverCandidate', {
          candidate: e.candidate,
          receiverSocketID: newSocket.id,
          senderSocketID: socketID
        });
      }
    }

    // Log when ICE connection status is changed
    pc.oniceconnectionstatechange = (e) => {
      console.log(e);
    }

    // Specifying other users' RTCSessionDescription as remoteSessionDescription in their RTCPeerConnection results in an event about the other user's track data.
    // register stream in users variable
    pc.ontrack = (e) => {
      console.log('ontrack success');
      setUsers(oldUsers => oldUsers.filter(user => user.id !== socketID));
      setUsers(oldUsers => [...oldUsers, {
        id: socketID,
        stream: e.streams[0]
      }]);
    }

    // return generated RTCPeerConnection
    return pc;
  }

  // Create an offer of RTCPeerConnection to receive your MediaStream to the server
  // Specifies RTCSessionDescription in the localDescription of the corresponding RTCPeerConnection
  // Send RTCSessionDescription via socket to server

  // change createReceiverOffer to createAnswerOffer?
  const createReceiverOffer = async (pc: RTCPeerConnection, newSocket, senderSocketID: string) => {
    try {
      // change createOffer to createAnswer?
      let sdp = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      console.log('create receiver offer success');
      await pc.setLocalDescription(new RTCSessionDescription(sdp));

      newSocket.emit('receiverOffer', {
        sdp,
        receiverSocketID: newSocket.id,
        senderSocketID,
        roomID: '1234'
      });
    } catch (error) {
      console.log(error);
    }
  }


  // +++++++ VIDEO RENDERING +++++++ //

  return (
    <div>
      <video
        style={{
          width: 240,
          height: 240,
          margin: 5,
          backgroundColor: 'black'
        }}
        muted
        ref={localVideoRef}
        autoPlay>
      </video>
      {users.map((user, index) => {
        return (
          <Video
            key={index}
            stream={user.stream}
          />
        );
      })}
    </div>
  );
}

export default Signaling;


