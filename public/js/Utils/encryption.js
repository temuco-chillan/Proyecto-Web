const bcrypt = require('bcrypt');
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.saltRounds = 12;
    this.algorithm = 'aes-256-cbc';
    // Asegurar que la clave tenga 32 bytes para AES-256
    const key = process.env.ENCRYPTION_KEY || 'mi-clave-super-secreta-de-32-caracteres!';
    this.encryptionKey = crypto.createHash('sha256').update(key).digest();
  }

  /**
   * Encripta una contraseña usando bcrypt
   * @param {string} password - Contraseña en texto plano
   * @returns {Promise<string>} - Contraseña encriptada
   */
  async hashPassword(password) {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new Error('Error al encriptar contraseña: ' + error.message);
    }
  }

  /**
   * Verifica una contraseña contra su hash
   * @param {string} password - Contraseña en texto plano
   * @param {string} hash - Hash almacenado
   * @returns {Promise<boolean>} - True si coincide
   */
  async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error('Error al verificar contraseña: ' + error.message);
    }
  }

  /**
   * Encripta un RUT de forma reversible
   * @param {string} rut - RUT en texto plano
   * @returns {string} - RUT encriptado
   */
  encryptRut(rut) {
    try {
      const normalizedRut = rut.replace(/[.-]/g, '').toUpperCase();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.encryptionKey), iv);
      let encrypted = cipher.update(normalizedRut, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw new Error('Error al encriptar RUT: ' + error.message);
    }
  }

  /**
   * Desencripta un RUT
   * @param {string} encryptedRut - RUT encriptado
   * @returns {string} - RUT en texto plano
   */
  decryptRut(encryptedRut) {
    try {
      const parts = encryptedRut.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.encryptionKey), iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error('Error al desencriptar RUT: ' + error.message);
    }
  }

  /**
   * Encripta un RUT para almacenamiento seguro (ahora usa encriptación reversible)
   * @param {string} rut - RUT en texto plano
   * @returns {string} - RUT encriptado
   */
  async hashRut(rut) {
    // Cambiar a encriptación reversible
    return this.encryptRut(rut);
  }

  /**
   * Verifica un RUT contra su hash
   * @param {string} rut - RUT en texto plano
   * @param {string} hash - Hash almacenado
   * @returns {Promise<boolean>} - True si coincide
   */
  async verifyRut(rut, hash) {
    try {
      const normalizedRut = rut.replace(/[.-]/g, '').toUpperCase();
      return await bcrypt.compare(normalizedRut, hash);
    } catch (error) {
      throw new Error('Error al verificar RUT: ' + error.message);
    }
  }

  /**
   * Enmascara un RUT para visualización segura
   * @param {string} rut - RUT completo
   * @returns {string} - RUT enmascarado (ej: 12.345.***-*)
   */
  maskRut(rut) {
    const normalizedRut = rut.replace(/[.-]/g, '');
    if (normalizedRut.length < 8) return '***-*';
    
    const visible = normalizedRut.substring(0, 5);
    const masked = visible.replace(/(\d{2})(\d{3})/, '$1.$2.***-*');
    return masked;
  }

  /**
   * Valida el formato de un RUT chileno
   * @param {string} rut - RUT a validar
   * @returns {boolean} - True si el formato es válido
   */
  validateRutFormat(rut) {
    const rutRegex = /^[0-9]+-[0-9kK]{1}$/;
    return rutRegex.test(rut);
  }

  /**
   * Calcula el dígito verificador de un RUT
   * @param {string} rutBody - Cuerpo del RUT sin dígito verificador
   * @returns {string} - Dígito verificador calculado
   */
  calculateRutVerifier(rutBody) {
    let sum = 0;
    let multiplier = 2;
    
    for (let i = rutBody.length - 1; i >= 0; i--) {
      sum += parseInt(rutBody[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const verifier = 11 - remainder;
    
    if (verifier === 11) return '0';
    if (verifier === 10) return 'K';
    return verifier.toString();
  }

  /**
   * Valida un RUT completo (formato y dígito verificador)
   * @param {string} rut - RUT completo a validar
   * @returns {boolean} - True si el RUT es válido
   */
  validateRut(rut) {
    if (!this.validateRutFormat(rut)) {
      return false;
    }

    const [rutBody, verifier] = rut.split('-');
    const calculatedVerifier = this.calculateRutVerifier(rutBody);
    
    return verifier.toUpperCase() === calculatedVerifier;
  }
}

module.exports = new EncryptionService();