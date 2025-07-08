import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appbar, Drawer, Portal, Modal } from 'react-native-paper';
import styles from '../styles/styles_dashboard';
import { cerrarSesion } from '../src/services/auth';
import { obtenerUsuario } from '../src/services/auth';

const Dashboard = ({ navigation }) => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        const cargarUsuario = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.replace('Login');
                    return;
                }

                // Consultar el usuario desde el backend
                const data = await obtenerUsuario(token);
                setUsuario(data);

                // Actualizar el usuario en AsyncStorage
                await AsyncStorage.setItem('usuario', JSON.stringify(data));
            } catch (error) {
                console.error("Error al cargar usuario actualizado:", error);
                navigation.replace('Login');
            }
        };

        cargarUsuario();
    }, []);

    const irAPerfil = () => {
        navigation.navigate("Perfil");
    };


    return (
        <View style={styles.root}>
            {/* Menú lateral solo en web */}
            {Platform.OS === 'web' && (
                <>
                    <Appbar.Header>
                        <Appbar.Action
                            icon="menu"
                            onPress={() => setDrawerVisible(true)}
                        />
                        <Appbar.Content title="Dashboard" />
                    </Appbar.Header>

                    <Portal>
                        <Modal
                            visible={drawerVisible}
                            onDismiss={() => setDrawerVisible(false)}
                            contentContainerStyle={styles.drawerContainer}
                        >
                            <Drawer.Section>
                                <Drawer.Item
                                    icon="account"
                                    label="Perfil"
                                    onPress={() => {
                                        setDrawerVisible(false);
                                        navigation.navigate('Perfil');
                                    }}
                                />
                                <Drawer.Item
                                    icon="logout"
                                    label="Cerrar sesión"
                                    onPress={async () => {
                                        setDrawerVisible(false);
                                        await cerrarSesion(navigation);
                                    }}
                                />
                            </Drawer.Section>
                        </Modal>
                    </Portal>
                </>
            )}

            <View style={styles.formulario}>
                <View style={styles.containerInterno}>
                    <Text style={styles.title}>¡Bienvenido/a {usuario?.name}!</Text>
                    <Text style={styles.label}>Correo: {usuario?.email}</Text>
                    <Text style={styles.label}>Este es tu panel personal</Text>
                    <TouchableOpacity style={styles.button} onPress={irAPerfil}>
                        <Text style={styles.buttonText}>Ir al perfil</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default Dashboard;
