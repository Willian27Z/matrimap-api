const User = require('../models/user');
const mailer = require('../mailing');

exports.view = function(req, res) {
    console.log("entered GET 'api/profile/:id' route, execution exports.view on userCtrl.js");
    if(!req.user){
        return res.status(403).json({error: "not logged in"});
    }
    console.log("req.user: ");
    console.log(req.user);

    User.findById(req.params.id, function(err, user){
        if(err)  {
            console.log(err)
            return res.send(err);
        }
        let response = {
            userID: req.params.id,
            pseudo: user.userName,
            avatar: user.profil.avatar,
            presentation: user.profil.presentation,
            nom: "privé",
            prenom: "privé",
            email: "privé",
            age: "privé",
            genre: "privé",
            coordonees: "privé",
            friend: "",
            friendSince: null,
            recommendedBy: ""
        }
        
        // am I his friend? Admin? myself?
        let meInHisAccount = user.friends.find(element => element.id.equals(req.user.id));
        if((meInHisAccount && meInHisAccount.status === "confirmed") || req.user.admin || req.user.id === req.params.id){
            response.prenom = user.profil.firstName;
            response.nom = user.profil.lastName;
            response.email = user.emailAddress;
            response.age = user.profil.age;
            response.genre = user.profil.genre;
            response.coordonees = user.profil.address;
        }

        // is this user MY friend?
        User.findById(req.user.id, function(err, myuser){
            const myFriend = myuser.friends.find(element => element.id.equals(req.params.id))
            if(myFriend){
                response.friend = myFriend.status;
                response.friendSince = myFriend.date;
            }
            if(myFriend && myFriend.recommendedBy){
                User.findById(myFriend.recommendedBy, function(err, userWhoRecommended){
                    response.recommendedBy = userWhoRecommended.userName;
                    return res.json(response);
                });
            } else {
                return res.json(response);
            }
        })
         
        // else {
        //     // if profil is set to private
        //     // function to filter profile and send response
        //     response.friend = false;
        //     res.json(response)    
        // }
    })
}

exports.myProfile = function(req, res) {
    User.findById(req.user.id, function(err, doc){
        if(err){
            console.log(err);
            return res.json({message:"Un erreur s'est produit!", type: "error"})
        }

        return res.json({profil: doc.profil, prefs: doc.prefs});
    });
}

exports.updataMyProfile = function(req, res) {
    User.findById(req.user.id, function(err, doc){
        if(err){
            console.log(err);
            return res.json({message:"Un erreur s'est produit!", type: "error"})
        }
        console.log("updating profile for: " + req.user.userName);
        doc.profil = req.body;
        doc.save().then(()=>{
            return res.json({message:"Profil actualisé avec success", type: "success"});
        });
    });
}
exports.updataMyPrefs = function(req, res) {
    User.findById(req.user.id, function(err, doc){
        if(err){
            console.log(err);
            return res.json({message:"Un erreur s'est produit!", type: "error"})
        }
        console.log("updating prefs for: " + req.user.userName);
        doc.profil.prefs.notifications = req.body;
        doc.save().then(()=>{
            return res.json({message:"Préférences actualisés avec success", type: "success"});
        });
    });
}

exports.search = function(req, res) {
    let value = req.query.name;
    User.find({
        $or: [
            { userName: { $regex: value, $options: 'i' }},
            { "profil.firstName": { $regex: value, $options: 'i' } },
            { "profil.lastName": { $regex: value, $options: 'i' } }
        ]
    }, function(err, docs){
        if(err){
            console.log(err)
            return res.status(500).end();
        }
        if(!docs){
            return res.status(404).end();
        }

        const results = [];
        docs.forEach(doc => {
            results.push({
                id: doc._id,
                username: doc.userName,
                avatar: doc.profil.avatar,
                prenom: doc.profil.firstName,
                nom: doc.profil.lastName
            });
        });

        return res.json(results);
    })
}