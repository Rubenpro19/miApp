import React, { useEffect, useState } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Appbar, Drawer, Portal, Modal } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '../styles/styles_dashboard';
import { cerrarSesion } from '../src/services/auth';
import { actualizarUsuario } from '../src/services/user';
import { mostrarAlerta } from '../src/services/alerta';
import WebDrawerLayout from "../components/WebDrawerLayout";
import { obtenerPersonaPorUsuario, crearPersona, actualizarPersona } from '../src/services/persona';

const Perfil = ({ navigation }) => {
    const [drawerVisible, setDrawerVisible] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password_confirmation, setPasswordConfirmation] = useState('');
    const [usuario, setUsuario] = useState(null);

    // Estados para los datos de persona
    const [cedula, setCedula] = useState('');
    const [fechaNacimiento, setFechaNacimiento] = useState('');
    const [direccion, setDireccion] = useState('');
    const [telefono, setTelefono] = useState('');
    const [personaId, setPersonaId] = useState(null); // Para saber si existe persona

    useEffect(() => {
        const cargarUsuario = async () => {
            try {
                const usuarioGuardado = await AsyncStorage.getItem('usuario');
                const token = await AsyncStorage.getItem('token');
                if (usuarioGuardado) {
                    const usuarioObj = JSON.parse(usuarioGuardado);
                    setUsuario(usuarioObj);
                    setName(usuarioObj.name || '');
                    setEmail(usuarioObj.email || '');
                    // Consultar datos de persona
                    const personas = await obtenerPersonaPorUsuario(usuarioObj.id, token);
                    // Si el backend retorna un array, buscar la persona del usuario
                    let miPersona = null;
                    if (Array.isArray(personas)) {
                        miPersona = personas.find(p => p.user_id === usuarioObj.id);
                    } else if (personas && personas.user_id === usuarioObj.id) {
                        miPersona = personas;
                    }
                    if (miPersona) {
                        setCedula(miPersona.cedula || '');
                        setFechaNacimiento(miPersona.fecha_nacimiento || '');
                        setDireccion(miPersona.direccion || '');
                        setTelefono(miPersona.telefono || '');
                        setPersonaId(miPersona.id);
                    }
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
            // Actualizar usuario
            const payload = { name, email };
            if (password) {
                payload.password = password;
                payload.password_confirmation = password_confirmation;
            }
            const data = await actualizarUsuario(payload, token);
            setUsuario(data.user);
            await AsyncStorage.setItem('usuario', JSON.stringify(data.user));

            // Guardar/actualizar persona
            const personaPayload = {
                cedula,
                fecha_nacimiento: fechaNacimiento,
                direccion,
                telefono,
            };
            let personaRes;
            if (personaId) {
                // Actualizar persona
                await actualizarPersona(personaId, personaPayload, token);
            } else {
                // Crear persona
                await crearPersona(personaPayload, token);
            }

            mostrarAlerta("Éxito", "Datos actualizados correctamente");
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

    const sections = [
        usuario?.roles_id === 1
            ? { label: "Panel de Administrador", icon: "account-group", onPress: () => navigation.navigate('AdminUsuarios') }
            : { label: "Dashboard", icon: "view-dashboard", onPress: () => navigation.navigate('Dashboard') },
        { label: "Cerrar sesión", icon: "logout", onPress: async () => await cerrarSesion(navigation) },
    ];

    const content = (
        <ScrollView>
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

                    {/* Campos de persona */}
                    <Text style={styles.label}>Cédula:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ingrese su cédula"
                        value={cedula}
                        onChangeText={setCedula}
                    />

                    <Text style={styles.label}>Fecha de nacimiento:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="AAAA-MM-DD"
                        value={fechaNacimiento}
                        onChangeText={setFechaNacimiento}
                    />

                    <Text style={styles.label}>Dirección:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ingrese su dirección"
                        value={direccion}
                        onChangeText={setDireccion}
                    />

                    <Text style={styles.label}>Teléfono:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ingrese su teléfono"
                        value={telefono}
                        onChangeText={setTelefono}
                    />

                    <TouchableOpacity style={styles.button} onPress={handleGuardar}>
                        <Text style={styles.buttonText}>Guardar Cambios</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    if (Platform.OS === "web") {
        return (
            <WebDrawerLayout navigation={navigation} title="Perfil" sections={sections}>
                {content}
            </WebDrawerLayout>
        );
    }

    return content;
};

export default Perfil;