# Resize atom.io Panes

This module allows a person to resize panes in atom. It adds a handle between panes that can be dragged to adjust the size of a pane.

To install and use this awesome extension:

 1. Download the `atom-resize-panes` directory
 2. Place it in the root of your atom config folder
      (`~/.atom/`, `C:\Users\Username\.atom\`)
 3. Add the following line to your Init Script (`init.coffee`)
      `require("./atom-resize-panes")()`
 4. Add the following line to your Stylesheet (`styles.less`)
      `@import "atom-resize-panes/main.less";`
 5. Profit

### Features

 - Saves pane sizes per project
 - Works for all type of panes (vertical, horizontal, mixed)
 - Change the width of the handle bar (default `10px`)
      Add this line after the `@import` statement in your Stylesheet
      `@atom-resize-thickness: 5px;` (replace `5px` with the width you want)

### Want to make this a package?

I hate Coffeescript, and I'm not going to learn it just so I can convert this project into an atom package. If anyone wants to do so, you are welcome to, just give me some credit.

### Known bugs

 - Pane can be made larger than window
