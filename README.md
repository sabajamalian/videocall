# Video Call App

A simple 2-person peer-to-peer video call web application built with Node.js, Express, Socket.io, and WebRTC.

## Features

- **Peer-to-Peer Video Calls**: Direct connection between two participants using WebRTC
- **Room-based System**: Join specific rooms via URL (e.g., `/room123`)
- **2-Person Limit**: Maximum of 2 participants per room
- **Automatic Camera/Microphone**: Streams start automatically when joining
- **Real-time Signaling**: WebRTC signaling handled via Socket.io
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme UI**: Modern, clean interface

## Tech Stack

- **Backend**: Node.js + Express
- **Signaling**: Socket.io
- **Frontend**: HTML, CSS, Vanilla JavaScript
- **WebRTC**: Peer-to-peer video/audio streaming
- **STUN Server**: Google's free STUN server for NAT traversal

## Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to:
   ```
   http://localhost/room1
   ```

### Network Access (for others on your network)

To allow others on your local network to connect:

1. **Find your local IP address**:
   ```bash
   # Windows
   ipconfig | findstr "IPv4"
   
   # Mac/Linux
   ifconfig | grep "inet "
   ```

2. **Share the network URL** with others:
   ```
   http://YOUR_IP_ADDRESS/room1
   ```
   
   Example: `http://192.168.68.65/room1`

3. **Make sure your firewall allows connections** on port 80

## Usage

### Starting a Call

1. Open the application in your browser
2. Allow camera and microphone permissions when prompted
3. Share the URL with someone you want to call
4. When they join, the video call will automatically start

### Joining a Call

1. Click on the shared URL or navigate to a specific room
2. Allow camera and microphone permissions
3. The video call will automatically connect

### Room Management

- **Room URLs**: Access specific rooms by going to `/roomname` (e.g., `/room123`, `/meeting1`)
- **2-Person Limit**: Only 2 people can be in a room at the same time
- **Room Full**: If a third person tries to join, they'll see a "Room is Full" message
- **Automatic Cleanup**: Rooms are automatically deleted when empty

## File Structure

```
videocall/
├── server.js          # Express + Socket.io backend
├── package.json       # Dependencies and scripts
├── README.md          # This file
└── public/            # Frontend files
    ├── index.html     # Main HTML page
    ├── style.css      # Styling
    └── script.js      # WebRTC + Socket.io logic
```

## How It Works

### Backend (server.js)
- **Express Server**: Serves static files and handles HTTP requests
- **Socket.io**: Manages real-time communication between clients
- **Room Management**: Tracks users in rooms and enforces 2-person limit
- **Signaling**: Relays WebRTC offers, answers, and ICE candidates

### Frontend (script.js)
- **WebRTC Setup**: Creates peer connections with STUN server
- **Media Capture**: Gets camera and microphone streams
- **Signaling**: Exchanges connection information via Socket.io
- **UI Management**: Handles video display and status updates

### WebRTC Flow
1. User A joins room → waits for participant
2. User B joins room → triggers connection
3. User A creates offer → sends via Socket.io
4. User B receives offer → creates answer → sends back
5. ICE candidates exchanged → establishes P2P connection
6. Video/audio streams flow directly between peers

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## Security Notes

- Uses HTTPS in production (required for WebRTC)
- No TURN server (only STUN) - may not work in restrictive networks
- Camera/microphone access requires user permission
- No persistent data storage

## Troubleshooting

### Common Issues

1. **"Could not access camera/microphone"**
   - Check browser permissions
   - Ensure camera/microphone is not in use by another application

2. **"Room is Full"**
   - Only 2 people can be in a room at once
   - Try a different room name

3. **Connection issues**
   - Check firewall settings
   - Some networks may block WebRTC traffic
   - Try refreshing the page

4. **Video not showing**
   - Check browser console for errors
   - Ensure camera permissions are granted

### Development

- Check browser console for detailed logs
- Server logs show connection events and room status
- Use browser dev tools to inspect WebRTC connections

## License

MIT License - feel free to use and modify as needed. 