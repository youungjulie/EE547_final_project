const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require("body-parser")
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const upload = multer({ dest: "uploads/" });
const User = require('../../schemas/UserSchema');
const Post = require('../../schemas/PostSchema');

app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", async (req, res, next) => {
    let searchObj = req.query;
    
    if (searchObj.search !== undefined) {
        searchObj = {
            $or: [
                { firstName: { $regex: searchObj.search, $options: "i" } },
                { lastName: { $regex: searchObj.search, $options: "i" } },
                { username: { $regex: searchObj.search, $options: "i" } }
            ]
        };
    }

    User.find(searchObj).then(results => {
        res.status(200).send(results);
    }).catch(error => {
        console.log(error);
        res.sendStatus(400);
    });
});

router.get("/:userId/followers", async (req, res, next) => {
    User.findById(req.params.userId).populate("followers").then(results => {
        res.status(200).send(results.followers);
    }).catch(error => {
        console.log(error);
        res.sendStatus(400);
    });
});

router.get("/:userId/following", async (req, res, next) => {
    User.findById(req.params.userId).populate("following").then(results => {
        res.status(200).send(results.following);
    }).catch(error => {
        console.log(error);
        res.sendStatus(400);
    });
});

router.post("/profilePicture", upload.single("croppedImage"), async (req, res, next) => {
    if(!req.file) {
        console.log("No file uploaded with ajax request.");
        return res.sendStatus(400);
    }

    var filePath = `/uploads/images/${req.file.filename}.png`;
    var tempPath = req.file.path;
    var targetPath = path.join(__dirname, `../../${filePath}`);

    fs.rename(tempPath, targetPath, async error => {
        if(error != null) {
            console.log(error);
            return res.sendStatus(400);
        }

        req.session.user = await User.findByIdAndUpdate(req.session.user._id, { profilePic: filePath }, { new: true });
        res.sendStatus(204);  // no content to return
    })

});

router.post("/coverPhoto", upload.single("croppedImage"), async (req, res, next) => {
    if(!req.file) {
        console.log("No file uploaded with ajax request.");
        return res.sendStatus(400);
    }

    var filePath = `/uploads/images/${req.file.filename}.png`;
    var tempPath = req.file.path;
    var targetPath = path.join(__dirname, `../../${filePath}`);

    fs.rename(tempPath, targetPath, async error => {
        if(error != null) {
            console.log(error);
            return res.sendStatus(400);
        }

        req.session.user = await User.findByIdAndUpdate(req.session.user._id, { coverPhoto: filePath }, { new: true });
        res.sendStatus(204);
    })

});

router.put("/:userId/follow", async (req, res, next) => {
    var userId = req.params.userId;
    var user = await User.findById(userId);
    // check if user exists
    if (user == null) return res.sendStatus(404);

    var isFollowing = user.followers && user.followers.includes(req.session.user._id);
    var option = isFollowing ? "$pull" : "$addToSet";

    // Insert user to the followers array of the user being followed
    req.session.user = await User.findByIdAndUpdate(req.session.user._id, 
        { [option]: { following: userId } }, { new: true }).catch(error => {
        console.log(error);
        res.sendStatus(400);
    });

    // Insert user to the following array of the user doing the following
    await User.findByIdAndUpdate(userId, { [option]: { followers: req.session.user._id } }).catch(error => {
        console.log(error);
        res.sendStatus(400);
    });

    // reserved: send notification

    res.status(200).send(req.session.user);
});

module.exports = router;