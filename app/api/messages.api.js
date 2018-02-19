var path = require('path'),
  {mdb, cdb} = require('../../db'),
  sgMail = require('@sendgrid/mail');
  
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var MessagesApi = function() {
        this.addMessage = handleAddMessage;
};

var schema = {
    message: function (type, from, to_key, content) {

        var datetime = new Date(); // added as milliseconds since epoch

        return {
            "type": type,
            "from": {
                "id": from.id,
                "name": from.name,
                "avatar": from.avatar,
                "headline": from.headline
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

    console.log('Adding message from ' + addMessage.from.name + ' to ' + addMessage.to.name);

    var message = schema.message(addMessage.type, addMessage.from, addMessage.to.id, addMessage.content);

    var to_notify = function(message) {

        console.log('sending notification');
        // note: message.type is 'question' or 'reply'
        message["link"] = 'https://startupcommunity.org/' +
            (message.type == 'question' ?
                    message.to.id :
                    message.parent.to
            ) + '#' + message.id;

        if (!message.parent) message.parent = { content: "" };

        var go = function(notify) {
            cdb.findById(notify.to.id)
                .then(response => {

                    var user = response;
                    
                    const substitutions = {
                        "from_name": notify.from.name,
                        "from_image": notify.from.avatar,
                        "link": notify.link,
                        "content": notify.content,
                        "parent": notify.parent.content
                    };
                    
                    const msg2 = {
                        templateId: '1bb022a2-6b14-40d0-8c5d-1130176de2ed',
                        to: user.email,
                        from: 'james@startupcommunity.org',
                        subject: 'Direct message from ' + notify.from.name,
                        substitutions: substitutions
                      };
                      sgMail.send(msg2)
                      .then(() => console.log('Message detail was sent to ' + user.name))
                      .catch(err => console.log('WARNING: ', err.toString()));

                })
                .catch(function(err){
                    console.log('User not found, no notification sent: ', notify.to.id);
                });
        };

        go(message);
        // send notifications to other people on the thread

        if (message.parent && message.parent.replies) {

            var newMessage = message,
                nodups = [];

            if (message.to.id) nodups.push(message.to.id);
            if (message.from.id) nodups.push(message.from.id);

            for (var reply in message.parent.replies) {
                // never send multiple emails to same person
                if (nodups.indexOf(message.parent.replies[reply].from.id) < 0) {
                    newMessage.to = message.parent.replies[reply].from;
                    go(newMessage);
                    nodups.push(message.parent.replies[reply].from.id);
                }
            }
        }
    };

   /* // check if this is a reply to existing thread
    if (addMessage.parent) {

        db.newPatchBuilder(process.env.DB_MESSAGES, addMessage.parent.slug)
            .append("replies", [message])
            .apply()
            .then(function (result) {
                addMessage["key"] = addMessage.parent.slug;
                to_notify(addMessage);
                res.status(200).send(message);
            })
            .catch(function (err) {
                console.error("WARNING: ", err);
                res.status(202).send({message: "Woah! Something went wrong, but we've been notified and will take care of it."});
            })

    } else {
*/
        mdb.create(message)
            .then(function (response) {
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