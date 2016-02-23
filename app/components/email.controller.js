angular
    .module('startupcommunity')
    .controller('EmailController', EmailController);

function EmailController($http, $httpParamSerializer, $sce, user) {
    var self = this;

    if (user) {

        $http({
            url: 'https://email.startupcommunity.org/includes/login/main.php',
            method: 'POST',
            data: $httpParamSerializer({
                email: "jgentes@gmail.com",
                password: "3OreHw2Z",
                redirect: ""
            }),
            withCredentials: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then(function (response) {
                self.working = false;
                //var cookie = CryptoJS.SHA512("4" + "jgentes@gmail.com" + CryptoJS.SHA512("3OreHw2Z" + "PectGtma").toString() + "PectGtma").toString();
                //$cookies.put('logged_in', cookie);

                self.frame_content = $sce.trustAsHtml(response.data);

                // pull the app_id (brand) from the url by parsing the html of the frame
                var el = document.createElement( 'html' );
                el.innerHTML = response.data.toString();
                var url = el.getElementsByClassName('brand')[0].href;
                self.app_id = url.split("?")[1].split("=")[1];

            });

    } else self.frame_content = "<p style='font-size: 24px;'>Please <a href='/login'>log in</a> to access this feature..</p>";


    this.createBrand = function() {

        $http({
            url: 'https://email.startupcommunity.org/includes/app/create.php',
            method: 'POST',
            data: $httpParamSerializer({
                app_name: "push_brand_test",
                from_name: "James Zibtru",
                from_email: "james@bendtech.com",
                reply_to: "james@bendtech.com"
            }),
            withCredentials: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then(function(response) {
                self.frame_content = $sce.trustAsHtml(response.data);
            })
    };

    this.createList = function() {

        $http({
            url: 'https://email.startupcommunity.org/includes/subscribers/import-add.php',
            method: 'POST',
            data: $httpParamSerializer({
                list_name: "list_test",
                app: self.app_id
            }),
            withCredentials: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then(function(response) {

                // pull the list_id from the url by parsing the html of the frame
                var el = document.createElement( 'html' );
                el.innerHTML = response.data.toString();
                var url = $("a[href*='&l=']", el);
                console.log(url[0]);
                self.list_id = url[0].href.split("&")[1].split("=")[1];

                self.frame_content = $sce.trustAsHtml(response.data);
            })
    };

    this.addSubscriber = function() {

        $http({
            url: 'https://email.startupcommunity.org/includes/subscribers/line-update.php',
            method: 'POST',
            data: $httpParamSerializer({
                line: "James Gentes, jgentes@gmail.com",
                list_id: '4',
                app: self.app_id
            }),
            withCredentials: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then(function(response) {
                self.frame_content = $sce.trustAsHtml(response.data);
            })
    };

    this.removeSubscriber = function() {

        $http({
            url: 'https://email.startupcommunity.org/includes/subscribers/line-delete.php',
            method: 'POST',
            data: $httpParamSerializer({
                line: "jgentes@gmail.com",
                list_id: '4',
                app: self.app_id
            }),
            withCredentials: true,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
            .then(function(response) {
                self.frame_content = $sce.trustAsHtml(response.data);
            })
    };
}