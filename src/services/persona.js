import api from '../api';

export const obtenerPersonaPorUsuario = async (userId, token) => {
    const response = await api.get(`/personas?user_id=${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const crearPersona = async (datos, token) => {
    const response = await api.post('/personas', datos, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const actualizarPersona = async (id, datos, token) => {
    const response = await api.put(`/personas/${id}`, datos, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};
