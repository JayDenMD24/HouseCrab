import { Tabs } from 'expo-router';
import React from 'react';

// Las pantallas son un flujo propio (bienvenida → login → mapa), no pestañas:
// se oculta la barra de tabs y el mapa trae su navbar.
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    />
  );
}
