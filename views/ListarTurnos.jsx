import React, { useEffect, useState } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, ScrollView, Platform, TextInput, ActivityIndicator } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/styles_dashboard";
import { cerrarSesion } from "../src/services/auth";
import WebDrawerLayout from "../components/WebDrawerLayout";
import { MaterialIcons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { obtenerUsuario, obtenerUsuarioPorId } from '../src/services/user';
import { listarTodosLosTurnos, cancelarTurnoReservado, finalizarTurno } from '../src/services/turnos';
import { eliminarTurnosPorFecha, eliminarTurnosPorIds } from '../src/services/turnos';
import { Modal } from 'react-native';

const ListarTurnos = ({ navigation }) => {
    const [eliminando, setEliminando] = useState(false);
    const [eliminandoSeleccionados, setEliminandoSeleccionados] = useState(false);
    const [modalSeleccionadosVisible, setModalSeleccionadosVisible] = useState(false);
    const [seleccionados, setSeleccionados] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [turnoDetalle, setTurnoDetalle] = useState(null);
    const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
    const [pacienteDetalle, setPacienteDetalle] = useState(null);
    const [cargandoPaciente, setCargandoPaciente] = useState(false);
    const [usuario, setUsuario] = useState(null);
    const [turnosPorFecha, setTurnosPorFecha] = useState({});
    const [fechaActual, setFechaActual] = useState(() => {
        const ahora = new Date();
        const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
        const guayaquil = new Date(utc - (5 * 60 * 60000));
        const yyyy = guayaquil.getFullYear();
        const mm = String(guayaquil.getMonth() + 1).padStart(2, '0');
        const dd = String(guayaquil.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    });
    const [cargando, setCargando] = useState(false);

    // Cargar usuario y turnos al montar y al enfocar la pantalla
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

    useFocusEffect(
        React.useCallback(() => {
            const cargarTurnos = async () => {
                setCargando(true);
                try {
                    const res = await listarTodosLosTurnos();
                    setTurnosPorFecha(res.turnos || {});
                    setMensaje("");
                } catch (error) {
                    setMensaje("Error al cargar los turnos");
                } finally {
                    setCargando(false);
                }
            };
            cargarTurnos();
        }, [])
    );

    // Eliminar todos los turnos del día actual
    const handleEliminarDia = async () => {
        setEliminando(true);
        setMensaje("");
        try {
            const res = await eliminarTurnosPorFecha(fechaActual);
            setMensaje(res.message + ` (${res.cantidad})`);
            // Recargar turnos
            const nuevos = await listarTodosLosTurnos();
            setTurnosPorFecha(nuevos.turnos || {});
        } catch (error) {
            setMensaje("Error al eliminar los turnos del día");
        } finally {
            setEliminando(false);
            setModalVisible(false);
        }
    };

    const sections = [
        { label: "Nutricionista", icon: "account-heart", onPress: () => navigation.navigate('Nutricionista') },
        { label: "Perfil", icon: "account-circle", onPress: () => navigation.navigate('Perfil') },
        { label: "Cerrar sesión", icon: "logout", onPress: async () => await cerrarSesion(navigation) },
    ];

    // Navegación de fechas
    const cambiarDia = (dias) => {
        // Ajuste para evitar desfase por zona horaria
        const partes = fechaActual.split('-');
        const fecha = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        fecha.setDate(fecha.getDate() + dias);
        // Formato YYYY-MM-DD local
        const yyyy = fecha.getFullYear();
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const dd = String(fecha.getDate()).padStart(2, '0');
        setFechaActual(`${yyyy}-${mm}-${dd}`);
    };

    // Filtrar turnos del día actual
    const turnosHoy = turnosPorFecha[fechaActual] || [];
    // Matutinos: hora_inicio < 13:00, Vespertinos >= 13:00
    const matutinos = turnosHoy.filter(t => t.hora_inicio < '13:00:00');
    const vespertinos = turnosHoy.filter(t => t.hora_inicio >= '13:00:00');

    // Mostrar detalle y cargar paciente si es reservado
    const handleVerDetalleTurno = async (turno) => {
        setTurnoDetalle(turno);
        setModalDetalleVisible(true);
        setPacienteDetalle(null);
        // Mostrar info de paciente si hay paciente_id y el estado es reservado, cancelado o finalizado
        if ((turno.estado === 'reservado' || turno.estado === 'cancelado' || turno.estado === 'finalizado') && turno.paciente_id) {
            setCargandoPaciente(true);
            try {
                const token = await AsyncStorage.getItem('token');
                const paciente = await obtenerUsuarioPorId(turno.paciente_id, token);
                setPacienteDetalle(paciente);
            } catch (e) {
                setPacienteDetalle({ error: 'No se pudo obtener el paciente' });
            } finally {
                setCargandoPaciente(false);
            }
        }
    };

    const renderTurno = (turno) => {
        let bgColor = '#e3f2fd';
        let icon = 'calendar-check';
        let iconColor = '#1976d2';
        let textColor = '#1976d2';
        if (turno.estado === 'caducado') {
            bgColor = '#eee';
            icon = 'clock-alert';
            iconColor = '#bdbdbd';
            textColor = '#bdbdbd';
        } else if (turno.estado === 'reservado') {
            bgColor = '#d0f5e8';
            icon = 'calendar-lock';
            iconColor = '#388e3c';
            textColor = '#388e3c';
        } else if (turno.estado === 'cancelado') {
            bgColor = '#ffeaea';
            icon = 'calendar-remove';
            iconColor = '#e53935';
            textColor = '#e53935';
        } else if (turno.estado === 'finalizado') {
            bgColor = '#f3e9ff';
            icon = 'calendar-check-outline';
            iconColor = '#8e24aa';
            textColor = '#8e24aa';
        }
        return (
            <TouchableOpacity
                key={turno.id}
                onPress={() => handleVerDetalleTurno(turno)}
                activeOpacity={0.85}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: bgColor,
                    borderRadius: 10,
                    marginBottom: 10,
                    padding: 12,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                }}
            >
                {/* Checkbox de selección */}
                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation && e.stopPropagation();
                        if (seleccionados.includes(turno.id)) {
                            setSeleccionados(seleccionados.filter(id => id !== turno.id));
                        } else {
                            setSeleccionados([...seleccionados, turno.id]);
                        }
                    }}
                    style={{ marginRight: 10 }}
                >
                    <MaterialCommunityIcons
                        name={seleccionados.includes(turno.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={26}
                        color={seleccionados.includes(turno.id) ? '#388e3c' : '#bbb'}
                    />
                </TouchableOpacity>
                <MaterialCommunityIcons name={icon} size={28} color={iconColor} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: 'bold', color: textColor, fontSize: 16 }}>{turno.hora_inicio.slice(0,5)} - {turno.hora_fin.slice(0,5)}</Text>
                    <Text style={{ color: textColor, fontSize: 14 }}>Estado: {turno.estado}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const content = (
        <ScrollView>
            <View style={styles.formulario}>
                <View style={styles.containerInterno}>
                    <Text style={[styles.title, { textAlign: 'center' }]}>Turnos del día</Text>
                    {mensaje ? (
                        <Text style={{ color: mensaje.includes('Error') ? '#e74c3c' : '#388e3c', textAlign: 'center', marginBottom: 8 }}>{mensaje}</Text>
                    ) : null}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <TouchableOpacity onPress={() => cambiarDia(-1)} style={{ padding: 8 }}>
                            <MaterialCommunityIcons name="chevron-left" size={28} color="#1976d2" />
                        </TouchableOpacity>
                        <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#1976d2' }}>{fechaActual}</Text>
                        <TouchableOpacity onPress={() => cambiarDia(1)} style={{ padding: 8 }}>
                            <MaterialCommunityIcons name="chevron-right" size={28} color="#1976d2" />
                        </TouchableOpacity>
                    </View>
                    {cargando ? (
                        <ActivityIndicator size="large" color="#1976d2" style={{ marginVertical: 20 }} />
                    ) : (
                        <>
                            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#388e3c' }}>
                                <MaterialCommunityIcons name="weather-sunset" size={22} color="#388e3c" /> Matutinos
                            </Text>
                            {matutinos.length === 0 ? (
                                <Text style={{ color: '#888', marginBottom: 12 }}>No hay turnos matutinos.</Text>
                            ) : matutinos.map(renderTurno)}
                            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#fbc02d', marginTop: 10 }}>
                                <MaterialCommunityIcons name="weather-night" size={22} color="#fbc02d" /> Vespertinos
                            </Text>
                            {vespertinos.length === 0 ? (
                                <Text style={{ color: '#888' }}>No hay turnos vespertinos.</Text>
                            ) : vespertinos.map(renderTurno)}
                        </>
                    )}
                {/* Botón de eliminar seleccionados y eliminar todos abajo */}
            <View style={{ marginTop: 24, alignItems: 'center' }}>
                {seleccionados.length > 0 && (
                    <TouchableOpacity
                        onPress={() => setModalSeleccionadosVisible(true)}
                        style={{
                            backgroundColor: '#e74c3c',
                            borderRadius: 10,
                            paddingVertical: 12,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            width: '100%',
                            maxWidth: 350,
                            shadowColor: '#000',
                            shadowOpacity: 0.08,
                            shadowRadius: 4,
                            elevation: 2,
                            marginBottom: 10,
                        }}
                        disabled={eliminandoSeleccionados}
                    >
                        <MaterialCommunityIcons name="delete" size={22} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Eliminar seleccionados ({seleccionados.length})</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={{
                        backgroundColor: '#e74c3c',
                        borderRadius: 10,
                        paddingVertical: 12,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        width: '100%',
                        maxWidth: 350,
                        shadowColor: '#000',
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 2,
                        marginBottom: 10,
                    }}
                    disabled={eliminando}
                >
                    <MaterialCommunityIcons name="delete" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Eliminar todos los turnos del día</Text>
                </TouchableOpacity>
            </View>
                {/* Modal de confirmación eliminar todos */}
                <Modal
                    visible={modalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 300, alignItems: 'center', elevation: 6 }}>
                            <MaterialCommunityIcons name="alert" size={38} color="#e74c3c" style={{ marginBottom: 8 }} />
                            <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#e74c3c', marginBottom: 10, textAlign: 'center' }}>¿Seguro que deseas eliminar todos los turnos del día?</Text>
                            <Text style={{ color: '#555', marginBottom: 18, textAlign: 'center' }}>Esta acción no se puede deshacer.</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
                                    style={{ backgroundColor: '#bbb', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 }}
                                    disabled={eliminando}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleEliminarDia}
                                    style={{ backgroundColor: '#e74c3c', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 }}
                                    disabled={eliminando}
                                >
                                    {eliminando ? (
                                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                                    ) : null}
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Eliminar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
                {/* Modal de confirmación eliminar seleccionados */}
                <Modal
                    visible={modalSeleccionadosVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setModalSeleccionadosVisible(false)}
                >
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 300, alignItems: 'center', elevation: 6 }}>
                            <MaterialCommunityIcons name="alert" size={38} color="#e74c3c" style={{ marginBottom: 8 }} />
                            <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#e74c3c', marginBottom: 10, textAlign: 'center' }}>¿Seguro que deseas eliminar los turnos seleccionados?</Text>
                            <Text style={{ color: '#555', marginBottom: 18, textAlign: 'center' }}>Esta acción no se puede deshacer.</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                                <TouchableOpacity
                                    onPress={() => setModalSeleccionadosVisible(false)}
                                    style={{ backgroundColor: '#bbb', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 }}
                                    disabled={eliminandoSeleccionados}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={async () => {
                                        setEliminandoSeleccionados(true);
                                        setMensaje("");
                                        try {
                                            const res = await eliminarTurnosPorIds(seleccionados);
                                            setMensaje(res.message + ` (${res.cantidad})`);
                                            // Recargar turnos
                                            const nuevos = await listarTodosLosTurnos();
                                            setTurnosPorFecha(nuevos.turnos || {});
                                            setSeleccionados([]);
                                        } catch (error) {
                                            setMensaje("Error al eliminar los turnos seleccionados");
                                        } finally {
                                            setEliminandoSeleccionados(false);
                                            setModalSeleccionadosVisible(false);
                                        }
                                    }}
                                    style={{ backgroundColor: '#e74c3c', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 }}
                                    disabled={eliminandoSeleccionados}
                                >
                                    {eliminandoSeleccionados ? (
                                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                                    ) : null}
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Eliminar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
                </View>
                
            </View>
            {/* Modal de detalle de turno */}
            <Modal
                visible={modalDetalleVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalDetalleVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 320, alignItems: 'center', elevation: 6 }}>
                        <MaterialCommunityIcons name="information" size={38} color="#1976d2" style={{ marginBottom: 8 }} />
                        <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#1976d2', marginBottom: 10, textAlign: 'center' }}>Detalle del turno</Text>
                        {turnoDetalle && (
                            <>
                                <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Hora:</Text> {turnoDetalle.hora_inicio.slice(0,5)} - {turnoDetalle.hora_fin.slice(0,5)}</Text>
                                <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Estado:</Text> {turnoDetalle.estado}</Text>
                                {(turnoDetalle.estado === 'reservado' || turnoDetalle.estado === 'cancelado' || turnoDetalle.estado === 'finalizado') && (
                                    cargandoPaciente ? (
                                        <Text style={{ marginBottom: 4, color: '#888' }}>Cargando paciente...</Text>
                                    ) : pacienteDetalle && !pacienteDetalle.error ? (
                                        <>
                                            <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Paciente:</Text> {pacienteDetalle.name}</Text>
                                            <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Correo:</Text> {pacienteDetalle.email}</Text>
                                        </>
                                    ) : (
                                        <Text style={{ marginBottom: 4, color: '#888' }}>No hay información del paciente.</Text>
                                    )
                                )}
                                {turnoDetalle.nutricionista_name && (
                                    <Text style={{ marginBottom: 4 }}><Text style={{ fontWeight: 'bold' }}>Nutricionista:</Text> {turnoDetalle.nutricionista_name}</Text>
                                )}

                                {/* Botones de acción */}
                                {(turnoDetalle.estado === 'reservado') && (
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18 }}>
                                        {/* Botón Cancelar: nutricionista o paciente dueño */}
                                        {(usuario && (usuario.roles_id === 2 || (usuario.roles_id === 3 && turnoDetalle.paciente_id === usuario.id))) && (
                                            <TouchableOpacity
                                                style={{ backgroundColor: '#e74c3c', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginHorizontal: 6 }}
                                                onPress={async () => {
                                                    try {
                                                        await cancelarTurnoReservado(turnoDetalle.id);
                                                        setModalDetalleVisible(false);
                                                        setMensaje('Turno cancelado correctamente');
                                                        // Recargar turnos
                                                        const nuevos = await listarTodosLosTurnos();
                                                        setTurnosPorFecha(nuevos.turnos || {});
                                                    } catch (e) {
                                                        setMensaje('Error al cancelar el turno');
                                                    }
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Cancelar turno</Text>
                                            </TouchableOpacity>
                                        )}
                                        {/* Botón Finalizar: solo nutricionista */}
                                        {(usuario && usuario.roles_id === 2) && (
                                            <TouchableOpacity
                                                style={{ backgroundColor: '#388e3c', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginHorizontal: 6 }}
                                                onPress={async () => {
                                                    try {
                                                        await finalizarTurno(turnoDetalle.id);
                                                        setModalDetalleVisible(false);
                                                        setMensaje('Turno finalizado correctamente');
                                                        // Recargar turnos
                                                        const nuevos = await listarTodosLosTurnos();
                                                        setTurnosPorFecha(nuevos.turnos || {});
                                                    } catch (e) {
                                                        setMensaje('Error al finalizar el turno');
                                                    }
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Finalizar turno</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </>
                        )}
                        <TouchableOpacity
                            onPress={() => setModalDetalleVisible(false)}
                            style={{ backgroundColor: '#1976d2', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24, marginTop: 18 }}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );

    if (Platform.OS === "web") {
        return (
            <WebDrawerLayout navigation={navigation} title="Listar Turnos" sections={sections}>
                {content}
            </WebDrawerLayout>
        );
    }

    return content;

};

export default ListarTurnos;