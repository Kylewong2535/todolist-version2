
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb+srv://kylewong2535:RYAVXFBMON0zaOJc@cluster0.8avknbd.mongodb.net/todolistDB');
  // await mongoose.connect('mongodb://127.0.0.1:27017/todolistDB');

  const itemsSchema = new mongoose.Schema({
    name: String
  });

  const Item = mongoose.model("Item", itemsSchema);

  const item1 = new Item({
    name: "Welcome to Todolist!"
  })

  const item2 = new Item({
    name: "Hit the + button to add a new item."
  })

  const item3 = new Item({
    name: "<-- Hit this to delete an item."
  })

  const defaultItems = [item1, item2, item3];

  const ListSchema = {
    name: String,
    items: [itemsSchema]
  };

  const List = mongoose.model("List", ListSchema);

  app.get("/", function (req, res) {

    Item.find({})
      .then(function (foundItems) {
        if (foundItems.length === 0) {

          Item.insertMany(defaultItems)
            .then(function (result) {
              console.log("Sucessfully Added Default Items to DB.");
            })
            .catch(function (err) {
              console.log(err);
            });
          res.redirect("/");
        } else {
          res.render("list", { listTitle: "Today", newListItems: foundItems });
        };
      })
      .catch(function (err) {
        console.log(err);
      });
  });



  app.post("/", function (req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName
    });

    if (listName === "Today") {
      item.save();
      res.redirect("/")
    } else {
      List.findOne({ name: listName })
        .then(foundList => {
          foundList.items.push(item);
          foundList.save();
          res.redirect("/" + listName)
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });

  app.post("/delete", async function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName

    if (listName === "Today") {
      Item.findByIdAndRemove(checkedItemId)
        .then(() => {
          console.log(`Deleted ${checkedItemId} Successfully`);
          res.redirect("/");
        })
        .catch((err) => {
          console.log(err);
        })
    } else {
      List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
        .then(() => {
          res.redirect("/" + listName);
        })
        .catch((err) => {
          console.log(err);
        })
    }

  });

  app.get("/:customListName", function (req, res) {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName })
      .then(foundList => {
        if (!foundList) {

          const list = new List({
            name: customListName,
            items: defaultItems
          });

          list.save()
            .then(() => {
              res.redirect("/" + customListName);
            })
            .catch((err) => {
              console.log(err);
            });



        } else {
          res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        }
      })
      .catch((err) => {
        console.log(err);
      });

  });



}

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});



