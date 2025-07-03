import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import StackNavigator from './src/navigation/StackNavigator';

export default function App() {
  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <StackNavigator />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});