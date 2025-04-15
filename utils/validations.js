function isValidMobile(mob) {
    const cleaned = mob.replace(/[^0-9]/g, '').slice(-10);
    return /^\d{10}$/.test(cleaned) ? cleaned : null;
  }
  
  function isValidPAN(pan) {
    return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.toUpperCase());
  }
  
  module.exports = { isValidMobile, isValidPAN };
  