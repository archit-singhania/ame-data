import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, Title, Paragraph } from 'react-native-paper';

export default function DashboardScreen({ navigation }: any) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Welcome to HealthSync</Text>

      <Card style={styles.card} onPress={() => navigation.navigate('Profile')}>
        <Card.Content>
          <Title>My Profile</Title>
          <Paragraph>View and update your personal info</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => navigation.navigate('AddVitals')}>
        <Card.Content>
          <Title>Add Vitals</Title>
          <Paragraph>Submit your daily health vitals</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => navigation.navigate('Reports')}>
        <Card.Content>
          <Title>Reports</Title>
          <Paragraph>View previous health reports</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card} onPress={() => alert('Appointments page coming')}>
        <Card.Content>
          <Title>Appointments</Title>
          <Paragraph>View or book upcoming appointments</Paragraph>
        </Card.Content>
      </Card>

      <Button mode="outlined" onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
        Logout
      </Button>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    marginBottom: 15,
    backgroundColor: '#fff',
    elevation: 3,
    borderRadius: 10,
  },
  logoutBtn: {
    marginTop: 20,
  },
});
