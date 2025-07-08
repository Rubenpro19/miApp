import { Alert, Platform } from 'react-native';

export const mostrarAlerta = (titulo, mensaje) => {
    if (Platform.OS === 'web') {
        alert(`${titulo}\n\n${mensaje}`);
    } else {
        Alert.alert(titulo, mensaje);
    }
};