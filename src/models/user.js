const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: { 
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) 
                throw new Error('Email is invalid')
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            // if (value.length < 6)
            //     throw new Error('Password must be greater than 6 characters')
            if (value.toLowerCase().includes('password'))
                throw new Error(`Password must not contain the word 'password'.`)
        }
    },
    age: { 
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0)
                throw new Error('Age must be a positive number')
        }
    },
    tokens: [
        {
            token: { 
                type: String,
                required: true
            }
        }
    ],
    avatar: {
        type: Buffer  // sotring avatar image buffer
    }
}, {
    timestamps: true  // adds createdAt & updatedAt fields on the User collection
})

// this is a virtual reference to the Tasks that the user owns
// not sotred in the DB, this is just for Mongoose to know, a realtionship exists between User and Task collections
userSchema.virtual('tasks', {
    ref: 'Task',  // model name of Task (a virtual reference )
    localField: '_id',  // letting Mongoose know where to find references of each other (Task & User)
    foreignField: 'owner'
})

// creating a unique index on email to ensure fast email query and email uniqueness
userSchema.index({ email: 1 }, { unique: true })

// toJSON() takes stringified input, parses the JSON, we can do out manipulations on it, 
// and then returns the stringified JSON
userSchema.methods.toJSON = function () {  // userSchema.methods.getPublicProfile = function () {
    const user = this
    const userObject = user.toObject()  

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this

    // the second argument is the secret code (can't be decoded)
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7 days' })

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

// setting a function up in the `statics` will enable us to use
// this function with the model itself, i.e. User.findByCredentials()
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user)
        throw new Error('Unable to login')

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch)
        throw new Error('Unable to login')

    return user
}

// run middleware BEFORE (pre) saving in the
// Has the plain text password before saving (before creating or updating user)
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    console.log('just b4 saving')

    next()
})

// delete user tasks from the DB after the user is deleted
userSchema.pre('remove', async function (next) {
    const user = this

    await Task.deleteMany({ owner: user._id })

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User