# ⚡️ TeamUp

**TeamUp** permite formar equipos de estudiantes a partir de un listado en un archivo de Excel. Asegura que cada equipo cumpla criterios mínimos de distribución predefinidos.

&nbsp;

## 🚀 Funcionalidades

- Cargar archivos de Excel (`.xlsx`) con los datos de los estudiantes.
- Seleccionar materias como criterio de selección para la creación de equipos.
- Definir el número integrantes mínimos por materia.
- Asignar automáticamente los equipos según los criterios establecidos.
- Exportar los equipos generados a Excel.

&nbsp;

## 🖱️ ¿Cómo usar la aplicación?

1. **Sube tu archivo Excel**
   - Haz clic en la zona de carga o arrastra tu archivo `.xlsx`.
      - El arhivo de debe contener las siguientes columnas: ID, Nombre completo, Correo electrónico, Matrias y Grupos.
      - Las columnas "Materias" y "Grupos" deben estar relacionadas por la posición de forma respectiva.
      - Los datos deben estar separados por comas si hay más de una materia o grupo.
   - El sistema procesará y mostrará la lista de estudiantes.

2. **Configura la distribución**
   - Define el número de equipos a conformar.
   - Selecciona las materias a considerar en la conformación de cada grupo.
   - Establece el número mínimo de estudiantes por materia de forma global o individual.

3. **Genera los equipos**
   - Haz clic en “Generar equipos”.
   - Verás los equipos creados y las advertencias o errores (si existen).

4. **Exporta los resultados**
   - Descarga un archivo Excel con:
     - Todos los equipos generados.
     - Estudiantes sin asignar.
     - Advertencias detalladas.

&nbsp;

## ⚙️ Instalación y ejecución

Abre tu terminal y ejecuta los siguientes comandos para instalar y ejecutar la aplicación.

**Clona el repositorio**
```bash
git clone https://github.com/julianvanegas/teamup.git
cd teamup
```

**Instala las dependencias necesarias**
```bash
npm install
```

**Ejecuta la aplicación en un ambiente de pruebas**
```bash
npm run dev
```
*Puedes acceder con tu navegador ingresando a [http://localhost:9002](http://localhost:9002)*

**Prepara para un ambiente producción**
```bash
npm run build
```

**Ejecuta en un ambiente de producción**
```bash
npm start
```
*Por defecto, puedes acceder con tu navegador ingresando a [http://localhost:3000](http://localhost:3000)*

&nbsp;

&nbsp;

Copyright © 2025 Julian Vanegas López
