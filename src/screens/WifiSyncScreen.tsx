import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import WifiP2p from 'react-native-wifi-p2p';
import { startServer } from '../utils/WifiServer';
import { sendDataToHost } from '../utils/WifiClient';

export default function WifiSyncScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'android') {
        await requestPermissions();
      }

      try {
        await WifiP2p.initialize();
        console.log('WiFi P2P initialized');

        const peers = await WifiP2p.getAvailablePeers();
        setDevices(peers?.devices ?? []);
      } catch (err) {
        console.error('P2P Init Error:', err);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const server = startServer(); // start listening
    return () => {
        server.close(); // clean up on unmount
    };
    }, []);


  const requestPermissions = async () => {
    try {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
      ]);
    } catch (err) {
      console.error('Permission error:', err);
    }
  };

  const discoverPeers = async () => {
    try {
      setIsDiscovering(true);
      await WifiP2p.startDiscoveringPeers();
      const peers = await WifiP2p.getAvailablePeers();
      setDevices(peers?.devices ?? []);
      Alert.alert('Discovery completed');
    } catch (err) {
      console.error('Discovery failed:', err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const connectToDevice = async (device: any) => {
    try {
        await WifiP2p.connect(device.deviceAddress);
        Alert.alert('Connected to', device.deviceName);

        // 🔄 Send data after connection (use IP of host device)
        sendDataToHost(device.deviceAddress); 
    } catch (err) {
        Alert.alert('Connection failed', (err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Wi-Fi Direct Sync</Text>

      <Button title="Discover Peers" onPress={discoverPeers} disabled={isDiscovering} />

      <FlatList
        data={devices}
        keyExtractor={(item) => item.deviceAddress}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.deviceItem} onPress={() => connectToDevice(item)}>
            <Text>{item.deviceName || 'Unknown'}</Text>
            <Text style={styles.address}>{item.deviceAddress}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  deviceItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  address: {
    fontSize: 12,
    color: '#666',
  },
});
