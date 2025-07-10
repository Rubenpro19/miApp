import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Platform, Alert } from 'react-native';
import styles from '../styles/styles_formularios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { iniciarSesion } from '../src/services/auth';
import { mostrarAlerta } from '../src/services/alerta';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
const Login = ({ navigation }) => {
    // Estados para manejar el email y la contraseña
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Función para redirigir al dashboard dependiendo de la plataforma
    const irADashboard = () => {
        if (Platform.OS === 'web') {
            navigation.replace("Dashboard");
        } else {
            navigation.replace("MainTabs");
        }
    };

    // Efecto para verificar si ya hay una sesión activa
    useEffect(() => {
        const verificarSesion = async () => {
            try {
                const usuario = await AsyncStorage.getItem('usuario');
                if (usuario) {
                    // Redirigir directamente si ya hay sesión
                    irADashboard();
                }
            } catch (error) {
                mostrarAlerta("Error verificando sesión:", error);
            }
        };
        verificarSesion();
    }, []);

    const irARegistro = () => {
        navigation.navigate("Registro");
    };

    const handleLogin = async () => {
        if (!email || !password) {
            mostrarAlerta("Campos requeridos", "Por favor llena todos los campos.");
            return;
        }

        try {
            const data = await iniciarSesion({ email, password });

            // Guardar el usuario y token en AsyncStorage
            await AsyncStorage.setItem('usuario', JSON.stringify(data.user));
            await AsyncStorage.setItem('token', data.token);

            //Una vez que el usuario se ha autenticado, redirigir al dashboard
            irADashboard();
        } catch (error) {
            mostrarAlerta("Error", error.message || "No se pudo iniciar sesión");
            console.error(error);
        }
    };

    return (
        <View style={styles.formulario}>
            <View style={styles.containerInterno}>
                <Text style={styles.title}>Iniciar Sesión</Text>

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

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Iniciar Sesión</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={irARegistro}>
                    <Text style={styles.link}>¿No tienes cuenta? ¡Regístrate!</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Login;
