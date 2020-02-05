const usersCollection = require("../db").db().collection("userdata")
const followsCollection = require("../db").db().collection("follows")
const objectId = require("mongodb").ObjectId
const User = require("./User")
let Follow = function(followedUsername, authorId) {
this.followedUsername = followedUsername;
this.authorId = authorId;
this.errors= []
}
Follow.prototype.cleanUp = function(){
    if(typeof(this.followedUsername)!="string"){this.followedUsername = "";}
}
Follow.prototype.validate = async function(action){
    let followedAccount =await usersCollection.findOne({username:this.followedUsername})

    if(followedAccount){
         this.followedId = followedAccount._id
    }else{
        this.errors.push("you cant follow that user it doesnt exists")
    }
    let doesFolllowAlreadyExist = await followsCollection.findOne({followedId:this.followedId,authorId:new objectId(this.authorId)})
    if(action === "create"){
        if(doesFolllowAlreadyExist){this.errors.push("You Already follow this user")}
    }
    if(action === "delete"){
        if(!doesFolllowAlreadyExist){this.errors.push("yaar pehle follow to karo fir stop karna")}
    }
    if(this.followedId.equals(this.authorId)){
        this.errors.push("khud ko hi follow karoge kya");
    }
}
Follow.prototype.create =function () {
return new Promise(async (resolve,reject)=>{
    this.cleanUp()
    await this.validate("create")
    if(!this.errors.length){
        await followsCollection.insertOne({followedId:this.followedId , authorId : new objectId(this.authorId)});
        resolve();
    }else{
        reject(this.errors)
    }
})
}
Follow.isVisitorFollowing = async function(followedId , visitoriId){
    let followDoc = await  followsCollection.findOne({followedId:followedId,authorId:new objectId(visitoriId)})
    if(followDoc){
        return true;

    }
    else{
        return false;
    }
}
Follow.prototype.delete =function () {
    return new Promise(async (resolve,reject)=>{
        this.cleanUp()
        await this.validate("delete")
        if(!this.errors.length){
            await followsCollection.deleteOne({followedId:this.followedId , authorId : new objectId(this.authorId)});
            resolve();
        }else{
            reject(this.errors)
        }
    })
}
Follow.getFollowersById =  function(id){
    return new Promise(async (resolve, reject) =>{
        try {
            let followers = await followsCollection.aggregate([
            {$match: {followedId: id}},
                {$lookup : {from :"userdata",localField: "authorId", foreignField: "_id" ,as:"userDoc"}},
                {$project : {username: {$arrayElemAt: ["$userDoc.username", 0]},
                        email: {$arrayElemAt: ["$userDoc.email", 0]}
                    }}
            ]).toArray()

            followers = followers.map(function(follower) {
                let user = new User(follower, true)
                return {username: follower.username, dp: user.dp}
            })
            resolve(followers)
        }
        catch{
            reject()
        }
    } )
}
Follow.getFollowingById =  function(id){
    return new Promise(async (resolve, reject) =>{
        try {
            let followers = await followsCollection.aggregate([
                {$match: {authorId: id}},
                {$lookup : {from :"userdata",localField: "followedId", foreignField: "_id" ,as:"userDoc"}},
                {$project : {username: {$arrayElemAt: ["$userDoc.username", 0]},
                        email: {$arrayElemAt: ["$userDoc.email", 0]}
                    }}
            ]).toArray()

            followers = followers.map(function(follower) {
                let user = new User(follower, true)
                return {username: follower.username, dp: user.dp}
            })
            resolve(followers)
        }
        catch{
            reject()
        }
    } )
}
Follow.countFollowerById = function(id){
    return new Promise ( async (resolve, reject)=>{
        let followerCount = await followsCollection.countDocuments({followedId:id})
        resolve(followerCount)
    })
}

Follow.countFollowingById = function(id){
    return new Promise ( async (resolve, reject)=>{
        let followerCount = await followsCollection.countDocuments({authorId:id})
        resolve(followerCount)
    })
}

module.exports = Follow;