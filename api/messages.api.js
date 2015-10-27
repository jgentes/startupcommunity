var config = require('../config.json')[process.env.NODE_ENV || 'development'],
    knowtify = require('knowtify-node'),
    db = require('orchestrate')(config.db.key);

var MessagesApi = function() {
        this.addMessage = handleAddMessage;
};

var schema = {
    message: function (type, from, to_key, content) {

        var datetime = new Date(); // added as milliseconds since epoch

        return {
            "type": type,
            "from": {
                "key": from.key,
                "name": from.profile.name,
                "avatar": from.profile.avatar,
                "headline": from.profile.headline
            },
            "to": to_key,
            "published": datetime.getTime(),
            "content": content
        };
    }
};

function handleAddMessage(req, res) {
    // always use ensureAuth before this (to acquire req.user)
    var addMessage = req.body.params;

    console.log('Adding message from ' + addMessage.from.profile.name + ' to ' + addMessage.to.profile.name);

    var message = schema.message(addMessage.type, addMessage.from, addMessage.to.key, addMessage.content);

    var putReply = function(addMessage, message, callback) {

        db.newPatchBuilder(config.db.messages, addMessage.parent.key)
            .add("replies", message)
            .apply()
            .then(function (result) {
                callback(result);
            })
            .fail(function (err) {
                console.error("POST FAIL:");
                console.error(err);
                res.status(202).send({message: "Woah! Something went wrong, but we've been notified and will take care of it."});
            })
    };

    var postQuestion = function(addMessage, message, callback) {

        db.post(config.db.messages, message)
            .then(function (response) {
                callback(response);
            })
            .fail(function (err) {
                console.error("POST FAIL:");
                console.error(err);
                res.status(202).send({message: "Woah! Something went wrong, but we've been notified and will take care of it."});
            });
    };

    var sendAlert = function(notify) {

        knowtifyClient.contacts.upsert({
                "event": notify.type,
                "contacts": [{
                    "email": notify.to.profile.email,
                    "data": {
                        "from_name": notify.from.profile.name,
                        "from_image": notify.from.profile.avatar,
                        "link": notify.link,
                        "content": notify.content,
                        "parent": notify.parent.content
                    }
                }]
            },
            function (success) {
                console.log('Notification sent to ' + notify.to.profile.email);
            },
            function (error) {
                console.log('WARNING:');
                console.log(error);
            });
    };

    var to_notify = function(message) {
        console.log('sending notification');

        // send email with knowtify with unique link
        var knowtifyClient = new knowtify.Knowtify(config.knowtify, false);

        // note: message.type triggers Knowtify event of 'question' or 'reply'

        message["link"] = 'https://startupcommunity.org/' +
            (message.type == 'question' ?
                    message.to.key:
                    message.parent.to.key
            ) + '#' + message.key;

        if (!message.parent || jQuery.isEmptyObject(message.parent))
            message.parent = { "content": "" };
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
>>>>>>> parent of 02c1b80... basics working
=======
>>>>>>> parent of 02c1b80... basics working

        var go = function(notify) {

            knowtifyClient.contacts.upsert({
                    "event": notify.type,
                    "contacts": [{
                        "email": notify.to.profile.email,
                        "data": {
                            "from_name": notify.from.profile.name,
                            "from_image": notify.from.profile.avatar,
                            "link": notify.link,
                            "content": notify.content,
                            "parent": notify.parent.content
                        }
                    }]
                },
                function (success) {
                    console.log('Notification sent to ' + notify.to.profile.email);
                },
                function (error) {
                    console.log('WARNING:');
                    console.log(error);
                });
        };
>>>>>>> parent of 02c1b80... basics working

        sendAlert(message);

        // send notifications to other people on the thread

        if (message.parent && message.parent.replies) {

            var newMessage = message,
                nodups = [];

            for (reply in message.parent.replies) {
                // never send multiple emails to same person
                if (nodups.indexOf(message.parent.replies[reply].from.key) < 0 &&
                    (message.parent.replies[reply].from.key !==
                    (message.to.profile.key || message.from.profile.key))) {

                    newMessage.to = message.parent.replies[reply].from;
                    sendAlert(newMessage);
                    nodups.push(message.parent.replies[reply].from.key);
                }
            }
        }
    };

    // check if this is a reply to existing thread
    if (addMessage.parent) {

        putReply(addMessage, message, function(response) {
            addMessage["key"] = addMessage.parent.key;
            to_notify(addMessage);
            res.status(200).end(message);
        })

    } else {

        postQuestion(addMessage, message, function(response) {
            addMessage["key"] = response.headers.location.split('/')[3];
            to_notify(addMessage);
            res.status(200).send(message);
        })
    }

}

module.exports = MessagesApi;