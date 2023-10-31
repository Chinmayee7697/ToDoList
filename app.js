//jshint esversion:6

//importing dependencies
const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connecting mongodb server using mongoose
mongoose.connect("mongodb+srv://chinmayee7697:17559988@cluster0.mhyik5j.mongodb.net/todolistDB", {useNewUrlParser:true});

//Creating collection - Item (in dbs - items )
const itemsSchema=new mongoose.Schema({
  name:String
});

const Item= mongoose.model("Item", itemsSchema);

const item1=new Item({
  name:"Welcome to your todo list!"
});

const item2= new Item({
  name:"Hit the button + to add a new item. "
});

const item3=new Item({
  name:"<--Hit this to delete an item."
});

const defaultItems=[item1, item2, item3];
  
//Creating another collection - List (in dbs - lists)
const listSchema=new mongoose.Schema({
  name:String,
  items:[itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find()
    .then(function(foundItems){

      if(foundItems.length === 0){
        Item.insertMany(defaultItems)
            .then(function (items) {
                  console.log("Successfully saved default items to the database");
            })
            .catch(function (err) {
                  console.log(err);
            });
            res.redirect("/");
      } else{
           res.render("list", {listTitle: "Today", newListItems: foundItems});
      }

    })
    .catch(function(err){
      console.log(err);
    });
    
});


app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
  .then((foundList) => {
    if (!foundList) {
      //Create a new list
      const list=new List({
        name:customListName,
        items: defaultItems
      });
    
      list.save();
      res.redirect("/"+customListName);
    } else {
      //Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  })
  .catch((error) => {
    console.error("Error finding list:", error);
  });


  

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item=new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name:listName})
      .then((foundList)=>{
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
  }
  
});


app.post("/delete", function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
      .then((removedItem) => {
          if (removedItem) {
            console.log("Successfully deleted checked item");
          } else {
            console.log("Item not found or already deleted");
          }
        res.redirect("/");
      })
      .catch((error) => {
        console.error("Error deleting item:", error);
       });  
  } 
  else{
      List.findOneAndUpdate({name: listName} , {$pull:{items: {_id:checkedItemId}}} )
        .then((foundList)=>{
          res.redirect("/"+ listName);
        })
        .catch((err)=>{
          console.log(err);
        });
  }

});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
