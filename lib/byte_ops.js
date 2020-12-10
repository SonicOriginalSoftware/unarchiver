/**
 * Extract an ascii string from a buffer
 *
 * @param {Buffer} buffer
 * @param {Number} offset
 * @param {Number} length
 */
export function extract_ascii(buffer, offset, length) {
  const ascii = buffer
    .toString("ascii", offset, offset + length)
    .replace(/\0/g, "")

  return ascii
}

/**
 * Extract an unsigned integer from a buffer given an endian notation
 *
 * @param {Boolean} big_endian
 * @param {Buffer} buffer
 * @param {Number} offset
 * @param {Number} length
 *
 * @returns {Number}
 */
function extract_uint(big_endian, buffer, offset, length) {
  let value
  if (big_endian) {
    value = buffer.readUIntBE(offset, length)
  } else {
    value = buffer.readUIntLE(offset, length)
  }

  return value
}

/**
 * Extract an unsigned big-endian integer from a buffer
 *
 * @param {Buffer} buffer
 * @param {Number} offset
 * @param {Number} length
 */
export function extract_uintBE(buffer, offset, length) {
  return extract_uint(true, buffer, offset, length)
}

/**
 * Extract an unsigned little-endian integer from a buffer
 *
 * @param {Buffer} buffer
 * @param {Number} offset
 * @param {Number} length
 */
export function extract_uintLE(buffer, offset, length) {
  return extract_uint(false, buffer, offset, length)
}
