// let http = require('http');
// let express = require('express');
// let cors = require('cors');
// let socketio = require('socket.io');
// let wrtc = require('wrtc');

// console.log(wrtc);

// const app = express();
// const server = http.createServer(app);

// app.use(cors());

// let receiverPCs = {}; // Saves RTCPeerConnection to receive MediaStream of connected user
// let senderPCs = {}; // Save RTC PeerConnection to send one user MediaStream of another user except yourself
// let users = {}; // Save MediaStream received via RTCPeerConnection connected from receiverPCs with user's socketID
// let socketToRoom = {}; // Save which room the user belongs to

// const pc_config = {
//   "iceServers": [
//     // {
//     //   urls: 'stun:[STUN_IP]:[PORT]',
//     //   'credentials': '[YOR CREDENTIALS]',
//     //   'username': '[USERNAME]'
//     // },
//     {
//       urls: 'stun:stun.l.google.com:19302'
//     }
//   ]
// }

// // returns if array matches id
// const isIncluded = (array, id) => {
//   let len = array.length;
//   for (let i = 0; i < len; i++) {
//     if (array[i].id === id) return true;
//   }
//   return false;
// }

// // socket = socket.io socket
// // save newly created PC as the value of receiverPCs with user's socketID as key
// // create event to receive user's MediaStream through that PC
// const createReceiverPeerConnection = (socketID, socket, roomID) => {
//   let pc = new wrtc.RTCPeerConnection(pc_config);

//   if (receiverPCs[socketID]) receiverPCs[socketID] = pc;
//   else receiverPCs = { ...receiverPCs, [socketID]: pc };

//   pc.onicecandidate = (e) => {
//     //console.log(`socketID: ${socketID}'s receiverPeerConnection icecandidate`);
//     socket.to(socketID).emit('getSenderCandidate', {
//       candidate: e.candidate
//     });
//   }

//   pc.oniceconnectionstatechange = (e) => {
//     //console.log(e);
//   }

//   pc.ontrack = (e) => {
//     if (users[roomID]) {
//       if (!isIncluded(users[roomID], socketID)) {
//         users[roomID].push({
//           id: socketID,
//           stream: e.streams[0]
//         });
//       } else return;
//     } else {
//       users[roomID] = [{
//         id: socketID,
//         stream: e.streams[0]
//       }];
//     }
//     socket.broadcast.to(roomID).emit('userEnter', { id: socketID });
//   }

//   return pc;
// }

// // creates RTCPeerConnection to deliver user(SenderSocketID)'s MediaStream with receiverSocketID
// // adds video and audio track of senderSocketID user to corresponding RTCPeerConnection
// const createSenderPeerConnection = (receiverSocketID, senderSocketID, socket, roomID) => {
//   let pc = new wrtc.RTCPeerConnection(pc_config);

//   if (senderPCs[senderSocketID]) {
//     senderPCs[senderSocketID].filter(user => user.id !== receiverSocketID);
//     senderPCs[senderSocketID].push({ id: receiverSocketID, pc: pc });
//   }
//   else senderPCs = { ...senderPCs, [senderSocketID]: [{ id: receiverSocketID, pc: pc }] };

//   pc.onicecandidate = (e) => {
//     //console.log(`socketID: ${receiverSocketID}'s senderPeerConnection icecandidate`);
//     socket.to(receiverSocketID).emit('getReceiverCandidate', {
//       id: senderSocketID,
//       candidate: e.candidate
//     });
//   }

//   pc.oniceconnectionstatechange = (e) => {
//     //console.log(e);
//   }

//   const sendUser = users[roomID].filter(user => user.id === senderSocketID);
//   sendUser[0].stream.getTracks().forEach(track => {
//     pc.addTrack(track, sendUser[0].stream);
//   });

//   return pc;
// }

// // returns array of socketID for all user in roomID except for themselves
// const getOtherUsersInRoom = (socketID, roomID) => {
//   let allUsers = [];

//   if (!users[roomID]) return allUsers;

//   let len = users[roomID].length;
//   for (let i = 0; i < len; i++) {
//     if (users[roomID][i].id === socketID) continue;
//     allUsers.push({ id: users[roomID][i].id });
//   }

//   return allUsers;
// }

// // remove user from the list containing user's information
// const deleteUser = (socketID, roomID) => {
//   let roomUsers = users[roomID];
//   if (!roomUsers) return;
//   roomUsers = roomUsers.filter(user => user.id !== socketID);
//   users[roomID] = roomUsers;
//   if (roomUsers.length === 0) {
//     delete users[roomID];
//   }
//   delete socketToRoom[socketID];
// }

// // Close RTCPeerConnection that the socketID user connected to send MediaStream, and delete from the list
// const closeRecevierPC = (socketID) => {
//   if (!receiverPCs[socketID]) return;

//   receiverPCs[socketID].close();
//   delete receiverPCs[socketID];
// }

// // Close all RTCPeerConneciton that were connected to send MediaStream of socketID user to other users, and delete them from the list
// const closeSenderPCs = (socketID) => {
//   if (!senderPCs[socketID]) return;

//   let len = senderPCs[socketID].length;
//   for (let i = 0; i < len; i++) {
//     senderPCs[socketID][i].pc.close();
//     let _senderPCs = senderPCs[senderPCs[socketID][i].id];
//     let senderPC = _senderPCs.filter(sPC => sPC.id === socketID);
//     if (senderPC[0]) {
//       senderPC[0].pc.close();
//       senderPCs[senderPCs[socketID][i].id] = _senderPCs.filter(sPC => sPC.id !== socketID);
//     }
//   }

//   delete senderPCs[socketID];
// }

// const io = socketio.listen(server);

// io.sockets.on('connection', (socket) => {

//   // sends list of socket ID of users already in room and sending their media stream to the server to user who is now in 
//   // data.id - socketID of user joining room, data.id - roomID
//   socket.on('joinRoom', (data) => {
//     try {
//       let allUsers = getOtherUsersInRoom(data.id, data.roomID);
//       io.to(data.id).emit('allUsers', { users: allUsers });
//     } catch (error) {
//       console.log(error);
//     }
//   });

//   // Server receives offer of RTCPeerConnection to receive user's MediaStream and sent answer
//   // data.sdp - RTCSessionDescription of user who offered to send RTCPeerConnection
//   socket.on('senderOffer', async (data) => {
//     try {
//       socketToRoom[data.senderSocketID] = data.roomID;
//       let pc = createReceiverPeerConnection(data.senderSocketID, socket, data.roomID);
//       await pc.setRemoteDescription(data.sdp);
//       let sdp = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
//       await pc.setLocalDescription(sdp);
//       socket.join(data.roomID);
//       io.to(data.senderSocketID).emit('getSenderAnswer', { sdp });
//     } catch (error) {
//       console.log(error);
//     }
//   });

//   // Adds RTCIceCandidate to the RTCPeerConnection that's saved when the user sends an offer
//   // data.candidate - RTCICeCandidate of user
//   socket.on('senderCandidate', async (data) => {
//     try {
//       let pc = receiverPCs[data.senderSocketID];
//       await pc.addIceCandidate(new wrtc.RTCIceCandidate(data.candidate));
//     } catch (error) {
//       console.log(error);
//     }
//   });

//   // User who has receiverSocketID as societID receives an offer of RTCPEerConnection to receive MediaStream of user who has senderSocketID as socketID, sends an answer
//   socket.on('receiverOffer', async (data) => {
//     try {
//       let pc = createSenderPeerConnection(data.receiverSocketID, data.senderSocketID, socket, data.roomID);
//       await pc.setRemoteDescription(data.sdp);
//       // set to false as they do not receive audio and video streams from users, as the RTCPeerConnection created is a connection to send a stram of existing users
//       let sdp = await pc.createAnswer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
//       await pc.setLocalDescription(sdp);
//       io.to(data.receiverSocketID).emit('getReceiverAnswer', { id: data.senderSocketID, sdp });
//     } catch (error) {
//       console.log(error);
//     }
//   });

//   // Add RTCIceCandidate to RTCPeerConnection
//   // what are we filtering
//   socket.on('receiverCandidate', async (data) => {
//     try {
//       const senderPC = senderPCs[data.senderSocketID].filter(sPC => sPC.id === data.receiverSocketID);
//       await senderPC[0].pc.addIceCandidate(new wrtc.RTCIceCandidate(data.candidate));
//     } catch (error) {
//       console.log(error);
//     }
//   });

//   // Turns of all RTCPeerConnection and MediaStream associated with disconneted users
//   socket.on('disconnect', () => {
//     try {
//       let roomID = socketToRoom[socket.id];

//       deleteUser(socket.id, roomID);
//       closeRecevierPC(socket.id);
//       closeSenderPCs(socket.id);

//       socket.broadcast.to(roomID).emit('userExit', { id: socket.id });
//     } catch (error) {
//       console.log(error);
//     }
//   });
// });

// server.listen(process.env.PORT || 8080, () => {
//   console.log('server running on 8080');
// })