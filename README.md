# 🏥 HisHospitales – Sistema de Gestión Hospitalaria (HIS)

Este proyecto es una aplicación web integral (HIS) diseñada para optimizar la gestión de pacientes, internaciones e infraestructura en un entorno hospitalario. Su objetivo principal es mejorar la eficiencia operativa y la administración de recursos mediante una interfaz moderna, implementando el flujo completo de atención desde la admisión hasta el alta clínica.

Proyecto final integrador para **Programación Web II**.

## 🚀 Tecnologías y Arquitectura

El sistema está construido bajo el patrón arquitectónico **MVC (Modelo-Vista-Controlador)** y renderizado completamente del lado del servidor (SSR), prescindiendo de frameworks reactivos en el frontend para garantizar máxima seguridad y cumplimiento técnico.

*   **Backend:** Node.js, Express.
*   **Base de Datos:** PostgreSQL administrada mediante Sequelize (ORM). Diseño relacional normalizado en Tercera Forma Normal (3FN).
*   **Frontend (SSR):** Motor de plantillas Pug, Bootstrap, FontAwesome, Vanilla JS.
*   **Seguridad:** Encriptación de contraseñas (bcryptjs), sistema de autenticación y autorización (RBAC) con roles mediante Passport.js, y protección de rutas.

## ⚙️ Funcionalidades Clave

*   **Admisión de Emergencia Flexible:** Permite registrar un paciente sin datos completos, generando automáticamente un DNI temporal (`EMERG_...`) para no demorar la atención crítica.
*   **Asignación de Cama Inteligente:** Valida la disponibilidad y aplica restricciones automáticas de compatibilidad de género en habitaciones compartidas.
*   **Autocompletado de Personal Médico:** Integración de búsqueda inteligente para evitar duplicidad de datos cuando médicos o enfermeros ingresan como pacientes.
*   **Evolución y Alta Médica:** Módulos para registrar evaluaciones, plan de cuidados y un sistema transaccional para la generación de Epicrisis que libera automáticamente las camas (estado "En limpieza").
*   **Manejo de Errores y Flexibilidad:** Capacidad de realizar cancelaciones lógicas de admisiones ante errores de carga, revirtiendo la ocupación de camas.

---

## 🛠️ Requisitos e Instalación Local

### 1. Clonar el Repositorio
```bash
git clone [https://github.com/milemise/hospitalhis.git](https://github.com/milemise/hospitalhis.git)
cd hospitalhis
2. Instalar Dependencias
Bash
npm install
3. Configuración de Variables de Entorno
Crea un archivo .env en la raíz del proyecto basándote en esta estructura:

Fragmento de código
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=tu_base_de_datos
DB_HOST=localhost
PORT=3000
NODE_ENV=development
SESSION_SECRET=clave_secreta_his_2026
4. Preparar la Base de Datos
Abre pgAdmin y crea una base de datos con el nombre definido en tu .env.

Restaura el archivo .sql de respaldo incluido en el repositorio para generar las tablas (3FN) y poblar los datos de prueba. Puedes hacerlo desde la terminal:

Bash
psql -U postgres -d tu_base_de_datos -f respaldo/hospital.sql
5. Iniciar la Aplicación
Bash
npm start
El sistema estará disponible en http://localhost:3000/auth/login.

🔐 Usuarios de Prueba (Roles RBAC)
Para evaluar los distintos niveles de acceso y módulos del sistema, utiliza las siguientes credenciales de prueba incluidas en el backup:

Administrador / Recepción: admin@his.com | Clave: admin

(Si tienes usuarios específicos para enfermería o médicos creados en tu base de datos, agrégalos aquí).

💡 Informe de Desarrollo: Problemas y Soluciones
Durante el ciclo de desarrollo, se identificaron y resolvieron los siguientes desafíos técnicos:

Concurrencia en el Alta Médica:

Problema: Al registrar un alta médica, la tabla altas rechazaba la inserción por restricciones NOT NULL en columnas de diagnóstico y medicación que a veces eran opcionales desde la interfaz.

Solución: Se relajaron las restricciones a nivel DB (ALTER TABLE) y se implementó una Transacción de Sequelize. Esto garantiza que la creación del alta, la actualización del paciente y la liberación de la cama se ejecuten como un bloque atómico, protegiendo la integridad de la base ante cortes.

Duplicidad de Registros del Personal:

Problema: Si un médico ingresaba como paciente, registrarlo de nuevo rompía la 3FN (redundancia).

Solución: Se desarrolló un endpoint asíncrono (/buscar-personal). Al escribir un nombre en admisión, el backend separa las cadenas y busca en la tabla de medicos, autocompletando instantáneamente el formulario y unificando el registro.
