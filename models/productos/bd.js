const mysql = require('mysql2');

const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'MBadmin',
    password: 'mbserver2025',
    database: 'Computadores'
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar a MariaDB:', err);
    } else {
        console.log('Conectado exitosamente a MariaDB');
    }
});

async function isConnected() {
  try {
    await pool.query('SELECT 1'); // o una consulta liviana
    return true;
  } catch (error) {
    console.error('DB connection failed:', error.message);
    return false;
  }
}


function getComputadores() {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM Computador', (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

function getComputadorById(id) {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM Computador WHERE id = ?', [id], (err, results) => {
            if (err) reject(err);
            else resolve(results[0] || null);
        });
    });
}

function insertComputador(computador) {
    return new Promise((resolve, reject) => {
        const { nombre_maquina, estado } = computador;
        db.query('INSERT INTO Computador (nombre_maquina, estado) VALUES (?, ?)', [nombre_maquina, estado], (err, results) => {
            if (err) reject(err);
            else resolve(results.insertId);
        });
    });
}

function updateComputador(id, computador) {
    return new Promise((resolve, reject) => {
        const { nombre_maquina, estado } = computador;
        db.query('UPDATE Computador SET nombre_maquina = ?, estado = ? WHERE id = ?', [nombre_maquina, estado, id], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function deleteComputador(id) {
    return new Promise((resolve, reject) => {
        db.query('DELETE FROM Computador WHERE id = ?', [id], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = {
    isConnected,
    getComputadores,
    getComputadorById,
    insertComputador,
    updateComputador,
    deleteComputador
};