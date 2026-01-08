import TcpSocket from 'react-native-tcp-socket';
import { exportDatabase } from './dbSync';

export const sendDataToHost = async (hostAddress: string) => {
  const exportData = await exportDatabase(true); 
  const client = TcpSocket.createConnection({ port: 5555, host: hostAddress }, () => {
    client.write(JSON.stringify(exportData));
    client.end(); 
    console.log('✅ Data sent to host');
  });

  client.on('error', (error) => {
    console.error('Client socket error:', error);
  });
};