const Booth = require('../models/Booth.model')

/**
 * Auto-generate Booth documents for every cell in a Hall grid.
 * @param {string} hallId
 * @param {string} expoId
 * @param {number} rows
 * @param {number} cols
 * @param {string} hallName  - used to build booth numbers like "A-1", "A-2"
 */
const generateBooths = async (hallId, expoId, rows, cols, hallName = 'A') => {
  const booths = []
  const prefix = hallName.substring(0, 2).toUpperCase()

  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const seq = (r - 1) * cols + c
      booths.push({
        boothNumber: `${prefix}-${String(seq).padStart(3, '0')}`,
        hallId,
        expoId,
        row: r,
        col: c,
        status: 'available',
        width: 1,
        height: 1,
        rotation: 0,
        price: 0,
      })
    }
  }

  return Booth.insertMany(booths)
}

module.exports = { generateBooths }
