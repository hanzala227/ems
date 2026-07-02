const { io } = require('socket.io-client');
const axios = require('axios');

async function test() {
  try {
    // login
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'techcorp@ex.com',
      password: 'Password123!'
    });
    const cookie = res.headers['set-cookie'][0];
    
    // connect
    const socket = io('http://localhost:5000', {
      extraHeaders: {
        Cookie: cookie
      }
    });

    socket.on('connect', () => {
      console.log('Connected!', socket.id);
      
      // try sending a message
      socket.emit('message:send', {
        recipientId: '668400000000000000000000', // invalid but should fail gracefully
        content: 'Test message',
      });
    });

    socket.on('message:sent', (msg) => console.log('Message sent:', msg));
    socket.on('message:error', (err) => console.log('Message error:', err));
    
    setTimeout(() => {
      socket.disconnect();
      process.exit(0);
    }, 3000);
  } catch (err) {
    console.error(err.message);
  }
}
test();
