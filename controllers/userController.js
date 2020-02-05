const User =  require("../models/User");
const Post = require("../models/Post")
const Follow = require("../models/follow")
const jwt = require("jsonwebtoken")
exports.validLogin = function(req,res,next){
    if(req.session.user){
       next();
    }
    else{
        req.flash("errors" ,"mousi says you must be logged in to post")
        req.session.save(function () {
            res.redirect("/")
        })
    }
}
exports.validApiLogin = function(req,res,next){
    try{
        req.apiUser = jwt.verify(req.body.token,process.env.JWTSECRET)
        next()
    }catch (e) {
        res.json("well that's a bad token")
    }
}

exports.login = function(req,res){
    let user = new User(req.body);
    user.login().then(function (result) {
        req.session.user={dp:user.dp , username : user.data.username,_id:user.data._id};
        req.session.save(function () {
            res.redirect('/')
        })
    }).catch(function (err) {
        req.flash('errors', err)
        req.session.save(function () {
            res.redirect('/')
        })

    })

};

exports.apiLogin = function(req,res){
    let user = new User(req.body);
    user.login().then(function (result) {
        res.json(jwt.sign({_id:user.data._id},process.env.JWTSECRET,{expiresIn:'7d'}))
    }).catch(function (err) {
        res.json("sorry thts wrong")

    })

};


exports.logout = function(req,res){
    req.session.destroy(function(){
        res.redirect('/');
    });

};

exports.register= function (req,res) {
    let user = new User(req.body);
    user.register().then(()=>
    {
        req.session.user = {username: user.data.username,dp :user.dp ,_id:user.data._id}
        req.session.save(function () {
            res.redirect('/')
        })
    }).catch((regErrors)=>{
        regErrors.forEach(function (err) {
            req.flash("regErrors",err)
        })
        req.session.save(function () {
            res.redirect('/')

        })
    })


};



exports.home =async function(req,res){
    if(req.session.user){
        //fetch feeds
        let posts = await Post.getFeed(req.session.user._id)
        res.render("home-dashboard" , {posts: posts ,title: `welcome screen`})
    }
    else {
        res.render("home-guest.ejs",{regErrors:req.flash("regErrors")} )

    }
};

exports.ifUserExists = function (req,res,next) {
 User.findByUsername(req.params.username).then(function (userDocument) {
    req.profileUser = userDocument
     next();
 }).catch(function () {

    res.render("404")
 })
}

exports.profilePostScreen = function (req,res) {
    Post.findByAuthorId(req.profileUser._id).then(function (posts) {
        res.render("profile",{
            title : `${req.profileUser.username}'s profile`,
            current : "posts",
            posts : posts,
            profileUsername: req.profileUser.username,
            profiledp : req.profileUser.dp,
            isFollowing : req.isFollowing,
            isVisitorsProfile :req.isVisitorsProfile,
            counts:{postCount:req.postCount,followercount:req.followercount,followingcount:req.followingcount}
        })


    }).catch(function () {
        res.render("404")
    })

}
exports.sharedProfileData  = async  function (req,res,next) {
        let isFollowing = false;
        let isVisitorsProfile = false;
        if(req.session.user){
            isFollowing = await Follow.isVisitorFollowing(req.profileUser._id,req.visitorId)
            isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)
        }
        req.isVisitorsProfile = isVisitorsProfile;
        req.isFollowing = isFollowing;
        //retreive counts
    let postCountP =  Post.countPostsByAuthor(req.profileUser._id);
    let followerCountP =  Follow.countFollowerById(req.profileUser._id);
    let followingCountP =  Follow.countFollowingById(req.profileUser._id);
    let [postCount, followerCount,followingCount] = await Promise.all([postCountP,followerCountP,followingCountP]);
    req.postCount = postCount;
    req.followercount = followerCount;
    req.followingcount = followingCount;
    next();
}
exports.profileFollowersScreen = async function (req,res) {
 try{
     let followers = await Follow.getFollowersById(req.profileUser._id)
     res.render('profile-followers' ,{
         current : "followers",
         followers : followers,
         profileUsername: req.profileUser.username,
         profiledp : req.profileUser.dp,
         isFollowing : req.isFollowing,
         isVisitorsProfile :req.isVisitorsProfile,
         counts:{postCount:req.postCount, followercount:req.followercount, followingcount:req.followingcount}

     })
 }
 catch(e){
     res.render('404')
 }
}
exports.profileFollowingScreen = async function (req,res) {
    try {
        let following = await Follow.getFollowingById(req.profileUser._id)
        res.render('profile-following', {
            current : "following",
            following: following,
            profileUsername: req.profileUser.username,
            profiledp: req.profileUser.dp,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts:{postCount:req.postCount,followerCount:req.followerCount,followingcount:req.followingcount}

        })
    } catch (e) {
        res.render('404')
    }
}

exports.doesUsernameExist = function(req, res) {
    User.findByUsername(req.body.username).then(function() {
        return res.json(true)
    }).catch(function() {
        return res.json(false)
    })
}

exports.doesEmailExist =async function (req,res) {
    let email  = await User.doesEmailExist(req.body.email)
    res.json(email)

}
exports.apiGetPostsByUsername = async function (req,res) {
try{
    let authorDoc =await User.findByUsername(req.params.id)
    let posts =await Post.findByAuthorId(authorDoc._id)
    res.json(posts)
}catch (e) {
    res.json('bad try')
}
}