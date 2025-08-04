import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Platform, ScrollView, ActivityIndicator } from "react-native";
import { registrarUsuario } from "../src/services/auth";
import { obtenerRoles } from "../src/services/rol";
import { cerrarSesion } from "../src/services/auth";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import styles from '../styles/styles_formularios';
import WebDrawerLayout from "../components/WebDrawerLayout";

const RegistroUsuario = ({ navigation }) => {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [rolesError, setRolesError] = useState("");
    const [roles_id, setRolesId] = useState(null); // ✅ cambiado de "id" a "roles_id"
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);
    const [password_confirmation, setPasswordConfirmation] = useState("");

    useEffect(() => {
        const cargarRoles = async () => {
            try {
                const rolesData = await obtenerRoles();
                setRoles(rolesData);
                if (rolesData.length > 0) setRolesId(rolesData[0].id);
            } catch (e) {
                setRolesError("No se pudieron cargar los roles");
            } finally {
                setRolesLoading(false);
            }
        };
        cargarRoles();
    }, []);

    const handleRegistro = async () => {
        setError("");
        setSuccess("");

        try {
            await registrarUsuario({
                name,
                email,
                password,
                password_confirmation,
                roles_id // ✅ nombre correcto esperado por el backend
            });
            setSuccess("Usuario registrado correctamente");
            setName(""); setEmail(""); setPassword(""); setPasswordConfirmation("");
            navigation.navigate("AdminUsuarios");
        } catch (e) {
            setError(e.message || "No se pudo registrar");
        }
    };

    const sections = [
        { label: "Perfil", icon: "account-circle", onPress: () => navigation.navigate('Perfil') },
        { label: "Cerrar sesión", icon: "logout", onPress: async () => await cerrarSesion(navigation) },
    ];

    const content = (
        <ScrollView>
            <View style={styles.formulario}>
                <View style={styles.containerInterno}>
                    <Text style={styles.title}>Registrar usuario</Text>

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

                    <Text style={styles.label}>Rol:</Text>
                    {rolesLoading ? (
                        <ActivityIndicator size="small" color="#4a90e2" style={{ marginVertical: 8 }} />
                    ) : rolesError ? (
                        <Text style={{ color: 'red', marginBottom: 8 }}>{rolesError}</Text>
                    ) : (
                        <View style={{ marginBottom: 16 }}>
                            {roles
                                .filter(r => r && r.id !== undefined && r.id !== null)
                                .map(r => (
                                    <TouchableOpacity
                                        key={String(r.id)}
                                        style={{
                                            padding: 8,
                                            backgroundColor: roles_id === r.id ? '#4a90e2' : '#eee',
                                            borderRadius: 6,
                                            marginBottom: 4
                                        }}
                                        onPress={() => setRolesId(r.id)}
                                    >
                                        <Text style={{ color: roles_id === r.id ? '#fff' : '#333', textAlign: 'center' }}>{r.nombre_rol}</Text>
                                    </TouchableOpacity>
                                ))}
                        </View>
                    )}

                    {error ? <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text> : null}
                    {success ? <Text style={{ color: 'green', marginTop: 8 }}>{success}</Text> : null}

                    <TouchableOpacity style={styles.button} onPress={handleRegistro}>
                        <Text style={styles.buttonText}>Registrar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.link}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    if (Platform.OS === "web") {
        return (
            <WebDrawerLayout navigation={navigation} title="Panel de Administración" sections={sections}>
                {content}
            </WebDrawerLayout>
        );
    }

    return content;
};

export default RegistroUsuario;
