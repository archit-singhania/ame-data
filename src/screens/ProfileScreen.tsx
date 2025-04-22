import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, RadioButton } from 'react-native-paper';

export default function ProfileScreen() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('male');

  const handleSave = () => {
    console.log({ name, email, age, gender });
    alert('Profile updated!');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>My Profile</Text>

      <TextInput
        label="Name"
        mode="outlined"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        label="Email"
        mode="outlined"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        label="Age"
        mode="outlined"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Gender</Text>
      <RadioButton.Group onValueChange={setGender} value={gender}>
        <View style={styles.radioRow}>
          <RadioButton value="male" />
          <Text style={styles.radioLabel}>Male</Text>
          <RadioButton value="female" />
          <Text style={styles.radioLabel}>Female</Text>
          <RadioButton value="other" />
          <Text style={styles.radioLabel}>Other</Text>
        </View>
      </RadioButton.Group>

      <Button mode="contained" onPress={handleSave} style={styles.button}>
        Save Profile
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { marginBottom: 15 },
  label: { marginTop: 10, fontSize: 16, marginBottom: 5 },
  radioRow: { flexDirection: 'row', alignItems: 'center' },
  radioLabel: { marginRight: 15 },
  button: { marginTop: 20 },
});
