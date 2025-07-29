import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/styles_dashboard";
import { cerrarSesion } from "../src/services/auth";
import WebDrawerLayout from "../components/WebDrawerLayout";
import { MaterialIcons } from "@expo/vector-icons";
import { obtenerUsuario } from '../src/services/user';

const ReservarCita = ({ navigation }) => {
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

    // Datos quemados
    const nutricionistas = [
        { id: 1, nombre: "Dr. Juan Pérez" },
        { id: 2, nombre: "Dra. Ana Torres" }
    ];
    const turnos = [
        { id: 1, fecha: "25/07/2025", hora: "10:30 AM" },
        { id: 2, fecha: "25/07/2025", hora: "12:00 PM" }
    ];

    const [nutriSel, setNutriSel] = useState(null);
    const [turnoSel, setTurnoSel] = useState(null);

    const content = (
        <ScrollView contentContainerStyle={styles.formulario} keyboardShouldPersistTaps="handled">
            <View style={styles.containerInterno}>
                <Text style={styles.title}>Reservar Cita</Text>
                <View style={{ marginTop: 24 }}>
                    <Text style={styles.label}>Selecciona un nutricionista:</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                        {nutricionistas.map(n => (
                            <TouchableOpacity
                                key={n.id}
                                style={{
                                    backgroundColor: nutriSel?.id === n.id ? '#4a90e2' : '#eee',
                                    padding: 10,
                                    borderRadius: 8,
                                    minWidth: 120
                                }}
                                onPress={() => { setNutriSel(n); setTurnoSel(null); }}
                            >
                                <Text style={{ color: nutriSel?.id === n.id ? '#fff' : '#333', textAlign: 'center' }}>{n.nombre}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {nutriSel && (
                        <>
                            <Text style={styles.label}>Selecciona un turno disponible:</Text>
                            <View style={{ gap: 8, marginBottom: 16 }}>
                                {turnos.map(t => (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={{
                                            backgroundColor: turnoSel?.id === t.id ? '#4a90e2' : '#eee',
                                            padding: 10,
                                            borderRadius: 8,
                                            marginBottom: 4
                                        }}
                                        onPress={() => setTurnoSel(t)}
                                    >
                                        <Text style={{ color: turnoSel?.id === t.id ? '#fff' : '#333', textAlign: 'center' }}>{t.fecha} - {t.hora}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}
                    {nutriSel && turnoSel && (
                        <View style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Turno seleccionado:</Text>
                            <Text>Nutricionista: {nutriSel.nombre}</Text>
                            <Text>Fecha: {turnoSel.fecha}</Text>
                            <Text>Hora: {turnoSel.hora}</Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity style={[styles.button, { marginTop: 32, opacity: nutriSel && turnoSel ? 1 : 0.5 }]} disabled>
                    <Text style={styles.buttonText}>Reservar</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    if (Platform.OS === "web") {
        return (
            <WebDrawerLayout navigation={navigation} title="Reservar Citas" sections={sections}>
                {content}
            </WebDrawerLayout>
        );
    }

    return content;
};

export default ReservarCita;