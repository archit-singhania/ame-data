import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import StackNavigator from './src/navigation/StackNavigator';

export default function App() {
  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Welcome to HealthSync</Text>
      </SafeAreaView>
      <StackNavigator />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007aff',
  },
});
