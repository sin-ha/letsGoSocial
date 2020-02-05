const validator = require("validator");
const usersCollection = require("../db").db().collection("userdata")
const bcrypt = require("bcryptjs");
const md5 = require("md5")
let User = function(data,dp){
this.data = data;
this.errors= [];
if(dp == undefined){
dp = false}
if(dp){this.dp(dp)}
};
User.prototype.validate = function(){
    return new Promise(async (resolve, reject) => {
        if(this.data.username === ''){this.errors.push("mousi says provide username")}
        if(this.data.username !== '' && !validator.isAlphanumeric(this.data.username)){this.errors.push("mouse says username must be only alphanumeric")}
        if(!validator.isEmail(this.data.email)){this.errors.push("mousi says provide valid email")}
        if(this.data.password === ''){this.errors.push("mousi says provide password")}
        if(this.data.password.length>0 && this.data.password.length<8){this.errors.push("mousi says small  pass")}
        if(this.data.password.length>50){this.errors.push("mousi says beta password 50 characters only")}
        if(this.data.username.length>0 && this.data.username.length<4){this.errors.push("mousi says small  username")}
        if(this.data.username.length>30){this.errors.push("mousi says very large username")}
        if(this.data.username.search(" ") !== -1){this.errors.push("mousi says remove space in username")}
        if(this.data.password.search(" ") !== -1){this.errors.push("mousi says remove space in password")}

        //only if unique
        if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
            let usernameExists = await usersCollection.findOne({username: this.data.username})
            //console.log(usernameExists)
            if (usernameExists) {this.errors.push("That username is already taken.")}
            //console.log(this.errors)
        }

        // Only if email is valid then check to see if it's already taken
        if (validator.isEmail(this.data.email)) {
            let emailExists = await usersCollection.findOne({email: this.data.email})
            if (emailExists) {this.errors.push("That email is already being used.")}
        }
        resolve()



        })

    }

User.prototype.cleanUp =function(){
    if(typeof(this.data.username)!= "string"){this.data.username = "";this.errors.push("mousi detected weird usernname")}
    if(typeof(this.data.email)!= "string"){this.data.email = "";this.errors.push("mousi detected weird email")}
    if(typeof(this.data.password)!= "string"){this.data.password = "";this.errors.push("mousi detected weird password")}

    this.data  = {
        username :this.data.username.trim().toLowerCase(),
        email :this.data.email.trim().toLowerCase(),
        password : this.data.password
    }
};

User.prototype.login = function(){
    return new Promise((resolve, reject) => {
        this.cleanUp();
        let salt = bcrypt.genSaltSync(10);
        usersCollection.findOne({username : this.data.username}).then((attemptedUser) =>{
        if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)){
            this.data = attemptedUser;
            this.dp()
            resolve("mousi says \"aoo beta andar aa jao\"")
            }

            //console.log(bcrypt.hashSync(attemptedUser.password,salt))}
        else{
                reject("mousi says \"beta itna galat kaise hoo sakte ho\"")
            }
        }).catch(function(err){
            reject("mousi says beta baad me aao pls")
        })
    })
};
User.prototype.register  = function(){
    return new Promise(async (resolve,reject)=>{

                //validate user data
                this.cleanUp();
                await this.validate();
                ///connect db
                if(!this.errors.length){
                    let salt = bcrypt.genSaltSync(10);
                    this.data.password = bcrypt.hashSync(this.data.password,salt)
                    await usersCollection.insertOne(this.data)
                    this.dp();
                    resolve()
                }
                else{
                    reject(this.errors)
                }
            })

        }
User.prototype.dp = function(){this
this.dp = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;

}

User.findByUsername = function(username){
    return new Promise(function( resolve,reject){
        if(typeof(username)!="string" ){
            reject()
            return
        }
        else{
            usersCollection.findOne({username: username}).then(function (userdoc) {

                if(userdoc){
                    userdoc = new User(userdoc,true)
                    userdoc = {
                        _id:userdoc.data._id,
                        username:userdoc.data.username,
                        dp : userdoc.dp
                    }
                    resolve(userdoc)
                }
                else{

                    reject()
                }
            }).catch(function () {
                reject()
            })
        }
    })
}

User.doesEmailExist = function(email){
    return new Promise(async (resolve, reject) => {
        if(typeof(email)!="string"){
            resolve( false)
            return
        }
        let User = await usersCollection.findOne({email:email})
        if(User){
            resolve(true)

        }
        else {
            resolve(false)
        }
    })
}
    module.exports=  User;

