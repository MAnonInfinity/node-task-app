const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    description: { 
        type: String,
        required: true,
        trim: true,
    },
    completed: { 
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'  // model name of User (for storing a reference of the user that owns this task)
    }
}, {
    timestamps: true  // adds createdAt & updatedAt fields on the User collection
})

const Task = mongoose.model('Task', taskSchema)

// const Task = mongoose.model('Task', {
//     description: { 
//         type: String,
//         required: true,
//         trim: true,
//     },
//     completed: { 
//         type: Boolean,
//         default: false
//     },
//     owner: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//         ref: 'User'  // model name of User (for storing a reference of the user that owns this task)
//     }
// })

module.exports = Task