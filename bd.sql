DROP DATABASE IF EXISTS el_despertar_DB;
CREATE DATABASE IF NOT EXISTS el_despertar_DB;
USE el_despertar_DB;

-- -----------------------------
-- Tabla: roles
-- -----------------------------
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- -----------------------------
-- Tabla: usuarios
-- -----------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    rut VARCHAR(255) UNIQUE,
    telefono VARCHAR(15) NOT NULL,
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
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
    video_url VARCHAR(500),
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

-- -----------------------------
-- Tabla: ventas
-- -----------------------------
CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    payment_id VARCHAR(255) NOT NULL,
    estado ENUM('completada', 'cancelada', 'pendiente') DEFAULT 'pendiente',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- -----------------------------
-- Tabla: detalle_venta
-- -----------------------------
CREATE TABLE IF NOT EXISTS detalle_venta (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    descuento_aplicado INT DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- -----------------------------
-- Tabla: descuentos por cantidad
-- -----------------------------
CREATE TABLE IF NOT EXISTS descuentos_cantidad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    cantidad_minima INT NOT NULL,
    porcentaje_descuento DECIMAL(5,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_producto_cantidad (producto_id, cantidad_minima)
);

---------------------------------------------------------------
-------------------- DATOS DE PRUEBA --------------------------
---------------------------------------------------------------

-- Roles
INSERT IGNORE INTO roles (nombre) VALUES ('admin'), ('usuario');

-- Usuarios
-- Usuarios con RUT y password hasheados
INSERT INTO usuarios (username, email, rut, telefono, direccion, ciudad, region, password, rol_id)
VALUES
('admin1', 'admin@tienda.com', 
 '$2b$10$aiJYbzpQvLzDyJQfPt94e.7eXoL8pA8OlL8o1KXrIV8pDe9HcW7iK', -- rut 12345678-9
 '987654321', 'Calle Admin 123', 'Santiago', 'RM',
 '$2b$10$EDVvByq26pNqMQyTzN9nIezGL9s80M/a9drqG1D9mYHkFvBkM36rC', -- password adminpass
 1),

('user1', 'user1@tienda.com',
 '$2b$10$s4h06OeRvjpsRBym42moOOG3Z2Yr7eV3d.vPc1uH9NGc7qXbK9iuu', -- rut 98765432-1
 '912345678', 'Calle Falsa 123', 'Santiago', 'RM',
 '$2b$10$wXc3uZxN9A/mtUhNjz3cUeT13.4j83DJwH6Zq8qebvSKGnPGeAO8K', -- password userpass
 2);

-- Categorías
INSERT INTO categorias (nombre) VALUES
('Electrónica'),
('Ropa'),
('Hogar'),
('Deportes');

-- Productos
INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, video_url)
VALUES
('Smartphone X', 'Teléfono de última generación con pantalla OLED', 599.99, 50, 'img/smartphone.jpg', 'https://youtu.be/demo1'),
('Camiseta Deportiva', 'Camiseta transpirable para entrenamiento', 19.99, 200, 'img/camiseta.jpg', NULL),
('Aspiradora 3000', 'Aspiradora con potencia de 2000W', 120.00, 30, 'img/aspiradora.jpg', NULL),
('Bicicleta Montaña', 'Bicicleta todo terreno de aluminio', 350.00, 15, 'img/bicicleta.jpg', 'https://youtu.be/demo2');

-- Relación productos - categorías
INSERT INTO producto_categorias (producto_id, categoria_id) VALUES
(1, 1), -- Smartphone -> Electrónica
(2, 2), -- Camiseta -> Ropa
(3, 3), -- Aspiradora -> Hogar
(4, 4); -- Bicicleta -> Deportes

-- Descuentos por cantidad
INSERT INTO descuentos_cantidad (producto_id, cantidad_minima, porcentaje_descuento) VALUES
(1, 3, 5.00),
(1, 5, 10.00),
(1, 10, 15.00),
(2, 5, 7.50),
(2, 10, 12.50),
(3, 2, 8.00),
(4, 2, 5.00),
(4, 3, 8.00);

-- Carrito de ejemplo
INSERT INTO carrito (usuario_id, producto_id, cantidad)
VALUES
(2, 1, 2), -- user1 compra 2 Smartphones
(2, 2, 5); -- user1 compra 5 Camisetas

-- Ventas de ejemplo
INSERT INTO ventas (usuario_id, total, payment_id, estado)
VALUES
(2, 1279.95, 'PAY123456', 'completada');

-- Detalle de la venta
INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, descuento_aplicado, subtotal)
VALUES
(1, 1, 2, 599.99, 0, 1199.98),  -- 2 Smartphones
(1, 2, 5, 19.99, 7, 79.97);    -- 5 Camisetas con descuento
