import React, { useState } from 'react';
import { Alert, StyleSheet, ScrollView, View, TextInput, TouchableOpacity, Text, Platform } from 'react-native';
import styles from '../styles/styles_formularios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registrarUsuario } from '../src/services/auth';
import { mostrarAlerta } from '../src/services/alerta';

const Registro = ({ navigation }) => {
    // Estados para los campos del formulario
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password_confirmation, setPasswordConfirmation] = useState('');

    const irALogin = () => {
        navigation.navigate("Login");
    };

    const handleRegistro = async () => {
        if (!name || !email || !password || !password_confirmation) {
            mostrarAlerta("Campos requeridos", "Por favor llena todos los campos.");
            return;
        }

        if (password !== password_confirmation) {
            mostrarAlerta("Contraseñas no coinciden", "Verifica que ambas contraseñas sean iguales.");
            return;
        }

        try {
            const data = await registrarUsuario({
                name,
                email,
                password,
                password_confirmation,
            });

            // Guardar sesión
            await AsyncStorage.setItem('usuario', JSON.stringify(data.user));
            await AsyncStorage.setItem('token', data.token);

            // Redirigir al dashboard dependiendo de la plataforma
            if (Platform.OS === 'web') {
                navigation.replace("Dashboard");
            } else {
                navigation.replace("MainTabs");
            }

        } catch (error) {
            if (error.errors) {
                const primerCampo = Object.keys(error.errors)[0];
                mostrarAlerta("Error", error.errors[primerCampo][0]);
            } else {
                mostrarAlerta("Error", error.message || "No se pudo registrar");
            }
            console.error(error);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.formulario} keyboardShouldPersistTaps="handled">
            <View style={styles.containerInterno}>
                <Text style={styles.title}>Registrarse</Text>

                <Text style={styles.label}>Nombre:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingrese su nombre"
                    value={name}
                    onChangeText={setName}
                />

                <Text style={styles.label}>Correo electrónico:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingrese su correo"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                <Text style={styles.label}>Contraseña:</Text>
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

                <TouchableOpacity style={styles.button} onPress={handleRegistro}>
                    <Text style={styles.buttonText}>Registrarse</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={irALogin}>
                    <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default Registro;


