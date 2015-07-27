var config = require('../config.json')[process.env.NODE_ENV || 'development'],
  db = require('orchestrate')(config.db.key),
  request = require('request');

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var AngelListApi = function() {
    this.getStartups = handleGetStartups;
    this.getStartup = handleGetStartup;
};

function handleGetStartups(req, res) {

    request.get({ url: 'https://api.angel.co/1/tags/' + req.query.id + '/startups?access_token=' + config.angellist.clientToken },
        function(error, response, body) {
            console.log(error);
            if (!body.status || body.status === 200) {
                var results = JSON.parse(body),
                    newresponse = [],
                    s;

                for (s in results.startups) {
                    if (results.startups[s].hidden == false) {
                        newresponse.push(results.startups[s]);
                    }
                }
                res.status(200).send(newresponse);
            } else {
                console.error('Error: ' + body.message);
                console.log(body);
                res.status(400).send({ message: 'Something went wrong: ' + err});
            }
        });

}

function handleGetStartup(req, res) {

    request.get({ url: 'https://api.angel.co/1/startups/' + req.query.id + '?access_token=' + config.angellist.clientToken },
        function(error, response, body) {

            if (!body.status || body.status === 200) {
                res.status(200).send(JSON.parse(body));
            } else {
                console.error('Error: ' + body.message);
                console.log(body);
                res.status(400).send({ message: 'Something went wrong: ' + err});
            }
        });

}

module.exports = AngelListApi;