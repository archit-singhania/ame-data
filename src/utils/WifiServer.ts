import TcpSocket from 'react-native-tcp-socket';
import { importDatabase } from './dbSync';

export const startServer = () => {
  const server = TcpSocket.createServer((socket) => {
    let dataBuffer = '';

    socket.on('data', (data) => {
      dataBuffer += data.toString();
    });

    socket.on('close', () => {
      try {
        const jsonData = JSON.parse(dataBuffer);
        importDatabase(jsonData);
        console.log('✅ Data imported via Wi-Fi Direct');
      } catch (err) {
        console.error('❌ Invalid JSON received:', err);
      }
    });

    socket.on('error', (error) => {
      console.error('Server socket error:', error);
    });
  });

  server.listen({ port: 5555, host: '0.0.0.0' }, () => {
    console.log('📡 Server listening on port 5555');
  });

  return server;
};