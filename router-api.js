const express = require('express');
const apiRouter = express.Router();
const userController = require("./controllers/userController");
const postController = require("./controllers/postController")
const cors = require("cors")
apiRouter.use(cors())
apiRouter.post('/login',userController.apiLogin)
apiRouter.post('/create-post',userController.validApiLogin,postController.apiCreate)
apiRouter.delete('/post/:id' ,userController.validApiLogin,postController.apiDelete)
apiRouter.get('/postsByAuthor/:id',userController.apiGetPostsByUsername)
module.exports = apiRouter;