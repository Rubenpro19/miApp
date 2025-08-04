import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/styles_dashboard";
import { cerrarSesion } from "../src/services/auth";
import WebDrawerLayout from "../components/WebDrawerLayout";
import { MaterialIcons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { obtenerUsuario } from '../src/services/user';

const AdminUsuarios = ({ navigation }) => {
    const [usuario, setUsuario] = useState(null);
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        const cargarUsuario = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.replace('Login');
                    return;
                }

                const data = await obtenerUsuario(token);
                setUsuario(data);
                await AsyncStorage.setItem('usuario', JSON.stringify(data));
            } catch (error) {
                console.error("Error al cargar usuario:", error);
                navigation.replace('Login');
            }
        };
        cargarUsuario();
    }, []);

    // Animación de fade-in al montar
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
        }).start();
    }, []);

    const sections = [
        { label: "Perfil", icon: "account-circle", onPress: () => navigation.navigate('Perfil') },
        { label: "Cerrar sesión", icon: "logout", onPress: async () => await cerrarSesion(navigation) },
    ];

    const content = (
        <ScrollView contentContainerStyle={styles.formulario} keyboardShouldPersistTaps="handled">
            <Animated.View style={[styles.containerInterno, { opacity: fadeAnim }]}> 
                <MaterialCommunityIcons name="account-tie" size={54} color="#1976d2" style={{ marginBottom: 8, textAlign: 'center' }} />
                {usuario?.name && (
                    <View style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: '#e3f2fd',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'absolute',
                        top: -32,
                        right: 16,
                        borderWidth: 2,
                        borderColor: '#1976d2',
                        shadowColor: '#1976d2',
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        elevation: 3,
                    }}>
                        <Text style={{ fontWeight: 'bold', color: '#1976d2', fontSize: 24 }}>
                            {usuario.name[0]}
                        </Text>
                    </View>
                )}
                <Text style={styles.title}>
                    <MaterialCommunityIcons name="crown" size={22} color="#1976d2" /> Bienvenido/a, Administrador
                </Text>
                <Text style={styles.label}>
                    <MaterialCommunityIcons name="email" size={18} color="#555" /> Correo: {usuario?.email}
                </Text>
                <Text style={styles.label}>
                    <MaterialCommunityIcons name="account-group" size={18} color="#555" /> Aquí puedes gestionar a los usuarios registrados.
                </Text>
            </Animated.View>

            {/* Sección de Gestión de Usuarios */}
            <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>
                    <MaterialCommunityIcons name="account-multiple" size={20} color="#1976d2" /> Gestión de Usuarios
                </Text>
                <View style={styles.actionsContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                        <ActionCard
                            title="Registrar Usuario"
                            icon="person-add"
                            onPress={() => navigation.navigate("RegistroUsuario")}
                        />
                        <ActionCard
                            title="Ver Usuarios"
                            icon="list"
                            onPress={() => navigation.navigate("ListarUsuarios")}
                        />
                    </View>
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

const ActionCard = ({ title, icon, onPress }) => (
    <Animated.View style={{ opacity: 0.95, width: '48%' }}>
        <TouchableOpacity
            style={[styles.actionCard, { width: '100%', height: 110, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }]}
            activeOpacity={0.85}
            onPress={onPress}
        >
            <MaterialIcons name={icon} size={36} color="#fff" style={{ marginBottom: 4 }} />
            <Text style={[styles.actionText, { fontSize: 17 }]}>{title}</Text>
        </TouchableOpacity>
    </Animated.View>
);

export default AdminUsuarios;
