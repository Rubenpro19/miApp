import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/styles_dashboard";
import { cerrarSesion } from "../src/services/auth";
import WebDrawerLayout from "../components/WebDrawerLayout";
import { MaterialIcons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { obtenerUsuario } from '../src/services/user';
import { obtenerTurnoReservadoPaciente } from '../src/services/turnos';
import { obtenerUsuarioPorId } from '../src/services/user';

const Dashboard = ({ navigation }) => {
    const [usuario, setUsuario] = useState(null);
    const [turnoReservado, setTurnoReservado] = useState(null);
    const [cargandoTurno, setCargandoTurno] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [nutricionistaDetalle, setNutricionistaDetalle] = useState(null);
    const [cargandoNutri, setCargandoNutri] = useState(false);

    useEffect(() => {
        const cargarUsuarioYTurno = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.replace('Login');
                    return;
                }

                const data = await obtenerUsuario(token);
                setUsuario(data);
                await AsyncStorage.setItem('usuario', JSON.stringify(data));

                setCargandoTurno(true);
                const turno = await obtenerTurnoReservadoPaciente();
                setTurnoReservado(turno);
                setCargandoTurno(false);
            } catch (error) {
                setCargandoTurno(false);
                setTurnoReservado(null);
                // Solo redirigir si el error es de autenticación
                if (error?.response?.status === 401 || error?.response?.status === 403) {
                    navigation.replace('Login');
                }
                // Si es 404 (no hay turno reservado), solo mostrar mensaje, no redirigir
            }
        };
        cargarUsuarioYTurno();
    }, []);

    // Mostrar modal con detalles del turno y nutricionista
    const handleVerDetalleTurno = async () => {
        if (!turnoReservado || !turnoReservado.nutricionista_id) return;
        setModalVisible(true);
        setCargandoNutri(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const nutri = await obtenerUsuarioPorId(turnoReservado.nutricionista_id, token);
            setNutricionistaDetalle(nutri);
        } catch (e) {
            setNutricionistaDetalle({ error: 'No se pudo obtener el nutricionista' });
        } finally {
            setCargandoNutri(false);
        }
    };

    // Estilo visual igual al de ListarTurnos
    const renderTurnoReservado = () => {
        if (cargandoTurno) {
            return <Text style={{ color: '#888', marginTop: 12, marginBottom: 8 }}>Cargando turno reservado...</Text>;
        }
        if (!turnoReservado) {
            return (
                <View style={{ marginTop: 12, marginBottom: 8 }}>
                    <Text style={{ color: '#888', marginBottom: 4 }}>No tienes ningún turno reservado actualmente.</Text>
                </View>
            );
        }
        let bgColor = '#d0f5e8';
        let icon = 'calendar-lock';
        let iconColor = '#388e3c';
        let textColor = '#388e3c';
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleVerDetalleTurno}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: bgColor,
                    borderRadius: 10,
                    marginTop: 12,
                    marginBottom: 8,
                    padding: 12,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                }}
            >
                <MaterialCommunityIcons name={icon} size={28} color={iconColor} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: textColor, fontSize: 16 }}>{(turnoReservado.hora_inicio || '').slice(0, 5)} - {(turnoReservado.hora_fin || '').slice(0, 5)}</Text>
                    <Text style={{ color: textColor, fontSize: 14 }}>Estado: {turnoReservado.estado}</Text>
                    {turnoReservado.nutricionista_name && (
                        <Text style={{ color: textColor, fontSize: 14 }}>Nutricionista: {turnoReservado.nutricionista_name}</Text>
                    )}
                    {turnoReservado.dia && (
                        <Text style={{ color: textColor, fontSize: 14 }}>Fecha: {turnoReservado.dia}</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const sections = [
        { label: "Perfil", icon: "account-circle", onPress: () => navigation.navigate('Perfil') },
        { label: "Cerrar sesión", icon: "logout", onPress: async () => await cerrarSesion(navigation) },
    ];

    const content = (
        <ScrollView contentContainerStyle={styles.formulario} keyboardShouldPersistTaps="handled">
            <View style={styles.containerInterno}>
                <Text style={styles.title}>Bienvenido/a, Paciente {usuario?.name}</Text>
                <Text style={styles.label}>
                    <MaterialCommunityIcons name="email" size={18} color="#555" /> Correo: {usuario?.email}
                </Text>
                <Text style={styles.label}>
                    <MaterialCommunityIcons name="calendar" size={18} color="#555" /> Aquí puedes gestionar tus citas.
                </Text>
                {renderTurnoReservado()}
            </View>
            {/* Modal de detalle del turno */}
            {modalVisible && (
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 320, alignItems: 'center', elevation: 6 }}>
                        <MaterialCommunityIcons name="information" size={38} color="#1976d2" style={{ marginBottom: 8 }} />
                        <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#1976d2', marginBottom: 10, textAlign: 'center' }}>Detalle del turno</Text>
                        {turnoReservado && (
                            <>
                                <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Hora:</Text> {(turnoReservado.hora_inicio || '').slice(0, 5)} - {(turnoReservado.hora_fin || '').slice(0, 5)}</Text>
                                <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Estado:</Text> {turnoReservado.estado}</Text>
                                {turnoReservado.dia && (
                                    <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Fecha:</Text> {turnoReservado.dia}</Text>
                                )}
                                {cargandoNutri ? (
                                    <Text style={{ marginBottom: 4, color: '#888' }}>Cargando nutricionista...</Text>
                                ) : nutricionistaDetalle && !nutricionistaDetalle.error ? (
                                    <>
                                        <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Nutricionista:</Text> {nutricionistaDetalle.name}</Text>
                                        <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Correo:</Text> {nutricionistaDetalle.email}</Text>
                                    </>
                                ) : (
                                    <Text style={{ marginBottom: 4, color: '#888' }}>No hay información del nutricionista.</Text>
                                )}
                            </>
                        )}
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            style={{ backgroundColor: '#1976d2', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24, marginTop: 18 }}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            <View style={styles.cardSection}>
                <Text style={styles.sectionTitle}>Gestión de Citas</Text>

                <View style={styles.actionsContainer}>
                    <ActionCard
                        title="Reservar Cita"
                        icon="event-available"
                        onPress={() => navigation.navigate("ReservarCita")}
                    />
                    <ActionCard
                        title="Ver Historial de Citas"
                        icon="history"
                        onPress={() => navigation.navigate("HistorialCitas")}
                    />
                </View>
            </View>
        </ScrollView>
    );

    if (Platform.OS === "web") {
        return (
            <WebDrawerLayout navigation={navigation} title="Panel de Paciente" sections={sections}>
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

export default Dashboard;