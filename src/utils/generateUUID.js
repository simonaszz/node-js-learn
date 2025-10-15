function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(character) {
        const randomNumber = Math.random() * 16 | 0;
        const uuidVersion = character === 'x' ? randomNumber : (randomNumber & 0x3 | 0x8);
        return uuidVersion.toString(16);
    });
}

module.exports = generateUUID;
