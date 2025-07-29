import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/styles_dashboard";
import { cerrarSesion } from "../src/services/auth";
import WebDrawerLayout from "../components/WebDrawerLayout";
import { MaterialIcons } from "@expo/vector-icons";
import { obtenerUsuario } from '../src/services/user';

const Nutricionista = ({ navigation }) => {
    const [usuario, setUsuario] = useState(null);

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

    const sections = [
        { label: "Perfil", icon: "account-circle", onPress: () => navigation.navigate('Perfil') },
        { label: "Cerrar sesión", icon: "logout", onPress: async () => await cerrarSesion(navigation) },
    ];

    const content = (
        <ScrollView contentContainerStyle={styles.formulario} keyboardShouldPersistTaps="handled">
            <View style={styles.containerInterno}>
                <Text style={styles.title}>Bienvenido/a, Nutricionista</Text>
                <Text style={styles.label}>Correo: {usuario?.email}</Text>
                <Text style={styles.label}>Aquí puedes gestionar sus turnos</Text>
            </View>

            <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>Gestión de Turnos</Text>

                <View style={styles.actionsContainer}>
                    <ActionCard
                        title="Generar Turnos"
                        icon="event-available"
                        onPress={() => navigation.navigate("GenerarTurnos")}
                    />
                    <ActionCard
                        title="Ver Turnos"
                        icon="calendar-today"
                        onPress={() => navigation.navigate("VerTurnos")}
                    />
                </View>
            </View>
        </ScrollView>
    );

    if (Platform.OS === "web") {
        return (
            <WebDrawerLayout navigation={navigation} title="Panel de Nutricionista" sections={sections}>
                {content}
            </WebDrawerLayout>
        );
    }

    return content;
};

const ActionCard = ({ title, icon, onPress }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
        <MaterialIcons name={icon} size={32} color="#fff" />
        <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
);

export default Nutricionista;