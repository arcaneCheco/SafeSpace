const socketIO = require("socket.io");
const wrtc = require("wrtc");
const { WebRTCFuncs } = require("../webrtc");

let receiverPCs = {}; // Saves RTCPeerConnection to receive MediaStream of connected user
let senderPCs = {}; // Save RTC PeerConnection to send one user MediaStream of another user except yourself
let users = {}; // Save MediaStream received via RTCPeerConnection connected from receiverPCs with user's socketID - SAME AS ACTIVE USERS?
let socketToRoom = {}; // Save which room the user belongs to
// sends list of socket ID of users already in room and sending their media stream to the server to user who is now in 
// data.id - socketID of user joining room, data.id - roomID


const webRTC = new WebRTCFuncs();

module.exports = (io) => {

  io.on('connection', (socket) => {

    console.log('io.sockets.on');

    socket.on('joinRoom', (data) => {

      try {
        let allUsers = webRTC.getOtherUsersInRoom(data.id, data.roomID);
        io.to(data.id).emit('allUsers', { users: allUsers });
      } catch (error) {
        console.log(error);
      }
    });

    // Server receives offer of RTCPeerConnection to receive user's MediaStream and sent answer
    // data.sdp - RTCSessionDescription of user who offered to send RTCPeerConnection
    socket.on('senderOffer', async (data) => {
      try {
        socketToRoom[data.senderSocketID] = data.roomID;
        let pc = webRTC.createReceiverPeerConnection(data.senderSocketID, socket, data.roomID);
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
    socket.on('senderCandidate', (data) => {
      try {
        let pc = webRTC.receiverPCs[data.senderSocketID];
        pc.addIceCandidate(new wrtc.RTCIceCandidate(data.candidate));
      } catch (error) {
        console.log(error);
      }
    });

    // User who has receiverSocketID as societID receives an offer of RTCPEerConnection to receive MediaStream of user who has senderSocketID as socketID, sends an answer
    socket.on('receiverOffer', async (data) => {
      try {
        let pc = webRTC.createSenderPeerConnection(data.receiverSocketID, data.senderSocketID, socket, data.roomID);
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
        const senderPC = webRTC.senderPCs[data.senderSocketID].filter(sPC => sPC.id === data.receiverSocketID);
        // console.log(senderPC, 'SENDERRRRRRR PCCCCCC')
        await senderPC[0].pc.addIceCandidate(new wrtc.RTCIceCandidate(data.candidate));
      } catch (error) {
        console.log(error);
      }
    });

    // Turns of all RTCPeerConnection and MediaStream associated with disconneted users
    socket.on('disconnect', () => {
      try {
        let roomID = socketToRoom[socket.id];

        webRTC.deleteUser(socket.id, roomID);
        webRTC.closeRecevierPC(socket.id);
        webRTC.closeSenderPCs(socket.id);

        socket.broadcast.to(roomID).emit('userExit', { id: socket.id });
      } catch (error) {
        console.log(error);
      }
    });
  });
}

