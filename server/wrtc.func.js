const wrtc = require("wrtc");
const socketIO = require("socket.io");


/******** WebRTC STUN SERVER *********/

class WRTCFuncs {
  constructor() {
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

  createReceiverPeerConnection(socketId) {
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
      if (users[roomID]) {
        if (!isIncluded(users[roomID], socketID)) {
          users[roomID].push({
            id: socketID,
            stream: e.streams[0]
          });
        } else return;
      } else {
        users[roomID] = [{
          id: socketID,
          stream: e.streams[0]
        }];
      }
      socket.broadcast.to(roomID).emit('userEnter', { id: socketID });
    }

    return pc;
  }
}




// returns if array matches id
const isIncluded = (array, id) => {
  let len = array.length;
  for (let i = 0; i < len; i++) {
    if (array[i].id === id) return true;
  }
  return false;
}

// save newly created PC as the value of receiverPCs with user's socketID as key
// create event to receive user's MediaStream through that PC
const createReceiverPeerConnection = (socketID, socket, roomID) => {

  // console.log(socketID);

  let pc = new wrtc.RTCPeerConnection(pc_config);

  if (receiverPCs[socketID]) receiverPCs[socketID] = pc;
  else receiverPCs = { ...receiverPCs, [socketID]: pc };

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
    if (users[roomID]) {
      if (!isIncluded(users[roomID], socketID)) {
        users[roomID].push({
          id: socketID,
          stream: e.streams[0]
        });
      } else return;
    } else {
      users[roomID] = [{
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

const createSenderPeerConnection = (receiverSocketID, senderSocketID, socket, roomID) => {
  let pc = new wrtc.RTCPeerConnection(pc_config);

  if (senderPCs[senderSocketID]) {
    senderPCs[senderSocketID].filter(user => user.id !== receiverSocketID);
    senderPCs[senderSocketID].push({ id: receiverSocketID, pc: pc });
  }
  else senderPCs = { ...senderPCs, [senderSocketID]: [{ id: receiverSocketID, pc: pc }] };

  pc.onicecandidate = (e) => {
    //console.log(`socketID: ${receiverSocketID}'s senderPeerConnection icecandidate`);
    socket.to(receiverSocketID).emit('getReceiverCandidate', {
      id: senderSocketID,
      candidate: e.candidate
    });
  }

  pc.oniceconnectionstatechange = (e) => {
    //console.log(e);
  }

  const sendUser = users[roomID].filter(user => user.id === senderSocketID);
  sendUser[0].stream.getTracks().forEach(track => {
    pc.addTrack(track, sendUser[0].stream);
  });

  return pc;
}

// returns array of socketID for all users in roomID except for themselves
const getOtherUsersInRoom = (socketID, roomID) => {
  let allUsers = [];

  if (!users[roomID]) return allUsers;

  let len = users[roomID].length;
  for (let i = 0; i < len; i++) {
    if (users[roomID][i].id === socketID) continue;
    allUsers.push({ id: users[roomID][i].id });
  }

  return allUsers;
}

// remove user from the list containing user's information
const deleteUser = (socketID, roomID) => {
  let roomUsers = users[roomID];
  if (!roomUsers) return;
  roomUsers = roomUsers.filter(user => user.id !== socketID);
  users[roomID] = roomUsers;
  if (roomUsers.length === 0) {
    delete users[roomID];
  }
  delete socketToRoom[socketID];
}

// Close RTCPeerConnection that the socketID user connected to send MediaStream, and delete from the list
const closeRecevierPC = (socketID) => {
  if (!receiverPCs[socketID]) return;

  receiverPCs[socketID].close();
  delete receiverPCs[socketID];
}

// Close all RTCPeerConnection that were connected to sent MediaStream of socketID user to other users, and delete them from the list
const closeSenderPCs = (socketID) => {
  if (!senderPCs[socketID]) return;

  let len = senderPCs[socketID].length;
  for (let i = 0; i < len; i++) {
    senderPCs[socketID][i].pc.close();
    let _senderPCs = senderPCs[senderPCs[socketID][i].id];
    let senderPC = _senderPCs.filter(sPC => sPC.id === socketID);
    if (senderPC[0]) {
      senderPC[0].pc.close();
      senderPCs[senderPCs[socketID][i].id] = _senderPCs.filter(sPC => sPC.id !== socketID);
    }
  }

  delete senderPCs[socketID];
}

module.exports = {
  isIncluded,
  createReceiverPeerConnection,
  createSenderPeerConnection,
  getOtherUsersInRoom,
  deleteUser,
  closeRecevierPC,
  closeSenderPCs,
}


