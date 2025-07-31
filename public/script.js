// WebRTC and Socket.io configuration
const socket = io();
const STUN_SERVER = 'stun:stun.l.google.com:19302';

// DOM elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const roomIdElement = document.getElementById('roomId');
const statusElement = document.getElementById('status');
const roomFullOverlay = document.getElementById('roomFullOverlay');
const waitingOverlay = document.getElementById('waitingOverlay');
const shareUrlInput = document.getElementById('shareUrl');

// State variables
let localStream = null;
let peerConnection = null;
let roomId = null;
let isInitiator = false;
let remoteUserId = null;

// Get room ID from URL
function getRoomId() {
    const path = window.location.pathname;
    const roomId = path.substring(1); // Remove leading slash
    return roomId || 'default';
}

// Initialize the application
async function init() {
    try {
        roomId = getRoomId();
        roomIdElement.textContent = `Room: ${roomId}`;
        
        // Set share URL
        shareUrlInput.value = window.location.href;
        
        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        // Display local video
        localVideo.srcObject = localStream;
        
        // Join room
        socket.emit('join-room', roomId);
        
        console.log('Initialized video call app');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        statusElement.textContent = 'Error: Could not access camera/microphone';
        statusElement.style.color = '#f44336';
    }
}

// Create RTCPeerConnection
function createPeerConnection() {
    const configuration = {
        iceServers: [
            { urls: STUN_SERVER }
        ]
    };
    
    peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream tracks to peer connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
    
    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
        console.log('Received remote stream');
        remoteVideo.srcObject = event.streams[0];
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate && remoteUserId) {
            console.log('Sending ICE candidate to:', remoteUserId);
            socket.emit('signal', {
                type: 'ice-candidate',
                candidate: event.candidate,
                target: remoteUserId
            });
        }
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
            statusElement.textContent = 'Connected';
            statusElement.style.color = '#4CAF50';
        } else if (peerConnection.connectionState === 'disconnected') {
            statusElement.textContent = 'Disconnected';
            statusElement.style.color = '#f44336';
        }
    };
    
    console.log('Created peer connection');
}

// Handle WebRTC offer/answer exchange
async function handleOffer(offer) {
    console.log('Received offer');
    
    if (!peerConnection) {
        createPeerConnection();
    }
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    console.log('Sending answer to:', remoteUserId);
    if (!remoteUserId) {
        console.error('No remote user ID set, cannot send answer');
        return;
    }
    socket.emit('signal', {
        type: 'answer',
        answer: answer,
        target: remoteUserId
    });
}

async function handleAnswer(answer) {
    console.log('Received answer');
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

async function handleIceCandidate(candidate) {
    console.log('Received ICE candidate');
    if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
}

// Copy URL to clipboard
function copyUrl() {
    shareUrlInput.select();
    document.execCommand('copy');
    
    const button = document.querySelector('.url-display button');
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    
    setTimeout(() => {
        button.textContent = originalText;
    }, 2000);
}

// Socket.io event handlers
socket.on('connect', () => {
    console.log('Connected to signaling server');
    statusElement.textContent = 'Connected to server';
});

socket.on('room-joined', (data) => {
    console.log('Joined room:', data);
    statusElement.textContent = `In room (${data.roomSize}/2 users)`;
    
    if (data.roomSize === 1) {
        // First user - wait for someone to join
        waitingOverlay.classList.remove('hidden');
        isInitiator = true;
    } else {
        // Second user - start connection
        waitingOverlay.classList.add('hidden');
        isInitiator = false;
        // Find the other user in the room
        socket.emit('get-room-users', roomId);
    }
});

socket.on('user-joined', (userId) => {
    console.log('User joined:', userId);
    statusElement.textContent = 'User joined - establishing connection...';
    waitingOverlay.classList.add('hidden');
    
    // Store the remote user ID
    remoteUserId = userId;
    
    if (isInitiator) {
        // Create offer
        createPeerConnection();
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                console.log('Sending offer to:', remoteUserId);
                socket.emit('signal', {
                    type: 'offer',
                    offer: peerConnection.localDescription,
                    target: remoteUserId
                });
            })
            .catch(error => console.error('Error creating offer:', error));
    }
});

socket.on('user-left', (userId) => {
    console.log('User left:', userId);
    statusElement.textContent = 'User left';
    statusElement.style.color = '#f44336';
    
    // Clean up peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    // Clear remote video and user ID
    remoteVideo.srcObject = null;
    remoteUserId = null;
    
    // Show waiting overlay if we're still in the room
    waitingOverlay.classList.remove('hidden');
});

socket.on('room-users', (users) => {
    console.log('Room users:', users);
    if (users.length > 0) {
        remoteUserId = users[0]; // Get the first other user
        console.log('Set remote user ID to:', remoteUserId);
        createPeerConnection();
    }
});

socket.on('room-full', () => {
    console.log('Room is full');
    roomFullOverlay.classList.remove('hidden');
    statusElement.textContent = 'Room is full';
    statusElement.style.color = '#f44336';
});

socket.on('signal', (data) => {
    console.log('Received signal:', data.type);
    
    switch (data.type) {
        case 'offer':
            handleOffer(data.offer);
            break;
        case 'answer':
            handleAnswer(data.answer);
            break;
        case 'ice-candidate':
            handleIceCandidate(data.candidate);
            break;
        default:
            console.warn('Unknown signal type:', data.type);
    }
});

socket.on('disconnect', () => {
    console.log('Disconnected from signaling server');
    statusElement.textContent = 'Disconnected from server';
    statusElement.style.color = '#f44336';
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
        peerConnection.close();
    }
});

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', init); 