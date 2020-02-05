const express = require('express');
const router = express.Router();
const userController = require("./controllers/userController");
const postController = require("./controllers/postController")
const followController = require("./controllers/followController")
router.get("/",userController.home);
router.post("/register" , userController.register);
router.post("/login",userController.login)
router.post("/logout",userController.logout)
router.post("/doesUsernameExist",userController.doesUsernameExist)
router.post("/doesEmailExist",userController.doesEmailExist)

//post related values
router.get('/create-post',userController.validLogin, postController.viewCreateScreen)
router.post('/create-post',userController.validLogin, postController.create);
router.get("/post/:id",postController.viewSingle)
router.get("/post/:id/edit",userController.validLogin,postController.viewEditScreen)
router.post("/post/:id/edit",userController.validLogin,postController.edit)
router.post("/post/:id/delete" , userController.validLogin , postController.delete)
router.post("/search" , postController.search);
//profile related
router.get("/profile/:username",userController.ifUserExists,userController.sharedProfileData,userController.profilePostScreen)
router.get("/profile/:username/followers",userController.ifUserExists,userController.sharedProfileData,userController.profileFollowersScreen)
router.get("/profile/:username/following",userController.ifUserExists,userController.sharedProfileData,userController.profileFollowingScreen)
//follow routes
router.post("/addFollow/:username" , userController.validLogin, followController.addFollow)
router.post("/stopFollow/:username" , userController.validLogin, followController.removeFollow)

module.exports = router;
