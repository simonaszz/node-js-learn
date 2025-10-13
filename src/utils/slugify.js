function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-ėąčęįšųūž]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

module.exports = slugify;