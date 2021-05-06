const fs = require('fs').promises;
const path = require('path');
const properties = require('./properties');

const filePattern = /[a-zA-z]+-[0-9]+/;
const dirPattern = /[a-zA-Z]+/;
const normalizedPattern = /[a-zA-z]+-[0-9]+\[.+\]/;

function isNormalized(basename) {
    const match1 = basename.match(filePattern);
    const match2 = basename.match(normalizedPattern);
    return (match1 && basename === match1[0])
        || (match2 && basename === match2[0]);
}

async function walk(target) {
    const extFilter = properties.getExtension();

    let list = [];
    const dir = await fs.opendir(target);
    for await  (const dirent of dir) {
        const newTarget = path.join(dir.path, dirent.name);
        let ext;

        if(dirent.isFile()) {
            ext = path.extname(dirent.name).replace('.', '');
        } else {
            ext = '';
        }

        if(dirent.isDirectory()) {
            const recursiveList = await walk(newTarget);
            list = list.concat(recursiveList);
        } else if(extFilter.includes(ext)) {
            list.push(newTarget);
        }
    }

    return list;
}

function normalizeFileName(value) {
    const result = value.match(filePattern);
    let ret;

    if(result == null) {
        ret = '';
    } else if(result.length > 0) {
        ret = result[0].toUpperCase();
    } else {
        ret = '';
    }

    return ret;
}

function getDestDirectory(fileName) {
    const result = fileName.match(dirPattern);
    let ret;

    if(result == null) {
        ret = '';
    } else if(result.length > 0) {
        ret = result[0].toUpperCase();
    } else {
        ret = '';
    }

    return ret;
}

async function moveFile(original, dest, name) {
    let ret = false;

    try {
        await fs.mkdir(dest);
    } catch(err) {
        if(err.code !== 'EEXIST') {
            throw err;
        }
    }

    try {
        await fs.rename(original, path.join(dest, name));
        console.log(`${original} => ${path.join(dest, name)}`);
        ret = true;
    } catch(err) {
        ret = false;
        console.log(err);
    }

    return ret;
}

async function process() {
    const sourcePath = path.normalize(properties.getSource());
    const destPath = path.normalize(properties.getDest());
    const errPath = path.normalize(properties.getErr());

    let moveResult = false;
    let targetCount = 0;
    let moveCount = 0;

    walk(sourcePath).then(async function (list) {
        targetCount = list.length;

        for (const item of list) {
            const extension = path.extname(item);
            const basename = path.basename(item, extension);
            let normalizedFileName;
            let targetName;
            if(isNormalized(basename)) {
                normalizedFileName = basename;
                targetName = `${basename}${extension}`;
            } else {
                normalizedFileName = normalizeFileName(basename);
                targetName = `${normalizedFileName}[${basename}]${extension}`;
            }

            try {
                if (normalizedFileName !== '') {
                    const destDirectory = getDestDirectory(normalizedFileName);
                    moveResult = await moveFile(item, path.join(destPath, destDirectory), targetName);
                } else {
                    moveResult = await moveFile(item, errPath, path.basename(item));
                }
            } catch(err) {
                console.log(err);
            }

            if(moveResult) {
                moveCount++;
            }

            console.log(`DONE ${moveCount}/${targetCount}`);
        }
    })
}

process().then(function() {
    console.log('Done');
});