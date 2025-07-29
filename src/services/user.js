import api from '../api';

export const obtenerUsuario = async (token) => {
    const response = await api.get('/perfil', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const actualizarUsuario = async (datos, token) => {
    const response = await api.put('/user', datos, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const verUsuarios = async (token) => {
    const response = await api.get('/user', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const eliminarUsuario = async (id, token) => {
    const response = await api.delete(`/user/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

export const actualizarUsuarioAdmin = async (id, datos, token) => {
    const response = await api.put(`/user/admin/${id}`, datos, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

