const User = require('../models/user');
const Recommend = require('../models/recommends');
const ObjectId = require('mongoose').Types.ObjectId;
const mailer = require('../mailing');


exports.myRecommends = function(req, res) {
    Recommend.findOne({owner: req.user.id}, function(err, doc){
        if(err){
            console.log(err);
            return res.json({message:"Un erreur s'est produit!", type: "error"})
        }
        if(doc){
            return res.json(doc);
        } else {
            return res.status(404).end();
        }
    });
}

exports.updateMyRecommends = function(req, res) {
    Recommend.findOne({owner: req.user.id}, function(err, doc){
        if(err){
            console.log(err);
            return res.json({message:"Un erreur s'est produit!", type: "error"})
        }
        if(!doc){
            newRecommends = new Recommend({
                owner: req.user.id,
                lieu: req.body.lieu,
                traiteur: req.body.traiteur,
                decorations: req.body.decorations,
                fleuriste: req.body.fleuriste,
                musique: req.body.musique,
                artiste: req.body.artiste,
                vetements: req.body.vetements,
                photography: req.body.photography,
                video: req.body.video,
                souvenir: req.body.souvenir,
                luneDeMiel: req.body.luneDeMiel,
                planner: req.body.planner
            })
            newRecommends.save().then(()=>{
                res.json({message:"Recommandations sauvegardés", type: "success"});
            })
        } else {
            doc.lieu = req.body.lieu,
            doc.traiteur = req.body.traiteur,
            doc.decorations = req.body.decorations,
            doc.fleuriste = req.body.fleuriste,
            doc.musique = req.body.musique,
            doc.artiste = req.body.artiste,
            doc.vetements = req.body.vetements,
            doc.photography = req.body.photography,
            doc.video = req.body.video,
            doc.souvenir = req.body.souvenir,
            doc.luneDeMiel = req.body.luneDeMiel,
            doc.planner = req.body.planner
            doc.save().then(()=>{
                res.json({message:"Recommandations sauvegardés", type: "success"});
            })
        }
    });
}

exports.search = function(req, res) {
    let value = req.query.name;
    Recommend.find({
        $or: [
            { "lieu.societe": { $regex: value, $options: 'i' } },
            { "traiteur.societe": { $regex: value, $options: 'i' } },
            { "decorations.societe": { $regex: value, $options: 'i' } },
            { "fleuriste.societe": { $regex: value, $options: 'i' } },
            { "musique.societe": { $regex: value, $options: 'i' } },
            { "artiste.societe": { $regex: value, $options: 'i' } },
            { "vetements.societe": { $regex: value, $options: 'i' } },
            { "photography.societe": { $regex: value, $options: 'i' } },
            { "video.societe": { $regex: value, $options: 'i' } },
            { "souvenir.societe": { $regex: value, $options: 'i' } },
            { "luneDeMiel.societe": { $regex: value, $options: 'i' } },
            { "planner.societe": { $regex: value, $options: 'i' } },
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
                owner: doc._id,
                societe: doc.userName,
                avatar: doc.profil.avatar,
                prenom: doc.profil.firstName,
                nom: doc.profil.lastName
            });
        });

        return res.json(results);
    })
}

exports.get = function(req, res) {
    let id = req.params.id;
    Recommend.findOne({owner: ObjectId(id)}, function(err, doc){
        if(err){
            console.log(err)
            return res.status(500).end();
        }

        if(!doc){
            return res.status(404).end();
        } else {
            return res.json(doc);
        }

    })
}