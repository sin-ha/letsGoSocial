const postCollection = require("../db").db().collection("posts")
const followsCollection = require("../db").db().collection("follows")
const objectID = require("mongodb").ObjectId;
const User = require("./User")
const sanitizeHtml = require("sanitize-html")
let Post = function (data ,userId,requestedPostId) {
        this.data = data
    this.errors =[];
    this.userid = userId;
    this.requestedPostId = requestedPostId;

};

Post.prototype.cleanUp= function(){
if(typeof(this.data.title)!= "string"){this.data.title=""}
if(typeof(this.data.body)!= "string"){this.data.body=""}
this.data={
    title : sanitizeHtml(this.data.title.trim() , allowedTags = [],allowedAttributes = {}),
    body : sanitizeHtml(this.data.body.trim() , allowedTags = [],allowedAttributes = {}),
    createdDate : new Date(),
    author: objectID(this.userid)
}

};
Post.prototype.validate = function(){
    if(this.data.title==""){this.errors.push("title empty")}
    if(this.data.body==""){this.errors.push("body empty")}

};
``
Post.prototype.create = function(){
    return new Promise((resolve,reject)=>{
        this.cleanUp()

        this.validate()
        if(!this.errors.length){
            postCollection.insertOne(this.data).then((info)=>
            {
                resolve(info.ops[0]._id)
            }).catch(()=>
            {
                this.errors.push("Please try again later")
            })
        }
        else{
            reject(this.errors)
        }
    })
};

Post.findSingleById = function(id,visitorId) {
    return new Promise(async function(resolve, reject) {
    if (typeof(id) != "string" || !objectID.isValid(id)) {
        reject()
        return
    }

    let posts = await Post.reusablePostQuery([
        {$match: {_id: new objectID(id)}}
    ], visitorId)

    if (posts.length) {

        resolve(posts[0])
    } else {
        reject()
    }
})
}

Post.reusablePostQuery = function(id,nowId){
      return new Promise(async function(resolve, reject) {
    let aggOperations = id.concat([
      {$lookup: {from: "userdata", localField: "author", foreignField: "_id", as: "authorDocument"}},
      {$project: {
        title: 1,
        body: 1,
        createdDate: 1,
        authorId: "$author",
        author: {$arrayElemAt: ["$authorDocument", 0]}
      }}
    ])

    let posts = await postCollection.aggregate(aggOperations).toArray()

    // clean up author property in each post object
    posts = posts.map(function(post) {
      post.isVisitorOwner = post.authorId.equals(nowId)
        post.authorId = undefined

      post.author = {
        username: post.author.username,
        dp: new User(post.author, true).dp
      }

      return post
    })

    resolve(posts)
  })

}


Post.findByAuthorId = function(authorId) {

    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}}
    ])
}
Post.prototype.update = function(){
    return new Promise(async (resolve, reject) =>{
        try{

            let post = await Post.findSingleById(this.requestedPostId,this.userid)

            if(post.isVisitorOwner){
               let status=   await this.actuallyUpdate();
                resolve(status)
            }
        }
        catch (e) {
                reject()
        }
    } )
}

Post.prototype.actuallyUpdate = function(){
    return new Promise(async (resolve,reject) =>{
        this.cleanUp();
        this.validate();
        if(!this.errors.length){

            await postCollection.findOneAndUpdate({_id: new objectID(this.requestedPostId)},{$set:{title:this.data.title,body :this.data.body}});
            resolve("success")
        }
    else{
        resolve("failure")
        }
    }

)
}

Post.delete= function(postId,userId){
    return new Promise(async (resolve,reject) =>{
       try{
           let post =await Post.findSingleById(postId,userId)
           console.log(post)
            if(post.isVisitorOwner){
                console.log("hi")
                await postCollection.deleteOne({_id :  new objectID(postId)})
                resolve()
                return;
            }
            else{
                reject()
            }
       }
       catch{
           reject()
       }
    })
};

Post.search = function(searchTerm){
    return new Promise(async (resolve,reject)=>{
        if(typeof(searchTerm)=="string"){
            let posts = await Post.reusablePostQuery([
                {$match:{$text:{$search : searchTerm}}},
                {$sort:{score:{$meta:"textScore"}}}
            ])
            resolve(posts)
        }

        else{
            reject()
        }
    })
}
Post.countPostsByAuthor = function(id){
    return new Promise ( async (resolve, reject)=>{
        let postCount = await postCollection.countDocuments({author:id})
        resolve(postCount)
    })

}
Post.getFeed = async function(id){
    //create array of follwing
    let followedUsers  = await followsCollection.find({authorId:new objectID(id)}).toArray()

    followedUsers =followedUsers.map(function (elem) {
        return elem.followedId;
    })
    console.log("foll" ,followedUsers)
    //look for posts
    return Post.reusablePostQuery([
        {$match:{author:{$in:followedUsers}}},
        {$sort :{createdDate :-1}}
    ])
}

module.exports = Post;