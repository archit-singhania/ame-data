import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

type Report = {
  id: string;
  date: string;
  heartRate: string;
  bloodPressure: string;
  temperature: string;
  oxygenLevel: string;
};

export default function ReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        const stored = await AsyncStorage.getItem('vitals');
        const parsed: Report[] = stored ? JSON.parse(stored) : [];
        setReports(parsed);
      } catch (err) {
        console.error('Error fetching vitals:', err);
      }
    };

    const unsubscribe = navigation.addListener('focus', fetchVitals);
    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Health Reports</Text>
      {reports.length > 0 ? (
        reports.map((report) => (
          <Card key={report.id} style={styles.card}>
            <Card.Content>
              <Text style={styles.date}>Date: {report.date}</Text>
              <Text>Heart Rate: {report.heartRate} bpm</Text>
              <Text>Blood Pressure: {report.bloodPressure}</Text>
              <Text>Temperature: {report.temperature} °C</Text>
              <Text>Oxygen Level: {report.oxygenLevel}</Text>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text>No reports found.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  card: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
  },
  date: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
});
