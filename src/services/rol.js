import api from '../api';

// Obtener todos los roles desde el backend
export const obtenerRoles = async () => {
    const response = await api.get('/roles');
    console.log("Roles recibidos:", response.data); // <-- AÑADE ESTO

    return response.data;
};

// Utilidad para obtener el nombre del rol por id
export const getNombreRol = (roles, id) => {
    const rol = roles.find(r => r.roles_id === id);
    return rol ? rol.nombre_rol : '';
};
