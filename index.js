const cropper = require('./cropper');

const width = 2560;
const height = 1440;

// try other sizes to make it work for them
// const width=746;
// const height=1417;

for (let count=1; count <= 30; count++) {
    const crops = cropper.autoCropZoomGallery(width, height, count, 0, 1, 0, 0, 0);

    const frameWidth = width - crops[0].left - crops[0].right;
    const frameHeight = height - crops[0].top - crops[0].bottom;

    // convenient for copy/paste into a spreadsheet
    console.log(`${count}\t${frameWidth}\t${frameHeight}\t${crops[0].left}\t${crops[0].top}`);
}
