# Proyecto-Web
Repositorio de proyecto web donde logramos la implementación de una página web con uso de JSON como fallback.
Usamos una API en Node montado con Express.

Aplicamos modelo vista controlador, controlador teniendo la API y la carpeta public la usa para mostrar la vista y el backend.

## 📋 Requisitos Previos

Antes de instalar el proyecto, asegúrate de tener instalado:

- **Node.js** (versión 14 o superior)
- **npm** (viene incluido con Node.js)
- **MySQL** (versión 5.7 o superior)

## 🚀 Instalación

### 1. Instalar Dependencias

```bash
npm install
```

#### 2 Crear la Base de Datos

1. Accede a MySQL:
```bash
mysql -u root -p
```

2. Ejecuta el script de la base de datos:
```sql
source bd.sql
```

O alternativamente, ejecuta el archivo `bd.sql` desde tu cliente MySQL preferido.

#### 3 Configurar Variables de Entorno

1. El archivo `.env` ya está configurado con valores por defecto:
```env
DB_NAME=el_despertar_DB
DB_USER=
DB_PASS=
DB_HOST=localhost
PORT=3000
```

2. **Modifica las credenciales** según tu configuración de MySQL:
   - `DB_USER`: Tu usuario de MySQL
   - `DB_PASS`: Tu contraseña de MySQL
   - `DB_HOST`: Host de la base de datos (localhost por defecto)
   - `PORT`: Puerto del servidor (3000 por defecto)

### 4. Configurar Mercado Pago (Opcional)

Si planeas usar la integración con Mercado Pago, agrega las siguientes variables al archivo `.env`:

```env
NGROK_URL=tu_url_ngrok_aqui
```

## 🏃‍♂️ Ejecutar el Proyecto

### Modo Desarrollo

```bash
npm start
```

El servidor se iniciará en: `http://localhost:3000`