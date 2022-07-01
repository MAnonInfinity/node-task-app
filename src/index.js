const express = require('express')
const jwt = require('jsonwebtoken')

require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()

/* Learning Middlewares
// app.use((req, res, next) => {
//     if (req.method === 'GET') {
//         res.send('Get reqs are disabled')
//     }
//     else {
//         next()
//     }
// })  

app.use((req, res, next) => {   
    res.status(503).send('Site under maintainance')
})  
*/


// automatically parses incoming JSON to an object
app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})