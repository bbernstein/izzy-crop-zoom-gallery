# izzy-crop-zoom-gallery

## Isadora - how to use

To use this in Isadora, make a Javascript actor and paste in the contents
of the file `cropper.js`

There is a full Isadora example that includes this 
[here](https://troikatronix.com/plugin/zoomosc-name-to-video/).

Look in scene `OSCListen` in the User Actor `Calculate Frame Croppers`.

## Breaking change 2021-03-18

Values returned are now an array of JSON values.

```
[
    {
        count: <# frames in gallary>,
        width: <width of each of the frames>,
        height: <height of each of the frames>
    },
    {
        panH: <H position for frame 1>,
        panV: <V position for frame 1>
    },
    {
        panH: <H position for frame 2>,
        panV: <V position for frame 2>
    },
    {
        panH: <H position for frame 3>,
        panV: <V position for frame 3>
    }
    ...
]
```

To use this in Isadora, you'll want to use 
[the JSON Parser](https://troikatronix.com/plugin/json-parser-json-bundler/)
which is not a built-in actor and needs to be installed.

If you need it to run the old way with the single-level array, set the variable OLDSTYLE to be `true`.


```
// If you need a single array of numbers instead of JSON output, change this to `true`    
var OLDSTYLE=false
```

## Running in NodeJS

Javascript code to chop up a zoom gallery

To run this in node, uncomment the lines in `cropper.js`:

```
// module.exports = { main, autoCropZoomGallery };
// function print(args) {
//     if (args == '\n') return;
//     // console.log(args);
// }
```

Then you can run it in node:

```
node index.js
```

You can edit index.js to try different gallery sizes and screen dimensions.

The output is made for copy/pasting into a spreadsheet like [this](https://docs.google.com/spreadsheets/d/1M8yhE6Iu3jYyatHGrvu9DI_ZiTZRRNLPt5CzthrkXDg/edit#gid=0)
