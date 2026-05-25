# TP4 - Inscripciones a materias UTN - Simulacion - UTN FRC

## Enunciado - Inscripción a exámenes UTN
Sea un lugar de inscripción a exámenes para alumnos de la UNVM, existen 6 equipos para inscribirse
y la inscripción demora de 5 a 8 minutos uniformemente distribuida. Los alumnos llegan para inscribirse
con una distribución exponencial negativa de media 2’. Una persona de sistemas hace mantenimiento
preventivo a cada computadora, empezando por la primera que este libre (si hay varias, elige
cualquiera), luego a otra y así sucesivamente, demorando un tiempo en cada equipo entre 3’ y 10’.
Tiene prioridad sobre los alumnos pero no interrumpe la inscripción. Esta persona regresa a hacer el
mantenimiento en 1 hora ± 3’ desde que finalizo el mantenimiento de la última máquina.
Si un alumno llega y hay más de 5 alumnos esperando, se va y regresa a la media hora.
Determine el % de alumnos que se van para regresar más tarde.
Determine el tiempo promedio de espera de los alumnos (considere solo los alumnos que hicieron cola).
Determine el promedio de tiempo ocioso del personal de sistemas por vez que va a la sala de inscripción
a realizar su tarea. 

### Parametros: 
- Cantidad de equipos: 6
- Tiempo de inscripción (servicio): Uniforme entre 5' y 8'
- Tiempo entre llegadas de alumnos: Exponencial negativa con media 2'
- Tiempo de mantenimiento por equipo: Uniforme entre 3' y 10'
- Frecuencia de regreso del técnico: 1 hora ± 3' desde que finalizó el mantenimiento de la última máquina
- Umbral de espera del alumno: más de 5 alumnos esperando → se va y regresa a la media hora

---

## Cómo Ejecutar la Plataforma Web

La solución incluye un backend en **FastAPI** con base de datos **SQLite (SQLAlchemy ORM)** y un frontend SPA moderno en **React (Ant Design)** con gráficos en **Recharts**.

### 1. Requisitos Previos
* **Python 3.10+**
* **Node.js 18+** y **npm**

### 2. Configurar y Ejecutar el Backend (FastAPI)
1. Instale las dependencias de Python:
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic
   ```
2. Inicie el servidor de desarrollo uvicorn en el puerto `8000`:
   ```bash
   python -m uvicorn backend.main:app --reload
   ```
3. Acceso a la API e interfaz Swagger interactiva:
   * **Swagger UI Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Configurar y Ejecutar el Frontend (React + Ant Design)
1. Ingrese a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instale los paquetes de Node:
   ```bash
   npm install
   ```
3. Inicie el servidor de desarrollo Vite:
   ```bash
   npm run dev
   ```
4. Acceso a la interfaz web:
   * **Plataforma Web**: [http://localhost:5173](http://localhost:5173)

---

## Características de la Plataforma
* **Configuración Totalizada en Minutos**: Ingrese todos los parámetros de tiempos (Inscripción, Llegadas, Tolerancia, Mantenimiento) directamente en **Minutos** y la duración en **Horas**.
* **Vector de Estados Detallado**: Explorador de traza FEL dinámico y paginado desde la base de datos SQLite.
* **Gráficos Premium**: Gráfico apilado interactivo de porcentajes de estado (Ocupado, Libre, Mantenimiento) para cada una de las PCs.
