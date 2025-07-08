import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import Login from '../views/Login';
import Registro from '../views/Registro';
import Dashboard from '../views/Dashboard';
import Perfil from '../views/Perfil';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = 'view-dashboard';
                    if (route.name === 'Perfil') iconName = 'account';
                    if (route.name === 'Cerrar sesión') iconName = 'logout';
                    return <Icon name={iconName} color={color} size={size} />;
                },
                tabBarActiveTintColor: '#4a90e2',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            <Tab.Screen name="Dashboard" component={Dashboard} />
            <Tab.Screen name="Perfil" component={Perfil} />
        </Tab.Navigator>
    );
}

export default function Router() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="Registro" component={Registro} />
                <Stack.Screen
                    name={Platform.OS === 'web' ? 'Dashboard' : 'MainTabs'}
                    component={Platform.OS === 'web' ? Dashboard : MainTabs}
                />
                {Platform.OS === 'web' && (
                    <Stack.Screen name="Perfil" component={Perfil} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}