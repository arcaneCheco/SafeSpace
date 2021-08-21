const wrtc = require("wrtc");
const socketIO = require("socket.io");

class WebRTCFuncs {
  constructor() {

    /******** WebRTC STUN SERVER *********/

    this.pc_config = {
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

    this.receiverPCs = {}; // Saves RTCPeerConnection to receive MediaStream of connected user
    this.senderPCs = {}; // Save RTC PeerConnection to send one user MediaStream of another user except yourself
    this.users = {}; // Save MediaStream received via RTCPeerConnection connected from receiverPCs with user's socketID - SAME AS ACTIVE USERS?
    this.socketToRoom = {}; // Save which room the user belongs to

  }

  // returns if array matches id
  isIncluded(array, id) {
    let len = array.length;
    for (let i = 0; i < len; i++) {
      if (array[i].id === id) return true;
    }
    return false;
  }

  createReceiverPeerConnection(socketID, socket, roomID) {
    // console.log(socketID);

    let pc = new wrtc.RTCPeerConnection(this.pc_config);

    if (this.receiverPCs[socketID]) this.receiverPCs[socketID] = pc;
    else this.receiverPCs = { ...this.receiverPCs, [socketID]: pc };

    pc.onicecandidate = (e) => {
      //console.log(`socketID: ${socketID}'s receiverPeerConnection icecandidate`);
      socket.to(socketID).emit('getSenderCandidate', {
        candidate: e.candidate
      });
    }

    pc.oniceconnectionstatechange = (e) => {
      //console.log(e);
    }

    pc.ontrack = (e) => {
      if (this.users[roomID]) {
        if (!this.isIncluded(this.users[roomID], socketID)) {
          this.users[roomID].push({
            id: socketID,
            stream: e.streams[0]
          });
        } else return;
      } else {
        this.users[roomID] = [{
          id: socketID,
          stream: e.streams[0]
        }];
      }
      socket.broadcast.to(roomID).emit('userEnter', { id: socketID });
    }

    return pc;
  }

  // creates RTCPeerConnection to deliver user(SenderSocketID)'s MediaStream with receiverSocketID
  // adds video and audio track of senderSocketID user to corresponding RTCPeerConnection

  createSenderPeerConnection(receiverSocketID, senderSocketID, socket, roomID) {
    let pc = new wrtc.RTCPeerConnection(this.pc_config);

    if (this.senderPCs[senderSocketID]) {
      this.senderPCs[senderSocketID].filter(user => user.id !== receiverSocketID);
      this.senderPCs[senderSocketID].push({ id: receiverSocketID, pc: pc });
    }
    else this.senderPCs = { ...this.senderPCs, [senderSocketID]: [{ id: receiverSocketID, pc: pc }] };

    pc.onicecandidate = (e) => {
      // console.log(`socketID: ${receiverSocketID}'s senderPeerConnection icecandidate`);
      socket.to(receiverSocketID).emit('getReceiverCandidate', {
        id: senderSocketID,
        candidate: e.candidate
      });
    }

    pc.oniceconnectionstatechange = (e) => {
      //console.log(e);
    }

    const sendUser = this.users[roomID].filter(user => user.id === senderSocketID);
    sendUser[0].stream.getTracks().forEach(track => {
      pc.addTrack(track, sendUser[0].stream);
    });

    return pc;
  }

  // returns array of socketID for all users in roomID except for themselves
  getOtherUsersInRoom(socketID, roomID) {
    let allUsers = [];

    if (!this.users[roomID]) return allUsers;

    let len = this.users[roomID].length;
    for (let i = 0; i < len; i++) {
      if (this.users[roomID][i].id === socketID) continue;
      allUsers.push({ id: this.users[roomID][i].id });
    }

    return allUsers;
  }

  // remove user from the list containing user's information
  deleteUser(socketID, roomID) {
    let roomUsers = this.users[roomID];
    if (!roomUsers) return;
    roomUsers = roomUsers.filter(user => user.id !== socketID);
    this.users[roomID] = roomUsers;
    if (roomUsers.length === 0) {
      delete this.users[roomID];
    }
    delete this.socketToRoom[socketID];
  }

  // Close RTCPeerConnection that the socketID user connected to send MediaStream, and delete from the list
  closeRecevierPC(socketID) {
    if (!this.receiverPCs[socketID]) return;

    this.receiverPCs[socketID].close();
    delete this.receiverPCs[socketID];
  }


  // Close all RTCPeerConnection that were connected to sent MediaStream of socketID user to other users, and delete them from the list
  closeSenderPCs(socketID) {
    if (!this.senderPCs[socketID]) return;

    let len = this.senderPCs[socketID].length;
    for (let i = 0; i < len; i++) {
      this.senderPCs[socketID][i].pc.close();
      let _senderPCs = this.senderPCs[this.senderPCs[socketID][i].id];
      let senderPC = _senderPCs.filter(sPC => sPC.id === socketID);
      if (senderPC[0]) {
        senderPC[0].pc.close();
        this.senderPCs[this.senderPCs[socketID][i].id] = _senderPCs.filter(sPC => sPC.id !== socketID);
      }
    }

    delete this.senderPCs[socketID];
  }

}

module.exports = { WebRTCFuncs }


