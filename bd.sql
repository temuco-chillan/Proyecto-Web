drop database Tienda_web;
CREATE DATABASE IF NOT EXISTS Tienda_web;
USE Tienda_web;

-- -----------------------------
-- Tabla: roles
-- -----------------------------
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT IGNORE INTO roles (nombre) VALUES ('admin'), ('usuario');

-- -----------------------------
-- Tabla: usuarios
-- -----------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol_id INT DEFAULT 2,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- -----------------------------
-- Tabla: productos
-- -----------------------------
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado ENUM('activo', 'inactivo', 'mantenimiento') DEFAULT 'activo',
    precio DECIMAL(10,2) NOT NULL,
    descuento INT DEFAULT 0, -- porcentaje
    stock INT DEFAULT 0,
    imagen_url VARCHAR(255),
    fecha_add TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------
-- Tabla: categorias
-- -----------------------------
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- -----------------------------
-- Tabla intermedia: producto_categorias
-- -----------------------------
CREATE TABLE IF NOT EXISTS producto_categorias (
    producto_id INT NOT NULL,
    categoria_id INT NOT NULL,
    PRIMARY KEY (producto_id, categoria_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
);

-- -----------------------------
-- Tabla: carrito
-- -----------------------------
CREATE TABLE IF NOT EXISTS carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT DEFAULT 1 CHECK (cantidad > 0),
    fecha_add TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE(usuario_id, producto_id)
);

CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('completada', 'cancelada', 'pendiente') DEFAULT 'completada',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS detalle_venta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,  -- precio en el momento de la compra
    descuento_aplicado INT DEFAULT 0,        -- % de descuento aplicado
    subtotal DECIMAL(10,2) NOT NULL,         -- cantidad * precio_unitario * (1 - descuento)
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

