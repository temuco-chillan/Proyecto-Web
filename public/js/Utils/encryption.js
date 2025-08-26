const bcrypt = require('bcrypt');

class EncryptionService {
  constructor() {
    this.saltRounds = 12; // Número de rondas de salt para bcrypt
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
   * Encripta un RUT para almacenamiento seguro
   * @param {string} rut - RUT en texto plano
   * @returns {Promise<string>} - RUT encriptado
   */
  async hashRut(rut) {
    try {
      // Normalizar RUT (remover puntos y guiones, convertir a mayúsculas)
      const normalizedRut = rut.replace(/[.-]/g, '').toUpperCase();
      return await bcrypt.hash(normalizedRut, this.saltRounds);
    } catch (error) {
      throw new Error('Error al encriptar RUT: ' + error.message);
    }
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