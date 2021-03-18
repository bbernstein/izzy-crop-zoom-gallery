/**
 * by Bernie Bernstein. Find me in ZoomOSC Power Users slack channel:
 * https://zoomoscpowerusers.slack.com/join/shared_invite/zt-ibb2jhgm-NEij9uT~Fgp98xVlkNCGVA#/
 *
 * The gist and other versions could get out-of-date.
 * You can find the original here:
 * https://github.com/bbernstein/izzy-crop-zoom-gallery/
 * (in the file cropper.js)
 *
 * Updates:
 *
 * 2021-03-18: Changed output to be an array of JSON rather than a plain array of numbers.
 *      In Isadora, you'll need to use the JSON Parser actor to use this:
 *      https://troikatronix.com/plugin/json-parser-json-bundler/
 *      The first element will contain {count, width, height}, then each subsequent
 *      element will have {pahH, panV} values.
 *
 * 2021-03-13: Removed "extraTopMargin" and added left/right margin overrides.
 *      It now can work for pinned windows by setting top and bottom margins to 45
 *
 * 2021-02-07: Removed kludgy exceptions and tested it to exact pixel on 2560x1440 on sizes 1 to 30 frames
 *   Also added more parameters:
 *   4. Resolution Multiplier lets it work on retina displays
 *   5. Number of rows in the gallery (saves figuring it out)
 *   6. Number of cols in the gallery (not really needed since this can be inferred from rows)
 *   7. Crop out names (on = crop the bottom 20 pixels to remove the name)
 *
 * Paste this into a new Javascript User Actor
 *
 * Inputs are:
 * 1: device width
 * 2: is device height
 * 3: is number of participant boxes on the screen
 * 4: resolution multiplier (retina = 2, normal = 1) (set to 1 if anything < 1)
 * 5: gallery rows (use this instead of calculating number of rows) (< 1 will force calculate)
 * 6: gallery cols (user this instead of calculating number of cols) (< 1 will force calculate)
 * 7: crop name (boolean (0/non-zero - crop the bottom pixels to remove the name)
 * 8: extra top margin in case this is in a window rather than full screen
 *
 * Outputs are
 * 1: number of participant boxes (passes through 3 above)
 * 2: width of the boxes
 * 3: height of the boxes
 * 4: box 1 horizontal offset
 * 5: box 1 vertical offset
 * 6: box 2 horizontal offset
 * 7: box 2 vertical offset
 * …… for as many boxes given in input 3 …..
 *
 */

// stuff for my own testing when calling from outsize function
// module.exports = { main, autoCropZoomGallery };
// function print(args) {
//     if (args == '\n') return;
//     console.log(args);
// }

var OLDSTYLE=false

function main() {
    const screenWidth = arguments[0];
    const screenHeight = arguments[1];
    const galCount = arguments[2];
    const multiplier = (Number(arguments[3]) < 2) ? 1 : arguments[3];
    const rows = (Number(arguments[4]) < 1) ? 0 : arguments[4];
    const cols = (Number(arguments[5]) < 1 || rows < 1) ? 0 : arguments[5];
    const cropName = arguments[6] != 0;
    const extraTopMargin = arguments[7] || 0;
    const topMargin = 45 + extraTopMargin;
    const bottomMargin = 59;

    print("Calculating boxes: " + galCount);
    print("\n");

    const result = calcIzzyPannerVals(screenWidth, screenHeight, galCount, cropName, multiplier, rows, cols, topMargin, bottomMargin)

    if (OLDSTYLE) return result;
    return result.map(val => JSON.stringify(val));
}

function calcDimensionsForShape(frameWidth, frameHeight, boxCount, aspectRatio, spacing, rows, cols) {
    // pack the frames together by removing the spacing between them
    const packedWidth = frameWidth - (spacing * (cols - 1));
    const packedHeight = frameHeight - (spacing * (rows - 1));
    const hScale = packedWidth / (cols * aspectRatio);
    const vScale = packedHeight / rows;
    let width;
    let height;
    if (hScale <= vScale) {
        width = Math.floor(packedWidth / cols / 16) * 16;
        height = Math.floor(width / aspectRatio / 9) * 9;
    } else {
        height = Math.floor(packedHeight / rows / 9) * 9;
        width = Math.floor(height * aspectRatio / 16) * 16;
    }
    const area = width * height;
    return {
        area: area,
        cols: cols,
        rows: rows,
        width: width,
        height: height
    };
}

/**
 * Calculate optimal layout (most area used) of a number of boxes within a larger frame.
 * Given number of boxes, aspectRatio of those boxes, and spacing between them.
 *
 * Thanks to Anton Dosov for algorithm shown in this article:
 * https://dev.to/antondosov/building-a-video-gallery-just-like-in-zoom-4mam
 *
 * @param frameWidth width of the space holding the boxes
 * @param frameHeight height of the space holding the boxes
 * @param boxCount number of boxes to place (all same aspect ratio)
 * @param aspectRatio ratio of width to height of the boxes (usually 16/9)
 * @param spacing amount of space (margin) between boxes to spread them out
 * @returns A description of the optimal layout
 */
function calcOptimalBoxes(frameWidth,
                          frameHeight,
                          boxCount,
                          aspectRatio,
                          spacing,
                          galRows,
                          galCols) {

    // keep track of the one with the biggest area, biggest is the best
    let bestLayout = {
        area: 0,
        cols: 0,
        rows: 0,
        width: 0,
        height: 0
    }

    if (galRows > 0 && galCols > 0) {
        // we already know rows/cols, we don't need to try all combinations
        return calcDimensionsForShape(frameWidth, frameHeight, boxCount, aspectRatio, spacing, galRows, galCols);
    }

    // try each possible number of columns to find the one with the highest area (optimum use of space)
    for (let cols = 1; cols <= boxCount; cols++) {
        const rows = Math.ceil(boxCount / cols);
        const layout = calcDimensionsForShape(frameWidth, frameHeight, boxCount, aspectRatio, spacing, rows, cols);
        if (layout.area > bestLayout.area) {
            bestLayout = layout;
        }
    }
    return bestLayout;
}

/**
 * Calculate crop values for the gallery boxes given the overall frame size and number of boxes in the gallary
 *
 * @param sourceWidth Width of the enclosing frame
 * @param sourceHeight Height of the enclosing frame
 * @param itemCount Number of boxes to lay out
 * @returns an array of crop values for a bunch of zoom boxes
 */
function autoCropZoomGallery(sourceWidth, sourceHeight, itemCount, cropName, multiplier, galRows, galCols, topMarginOverride, bottomMarginOverride) {

    const ASPECTRATIO = 16 / 9;
    const TOPMARGIN = (topMarginOverride && topMarginOverride >= 0) ? topMarginOverride : 45;
    const BOTTOMMARGIN = (bottomMarginOverride && topMarginOverride >= 0) ? bottomMarginOverride : 59;
    const LEFTMARGIN = RIGHTMARGIN = 6;
    const SPACING = 6;

    // these work for me ymmv
    const topMargin = TOPMARGIN * multiplier;
    const bottomMargin = BOTTOMMARGIN * multiplier;
    const spacing = SPACING * multiplier;
    let leftMargin = rightMargin = LEFTMARGIN * multiplier;

    // make this zero if you don't want to crop out the name
    // if you want to be really cool about it, add boolean param like "crop name"
    const nameLabelHeight = (cropName ? 20 : 0) * multiplier;

    let centerV = (sourceHeight - topMargin - bottomMargin) / 2 + topMargin;

    // width excluding margins
    const innerWidth = sourceWidth - leftMargin - rightMargin;
    const innerHeight = sourceHeight - topMargin - bottomMargin;

    let bestLayout = calcOptimalBoxes(innerWidth, innerHeight, itemCount, ASPECTRATIO, spacing, galRows, galCols);

    const numCols = bestLayout.cols;
    const numRows = bestLayout.rows;
    const boxWidth = bestLayout.width;
    const boxHeight = bestLayout.height;

    print("width="+boxWidth+ ", height="+boxHeight+", rows="+numRows);
    print('\n');

    // last row might not be full
    const lastRow = numRows - 1;
    const lastRowCols = numCols - (numRows * numCols - itemCount);

    const result = [];

    // figure out crop for each item
    for (let i = 0; i < itemCount; i++) {
        const colInd = i % numCols;
        const rowInd = Math.floor(i / numCols);
        const rowSize = (rowInd === lastRow) ? lastRowCols : numCols;

        const boxWidthSum = rowSize * boxWidth + (spacing * (rowSize - 1))
        const boxHeightSum = numRows * boxHeight + (spacing * (numRows - 1))

        const hMargin = (sourceWidth - boxWidthSum) / 2;

        const cropLeft = hMargin + (colInd * boxWidth) + (colInd * spacing);
        const cropRight = sourceWidth - (cropLeft + boxWidth);

        const cropTop = Math.round(centerV - boxHeightSum / 2) + (rowInd * (boxHeight + spacing));
        const cropBottom = sourceHeight - (cropTop + boxHeight) + nameLabelHeight;

        print("crop "+i+": cropLeft="+cropLeft+", cropRight="+cropRight+", cropTop="+cropTop+", cropBottom="+cropBottom);
        print('\n');

        result.push({
            left: cropLeft,
            right: cropRight,
            top: cropTop,
            bottom: cropBottom
        });
    }

    return result;
}

/**
 * Calculate Isadora Panner values for a screen size and count of boxes
 *
 * Example for count of 3:
 * <count> <boxWidth> <boxHeight> <panH1> <panV1> <panH2> <panV2> <panH3> <panV3>
 *
 * stick those values into an Isadora Panner and voíla, you've got a perfectly cropped box
 *
 * @param width screen width
 * @param height screen height
 * @param count number of zoom boxes
 */
function calcIzzyPannerVals(width, height, count, cropName, multiplier, galRows, galCols, topMarginOverride, bottomMarginOverride) {
    const crops = autoCropZoomGallery(width, height, count, cropName, multiplier, galRows, galCols, topMarginOverride, bottomMarginOverride)
        // inset by 1 pixels so when we convert to percentages, we the rounding-error will not extend beyond box
        .map((crop) => ({
            left: crop.left + 1,
            right: crop.right + 1,
            top: crop.top + 1,
            bottom: crop.bottom + 1
        }));

    let boxWidth = 0;
    let boxHeight = 0;
    let boxWidthP = 1;
    let boxHeightP = 1;
    if (crops.length > 0) {
        boxWidth = width - crops[0].left - crops[0].right;
        boxHeight = height - crops[0].top - crops[0].bottom;
        boxWidthP = boxWidth / width;
        boxHeightP = boxHeight / height;
    }
    let cropPercents = [];

    const boxWid2 = boxWidth / 2;
    const boxHei2 = boxHeight / 2;
    const screenWid = width - boxWidth;
    const screenHei = height - boxHeight;

    let screenCenterH = width / 2;
    let screenCenterV = height / 2;
    for (let i = 1; i <= count; i++) {
        const boxCenterH = crops[i - 1].left + boxWid2;
        const boxCenterV = crops[i - 1].top + boxHei2;

        const panH = screenCenterH - boxCenterH;
        const panHP = 0.5 - panH / screenWid;
        const panV = screenCenterV - boxCenterV;
        const panVP = 0.5 - panV / screenHei;

        if (OLDSTYLE) {
            const aCrop = [panHP * 100, panVP * 100]
            cropPercents = cropPercents.concat(aCrop);
        } else {
            const aCrop = { panH: panHP * 100, panV: panVP * 100 };
            cropPercents.push(aCrop);
        }
    }

    if (OLDSTYLE) {
        return [count, boxWidthP * 100, boxHeightP * 100].concat(cropPercents);
    }

    return [
        {
            count: count,
            width: boxWidthP * 100,
            height: boxHeightP * 100
        },
        ...cropPercents
    ];
}


