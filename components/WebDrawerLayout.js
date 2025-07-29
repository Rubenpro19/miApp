// components/WebDrawerLayout.js
import React, { useState } from 'react';
import { View, Platform } from 'react-native';
import { Appbar, Drawer, Modal, Portal } from 'react-native-paper';
import styles from '../styles/webDrawerStyles.js';

const WebDrawerLayout = ({
  navigation,
  title = "Dashboard",
  sections = [], // <- Array dinámico de secciones
  children,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  if (Platform.OS !== 'web') {
    return <View style={{ flex: 1 }}>{children}</View>;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Barra superior */}
      <Appbar.Header>
        <Appbar.Action
          icon="menu"
          onPress={() => setDrawerVisible(true)}
        />
        <Appbar.Content title={title} />
      </Appbar.Header>

      {/* Menú lateral */}
      <Portal>
        <Modal
          visible={drawerVisible}
          onDismiss={() => setDrawerVisible(false)}
          contentContainerStyle={styles.drawerContainer}
        >
          <Drawer.Section>
            {sections.map((section, index) => (
              <Drawer.Item
                key={index}
                icon={section.icon || "folder"}
                label={section.label}
                onPress={() => {
                  setDrawerVisible(false);
                  if (section.onPress) section.onPress();
                }}
              />
            ))}
          </Drawer.Section>
        </Modal>
      </Portal>

      {/* Contenido */}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
};

export default WebDrawerLayout;
