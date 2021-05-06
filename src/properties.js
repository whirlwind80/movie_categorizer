const propertiesFile = './resources/settings.properties';
const PropertiesReader = require('properties-reader');
const properties = PropertiesReader(propertiesFile, {saveSections: true});

const sourceKey = 'source';
const destKey = 'dest';
const extensionKey = 'extension';
const errKey = 'err';

module.exports = {
    get: function(key) {
        return properties.get(key);
    },
    set: async function(key, value, func) {
        properties.set(key, value);
        await properties.save(propertiesFile, func);
    },
    getSource: function() {
        return properties.get(sourceKey);
    },
    getDest: function() {
        return properties.get(destKey);
    },
    getErr: function() {
        return properties.get(errKey);
    },
    getExtension: function () {
        const extension = properties.get(extensionKey);
        return extension.toLowerCase().split(',');
    }
}