const express = require('express')
const multer = require('multer')
const sharp = require('sharp')

require('../db/mongoose')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../emails/account')

const router = new express.Router()

// signup
router.post('/users', async (req, res) =>{
    const user = new User(req.body)

    try{
        // user.generateAuthToken() already saves the user in the DB, hence,
        // we don't need to explicitly say user.save()
        const token = await user.generateAuthToken()
        console.log(token)

        res.status(201).send({ user, token })
        console.log(user)

        sendWelcomeEmail(user.email, user.name)
    }
    catch (err) {
        res.status(400).send(err)
        console.log(err)
    }

})

// login
router.post('/users/login', async(req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)

        const token = await user.generateAuthToken()
        console.log(token)
        //res.status(200).send(user)

        // res.status(200).send({ user: user.getPublicProfile(), token })
        res.status(200).send({ user, token })
    } 
    catch (err) {
        res.status(400).send(err)
    }
})

// router.get('/users', auth, async (req, res) => {
//     try {
//         const result = await User.find({})
//         res.status(200).send(result)
//         console.log(result)
//     }
//     catch(err) {
//         res.status(500).send()
//         console.log(err)
//     }
// })

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)    

        await req.user.save()
        res.status(200).send()
    } 
    catch (err) {
        console.log(err)
        res.status(500).send()
    }
})

// logout from all devices (removing all the tokens)
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        
        await req.user.save()   
        res.status(200).send()
    } 
    catch (err) {
        console.log(err)
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.status(200).send(req.user)
})

// router.get('/users/:id', async (req, res) => {
//     const _id = req.params.id

//     try {
//         const result = await User.findById(_id)
//         if (!result)
//                 return res.status(404).send()

//         res.status(200).send(result)
//         console.log(result)
//     }
//     catch (err) {
//         if(err.name === 'CastError')
//             return res.status(400).send({
//                 error: 'Invalid ID'
//             })

//         res.status(500).send(err)
//         console.log(err)
//     }
// })

// updating the profile
// router.patch('/users/:id', async (req, res) => {
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if (!isValidOperation) 
        return res.status(400).send({
            error: 'Invalid updates'
        })

    try {
        // const user = await User.findById(req.params.id)
        const user = req.user

        updates.forEach(update => user[update] = req.body[update])

        const result = await user.save()

        // const result = await User.findByIdAndUpdate(req.params.id, req.body, { 
        //     new: true,  // // returns the newly updated document
        //     runValidators: true  // validating the newly incoming data (the updateded data)
        // })
        console.log(result)

        // we know that user existed since we're come this far from auth() middleware
        // if (!result)
        //     return res.status(404).send()

        res.status(200).send(result)
    }
    catch (err) {
        if (err.name === 'CastError') 
            return res.status(400).send({
                error: 'Invalid ID'
            })

        console.log(err)
        res.status(500).send(err)
    }
})

// account deletion
router.delete('/users/me', auth, async (req, res) => {
    try {
        // const result = await User.findByIdAndDelete(req.params.id)
        /* since we just fetched the user by ID in the auth() middleware, no need to do it all again */
        // const result = await User.findByIdAndDelete(req.user._id)
        // console.log(result)

        // if (!result)
        //     return res.status(404).send()
            
        // removing the document for this user form the DB
        await req.user.remove()
        res.status(200).send(req.user)

        sendGoodbyeEmail(req.user.email, req.user.name)
    } 
    catch (err) {
        console.log(err)
        if (err.name === 'CastError')
            return res.status(400).send({
                error: 'Invalid ID'
            })

        res.status(500).send(err)
    }
})

const upload = multer({
    // dest: 'avatars',  // destination folder where these files will be stored in the server
    limits: {
        fileSize: 1000000  // need mention file size limit in bytes
    },
    fileFilter (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/))
            return cb(new Error('Please upload an image only'))

        cb(undefined, true)
    }
})
// uploading user avatar
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    // req.user.avatar = req.file.buffer

    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer

    await req.user.save()

    res.send('Done!')
}, (error, req, res, next) => {  // another callback function for handling middleware errors
    res.status(400).send({
        error: error.message
    })
})

// deleting user avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    try {
        await req.user.save()
        res.status(200).send(req.user)
    }
    catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
})

// get user avatar
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById({ _id: req.params.id })    

        if (!user || !user.avatar)
            return res.status(404).send()

        // setting the response header
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } 
    catch (err) {
        if (err.name === 'CastError')
            return res.status(400).send({
                error: 'Invalid ID'
            })

        res.status(500).send(err)
    }
})

module.exports = router