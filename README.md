
# 🧬 PokéVision Pro | Elite Edition

**PokéVision Pro** es una estación de análisis táctico Pokémon de alto rendimiento. Utiliza una arquitectura moderna basada en React para visualizar datos de la PokéAPI y potencia sus capacidades analíticas mediante inteligencia artificial (Google Gemini API).

## 🚀 Características Principales

- **Neural Professor Insights**: Análisis táctico generado por IA para cada Pokémon.
- **Genetic Evolution Pathway**: Navegación interactiva a través de cadenas evolutivas completas.
- **Elite Squad Protocol**: Sistema de gestión de favoritos con límite de 6 slots y persistencia local.
- **Performance Radar**: Visualización de estadísticas base mediante gráficos radiales dinámicos.
- **Extreme UI**: Interfaz estilo HUD futurista con efectos de cristal (Glassmorphism) y partículas elementales.

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
- **Node.js** (Versión 18 o superior recomendada)
- **NPM** o **Yarn**
- Una **API Key de Google Gemini** (Obtenla en [Google AI Studio](https://aistudio.google.com/))

## 📦 Instalación Local

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd pokevision-pro
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto y añade tu clave de API:
   ```env
   API_KEY=tu_clave_de_gemini_aqui
   ```

4. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000` (o el puerto configurado por tu bundler).

## 🏗️ Estructura del Proyecto

- `App.tsx`: Orquestador principal y gestión del estado global (Filtros, Squad Elite).
- `components/`:
  - `PokemonCard.tsx`: Motor de renderizado de especímenes con efectos de partículas.
  - `PokemonModal.tsx`: Centro de comando detallado con visualizaciones de Recharts y navegación evolutiva.
- `services/`:
  - `pokeApi.ts`: Consumo optimizado de la API REST de Pokémon.
  - `geminiService.ts`: Integración con el SDK `@google/genai` para análisis de IA.
- `types.ts` & `constants.tsx`: Definiciones de esquemas de datos y matrices de eficacia elemental.

## 🧪 Notas para Desarrolladores

- **Eficacia de Tipos**: El sistema calcula automáticamente las debilidades 2x y 4x basándose en la matriz definida en `constants.tsx`.
- **Persistencia**: El "Elite Squad" se sincroniza automáticamente con el `localStorage` del navegador.
- **IA**: Las consultas a Gemini están optimizadas para devolver JSON estructurado, asegurando que el feedback del "Profesor Neural" sea siempre parseable.

## 📜 Licencia

Este proyecto es una herramienta educativa y de fans. Los datos e imágenes pertenecen a Nintendo/Creatures Inc./GAME FREAK inc.
