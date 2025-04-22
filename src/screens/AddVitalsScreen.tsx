import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export default function AddVitalsScreen() {
  const navigation = useNavigation();

  const [heartRate, setHeartRate] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [temperature, setTemperature] = useState('');
  const [oxygenLevel, setOxygenLevel] = useState('');

  const handleSubmit = () => {
    console.log({
      heartRate,
      bloodPressure,
      temperature,
      oxygenLevel,
    });

    navigation.goBack(); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Add Vitals</Text>
      <TextInput
        label="Heart Rate (bpm)"
        value={heartRate}
        onChangeText={setHeartRate}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        label="Blood Pressure (e.g. 120/80)"
        value={bloodPressure}
        onChangeText={setBloodPressure}
        style={styles.input}
      />
      <TextInput
        label="Temperature (°C)"
        value={temperature}
        onChangeText={setTemperature}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        label="Oxygen Level (%)"
        value={oxygenLevel}
        onChangeText={setOxygenLevel}
        style={styles.input}
        keyboardType="numeric"
      />
      <Button mode="contained" onPress={handleSubmit}>
        Submit
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 15,
  },
});
