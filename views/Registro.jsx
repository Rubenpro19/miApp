import React, { useState } from 'react';
import { Alert, StyleSheet, ScrollView, View, TextInput, TouchableOpacity, Text, Platform, ActivityIndicator } from 'react-native';
import styles from '../styles/styles_formularios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { registrarUsuario } from '../src/services/auth';
import { mostrarAlerta } from '../src/services/alerta';

const Registro = ({ navigation }) => {
    // Estados para los campos del formulario
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password_confirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    const [cargando, setCargando] = useState(false);

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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            mostrarAlerta("Correo inválido", "Por favor ingresa un correo electrónico válido.");
            return;
        }

        setCargando(true);
        try {
            const data = await registrarUsuario({
                name,
                email,
                password,
                password_confirmation,
            });

            // Guardar sesión
            await AsyncStorage.setItem('usuario', JSON.stringify(data.user));

            // Redirigir al dashboard dependiendo de la plataforma
            navigation.replace("Login");

        } catch (error) {
            if (error.errors) {
                const primerCampo = Object.keys(error.errors)[0];
                mostrarAlerta("Error", error.errors[primerCampo][0]);
            } else {
                mostrarAlerta("Error", error.message || "No se pudo registrar");
            }
            console.error(error);
        } finally {
            setCargando(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={[styles.formulario, styles.loginForm]} keyboardShouldPersistTaps="handled">
            <View style={[styles.containerInterno, styles.loginContainer]}>
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
                <View style={styles.inputPasswordContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ingrese su contraseña"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.iconPassword}
                    >
                        <Icon
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={24}
                            color="#888"
                        />
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Confirme su contraseña:</Text>
                <View style={styles.inputPasswordContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Repita su contraseña"
                        secureTextEntry={!showPassword2}
                        autoCapitalize="none"
                        value={password_confirmation}
                        onChangeText={setPasswordConfirmation}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword2(!showPassword2)}
                        style={styles.iconPassword}>
                        <Icon
                            name={showPassword2 ? 'eye-off' : 'eye'}
                            size={24}
                            color="#888"
                        />
                    </TouchableOpacity>
                </View>

                {cargando ? (
                    <View style={{ alignItems: 'center', marginVertical: 20 }}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={{ color: '#007AFF', marginTop: 8, fontWeight: 'bold' }}>Creando cuenta...</Text>
                    </View>
                ) : (
                    <TouchableOpacity style={[styles.button, styles.loginButton]} onPress={handleRegistro} activeOpacity={0.8}>
                        <Icon name="account-plus" size={22} color="#fff" />
                        <Text style={[styles.buttonText, styles.loginButtonText]}>Registrarse</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={irALogin}>
                    <Text style={[styles.link, styles.loginLink]}>¿Ya tienes cuenta? Inicia sesión</Text>
                </TouchableOpacity>
                
                <View style={styles.loginFooter}>
                    <Icon name="shield-lock" size={28} color="#007AFF" />
                    <Text style={styles.loginFooterText}>Tu información está protegida y cifrada.</Text>
                </View>
            </View>
        </ScrollView>
    );
};

export default Registro;


