const discountCodes = {
    '20SBESTHIT': 0.20,
    'ELV15': 0.05,
    '2NDNATVR3': 0.10
};

const getDiscountRate = (code) => discountCodes[String(code || '').trim().toUpperCase()] || 0;

module.exports = { getDiscountRate };
