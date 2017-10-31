## Disclaimer: This is a project intended for a web apps class and any of this content is not to be fully compatible with current developing standards

## the-classicals
Developing a Single Page Application for classical music enthusiasts

### Why?
Because classical music and its fans deserve so much more!

## How?
The project features `Angular 2.0` for handling the delicate frontend, `Node.js` for providing the backend capabilities wrapped up in a RESTful architecture and `Sequelize` for connecting with a MySQL relational database.

### Sounds promising. What can I do with it?
Well, let's see:
* Find your favourite composers, go through their lives, works, official Opus numbers and *hopefully* watch their masterpieces being played on [Youtube](www.youtube.com);
* Search through a vast collection of pieces and indulge in details including including a short history and even *hopefully* music sheets;
> * Build your own Composers, Artists, and/or Songs Sheet to access your preferred content as quickly as possible (not sure if this is going to happen)

### I'm not impressed!
I bet you'll be when you learn about our feature called `Advanced Song Search`, which provides you with a mean of finding songs which
contain a sequence of given tones; you may also spot how often this sequence has been used in songs over the years on a chart. This 
is thanks to [Peachnote](www.peachnote.com).
Perfect if a have a small piece of music stuck in your head, like most of us do!

### Okay, enough with advertising. May you provide technical details about your design?
Sure. Since I'm not accustomed to web development, I might as well provide a mockup and describe the endpoints planned. Keep in mind that this details may change slightly during later development stages.
Let's begin with the endpoints:
* `/` will be used for the main page and it will be the default route for the browser;
* `/composers/` will include a list of composers, which can be trimmed down by searching, `/composers/search/:searchId` will contain the results yielded by the search and `/composers/search/:searchId/:pieceId` will route to the page of the selected piece;
* `/composers/today/:composerId` will include today's picked composer, so will `/pieces/today/:id` today's piece;
* `/composers/pieces/` will include pieces that belong to a certain composer, and `/composers/pieces/:pieceId` will be used to aceess one of the listed pieces;
* `/pieces/` will include a list of pieces that can be searched, so `/pieces/search/:searchId/:pieceId` will include the details of a certain piece;
* `/advancedSearch/` will provide the `Advanced Song Search` functionality, featuring two return types. `/advancedSearch/:searchId&:type/` will return either a chart of pieces that contain the note sequence (if `type` will be `chart`) or 
a list of pieces (if `type` will be `pieces`); resulting endpoint will be `/advancedSearch/:searchId&type=chart/result`.
Here's a rather unrealistic mockup, but feel free to look over it:
![mockupImage](https://user-images.githubusercontent.com/29733821/32249147-9e676a7a-be90-11e7-9d8d-727b4e1748b7.jpg)


### Sounds cool. Where do I find it? 
> At the moment the application is in process of development and therefore it is not publicly available, 
> but you may check the code at any time
