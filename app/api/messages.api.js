var knowtify = require('knowtify-node'),
  Cloudant = require('cloudant'),
  cloudant = Cloudant({
    account: process.env.DB_ACCOUNT,
    password: process.env.DB_PASSWORD,
    plugin: 'promises'
  }),
  cdb = cloudant.db.use(process.env.DB_COMMUNITIES),
  cdb_messages = cloudant.db.use(process.env.DB_MESSAGES);

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
            "content": content,
            "replies": []
        };
    }
};

function handleAddMessage(req, res) {
    // always use ensureAuth before this (to acquire req.user)
    var addMessage = req.body.params;

    console.log('Adding message from ' + addMessage.from.profile.name + ' to ' + addMessage.to.profile.name);

    var message = schema.message(addMessage.type, addMessage.from, addMessage.to.key, addMessage.content);

    var to_notify = function(message) {

        console.log('sending notification');
        // note: message.type triggers Knowtify event of 'question' or 'reply'
        message["link"] = 'https://startupcommunity.org/' +
            (message.type == 'question' ?
                    message.to.key :
                    message.parent.to
            ) + '#' + message.key;

        if (!message.parent) message.parent = { content: "" };

        var go = function(notify) {
            cdb.get(notify.to.key)
                .then(function(response) {

                    var user = response;

                    // send email with knowtify with unique link
                    var knowtifyClient = new knowtify.Knowtify(process.env.KNOWTIFY, false);

                    knowtifyClient.contacts.upsert({
                            "event": notify.type,
                            "contacts": [{
                                "email": user.profile.email,
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
                            console.log('Notification sent to ' + user.profile.email);
                        },
                        function (error) {
                            console.log('WARNING: messages73', error);
                        });

                })
                .catch(function(err){
                    console.log('User not found, no notification sent: ', notify.to.key);
                });
        };

        go(message);
        // send notifications to other people on the thread

        if (message.parent && message.parent.replies) {

            var newMessage = message,
                nodups = [];

            if (message.to.key) nodups.push(message.to.key);
            if (message.from.key) nodups.push(message.from.key);

            for (reply in message.parent.replies) {
                // never send multiple emails to same person
                if (nodups.indexOf(message.parent.replies[reply].from.key) < 0) {
                    newMessage.to = message.parent.replies[reply].from;
                    go(newMessage);
                    nodups.push(message.parent.replies[reply].from.key);
                }
            }
        }
    };

   /* // check if this is a reply to existing thread
    if (addMessage.parent) {

        db.newPatchBuilder(process.env.DB_MESSAGES, addMessage.parent.key)
            .append("replies", [message])
            .apply()
            .then(function (result) {
                addMessage["key"] = addMessage.parent.key;
                to_notify(addMessage);
                res.status(200).send(message);
            })
            .catch(function (err) {
                console.error("WARNING: ", err);
                res.status(202).send({message: "Woah! Something went wrong, but we've been notified and will take care of it."});
            })

    } else {
*/
        cdb_messages.insert(message)
            .then(function (response) {
                addMessage["key"] = response.id;
                message.key = addMessage.key;
                to_notify(addMessage);
                res.status(200).send(message);
            })
            .catch(function (err) {
                console.error("WARNING: ", err);
                res.status(202).send({message: "Woah! Something went wrong, but we've been notified and will take care of it."});
            });
   /* }*/

}

module.exports = MessagesApi;