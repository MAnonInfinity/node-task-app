const express = require('express')

require('../db/mongoose')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const { translateOptions } = require('mongodb/lib/utils')

const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        const result = await task.save()
        res.status(201).send(result)
        console.log(result)
    }
    catch (err) {
        res.status(400).send(err)
        console.log(err)
    }
})

// GET /tasks?competed=true
// GET /tasks?limit=2&skip=2
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed)
        match.completed = req.query.completed === 'true'

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc'? -1 : 1
    }

    try {
        // const result = await Task.find()
        // const result = await Task.find({ owner: req.user._id })

        // /* alternative */
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),  // for pagination
                skip: parseInt(req.query.skip),
                sort: sort
            }
        }).execPopulate()
        res.status(200).send(req.user.tasks)

        // res.status(200).send(result)
        // console.log(result)
    }
    catch (err) {
        res.status(500).send()
        console.log(err)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        // const result = await Task.findById(_id)
        const task = await Task.findOne({ _id, owner: req.user._id })

        if (!task)
                res.status(404).send()

        res.status(200).send(task)
        console.log(task)
    }
    catch (err) {
        console.log(err)

        if (err.name === 'CastError')
                return res.status(400).send({
                    error: 'Invalid ID'
                })

        res.status(500).send()
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if (!isValidOperation)
        return res.status(400).send({
            error: 'Invalid updates'
        })

    try {
        // const task = await Task.findById(req.params.id)
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if (!task)
            return res.status(404).send()

        updates.forEach(update => task[update] = req.body[update])

        const result = await task.save()

        // const result = await Task.findByIdAndUpdate(req.params.id, req.body, {
        //     new: true,
        //     runValidators: true
        // })
        console.log(result)

        res.status(200).send(result)
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

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        // const result = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        console.log(task)

        if (!task)
            return res.status(404).send()
 
        await task.remove()
        
        /* alternative */
        // const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        res.status(200).send(task)
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

module.exports = router