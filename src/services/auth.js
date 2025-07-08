import api from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const registrarUsuario = async (datos) => {
    try {
        const response = await api.post('/register', datos);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Error desconocido al registrar' };
    }
};

export const iniciarSesion = async (credenciales) => {
    try {
        const response = await api.post('/login', credenciales);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Error desconocido al iniciar sesión' };
    }
};

export const cerrarSesion = async (navigation, setUsuario = null) => {
    try {
        await AsyncStorage.removeItem('usuario');
        await AsyncStorage.removeItem('token');

        if (setUsuario) {
            setUsuario(null);
        }

        navigation.replace('Login');
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
};

export const actualizarUsuario = async (datos, token) => {
    const response = await api.put('/user', datos, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
};

