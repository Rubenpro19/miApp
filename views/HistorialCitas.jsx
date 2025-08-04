import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/styles_dashboard";
import WebDrawerLayout from "../components/WebDrawerLayout";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { listarTurnosPacienteAutenticado } from '../src/services/turnos';
import { obtenerUsuarioPorId } from '../src/services/user';

const HistorialCitas = ({ navigation }) => {
    const [turnosFinalizados, setTurnosFinalizados] = useState([]);
    const [nutricionistas, setNutricionistas] = useState({}); // id -> datos
    const [cargando, setCargando] = useState(true);
    const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
        const ahora = new Date();
        const yyyy = ahora.getFullYear();
        const mm = String(ahora.getMonth() + 1).padStart(2, '0');
        const dd = String(ahora.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    });

    useEffect(() => {
        const cargarTurnosYNutricionistas = async () => {
            setCargando(true);
            try {
                const res = await listarTurnosPacienteAutenticado();
                const finalizados = (res.turnos || []).filter(t => t.estado === 'finalizado');
                setTurnosFinalizados(finalizados);
                // Precargar datos de nutricionistas
                const token = await AsyncStorage.getItem('token');
                const idsNutri = [...new Set(finalizados.map(t => t.nutricionista_id).filter(Boolean))];
                const nutriData = {};
                for (const id of idsNutri) {
                    try {
                        const nutri = await obtenerUsuarioPorId(id, token);
                        nutriData[id] = nutri;
                    } catch (e) {
                        nutriData[id] = { name: 'Desconocido', email: '-' };
                    }
                }
                setNutricionistas(nutriData);
            } catch (e) {
                setTurnosFinalizados([]);
                setNutricionistas({});
            } finally {
                setCargando(false);
            }
        };
        cargarTurnosYNutricionistas();
    }, []);

    const sections = [
        { label: "Dashboard", icon: "view-dashboard", onPress: () => navigation.navigate('Dashboard') },
        { label: "Reservar Cita", icon: "calendar-plus", onPress: () => navigation.navigate('ReservarCita') },
        { label: "Perfil", icon: "account-circle", onPress: () => navigation.navigate('Perfil') },
        { label: "Cerrar sesión", icon: "logout", onPress: async () => await cerrarSesion(navigation) },
    ];

    // Slider de fechas
    const cambiarDia = (dias) => {
        const partes = fechaSeleccionada.split('-');
        const fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        fecha.setDate(fecha.getDate() + dias);
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        setFechaSeleccionada(`${yyyy}-${mm}-${dd}`);
    };

    // Obtener nombre del día
    const getDiaSemana = (fechaStr) => {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const partes = fechaStr.split('-');
        const fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        return dias[fecha.getDay()];
    };

    // Filtrar turnos por fecha seleccionada
    const turnosFiltrados = turnosFinalizados.filter(t => {
        const fechaTurno = t.fecha || t.dia;
        return fechaTurno === fechaSeleccionada;
    });

    const renderTurno = (turno) => {
        const nutri = turno.nutricionista_id ? nutricionistas[turno.nutricionista_id] : null;
        return (
            <View
                key={turno.id}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#f3e9ff',
                    borderRadius: 10,
                    marginBottom: 10,
                    padding: 12,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                }}
            >
                <MaterialCommunityIcons name="calendar-check-outline" size={28} color="#8e24aa" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: '#8e24aa', fontSize: 16 }}>{(turno.hora_inicio || '').slice(0, 5)} - {(turno.hora_fin || '').slice(0, 5)}</Text>
                    <Text style={{ color: '#8e24aa', fontSize: 14 }}>Fecha: {turno.fecha || turno.dia || '-'}</Text>
                    {nutri && (
                        <>
                            <Text style={{ color: '#8e24aa', fontSize: 14 }}>Nutricionista: {nutri.name}</Text>
                            <Text style={{ color: '#8e24aa', fontSize: 14 }}>Correo: {nutri.email}</Text>
                        </>
                    )}
                </View>
            </View>
        );
    };

    const content = (
        <ScrollView contentContainerStyle={styles.formulario} keyboardShouldPersistTaps="handled">
            <View style={styles.containerInterno}>
                <Text style={styles.title}>Historial de Citas</Text>
                <Text style={styles.description}>Aquí podrás ver el historial de tus citas finalizadas.</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, marginTop: 10 }}>
                    <TouchableOpacity onPress={() => cambiarDia(-1)} style={{ padding: 8 }}>
                        <MaterialIcons name="chevron-left" size={28} color="#8e24aa" />
                    </TouchableOpacity>
                    <View>
                        <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#8e24aa', textAlign: 'center' }}>{fechaSeleccionada}</Text>
                        <Text style={{ color: '#888', fontSize: 15, textAlign: 'center' }}>{getDiaSemana(fechaSeleccionada)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => cambiarDia(1)} style={{ padding: 8 }}>
                        <MaterialIcons name="chevron-right" size={28} color="#8e24aa" />
                    </TouchableOpacity>
                </View>
                <Text style={{ color: '#8e24aa', marginBottom: 8, marginTop: 4 }}>Mostrando turnos finalizados de: <Text style={{ fontWeight: 'bold' }}>{fechaSeleccionada}</Text></Text>
                {cargando ? (
                    <ActivityIndicator size="large" color="#8e24aa" style={{ marginVertical: 20 }} />
                ) : turnosFiltrados.length === 0 ? (
                    <Text style={{ color: '#888', marginTop: 16 }}>No tienes citas finalizadas en esa fecha.</Text>
                ) : (
                    <View style={{ marginTop: 16 }}>
                        {turnosFiltrados.map(renderTurno)}
                    </View>
                )}
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

export default HistorialCitas;