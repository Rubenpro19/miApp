import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import Login from '../views/Login';
import Registro from '../views/Registro';
import Dashboard from '../views/Dashboard';
import Perfil from '../views/Perfil';
import AdminUsuarios from '../views/AdminUsuarios';
import RegistroUsuario from "../views/RegistroUsuario";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ListarUsuarios from '../views/ListarUsuarios';
import ReservarCita from '../views/ReservarCita';
import Nutricionista from '../views/Nutricionista';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function LogoutTab({ navigation }) {
    React.useEffect(() => {
        import('../src/services/auth').then(({ cerrarSesion }) => {
            cerrarSesion(navigation);
        });
    }, [navigation]);
    return null;
}

function MainTabs() {
    const [rol, setRol] = useState(undefined);
    useEffect(() => {
        AsyncStorage.getItem('usuario').then(u => {
            if (u) {
                const userObj = JSON.parse(u);
                setRol(userObj.roles_id);
            } else {
                setRol(null);
            }
        });
    }, []);

    if (rol === undefined) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4a90e2" />
            </View>
        );
    }

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'AdminUsuarios') iconName = 'account-group';
                    if (route.name === 'Dashboard') iconName = 'view-dashboard';
                    if (route.name === 'Nutricionista') iconName = 'account-heart';
                    if (route.name === 'Perfil') iconName = 'account';
                    if (route.name === 'Cerrar sesión') iconName = 'logout';
                    if (route.name === 'RegistroUsuario') iconName = 'account-plus';
                    if (route.name === 'ListarUsuarios') iconName = 'account-multiple';
                    if (route.name === 'ReservarCita') iconName = 'calendar-plus';
                    return <Icon name={iconName} color={color} size={size} />;
                },
                tabBarActiveTintColor: '#4a90e2',
                tabBarInactiveTintColor: 'gray',
                headerShown: false,
            })}
        >
            {rol === 1 && (
                <>
                    <Tab.Screen name="AdminUsuarios" component={AdminUsuarios} />
                    <Tab.Screen name="RegistroUsuario" component={RegistroUsuario} />
                    <Tab.Screen name="ListarUsuarios" component={ListarUsuarios} />
                    <Tab.Screen name="Perfil" component={Perfil} />
                    <Tab.Screen name="Cerrar sesión" component={LogoutTab} />
                </>
            )}
            {rol === 2 && (
                <>
                    <Tab.Screen name="Nutricionista" component={Nutricionista} />
                    <Tab.Screen name="Perfil" component={Perfil} />
                    <Tab.Screen name="Cerrar sesión" component={LogoutTab} />
                </>
            )}
            {rol === 3 && (
                <>
                    <Tab.Screen name="Dashboard" component={Dashboard} />
                    <Tab.Screen name="ReservarCita" component={ReservarCita} />
                    <Tab.Screen name="Perfil" component={Perfil} />
                    <Tab.Screen name="Cerrar sesión" component={LogoutTab} />
                </>
            )}
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
                <Stack.Screen name="AdminUsuarios" component={AdminUsuarios} />
                {Platform.OS === 'web' && (
                    <Stack.Screen name="Perfil" component={Perfil} />
                )}
                <Stack.Screen name="RegistroUsuario" component={RegistroUsuario} />
                <Stack.Screen name="ListarUsuarios" component={ListarUsuarios} />
                <Stack.Screen name="ReservarCita" component={ReservarCita} />
                
                <Stack.Screen name="Nutricionista" component={Nutricionista} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}