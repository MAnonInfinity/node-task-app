const postmark = require('postmark')

// const serverToken = 'e1aaf657-5795-40fa-8647-6c76fef89245'

const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY)   

const sendWelcomeEmail = (email, name) => {
    client.sendEmail({
        "From": "pearceenveng@gmailpro.ml",
        "To": email,
        "Subject": "Thanks for joining in!",
        "TextBody": `Welcome to the app, ${name}! Let me know how you get along with the app.`
    })
}

const sendGoodbyeEmail = (email, name) => {
    client.sendEmail({
        "From": "pearceenveng@gmailpro.ml",
        "To": email,
        "Subject": "Goodbyes are tough!",
        "TextBody": `Sorry to see you go, ${name}! Goodbye.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendGoodbyeEmail
}