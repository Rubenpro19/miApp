import React, { useEffect, useState } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Appbar, Drawer, Portal, Modal } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/styles_dashboard';
import { cerrarSesion } from '../src/services/auth';
import { actualizarUsuario } from '../src/services/auth';
import { mostrarAlerta } from '../src/services/alerta';

const Perfil = ({ navigation }) => {
    const [drawerVisible, setDrawerVisible] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password_confirmation, setPasswordConfirmation] = useState('');
    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        const cargarUsuario = async () => {
            try {
                const usuarioGuardado = await AsyncStorage.getItem('usuario');
                if (usuarioGuardado) {
                    const usuarioObj = JSON.parse(usuarioGuardado);
                    setUsuario(usuarioObj);
                    setName(usuarioObj.name || '');
                    setEmail(usuarioObj.email || '');
                } else {
                    navigation.replace('Login');
                }
            } catch (error) {
                console.error("Error al cargar usuario:", error);
                navigation.replace('Login');
            }
        };

        cargarUsuario();
    }, []);


    const handleGuardar = async () => {
        if (!name || !email) {
            mostrarAlerta("Campos requeridos", "Nombre y correo no pueden estar vacíos");
            return;
        }

        // Validar contraseñas solo si el usuario las escribió
        if ((password || password_confirmation) && password !== password_confirmation) {
            mostrarAlerta("Error", "Las contraseñas no coinciden");
            return;
        }
        try {
            const token = await AsyncStorage.getItem('token');
            // Construir el payload dinámicamente
            const payload = { name, email };
            if (password) {
                payload.password = password;
                payload.password_confirmation = password_confirmation;
            }
            const data = await actualizarUsuario(payload, token);

            // Actualizar usuario en estado y en almacenamiento
            setUsuario(data.user);
            await AsyncStorage.setItem('usuario', JSON.stringify(data.user));

            mostrarAlerta("Éxito", "Datos actualizados correctamente");
            
            // Limpiar campos de contraseña después de actualizar
            setPassword("");
            setPasswordConfirmation("");
        } catch (error) {
            if (error.response?.data?.errors) {
                const primerCampo = Object.keys(error.response.data.errors)[0];
                mostrarAlerta("Error", error.response.data.errors[primerCampo][0]);
            } else {
                mostrarAlerta("Error", error.message || "No se pudo actualizar");
            }
            console.error("Error al actualizar:", error);
        }
    };

    return (
        <View style={styles.root}>
            {Platform.OS === 'web' && (
                <>
                    <Appbar.Header>
                        <Appbar.Action
                            icon="menu"
                            onPress={() => setDrawerVisible(true)}
                        />
                        <Appbar.Content title="Perfil" />
                    </Appbar.Header>

                    <Portal>
                        <Modal
                            visible={drawerVisible}
                            onDismiss={() => setDrawerVisible(false)}
                            contentContainerStyle={styles.drawerContainer}
                        >
                            <Drawer.Section>
                                <Drawer.Item
                                    icon="view-dashboard"
                                    label="Dashboard"
                                    onPress={() => {
                                        setDrawerVisible(false);
                                        navigation.navigate('Dashboard');
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
                    <Text style={styles.title}>Perfil de Usuario</Text>
                    <Text style={styles.label}>Nombre:</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={styles.label}>Correo:</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ingrese su contraseña"
                        secureTextEntry
                        autoCapitalize="none"
                        value={password}
                        onChangeText={setPassword}
                    />

                    <Text style={styles.label}>Confirme su contraseña:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Repita su contraseña"
                        secureTextEntry
                        autoCapitalize="none"
                        value={password_confirmation}
                        onChangeText={setPasswordConfirmation}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleGuardar}>
                        <Text style={styles.buttonText}>Guardar Cambios</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default Perfil;