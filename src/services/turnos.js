import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// GET /turnos/paciente/reservado
export const obtenerTurnoReservadoPaciente = async () => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.get('/turnos/paciente/reservado', {
        headers: { Authorization: `Bearer ${token}` }
    });
    // Si la respuesta tiene .turno, devolverlo, si no, null
    return res.data?.turno || null;
};

// POST /turnos/{id}/finalizar-turno
export const finalizarTurno = async (turnoId) => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.post(`/turnos/${turnoId}/finalizar-turno`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};
// POST /turnos/{id}/cancelar
export const cancelarTurnoReservado = async (turnoId) => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.post(`/turnos/${turnoId}/cancelar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};
// GET /nutricionista/{id}/turnos
export const listarTurnosPorNutricionistaId = async (nutricionistaId) => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.get(`/nutricionista/${nutricionistaId}/turnos`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};
// DELETE /nutricionista/turnos/eliminar-multiple
export const eliminarTurnosPorIds = async (ids) => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.delete('/nutricionista/turnos/eliminar-multiples', {
        headers: { Authorization: `Bearer ${token}` },
        data: { ids }
    });
    return res.data;
};

// DELETE /nutricionista/turnos/eliminar-por-fecha
export const eliminarTurnosPorFecha = async (fecha) => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.delete('/nutricionista/turnos/eliminar-dia', {
        headers: { Authorization: `Bearer ${token}` },
        data: { fecha }
    });
    return res.data;
};

// POST /nutricionista/turnos/generar
export const generarTurnos = async (datos) => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.post('/nutricionista/turnos/generar', datos, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

// GET /nutricionista/turnos/fecha?fecha=YYYY-MM-DD
export const obtenerTurnosPorFecha = async (fecha) => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.get(`/nutricionista/turnos/fecha?fecha=${fecha}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

// GET /nutricionista/turnos
export const listarTodosLosTurnos = async () => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.get('/nutricionista/turnos', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

// POST /turnos/{id}/reservar
export const reservarTurno = async (turnoId) => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.post(`/turnos/${turnoId}/reservar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};

// GET /turnos/paciente
export const listarTurnosPacienteAutenticado = async () => {
    const token = await AsyncStorage.getItem('token');
    const res = await api.get('/turnos/paciente', {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
};
