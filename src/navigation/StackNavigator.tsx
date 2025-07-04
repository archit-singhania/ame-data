import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LandingScreen from '../screens/LandingScreen';
import LoginAdmin from '../screens/AdminLoginScreen';
import LoginDoctor from '../screens/DoctorLoginScreen';
import LoginPersonnel from '../screens/PersonnelLoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AMEStatus from '../screens/AMEStatus';
import LMCRecords from '../screens/LMCRecords';
import ReportsScreen from '../screens/ReportsScreen';
import AddVitalsScreen from '../screens/AddVitalsScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import RoleSelection from '@/screens/RoleSelection';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelection} />
        <Stack.Screen name="LoginAdmin" component={LoginAdmin} />
        <Stack.Screen name="LoginDoctor" component={LoginDoctor} />
        <Stack.Screen name="LoginPersonnel" component={LoginPersonnel} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="AMEStatus" component={AMEStatus} />
        <Stack.Screen name="LMCRecords" component={LMCRecords} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="AddVitals" component={AddVitalsScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
        <Stack.Screen name="Appointments" component={AppointmentsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}