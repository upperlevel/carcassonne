# Carcassonne
Carcassone board-game brought online.

If you don't know what carcassonne is, visit us at (TODO) (and remember to bring friends!).

### How do I host it?
This is only the client code, the server code is hosted [here](https://gtihub.com/upperlevel/carcassonne-server).

In our production server a nginx webserver hosts the files and routes websocket requests to carcasssonne-server.
To select where you want your websocket to connect you can edit configurations in your .env file.

### How do I build it?

In order to build the client you only need Node.js (preferably >= 18.x).

After you've cloned the repository, install the node.js dependencies:

```
npm install .
```

Then you have to copy `.env.example` into `.env` and if needed configure the fields as you like.

Build the game files:

```
npx webpack --mode production
```

Once built carcassonne's game files can be found under the `./dist` directory. The generated files have to be statically served by a webserver such as Apache or nginx.

### Why did you create it?
In our lonely quarantine days we wanted to play with our friends but we found no game like carcassonne available
online, so we started creating it! If you want to help us make more games like this available do not hesitate to
contact any of the devs (opening a issue or finding us on a social network) or consider donating!

### Graphics
All of the graphics has been made by [Giorgia Nizzoli](https://t.me/GioOmbra).
Without her we couldn't make this game so enjoyable and user friendly.


### Privacy
The server does not host anything and we use no cookies, we are only using google analytics for statistics.
The connection is not P2P though (although there are plans to implement that) so any data that you send trough he server
ca be easily read by the server.
In future versions we plan to use WebRTC to distribute the gameplay load.

### Game Logic
The client handles all of the game logic, the server only knows what's the avatar like.
This has been designed to ease client implementation and to support multiple game protocols when needed.

### Thanks
We must also thank all of our friends that have been silently used as alpha testers.
