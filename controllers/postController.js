const Post = require("../models/Post")
const sengrid = require("@sendgrid/mail")
sengrid.setApiKey(process.env.SENDGRID)
exports.viewCreateScreen = function (req,res) {
    res.render("create-post")
}

exports.create= function (req,res) {
    let post = new Post(req.body, req.session.user._id)
    post.create().then(function(new_id){
        sengrid.send({
            to: "harsh19112000@gmail.com",
            from : "harshsinha.iit18@gmail.com",
            subject:"congo",
            text:"you did good",
            html:'you did <b>good</b>'

        })
        console.log(process.env.SENDGRID)
        req.flash("success" , "new post created")
        req.session.save(()=>res.redirect(`post/${new_id}`))
    }).catch(function (errors) {
        errors.forEach(error=>req.flash("errors",error))
        req.session.save(()=> res.redirect("/create-post"))
    })
}
exports.apiCreate= function (req,res) {
    let post = new Post(req.body, req.apiUser._id)
    post.create().then(function(new_id){
        res.json("done dona done done")
    }).catch(function (errors) {
        res.json(errors)
    })
}
exports.viewSingle= async function(req,res){
    try{
        //console.log("id,params" , req.params.id,req.visitorId)
        let post = await Post.findSingleById(req.params.id,req.visitorId)

        res.render("single-post-screen",{post:post ,title:post.title});
    }catch{
        res.render("404.ejs")
    }
};
exports.viewEditScreen = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        if (post.isVisitorOwner) {
            res.render("edit-post", {post: post})
        } else {
            req.flash("errors", "You do not have permission to perform that action.")
            req.session.save(() => res.redirect("/"))
        }
    } catch {
        res.render("404")
    }
}
exports.edit  = function (req,res) {
let post = new Post(req.body,req.visitorId,req.params.id)
    post.update().then((status)=>{

        if(status=="success"){
            req.flash("success" , "your post was updated")
            req.session.save(function () {
                res.redirect(`/post/${req.params.id}`)
            })
        }
        else{
            post.errors.forEach(function (error) {
                req.flash("errors" , error)
            })
        }
    }).catch(()=>{
        req.flash("errors","you dont have permission")
    });
    req.session.save(function () {
            res.redirect(`/post/${req.params.id}/edit`)
    })
};

exports.delete = function(req, res) {
    Post.delete(req.params.id, req.visitorId).then(() => {
        req.flash("success", "Post successfully deleted.")
        req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))
    }).catch(() => {
        req.flash("errors", "You do not have permission to perform that action.")
        req.session.save(() => res.redirect("/"))
    })
}
exports.apiDelete = function(req, res) {
    Post.delete(req.params.id, req.apiUser._id).then(() => {
res.json("success")}).catch(() => {
        res.json("you dont have permission")
    })
}

exports.search = function (req,res) {
    Post.search(req.body.searchTerm).then((posts)=>{
        res.json(posts)
    }).catch(()=>res.json([]))
}