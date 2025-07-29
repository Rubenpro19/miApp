import React, { useState, useEffect } from "react";
import { View, Text, Platform, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from "react-native";
import { Portal, Modal } from 'react-native-paper';
import styles from "../styles/styles_tablas";
import WebDrawerLayout from "../components/WebDrawerLayout";
import { verUsuarios, eliminarUsuario, actualizarUsuarioAdmin } from "../src/services/user";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ListarUsuarios = ({ navigation }) => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // Para confirmación en web
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
    // Para modal de edición
    const [editarVisible, setEditarVisible] = useState(false);
    const [usuarioEditar, setUsuarioEditar] = useState(null);
    const [errorEditar, setErrorEditar] = useState("");

    const sections = [
        { label: "Panel de Administrador", icon: "account-group", onPress: () => navigation.navigate('AdminUsuarios') },
        { label: "Perfil", icon: "account-circle", onPress: () => navigation.navigate('Perfil') },
        { label: "Cerrar sesión", icon: "logout", onPress: async () => await cerrarSesion(navigation) },
    ];

    const fetchUsuarios = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const data = await verUsuarios(token);
            const filtrados = data.filter(u => u.nombre_rol !== "Administrador");
            setUsuarios(filtrados);
        } catch (err) {
            setError("Error al cargar los usuarios.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleEliminarUsuario = (usuario) => {
        if (Platform.OS === 'web') {
            setUsuarioAEliminar(usuario);
            setConfirmVisible(true);
        } else {
            Alert.alert(
                "¿Eliminar usuario?",
                `¿Estás seguro de que deseas eliminar a ${usuario.name}? Esta acción no se puede deshacer.`,
                [
                    { text: "Cancelar", style: "cancel" },
                    {
                        text: "Eliminar",
                        style: "destructive",
                        onPress: async () => {
                            try {
                                setLoading(true);
                                const token = await AsyncStorage.getItem("token");
                                await eliminarUsuario(usuario.id, token);
                                setUsuarios(prev => prev.filter(u => u.id !== usuario.id));
                            } catch (err) {
                                Alert.alert("Error", "No se pudo eliminar el usuario.");
                            } finally {
                                setLoading(false);
                            }
                        }
                    }
                ]
            );
        }
    };

    const confirmarEliminarWeb = async () => {
        if (usuarioAEliminar) {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem("token");
                await eliminarUsuario(usuarioAEliminar.id, token);
                setUsuarios(prev => prev.filter(u => u.id !== usuarioAEliminar.id));
            } catch (err) {
                setError("No se pudo eliminar el usuario.");
            } finally {
                setLoading(false);
                setConfirmVisible(false);
                setUsuarioAEliminar(null);
            }
        }
    };

    const cancelarEliminarWeb = () => {
        setConfirmVisible(false);
        setUsuarioAEliminar(null);
    };

    // Guardar cambios de usuario
    const handleActualizarUsuario = async () => {
        setErrorEditar("");
        if (!usuarioEditar.name || !usuarioEditar.email || !usuarioEditar.roles_id) {
            setErrorEditar("Todos los campos son obligatorios");
            return;
        }
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            await actualizarUsuarioAdmin(usuarioEditar.id, {
                name: usuarioEditar.name,
                email: usuarioEditar.email,
                roles_id: usuarioEditar.roles_id
            }, token);
            setEditarVisible(false);
            setUsuarioEditar(null);
            await fetchUsuarios();
        } catch (err) {
            setErrorEditar("No se pudo actualizar el usuario");
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <ScrollView>
            <View style={styles.formulario}>
                <View style={styles.containerInterno}>
                    <Text style={styles.title}>Listar usuarios</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.link}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.tableContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#4a90e2" style={{ marginTop: 32 }} />
                ) : error ? (
                    <Text style={{ color: 'red', textAlign: 'center', marginTop: 32 }}>{error}</Text>
                ) : usuarios.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 32 }}>No hay usuarios registrados.</Text>
                ) : (
                    <View>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableHeaderCell}>Nombre</Text>
                            <Text style={styles.tableHeaderCell}>Correo</Text>
                            <Text style={styles.tableHeaderCell}>Rol</Text>
                            <Text style={styles.tableHeaderCell}>Acciones</Text>
                        </View>
                        {usuarios.map(u => (
                            <View key={u.id} style={styles.tableRow}>
                                <Text style={styles.tableCell}>{u.name}</Text>
                                <Text style={styles.tableCell}>{u.email}</Text>
                                <Text style={styles.tableCell}>{u.nombre_rol}</Text>
                                <View style={styles.tableActions}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#e74c3c' }]}
                                        onPress={() => handleEliminarUsuario(u)}
                                    >
                                        <Text style={styles.actionBtnText}>Eliminar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#4a90e2', marginLeft: 8 }]}
                                        onPress={() => {
                                            setUsuarioEditar({ ...u });
                                            setEditarVisible(true);
                                        }}
                                    >
                                        <Text style={styles.actionBtnText}>Actualizar</Text>
                                    </TouchableOpacity>

                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );

    if (Platform.OS === "web") {
        return (
            <WebDrawerLayout navigation={navigation} title="Listar Usuarios" sections={sections}>
                {content}
                <Portal>
                    {/* Modal eliminar */}
                    <Modal visible={confirmVisible} onDismiss={cancelarEliminarWeb} contentContainerStyle={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, maxWidth: 350, alignSelf: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>¿Eliminar usuario?</Text>
                        <Text style={{ textAlign: 'center', marginBottom: 18 }}>
                            ¿Estás seguro de que deseas eliminar a {usuarioAEliminar?.name}? Esta acción no se puede deshacer.
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e74c3c', minWidth: 100 }]} onPress={confirmarEliminarWeb}>
                                <Text style={styles.actionBtnText}>Eliminar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4a90e2', minWidth: 100, marginLeft: 16 }]} onPress={cancelarEliminarWeb}>
                                <Text style={styles.actionBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </Modal>
                    {/* Modal editar */}
                    <Modal visible={editarVisible} onDismiss={() => setEditarVisible(false)} contentContainerStyle={{ backgroundColor: '#fff', padding: 24, borderRadius: 12, maxWidth: 350, alignSelf: 'center' }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>Actualizar usuario</Text>
                        {usuarioEditar && (
                            <View>
                                <Text style={styles.label}>Nombre:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={usuarioEditar.name}
                                    onChangeText={text => setUsuarioEditar({ ...usuarioEditar, name: text })}
                                />
                                <Text style={styles.label}>Correo:</Text>
                                <TextInput
                                    style={styles.input}
                                    value={usuarioEditar.email}
                                    onChangeText={text => setUsuarioEditar({ ...usuarioEditar, email: text })}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <Text style={styles.label}>Rol:</Text>
                                <View style={[styles.input, { padding: 0 }]}> 
                                    {[{ roles_id: 1, nombre_rol: 'Administrador' }, { roles_id: 2, nombre_rol: 'Nutricionista' }, { roles_id: 3, nombre_rol: 'Paciente' }].map(r => (
                                        <TouchableOpacity key={r.roles_id} style={{ padding: 8, backgroundColor: usuarioEditar.roles_id === r.roles_id ? '#4a90e2' : '#eee', borderRadius: 6, marginBottom: 4 }} onPress={() => setUsuarioEditar({ ...usuarioEditar, roles_id: r.roles_id })}>
                                            <Text style={{ color: usuarioEditar.roles_id === r.roles_id ? '#fff' : '#333', textAlign: 'center' }}>{r.nombre_rol}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                        {errorEditar ? <Text style={{ color: 'red', marginTop: 8 }}>{errorEditar}</Text> : null}
                        <View style={{ flexDirection: 'column', alignItems: 'center', marginTop: 18 }}>
                            <TouchableOpacity style={[styles.button, { minWidth: 120, marginBottom: 12 }]} onPress={handleActualizarUsuario}>
                                <Text style={styles.buttonText}>Guardar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, { minWidth: 120, marginBottom: 12 }]} onPress={() => setEditarVisible(false)}>
                                <Text style={styles.buttonText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </Modal>
                </Portal>
            </WebDrawerLayout>
        );
    }

    return content;
};

export default ListarUsuarios;
