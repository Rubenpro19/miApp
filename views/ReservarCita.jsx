import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform, Modal, Alert, Pressable } from "react-native";
// Usar TouchableOpacity para compatibilidad móvil en el botón de cancelar
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/styles_dashboard";
import { cerrarSesion } from "../src/services/auth";
import WebDrawerLayout from "../components/WebDrawerLayout";
import { MaterialIcons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { obtenerUsuario, verUsuarios } from '../src/services/user';
import { listarTurnosPorNutricionistaId, reservarTurno, cancelarTurnoReservado } from '../src/services/turnos';

const ReservarCita = ({ navigation }) => {
    // Estado para hover en turnos reservados
    const [hoverTurnoId, setHoverTurnoId] = useState(null);
    // Estado para mostrar el modal de confirmación de cancelación
    const [modalCancelar, setModalCancelar] = useState(false);
    const [turnoCancelar, setTurnoCancelar] = useState(null);

    // Función para cancelar el turno reservado
    const cancelarTurno = async (turno) => {
        if (!turno) return;
        try {
            await cancelarTurnoReservado(turno.id);
            Alert.alert('Turno cancelado', 'Tu turno ha sido cancelado y está disponible nuevamente.');
            // Recargar turnos
            const resp = await listarTurnosPorNutricionistaId(nutriSel.id);
            const turnosArray = Object.values(resp.turnos).flat();
            setTurnosNutri(turnosArray);
            setTurnoSel(null);
        } catch (error) {
            let msg = 'No se pudo cancelar el turno.';
            if (error?.response?.data?.error) {
                msg = error.response.data.error;
            }
            Alert.alert('Error', msg);
        }
    };
    const [usuario, setUsuario] = useState(null);
    const [nutricionistas, setNutricionistas] = useState([]);
    const [nutriSel, setNutriSel] = useState(null);
    const [turnoSel, setTurnoSel] = useState(null);
    const [reservando, setReservando] = useState(false);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [turnosNutri, setTurnosNutri] = useState([]);
    const [cargandoTurnos, setCargandoTurnos] = useState(false);
    const [fechaFiltro, setFechaFiltro] = useState(() => {
        const ahora = new Date();
        const yyyy = ahora.getFullYear();
        const mm = String(ahora.getMonth() + 1).padStart(2, '0');
        const dd = String(ahora.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    });
    const [mostrarListaNutri, setMostrarListaNutri] = useState(false);

    useEffect(() => {
        const cargarUsuarioYNutricionistas = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) {
                    navigation.replace('Login');
                    return;
                }
                // Usuario actual
                const data = await obtenerUsuario(token);
                setUsuario(data);
                await AsyncStorage.setItem('usuario', JSON.stringify(data));
                // Listar usuarios y filtrar nutricionistas
                const lista = await verUsuarios(token);
                const nutris = lista.filter(u => u.nombre_rol === 'Nutricionista');
                setNutricionistas(nutris);
            } catch (error) {
                console.error("Error al cargar usuario o nutricionistas:", error);
                navigation.replace('Login');
            }
        };
        cargarUsuarioYNutricionistas();
    }, []);

    // Cargar turnos del nutricionista seleccionado
    useEffect(() => {
        const cargarTurnosNutri = async () => {
            if (!nutriSel) {
                setTurnosNutri([]);
                return;
            }
            setCargandoTurnos(true);
            try {
                const res = await listarTurnosPorNutricionistaId(nutriSel.id);
                const turnosArray = Object.values(res.turnos).flat();
                setTurnosNutri(turnosArray);
            } catch (error) {
                setTurnosNutri([]);
            } finally {
                setCargandoTurnos(false);
            }
        };
        cargarTurnosNutri();
    }, [nutriSel]);

    // Filtrar turnos por fecha seleccionada
    const turnosHoy = turnosNutri.filter(t => t.fecha === fechaFiltro);
    const matutinos = turnosHoy.filter(t => t.hora_inicio < '13:00:00' && t.estado !== 'caducado');
    const vespertinos = turnosHoy.filter(t => t.hora_inicio >= '13:00:00' && t.estado !== 'caducado');

    // Verificar si el usuario ya tiene un turno reservado
    const tieneTurnoReservado = turnosNutri.some(t => t.estado === 'reservado' && t.paciente_id === usuario?.id);

    const sections = [
        { label: "Dashboard", icon: "view-dashboard", onPress: () => navigation.navigate('Dashboard')},
        { label: "Historial Citas", icon: "history", onPress: () => navigation.navigate('HistorialCitas') },
        { label: "Perfil", icon: "account-circle", onPress: () => navigation.navigate('Perfil') },
        { label: "Cerrar sesión", icon: "logout", onPress: async () => await cerrarSesion(navigation) },
    ];

    // Función para obtener el nombre del día en español
    const getDiaSemana = (fechaStr) => {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const partes = fechaStr.split('-');
        const fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        return dias[fecha.getDay()];
    };

    const content = (
        <ScrollView>
            <View style={styles.formulario}>
                <View style={styles.containerInterno}>
                    <Text style={styles.title}>Reservar Cita</Text>
                    <View>
                        <Text style={styles.label}>Selecciona un nutricionista:</Text>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#eee',
                                borderRadius: 8,
                                padding: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 16,
                            }}
                            onPress={() => setMostrarListaNutri(!mostrarListaNutri)}
                        >
                            <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 16 }}>
                                {nutriSel ? nutriSel.name : 'Selecciona un nutricionista'}
                            </Text>
                            <MaterialIcons name={mostrarListaNutri ? 'expand-less' : 'expand-more'} size={28} color="#1976d2" />
                        </TouchableOpacity>
                        {mostrarListaNutri && (
                            <View style={{ backgroundColor: '#fafafa', borderRadius: 8, padding: 8, marginBottom: 8 }}>
                                {nutricionistas.length === 0 ? (
                                    <Text style={{ color: '#888' }}>No hay nutricionistas disponibles.</Text>
                                ) : nutricionistas.map(n => (
                                    <TouchableOpacity
                                        key={n.id}
                                        style={{
                                            backgroundColor: nutriSel?.id === n.id ? '#4a90e2' : '#fff',
                                            padding: 10,
                                            borderRadius: 8,
                                            marginBottom: 6,
                                            borderWidth: nutriSel?.id === n.id ? 2 : 1,
                                            borderColor: nutriSel?.id === n.id ? '#1976d2' : '#eee',
                                        }}
                                        onPress={() => { setNutriSel(n); setTurnoSel(null); setMostrarListaNutri(false); }}
                                    >
                                        <Text style={{ color: nutriSel?.id === n.id ? '#fff' : '#333', textAlign: 'center', fontWeight: 'bold' }}>{n.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        {nutriSel && (
                            <>
                                <Text style={styles.label}>Turnos del día:</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                    <TouchableOpacity onPress={() => {
                                        // Día anterior
                                        const partes = fechaFiltro.split('-');
                                        const fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
                                        fecha.setDate(fecha.getDate() - 1);
                                        const yyyy = fecha.getFullYear();
                                        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
                                        const dd = String(fecha.getDate()).padStart(2, '0');
                                        setFechaFiltro(`${yyyy}-${mm}-${dd}`);
                                    }} style={{ padding: 8 }}>
                                        <MaterialIcons name="chevron-left" size={28} color="#1976d2" />
                                    </TouchableOpacity>
                                    <View>
                                        <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#1976d2', textAlign: 'center' }}>{fechaFiltro}</Text>
                                        <Text style={{ color: '#888', fontSize: 15, textAlign: 'center' }}>{getDiaSemana(fechaFiltro)}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => {
                                        // Día siguiente
                                        const partes = fechaFiltro.split('-');
                                        const fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
                                        fecha.setDate(fecha.getDate() + 1);
                                        const yyyy = fecha.getFullYear();
                                        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
                                        const dd = String(fecha.getDate()).padStart(2, '0');
                                        setFechaFiltro(`${yyyy}-${mm}-${dd}`);
                                    }} style={{ padding: 8 }}>
                                        <MaterialIcons name="chevron-right" size={28} color="#1976d2" />
                                    </TouchableOpacity>
                                </View>
                                {cargandoTurnos ? (
                                    <Text style={{ color: '#888', marginBottom: 12 }}>Cargando turnos...</Text>
                                ) : turnosHoy.length === 0 ? (
                                    <Text style={{ color: '#888', marginBottom: 12 }}>No hay turnos para este día.</Text>
                                ) : (
                                    <>
                                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#388e3c' }}>
                                            <MaterialIcons name="wb-sunny" size={22} color="#388e3c" /> Matutinos
                                        </Text>
                                        {matutinos.length === 0 ? (
                                            <Text style={{ color: '#888', marginBottom: 12 }}>No hay turnos matutinos.</Text>
                                        ) : matutinos.map(t => (
                                            <View key={t.id} style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor:
                                                    t.estado === 'cancelado' ? '#ffebee' :
                                                    t.estado === 'caducado' ? '#eee'
                                                    : t.estado === 'reservado' ? '#c8e6c9'
                                                    : '#e3f2fd',
                                                borderRadius: 10,
                                                marginBottom: 10,
                                                padding: 12,
                                                shadowColor: '#000',
                                                shadowOpacity: 0.08,
                                                shadowRadius: 4,
                                                elevation: 2,
                                                borderWidth: t.estado === 'reservado' ? 2 : (turnoSel?.id === t.id ? 2 : 0),
                                                borderColor: t.estado === 'reservado' ? '#388e3c' : (turnoSel?.id === t.id ? '#388e3c' : 'transparent'),
                                            }}>
                                                <MaterialCommunityIcons name={t.estado === 'caducado' ? 'calendar-remove' : (t.estado === 'reservado' ? 'calendar-lock' : 'calendar-check')} size={28} color={t.estado === 'caducado' ? '#bdbdbd' : (t.estado === 'reservado' ? '#388e3c' : '#1976d2')} style={{ marginRight: 10 }} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontWeight: 'bold', color: t.estado === 'cancelado' ? '#e53935' : (t.estado === 'reservado' ? '#388e3c' : '#1976d2'), fontSize: 16 }}>{t.hora_inicio.slice(0, 5)} a {t.hora_fin.slice(0, 5)}</Text>
                                                    <Text style={{ color: t.estado === 'cancelado' ? '#e53935' : '#555', fontSize: 14 }}>Estado: {t.estado}</Text>
                                                </View>
                                                {t.estado === 'reservado' && t.paciente_id === usuario?.id ? (
                                                    <TouchableOpacity
                                                        style={{
                                                            backgroundColor: Platform.OS === 'web' && hoverTurnoId === t.id ? '#e53935' : '#c8e6c9',
                                                            padding: 8,
                                                            borderRadius: 8,
                                                            marginLeft: 8,
                                                            borderWidth: 2,
                                                            borderColor: '#388e3c',
                                                        }}
                                                        onPress={() => {
                                                            setTurnoCancelar(t);
                                                            setModalCancelar(true);
                                                        }}
                                                        onMouseEnter={Platform.OS === 'web' ? () => setHoverTurnoId(t.id) : undefined}
                                                        onMouseLeave={Platform.OS === 'web' ? () => setHoverTurnoId(null) : undefined}
                                                    >
                                                        <Text style={{ color: Platform.OS === 'web' && hoverTurnoId === t.id ? '#fff' : '#388e3c', fontWeight: 'bold' }}>
                                                            {Platform.OS === 'web' && hoverTurnoId === t.id ? 'Cancelar' : 'Reservado'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <TouchableOpacity
                                                        style={{
                                                            backgroundColor: turnoSel?.id === t.id ? '#1976d2' : '#eee',
                                                            padding: 8,
                                                            borderRadius: 8,
                                                            marginLeft: 8,
                                                            borderWidth: turnoSel?.id === t.id ? 2 : 0,
                                                            borderColor: turnoSel?.id === t.id ? '#388e3c' : 'transparent',
                                                            shadowColor: turnoSel?.id === t.id ? '#388e3c' : undefined,
                                                            shadowOpacity: turnoSel?.id === t.id ? 0.2 : 0,
                                                            shadowRadius: turnoSel?.id === t.id ? 6 : 0,
                                                            opacity: (tieneTurnoReservado && t.estado === 'disponible') ? 0.5 : 1,
                                                        }}
                                                        onPress={() => {
                                                            setTurnoSel(t);
                                                            setMostrarModal(true);
                                                        }}
                                                        disabled={t.estado !== 'disponible' || (tieneTurnoReservado && t.estado === 'disponible')}
                                                    >
                                                        <Text style={{ color: turnoSel?.id === t.id ? '#fff' : '#333', fontWeight: 'bold' }}>
                                                            {t.estado === 'disponible' ? (turnoSel?.id === t.id ? 'Seleccionado' : 'Seleccionar') : (t.estado === 'reservado' ? 'Reservado' : 'No disponible')}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#fbc02d', marginTop: 10 }}>
                                            <MaterialIcons name="nights-stay" size={22} color="#fbc02d" /> Vespertinos
                                        </Text>
                                        {vespertinos.length === 0 ? (
                                            <Text style={{ color: '#888' }}>No hay turnos vespertinos.</Text>
                                        ) : vespertinos.map(t => (
                                            <View key={t.id} style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor:
                                                    t.estado === 'cancelado' ? '#ffebee' :
                                                    t.estado === 'caducado' ? '#eee'
                                                    : t.estado === 'reservado' ? '#c8e6c9'
                                                    : '#e3f2fd',
                                                borderRadius: 10,
                                                marginBottom: 10,
                                                padding: 12,
                                                shadowColor: '#000',
                                                shadowOpacity: 0.08,
                                                shadowRadius: 4,
                                                elevation: 2,
                                                borderWidth: t.estado === 'reservado' ? 2 : (turnoSel?.id === t.id ? 2 : 0),
                                                borderColor: t.estado === 'reservado' ? '#388e3c' : (turnoSel?.id === t.id ? '#388e3c' : 'transparent'),
                                            }}>
                                                <MaterialCommunityIcons name={t.estado === 'caducado' ? 'calendar-remove' : (t.estado === 'reservado' ? 'calendar-lock' : 'calendar-check')} size={28} color={t.estado === 'caducado' ? '#bdbdbd' : (t.estado === 'reservado' ? '#388e3c' : '#1976d2')} style={{ marginRight: 10 }} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontWeight: 'bold', color: t.estado === 'cancelado' ? '#e53935' : (t.estado === 'reservado' ? '#388e3c' : '#1976d2'), fontSize: 16 }}>{t.hora_inicio.slice(0, 5)} a {t.hora_fin.slice(0, 5)}</Text>
                                                    <Text style={{ color: t.estado === 'cancelado' ? '#e53935' : '#555', fontSize: 14 }}>Estado: {t.estado}</Text>
                                                </View>
                                                {t.estado === 'reservado' && t.paciente_id === usuario?.id ? (
                                                    <TouchableOpacity
                                                        style={{
                                                            backgroundColor: Platform.OS === 'web' && hoverTurnoId === t.id ? '#e53935' : '#c8e6c9',
                                                            padding: 8,
                                                            borderRadius: 8,
                                                            marginLeft: 8,
                                                            borderWidth: 2,
                                                            borderColor: '#388e3c',
                                                        }}
                                                        onPress={() => {
                                                            setTurnoCancelar(t);
                                                            setModalCancelar(true);
                                                        }}
                                                        onMouseEnter={Platform.OS === 'web' ? () => setHoverTurnoId(t.id) : undefined}
                                                        onMouseLeave={Platform.OS === 'web' ? () => setHoverTurnoId(null) : undefined}
                                                    >
                                                        <Text style={{ color: Platform.OS === 'web' && hoverTurnoId === t.id ? '#fff' : '#388e3c', fontWeight: 'bold' }}>
                                                            {Platform.OS === 'web' && hoverTurnoId === t.id ? 'Cancelar' : 'Reservado'}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <TouchableOpacity
                                                        style={{
                                                            backgroundColor: turnoSel?.id === t.id ? '#1976d2' : '#eee',
                                                            padding: 8,
                                                            borderRadius: 8,
                                                            marginLeft: 8,
                                                            borderWidth: turnoSel?.id === t.id ? 2 : 0,
                                                            borderColor: turnoSel?.id === t.id ? '#388e3c' : 'transparent',
                                                            shadowColor: turnoSel?.id === t.id ? '#388e3c' : undefined,
                                                            shadowOpacity: turnoSel?.id === t.id ? 0.2 : 0,
                                                            shadowRadius: turnoSel?.id === t.id ? 6 : 0,
                                                            opacity: (tieneTurnoReservado && t.estado === 'disponible') ? 0.5 : 1,
                                                        }}
                                                        onPress={() => {
                                                            setTurnoSel(t);
                                                            setMostrarModal(true);
                                                        }}
                                                        disabled={t.estado !== 'disponible' || (tieneTurnoReservado && t.estado === 'disponible')}
                                                    >
                                                        <Text style={{ color: turnoSel?.id === t.id ? '#fff' : '#333', fontWeight: 'bold' }}>
                                                            {t.estado === 'disponible' ? (turnoSel?.id === t.id ? 'Seleccionado' : 'Seleccionar') : (t.estado === 'reservado' ? 'Reservado' : 'No disponible')}
                                                        </Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                        {/* Modal para confirmar turno */}
                        {/* Modal para confirmar cancelación */}
                        <Modal
                            visible={modalCancelar}
                            animationType="fade"
                            transparent
                            onRequestClose={() => setModalCancelar(false)}
                        >
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '85%', maxWidth: 400, elevation: 5 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10, textAlign: 'center', color: '#e53935' }}>¿Cancelar turno?</Text>
                                    <Text style={{ marginBottom: 10, textAlign: 'center' }}>¿Estás seguro que deseas cancelar este turno? Esta acción no se puede deshacer.</Text>
                                    {turnoCancelar && (
                                        <>
                                            <Text style={{ marginBottom: 4 }}>Fecha: <Text style={{ fontWeight: 'bold' }}>{turnoCancelar.fecha}</Text></Text>
                                            <Text style={{ marginBottom: 4 }}>Hora: <Text style={{ fontWeight: 'bold' }}>{turnoCancelar.hora_inicio.slice(0, 5)} a {turnoCancelar.hora_fin.slice(0, 5)}</Text></Text>
                                        </>
                                    )}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#eee', padding: 10, borderRadius: 8, flex: 1, marginRight: 8 }}
                                            onPress={() => setModalCancelar(false)}
                                        >
                                            <Text style={{ color: '#333', textAlign: 'center', fontWeight: 'bold' }}>No</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#e53935', padding: 10, borderRadius: 8, flex: 1, marginLeft: 8 }}
                                            onPress={async () => {
                                                await cancelarTurno(turnoCancelar);
                                                setModalCancelar(false);
                                            }}
                                        >
                                            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Sí, cancelar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                        <Modal
                            visible={mostrarModal}
                            animationType="slide"
                            transparent
                            onRequestClose={() => setMostrarModal(false)}
                        >
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '85%', maxWidth: 400, elevation: 5 }}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10, textAlign: 'center' }}>Confirmar Turno</Text>
                                    {nutriSel && turnoSel && (
                                        <>
                                            <Text style={{ marginBottom: 4 }}>Nutricionista: <Text style={{ fontWeight: 'bold' }}>{nutriSel.name}</Text></Text>
                                            <Text style={{ marginBottom: 4 }}>Fecha: <Text style={{ fontWeight: 'bold' }}>{turnoSel.fecha}</Text></Text>
                                            <Text style={{ marginBottom: 4 }}>Hora: <Text style={{ fontWeight: 'bold' }}>{turnoSel.hora_inicio.slice(0, 5)} a {turnoSel.hora_fin.slice(0, 5)}</Text></Text>
                                        </>
                                    )}
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#eee', padding: 10, borderRadius: 8, flex: 1, marginRight: 8 }}
                                            onPress={() => setMostrarModal(false)}
                                        >
                                            <Text style={{ color: '#333', textAlign: 'center', fontWeight: 'bold' }}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#1976d2', padding: 10, borderRadius: 8, flex: 1, marginLeft: 8, opacity: reservando ? 0.7 : 1 }}
                                            onPress={async () => {
                                                if (!turnoSel) return;
                                                setReservando(true);
                                                try {
                                                    const res = await reservarTurno(turnoSel.id);
                                                    setMostrarModal(false);
                                                    Alert.alert('¡Turno reservado!', 'Tu turno ha sido reservado correctamente.');
                                                    // Recargar turnos del nutricionista
                                                    const resp = await listarTurnosPorNutricionistaId(nutriSel.id);
                                                    const turnosArray = Object.values(resp.turnos).flat();
                                                    setTurnosNutri(turnosArray);
                                                    setTurnoSel(null);
                                                } catch (error) {
                                                    setMostrarModal(false);
                                                    let msg = 'No se pudo reservar el turno.';
                                                    if (error?.response?.data?.error) {
                                                        msg = error.response.data.error;
                                                    }
                                                    Alert.alert('Error', msg);
                                                } finally {
                                                    setReservando(false);
                                                }
                                            }}
                                            disabled={reservando}
                                        >
                                            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>{reservando ? 'Reservando...' : 'Confirmar'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </View>
                    {/* Eliminar botón de Reservar */}
                </View>
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