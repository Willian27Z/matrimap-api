const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const recommendSchema = new Schema({
    owner: {
        type: ObjectId,
        required: true
    },
    lieu: {
        societe: {
            type: String
        },
        avis: {
            type: String
        }
    },
    traiteur: {
        societe: {
            type: String
        },
        avis: {
            type: String
        }
    },
    decorations: {
        societe: {
            type: String
        },
        avis: {
            type: String
        }
    },
    fleuriste: {
        societe: {
            type: String
        },
        avis: {
            type: String
        }
    },
    musique: {
        societe: {
            type: String
        },
        avis: {
            type: String
        }
    },
    artiste: {
        societe: {
            type: String
        },
        avis: {
            type: String
        }
    },
    vetements: {
        societe: {
            type: String
        },
        avis: {
            type: String
        }
    },
    photography: {
        societe: {
            type: String
        },
        avis: {
            type: String
        }
    },
    video: {
        societe: {
            type: String
        },
        avis: {
            type: String
        }
    },
    souvenir: {
        societe: {
            type: String
        },
        avis: {
            type: String
        }
    },
    luneDeMiel: {
        societe: {
            type: String
        },
        avis: {
            type: String
        }
    },
    planner: {
        societe: {
            type: String
        },
        avis: {
            type: String
        }
    },
});

//module.exports = CommentSchema;
module.exports = Comment = mongoose.model('Recommend', recommendSchema, "recommends");