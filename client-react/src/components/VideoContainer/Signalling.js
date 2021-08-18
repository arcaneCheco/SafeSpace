"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
exports.__esModule = true;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var socket_io_client_1 = require("socket.io-client");
var react_2 = require("react");
var react_3 = require("react");
var Video_1 = require("./Video");
var Signalling = function () {
    var _a = react_1.useState(), socket = _a[0], setSocket = _a[1];
    var _b = react_1.useState([]), users = _b[0], setUsers = _b[1]; // Array of users' data (socket id, MediaStream)
    var localVideoRef = react_2.useRef(null); // ref of the video on which you want to print your MediaStream
    var sendPC; // RTCPeerConnetion to send to MediaStream to the server
    var receivePCs; // List of RTCPeerConnections to receive MediaStream from other users in same room from server (receivePCs[socketid] = RTCPeerConnection)
    // RTCPeerConnection setting to STUN Server
    var pc_config = {
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
    };
    react_3.useEffect(function () {
        var newSocket = socket_io_client_1["default"]('http://localhost:8080');
        var localStream;
        // Generates RTCPeerConnection to receive MediaStream then sent to server (needs to be in userJoined in client.js)
        newSocket.on('userEnter', function (data) {
            createReceivePC(data.id, newSocket);
        });
        // Generates RTC PeerConnection to receive MediaStream fromm those users, sends to server
        newSocket.on('allUsers', function (data) {
            var len = data.users.length;
            for (var i = 0; i < len; i++) {
                createReceivePC(data.users[i].id, newSocket);
            }
        });
        // Close RTCPeerConnection that you connected to receive MediaStream for that user, then delete it from list
        newSocket.on('userExit', function (data) {
            receivePCs[data.id].close(); // move this over into removePlayer
            delete receivePCs[data.id]; // move this over into removePlayer
            setUsers(function (users) { return users.filter(function (user) { return user.id !== data.id; }); });
        });
        // specify SDP as remoteDescription of corresponding RTCPeerConneciton
        newSocket.on('getSenderAnswer', function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log('get sender answer');
                        console.log(data.sdp);
                        return [4 /*yield*/, sendPC.setRemoteDescription(new RTCSessionDescription(data.sdp))];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.log(error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // Add RTCIceCandidate to corresponding RTCPeerConnection
        newSocket.on('getSenderCandidate', function (data) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    console.log('get sender candidate');
                    if (!data.candidate)
                        return [2 /*return*/];
                    sendPC.addIceCandidate(new RTCIceCandidate(data.candidate));
                    console.log('candidate add success');
                }
                catch (error) {
                    console.log(error);
                }
                return [2 /*return*/];
            });
        }); });
        // specify SDP as remoteDescription of corresponding RTCPeerConneciton
        newSocket.on('getReceiverAnswer', function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var pc, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("get socketID(" + data.id + ")'s answer");
                        pc = receivePCs[data.id];
                        return [4 /*yield*/, pc.setRemoteDescription(data.sdp)];
                    case 1:
                        _a.sent();
                        console.log("socketID(" + data.id + ")'s set remote sdp success");
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.log(error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        // Add RTCIceCandidate to corresponding RTCPeerConnection
        newSocket.on('getReceiverCandidate', function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var pc;
            return __generator(this, function (_a) {
                try {
                    console.log(data);
                    console.log("get socketID(" + data.id + ")'s candidate");
                    pc = receivePCs[data.id];
                    if (!data.candidate)
                        return [2 /*return*/];
                    pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    console.log("socketID(" + data.id + ")'s candidate add success");
                }
                catch (error) {
                    console.log(error);
                }
                return [2 /*return*/];
            });
        }); });
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
        }).then(function (stream) {
            if (localVideoRef.current)
                localVideoRef.current.srcObject = stream;
            localStream = stream;
            sendPC = createSenderPeerConnection(newSocket, localStream);
            createSenderOffer(newSocket);
            newSocket.emit('joinRoom', {
                id: newSocket.id,
                roomID: '1234'
            });
        })["catch"](function (error) {
            console.log("getUserMedia error: " + error);
        });
    }, []);
    // +++++++ Functions +++++++ //
    // Create an RTCPeerConnection to send your MediaStream to the server and register localStream
    var createSenderPeerConnection = function (newSocket, localStream) {
        var pc = new RTCPeerConnection(pc_config);
        // Your RTCIceCandidate information event occurred after you created the offer or answer signal.
        // Sends RTCIceCandidate information to the server via Socket
        pc.onicecandidate = function (e) {
            if (e.candidate) {
                console.log('sender PC onicecandidate');
                newSocket.emit('senderCandidate', {
                    candidate: e.candidate,
                    senderSocketID: newSocket.id
                });
            }
        };
        // Log when ICE connection status is changed
        pc.oniceconnectionstatechange = function (e) {
            console.log(e);
        };
        if (localStream) {
            console.log('localstream add');
            localStream.getTracks().forEach(function (track) {
                pc.addTrack(track, localStream);
            });
        }
        else {
            console.log('no local stream');
        }
        // return generated RTCPeerConnection
        return pc;
    };
    // Create an offer of RTCPeerConnection to send MediaStream to the server
    // Specifies RTCSessionDescription in the localDescription of the corresponding RTCPeerConnection
    // Send RTCSessionDescription via socket to server
    var createSenderOffer = function (newSocket) { return __awaiter(void 0, void 0, void 0, function () {
        var sdp, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, sendPC.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false })];
                case 1:
                    sdp = _a.sent();
                    console.log('create sender offer success');
                    return [4 /*yield*/, sendPC.setLocalDescription(new RTCSessionDescription(sdp))];
                case 2:
                    _a.sent();
                    newSocket.emit('senderOffer', {
                        sdp: sdp,
                        senderSocketID: newSocket.id,
                        roomID: '1234'
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    console.log(error_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Created RTCPeerConnection to receive MediaStream from other users in the room
    // sends offer to the server
    var createReceivePC = function (id, newSocket) {
        try {
            console.log("socketID(" + id + ") user entered");
            var pc = createReceiverPeerConnection(id, newSocket);
            createReceiverOffer(pc, newSocket, id);
        }
        catch (error) {
            console.log(error);
        }
    };
    // Create RTCPeerConnection to receive MediaStream from socketID user
    // Store RTCPeerConnection created as key-value format in receivePCs variable
    var createReceiverPeerConnection = function (socketID, newSocket) {
        var _a;
        var pc = new RTCPeerConnection(pc_config);
        // add pc to peerConnections object
        receivePCs = __assign(__assign({}, receivePCs), (_a = {}, _a[socketID] = pc, _a));
        // Your RTCIceCandidate information event occurred after you created the offer or answer signal
        // Send your RTCIceCandidate information to the server via Socket
        pc.onicecandidate = function (e) {
            if (e.candidate) {
                console.log('receiver PC onicecandidate');
                newSocket.emit('receiverCandidate', {
                    candidate: e.candidate,
                    receiverSocketID: newSocket.id,
                    senderSocketID: socketID
                });
            }
        };
        // Log when ICE connection status is changed
        pc.oniceconnectionstatechange = function (e) {
            console.log(e);
        };
        // Specifying other users' RTCSessionDescription as remoteSessionDescription in their RTCPeerConnection results in an event about the other user's track data.
        // register stream in users variable
        pc.ontrack = function (e) {
            console.log('ontrack success');
            setUsers(function (oldUsers) { return oldUsers.filter(function (user) { return user.id !== socketID; }); });
            setUsers(function (oldUsers) { return __spreadArray(__spreadArray([], oldUsers), [{
                    id: socketID,
                    stream: e.streams[0]
                }]); });
        };
        // return generated RTCPeerConnection
        return pc;
    };
    // Create an offer of RTCPeerConnection to receive MediaStream from server
    // Specifies RTCSessionDescription in the localDescription of the corresponding RTCPeerConnection
    // Send RTCSessionDescription via socket to server
    var createReceiverOffer = function (pc, newSocket, senderSocketID) { return __awaiter(void 0, void 0, void 0, function () {
        var sdp, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })];
                case 1:
                    sdp = _a.sent();
                    console.log('create receiver offer success');
                    return [4 /*yield*/, pc.setLocalDescription(new RTCSessionDescription(sdp))];
                case 2:
                    _a.sent();
                    newSocket.emit('receiverOffer', {
                        sdp: sdp,
                        receiverSocketID: newSocket.id,
                        senderSocketID: senderSocketID,
                        roomID: '1234'
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _a.sent();
                    console.log(error_4);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // +++++++ VIDEO RENDERING +++++++ //
    return (jsx_runtime_1.jsxs("div", { children: [jsx_runtime_1.jsx("video", { style: {
                    width: 240,
                    height: 240,
                    margin: 5,
                    backgroundColor: 'black'
                }, muted: true, ref: localVideoRef, autoPlay: true }, void 0), users.map(function (user, index) {
                return (jsx_runtime_1.jsx(Video_1["default"], { stream: user.stream }, index));
            })] }, void 0));
};
exports["default"] = Signalling;
