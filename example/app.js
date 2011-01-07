var express = require("express")
  , app = express.createServer()

app.use(express.staticProvider(__dirname + '/public'));

app.set('view options', {
 layout: false
});

app.get("/", function (req, res) {
  res.render("index.haml");
});

app.listen(3031);
