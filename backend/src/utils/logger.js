function debug(message, data) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
  
  function error(message, error) {
    console.error(`[DEBUG] ${message}`, error || '');
  }
  
  // Helper functions from your original code
  function requiredFieldsPresent(body) {
    return ['date', 'time', 'location'].every(
      (field) => body[field] && body[field].trim() !== ''
    );
  }
  
  module.exports = {
    debug,
    error,
    requiredFieldsPresent
  };