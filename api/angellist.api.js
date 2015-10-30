var config = require('../config.json')[process.env.NODE_ENV || 'development'],
  db = require('orchestrate')(config.db.key),
  request = require('request');

//require('request-debug')(request); // Very useful for debugging oauth and api req/res

var AngelListApi = function() {
    this.getStartups = handleGetStartups;
    this.getStartup = handleGetStartup;
    this.searchStartups = handleSearchStartups;
};

function handleSearchStartups(req, res) {

    request.get({ url: 'https://api.angel.co/1/search?query=' + req.query.val + '&type=Startup&access_token=' + config.angellist.clientToken },
        function(error, response, body) {
            if (error || body.error) {
                console.warn('WARNING: AngelList API ERROR');
                console.log(error);
                res.status(202).send({ message: 'Something went wrong: ' + error || body.error});
            } else if (!body.status || body.status === 200) {
                res.status(200).send(body);
            }
        });
}

function handleGetStartups(req, res) {

    request.get({ url: 'https://api.angel.co/1/tags/' + req.query.id + '/startups?access_token=' + config.angellist.clientToken },
        function(error, response, body) {
            if (error) {
                console.log('AngelList API ERROR');
                console.log(error);
                res.status(202).send({ message: 'Something went wrong: ' + error});
            } else if (!body.status || body.status === 200) {
                var results = JSON.parse(body),
                    newresponse = [],
                    s;

                for (s in results.startups) {
                    if (results.startups[s].hidden == false) {
                        newresponse.push(results.startups[s]);
                    }
                }
                res.status(200).send(newresponse);
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
                res.status(202).send({ message: 'Something went wrong: ' + err});
            }
        });

}

module.exports = AngelListApi;