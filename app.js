//importing the libraries
const express = require('express');
const session = require("express-session");
const MongoStore = require("connect-mongo")(session)
const flash = require("connect-flash")
const markdown = require("marked")
const csrf = require("csurf")
const app = express();
const  sanitizeHtml = require('sanitize-html')
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use("/api" ,require('./router-api'))
let sessionOptions = session({
  secret : "this is secret",
  store: new MongoStore({client: require("./db")}),
  resave : false,
  saveUninitialized: false,
  cookie:{maxAge:1000*60*60*24,httpOnly:true}
})
app.use(flash())

app.use(sessionOptions)
app.use(function (req,res,next) {
  res.locals.filterUserHTML = function(content){
    return(markdown(content))
  }
  res.locals.errors = req.flash("errors")
  res.locals.success = req.flash("success")


  if(req.session.user){req.visitorId = req.session.user._id}
  else{req.visitorId=0}


  res.locals.user = req.session.user
  next();
})
const router = require("./router");
app.use(express.static("public"));

app.set('views','views');
app.set('view engine','ejs');
app.use(csrf())
app.use(function (req,res,next) {
 res.locals.csrfToken = req.csrfToken()
  next();
})


app.use("/",router);
app.use(function (err, req,res,next) {
if(err){
  if(err.code ===  "EBADCSRFTOKEN"){
    req.flash("errors" ,"Cross site frogery detected.")
    req.session.save(()=>res.redirect('/'))
  }
  else{
    res.render('404')
  }
}
})
const server = require('http').createServer(app)
const io  = require('socket.io')(server)
io.use(function(socket, next) {
  sessionOptions(socket.request, socket.request.res, next)
})
io.on('connection' ,(socket)=>
{
 if(socket.request.session.user){
   let user = socket.request.session.user
   socket.emit("welcome",{username: user.username, dp: user.dp})
   socket.request.session.user
   socket.on('chatmessagefrombrowser', function(data) {
     socket.broadcast.emit('chatmessagefrombrowser', {message: sanitizeHtml(data.message, allowedTags = [],allowedAttributes = {}), username: user.username, dp: user.dp})
   })

 }
})
module.exports = server;
