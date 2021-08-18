const socketIO = require("socket.io");
const wrtc = require("webrtc");

const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

// double check socket io 'strings' that are emitting - make sure they're not doubling with physics

const wrtcSockets = io.sockets.on('connection', (socket) => {

  // sends list of socket ID of users already in room and sending their media stream to the server to user who is now in
  // data.id - socketID of user joining room, data.id - roomID
  socket.on('joinRoom', (data) => {
    try {
      let allUsers = getOtherUsersInRoom(data.id, data.roomID);
      io.to(data.id).emit('allUsers', { users: allUsers });
    } catch (error) {
      console.log(error);
    }
  });

  // Server receives offer of RTCPeerConnection to receive user's MediaStream and sent answer
  // data.sdp - RTCSessionDescription of user who offered to send RTCPeerConnection
  socket.on('senderOffer', async (data) => {
    try {
      // socketToRoom[data.senderSocketID] = data.roomID;
      let pc = createReceiverPeerConnection(data.senderSocketID, socket, data.roomID);
      await pc.setRemoteDescription(data.sdp);
      let sdp = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(sdp);
      socket.join(data.roomID);
      io.to(data.senderSocketID).emit('getSenderAnswer', { sdp });
    } catch (error) {
      console.log(error);
    }
  });

  // Adds RTCIceCandidate to the RTCPeerConnection that's saved when the user sends an offer
  // data.candidate - RTCICeCandidate of user
  socket.on('senderCandidate', async (data) => {
    try {
      let pc = receiverPCs[data.senderSocketID];
      await pc.addIceCandidate(new wrtc.RTCIceCandidate(data.candidate));
    } catch (error) {
      console.log(error);
    }
  });

  // User who has receiverSocketID as societID receives an offer of RTCPEerConnection to receive MediaStream of user who has senderSocketID as socketID, sends an answer
  socket.on('receiverOffer', async (data) => {
    try {
      let pc = createSenderPeerConnection(data.receiverSocketID, data.senderSocketID, socket, data.roomID);
      await pc.setRemoteDescription(data.sdp);
      // set to false as they do not receive audio and video streams from users, as the RTCPeerConnection created is a connection to send a stram of existing users
      let sdp = await pc.createAnswer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
      await pc.setLocalDescription(sdp);
      io.to(data.receiverSocketID).emit('getReceiverAnswer', { id: data.senderSocketID, sdp });
    } catch (error) {
      console.log(error);
    }
  });

  // Add RTCIceCandidate to RTCPeerConnection
  socket.on('receiverCandidate', async (data) => {
    try {
      const senderPC = senderPCs[data.senderSocketID].filter(sPC => sPC.id === data.receiverSocketID);
      await senderPC[0].pc.addIceCandidate(new wrtc.RTCIceCandidate(data.candidate));
    } catch (error) {
      console.log(error);
    }
  });

  // Turns of all RTCPeerConnection and MediaStream associated with disconneted users
  socket.on('disconnect', () => {
    try {
      let roomID = socketToRoom[socket.id];

      deleteUser(socket.id, roomID);
      closeRecevierPC(socket.id);
      closeSenderPCs(socket.id);

      socket.broadcast.to(roomID).emit('userExit', { id: socket.id });
    } catch (error) {
      console.log(error);
    }
  });
});

module.exports = { wrtcSockets };
