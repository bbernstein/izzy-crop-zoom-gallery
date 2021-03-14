# izzy-crop-zoom-gallery

## Isadora - how to use

To use this in Isadora, make a Javascript actor and paste in the contents
of the file `cropper.js`

There is a full Isadora example that includes this 
[here](https://troikatronix.com/plugin/zoomosc-name-to-video/).

Look in scene `OSCListen` in the User Actor `Calculate Frame Croppers`.


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
