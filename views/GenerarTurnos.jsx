import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Platform, TextInput } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "../styles/styles_dashboard";
import { cerrarSesion } from "../src/services/auth";
import WebDrawerLayout from "../components/WebDrawerLayout";
import { MaterialIcons } from "@expo/vector-icons";
import { obtenerUsuario } from '../src/services/user';
import { generarTurnos } from '../src/services/turnos';

const GenerarTurnos = ({ navigation }) => {
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
        { label: "Nutricionista", icon: "account-heart", onPress: () => navigation.navigate('Nutricionista') },
        { label: "Perfil", icon: "account-circle", onPress: () => navigation.navigate('Perfil') },
        { label: "Cerrar sesión", icon: "logout", onPress: async () => await cerrarSesion(navigation) },
    ];

    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);
    const [horaInicio, setHoraInicio] = useState(null);
    const [horaFin, setHoraFin] = useState(null);
    const [descansoInicio, setDescansoInicio] = useState(null);
    const [descansoFin, setDescansoFin] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [cargando, setCargando] = useState(false);
    const [showPicker, setShowPicker] = useState({ campo: null, modo: null });

    const hoy = new Date();
    const formatDate = d => {
        if (!d) return "";
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const formatTime = d => {
        if (!d) return "";
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const validarCampos = () => {
        if (!fechaInicio || !fechaFin || !horaInicio || !horaFin || !descansoInicio || !descansoFin) {
            setMensaje("Todos los campos son obligatorios");
            return false;
        }
        if (fechaFin < fechaInicio) {
            setMensaje("La fecha fin debe ser igual o posterior a la fecha inicio");
            return false;
        }
        if (horaFin <= horaInicio) {
            setMensaje("La hora fin debe ser posterior a la hora inicio");
            return false;
        }
        if (descansoFin <= descansoInicio) {
            setMensaje("El descanso fin debe ser posterior al descanso inicio");
            return false;
        }
        setMensaje("");
        return true;
    };

    const handleGenerarTurnos = async () => {
        if (!validarCampos()) return;
        setCargando(true);
        try {
            const datos = {
                fecha_inicio: formatDate(fechaInicio),
                fecha_fin: formatDate(fechaFin),
                hora_inicio: formatTime(horaInicio),
                hora_fin: formatTime(horaFin),
                descanso_inicio: formatTime(descansoInicio),
                descanso_fin: formatTime(descansoFin),
            };
            const res = await generarTurnos(datos);
            setMensaje(res.message || "Turnos generados correctamente");
            // Limpiar los inputs
            setFechaInicio(null);
            setFechaFin(null);
            setHoraInicio(null);
            setHoraFin(null);
            setDescansoInicio(null);
            setDescansoFin(null);
            // Ocultar mensaje de éxito tras 2 segundos
            setTimeout(() => setMensaje(""), 2000);
        } catch (err) {
            setMensaje(err.response?.data?.message || err.message || "Error al generar turnos");
        } finally {
            setCargando(false);
        }
    };

    const content = (
        <ScrollView>
            <View style={styles.formulario}>
                <View style={styles.containerInterno}>
                    <Text style={styles.title}>Generar Turnos</Text>
                    {/* Inputs multiplataforma */}
                    {Platform.OS === 'web' ? (
                        <>
                            <Text style={styles.label}>Fecha inicio:</Text>
                            <input
                                type="date"
                                style={{ ...styles.input, padding: 8, fontSize: 16 }}
                                min={formatDate(hoy)}
                                value={fechaInicio ? formatDate(fechaInicio) : ''}
                                onChange={e => {
                                    if (e.target.value) {
                                        // Evita desfase de zona horaria en web
                                        const d = new Date(e.target.value + 'T00:00:00');
                                        setFechaInicio(d);
                                    } else {
                                        setFechaInicio(null);
                                    }
                                }}
                            />
                            <Text style={styles.label}>Fecha fin:</Text>
                            <input
                                type="date"
                                style={{ ...styles.input, padding: 8, fontSize: 16 }}
                                min={formatDate(hoy)}
                                value={fechaFin ? formatDate(fechaFin) : ''}
                                onChange={e => {
                                    if (e.target.value) {
                                        // Evita desfase de zona horaria en web
                                        const d = new Date(e.target.value + 'T00:00:00');
                                        setFechaFin(d);
                                    } else {
                                        setFechaFin(null);
                                    }
                                }}
                            />
                            <Text style={styles.label}>Hora inicio:</Text>
                            <input
                                type="time"
                                step="3600"
                                style={{ ...styles.input, padding: 8, fontSize: 16 }}
                                value={horaInicio ? formatTime(horaInicio) : ''}
                                onChange={e => {
                                    if (e.target.value) {
                                        const [h, m] = e.target.value.split(":");
                                        const d = new Date();
                                        d.setHours(Number(h));
                                        d.setMinutes(0);
                                        d.setSeconds(0);
                                        d.setMilliseconds(0);
                                        setHoraInicio(d);
                                    } else {
                                        setHoraInicio(null);
                                    }
                                }}
                            />
                            <Text style={styles.label}>Hora fin:</Text>
                            <input
                                type="time"
                                step="3600"
                                style={{ ...styles.input, padding: 8, fontSize: 16 }}
                                value={horaFin ? formatTime(horaFin) : ''}
                                onChange={e => {
                                    if (e.target.value) {
                                        const [h, m] = e.target.value.split(":");
                                        const d = new Date();
                                        d.setHours(Number(h));
                                        d.setMinutes(0);
                                        d.setSeconds(0);
                                        d.setMilliseconds(0);
                                        setHoraFin(d);
                                    } else {
                                        setHoraFin(null);
                                    }
                                }}
                            />
                            <Text style={styles.label}>Descanso inicio:</Text>
                            <input
                                type="time"
                                step="3600"
                                style={{ ...styles.input, padding: 8, fontSize: 16 }}
                                value={descansoInicio ? formatTime(descansoInicio) : ''}
                                onChange={e => {
                                    if (e.target.value) {
                                        const [h, m] = e.target.value.split(":");
                                        const d = new Date();
                                        d.setHours(Number(h));
                                        d.setMinutes(0);
                                        d.setSeconds(0);
                                        d.setMilliseconds(0);
                                        setDescansoInicio(d);
                                    } else {
                                        setDescansoInicio(null);
                                    }
                                }}
                            />
                            <Text style={styles.label}>Descanso fin:</Text>
                            <input
                                type="time"
                                step="3600"
                                style={{ ...styles.input, padding: 8, fontSize: 16 }}
                                value={descansoFin ? formatTime(descansoFin) : ''}
                                onChange={e => {
                                    if (e.target.value) {
                                        const [h, m] = e.target.value.split(":");
                                        const d = new Date();
                                        d.setHours(Number(h));
                                        d.setMinutes(0);
                                        d.setSeconds(0);
                                        d.setMilliseconds(0);
                                        setDescansoFin(d);
                                    } else {
                                        setDescansoFin(null);
                                    }
                                }}
                            />
                        </>
                    ) : (
                        <>
                            <Text style={styles.label}>Fecha inicio:</Text>
                            <TouchableOpacity style={styles.input} onPress={() => setShowPicker({ campo: 'fechaInicio', modo: 'date' })}>
                                <Text>{formatDate(fechaInicio) || 'Selecciona fecha'}</Text>
                            </TouchableOpacity>
                            <Text style={styles.label}>Fecha fin:</Text>
                            <TouchableOpacity style={styles.input} onPress={() => setShowPicker({ campo: 'fechaFin', modo: 'date' })}>
                                <Text>{formatDate(fechaFin) || 'Selecciona fecha'}</Text>
                            </TouchableOpacity>
                            <Text style={styles.label}>Hora inicio:</Text>
                            <TouchableOpacity style={styles.input} onPress={() => setShowPicker({ campo: 'horaInicio', modo: 'time' })}>
                                <Text>{formatTime(horaInicio) || 'Selecciona hora'}</Text>
                            </TouchableOpacity>
                            <Text style={styles.label}>Hora fin:</Text>
                            <TouchableOpacity style={styles.input} onPress={() => setShowPicker({ campo: 'horaFin', modo: 'time' })}>
                                <Text>{formatTime(horaFin) || 'Selecciona hora'}</Text>
                            </TouchableOpacity>
                            <Text style={styles.label}>Descanso inicio:</Text>
                            <TouchableOpacity style={styles.input} onPress={() => setShowPicker({ campo: 'descansoInicio', modo: 'time' })}>
                                <Text>{formatTime(descansoInicio) || 'Selecciona hora'}</Text>
                            </TouchableOpacity>
                            <Text style={styles.label}>Descanso fin:</Text>
                            <TouchableOpacity style={styles.input} onPress={() => setShowPicker({ campo: 'descansoFin', modo: 'time' })}>
                                <Text>{formatTime(descansoFin) || 'Selecciona hora'}</Text>
                            </TouchableOpacity>
                            {showPicker.campo && (
                                <DateTimePicker
                                    value={
                                        showPicker.modo === 'date'
                                            ? (showPicker.campo === 'fechaInicio' ? fechaInicio || hoy : fechaFin || hoy)
                                            : (showPicker.campo === 'horaInicio' ? horaInicio || hoy : showPicker.campo === 'horaFin' ? horaFin || hoy : showPicker.campo === 'descansoInicio' ? descansoInicio || hoy : descansoFin || hoy)
                                    }
                                    mode={showPicker.modo}
                                    display="default"
                                    minimumDate={showPicker.modo === 'date' ? hoy : undefined}
                                    onChange={(event, selectedDate) => {
                                        setShowPicker({ campo: null, modo: null });
                                        if (event.type === 'set' && selectedDate) {
                                            let d = selectedDate;
                                            if (showPicker.modo === 'time') {
                                                // Redondea minutos a 00
                                                d = new Date(selectedDate);
                                                d.setMinutes(0);
                                                d.setSeconds(0);
                                                d.setMilliseconds(0);
                                            }
                                            if (showPicker.campo === 'fechaInicio') setFechaInicio(d);
                                            if (showPicker.campo === 'fechaFin') setFechaFin(d);
                                            if (showPicker.campo === 'horaInicio') setHoraInicio(d);
                                            if (showPicker.campo === 'horaFin') setHoraFin(d);
                                            if (showPicker.campo === 'descansoInicio') setDescansoInicio(d);
                                            if (showPicker.campo === 'descansoFin') setDescansoFin(d);
                                        }
                                    }}
                                />
                            )}
                        </>
                    )}
                    {mensaje ? (
                        <Text style={{
                            color: mensaje.includes('correctamente') ? 'green' : (cargando ? '#4a90e2' : 'red'),
                            marginTop: 12,
                            fontWeight: mensaje.includes('correctamente') ? 'bold' : 'normal',
                            fontSize: mensaje.includes('correctamente') ? 18 : 15,
                            textAlign: 'center',
                            backgroundColor: mensaje.includes('correctamente') ? '#eafbe7' : undefined,
                            borderRadius: mensaje.includes('correctamente') ? 8 : undefined,
                            padding: mensaje.includes('correctamente') ? 8 : 0
                        }}>{mensaje}</Text>
                    ) : null}
                    <TouchableOpacity style={styles.button} onPress={handleGenerarTurnos} disabled={cargando}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialIcons name="event" size={22} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.buttonText}>{cargando ? 'Generando...' : 'Generar turnos'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );

    if (Platform.OS === "web") {
        return (
            <WebDrawerLayout navigation={navigation} title="Generar Turnos" sections={sections}>
                {content}
            </WebDrawerLayout>
        );
    }

    return content;

};

export default GenerarTurnos;