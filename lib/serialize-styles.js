require('itsa-jsext');

const serialize = function(styles) {
    if (!Object.itsa_isObject(styles)) {
        return '';
    }
    let serialized = '';
    styles.itsa_each(function(value, key) {
        value && (serialized += key + ':' + value + ';');
    });
    // serialized += '}';
    // (serialized==='{}') && (serialized='');
    return serialized;
};

module.exports = {
    serialize
};
