import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import styles from "../styles/styles_formularios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { iniciarSesion } from "../src/services/auth";
import { mostrarAlerta } from "../src/services/alerta";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  // Redirige según el rol del usuario
  const redirigirSegunRol = (usuario) => {
    if (usuario.roles_id === 1) {
      // Administrador
      if (Platform.OS === "web") {
        navigation.replace("AdminUsuarios");
      } else {
        navigation.replace("MainTabs", { screen: "AdminUsuarios" });
      }
    } else if (usuario.roles_id === 2) {
      // Nutricionista
      if (Platform.OS === "web") {
        navigation.replace("Nutricionista");
      } else {
        navigation.replace("MainTabs", { screen: "Nutricionista" });
      }
    } else if (usuario.roles_id === 3) {
      // Paciente
      if (Platform.OS === "web") {
        navigation.replace("Dashboard");
      } else {
        navigation.replace("MainTabs", { screen: "Dashboard" });
      }
    } else {
      // Rol desconocido, fallback
      if (Platform.OS === "web") {
        navigation.replace("Dashboard");
      } else {
        navigation.replace("MainTabs");
      }
    }
  };

  // Verifica si ya hay sesión activa
  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const usuario = await AsyncStorage.getItem("usuario");
        if (token && usuario) {
          const userObj = JSON.parse(usuario);
          redirigirSegunRol(userObj);
        }
      } catch (error) {
        mostrarAlerta("Error", "Hubo un problema al verificar la sesión.");
        console.error("Error verificando sesión:", error);
      }
    };
    verificarSesion();
  }, []);

  const irARegistro = () => {
    navigation.navigate("Registro");
  };

  const handleLogin = async () => {
    if (!email || !password) {
      mostrarAlerta("Campos requeridos", "Por favor llena todos los campos.");
      return;
    }

    const correoValido = /^\S+@\S+\.\S+$/;
    if (!correoValido.test(email)) {
      mostrarAlerta("Correo inválido", "Ingrese un correo electrónico válido.");
      return;
    }

    setCargando(true);
    try {
      const data = await iniciarSesion({ email, password });

      await AsyncStorage.setItem("usuario", JSON.stringify(data.user));
      await AsyncStorage.setItem("token", data.token);

      redirigirSegunRol(data.user);
    } catch (error) {
      mostrarAlerta("Error", error.message || "No se pudo iniciar sesión.");
      console.error(error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.formulario}>
      <View style={styles.containerInterno}>
        <Text style={styles.title}>Iniciar Sesión</Text>

        <Text style={styles.label}>Correo electrónico:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingrese su correo"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Contraseña:</Text>
        <View style={styles.inputPasswordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ingrese su contraseña"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconPassword}
          >
            <Icon
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={irARegistro}>
          <Text style={styles.link}>¿No tienes cuenta? ¡Regístrate!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Login;