angular
    .module('startupcommunity')
    .directive('alertBox', alertBox)
    .directive('loadingBars', loadingBars)
    .directive('uiSelect', uiSelect)
    .directive('pageTitle', pageTitle)
    .directive('sideNavigation', sideNavigation)
    .directive('minimalizaMenu', minimalizaMenu)
    .directive('smallHeader', smallHeader)
    .directive('animatePanel', animatePanel)
    .directive('randomQuote', randomQuote)
    .directive('backToTop', backToTop)
    .filter('safe_html', safeHTML)
    .filter('words', words)
    .filter('sentence', sentence);

// custom

function alertBox(){
    return {
        scope: {
            thisAlert: '='
        },
        template: '<div ng-show="thisAlert" class="alert alert-{{thisAlert.type}}" style="text-align: center;"><a href="#" class="close" ng-click="thisAlert = undefined" aria-label="close" title="close">x</a><span ng-bind-html="thisAlert.message | safe_html"></span></div>'
    }
}

function loadingBars() {
    return {
        template: '<img src="/public/images/loading-bars.svg" width="15" height="15" style="margin-right: -35px; margin-left: 3px; margin-top: -4px;"/>'
    }
}

function uiSelect(sweet){
    return {
        restrict: 'EA',
        require: 'uiSelect',
        link: function($scope, $element, $attributes, ctrl) {
            $scope.$select.limit = (angular.isDefined($attributes.limit)) ? parseInt($attributes.limit, 10) : undefined;
            var superSelect = ctrl.select;
            ctrl.select = function() {
                if(ctrl.multiple && ctrl.limit !== undefined && ctrl.selected.length >= ctrl.limit) {
                    sweet.show({
                        title: $attributes.alertTitle,
                        text: $attributes.alertText,
                        type: $attributes.alertType
                    });
                } else {
                    superSelect.apply(ctrl, arguments);
                }
            };
        }
    }
}

/**
 * pageTitle - Directive for set Page title - mata title
 */
function pageTitle($rootScope, $timeout) {
    return {
        link: function(scope, element) {
            var listener = function(event, toState, toParams, fromState, fromParams) {
                // Default title
                var title = "StartupCommunity.org - Kickstart your city's entrepreneurial ecosystem";
                // Create your own title pattern
                if (toState.data && toState.data.pageTitle) title = 'StartupCommunity.org | ' + toState.data.pageTitle;
                $timeout(function() {
                    element.text(title);
                });
            };
            $rootScope.$on('$stateChangeStart', listener);
        }
    }
}

/**
 * sideNavigation - Directive for run metisMenu on sidebar navigation
 */
function sideNavigation() {
    return {
        restrict: 'EA',
        link: function(scope, element) {
            // Call the metisMenu plugin and plug it to sidebar navigation
            element.metisMenu({
                toggle: false
            });
        }
    };
}

/**
 * minimalizaSidebar - Directive for minimalize sidebar
 */
function minimalizaMenu() {
    return {
        restrict: 'EA',
        template: '<div class="header-link hide-menu" id="toggleNav" ng-click="menu.minimalize()"><i class="pe-7s-way" style="font-size:31px;"></i></div>',
        controllerAs: 'menu',
        controller: function () {

            this.minimalize = function () {
            if ($(window).width() < 769) {
                    $("body").toggleClass("show-sidebar");
                } else {
                    $("body").toggleClass("hide-sidebar");
                }
            }
        }
    };
}

/**
 * smallHeader - Directive for page title panel
 */
function smallHeader() {
    return {
        restrict: 'A',
        scope:true,
        controller: function ($scope, $element) {
            $scope.small = function() {
                var icon = $element.find('i:first');
                var breadcrumb  = $element.find('#hbreadcrumb');
                $element.toggleClass('small-header');
                breadcrumb.toggleClass('m-t-lg');
                icon.toggleClass('fa-arrow-up').toggleClass('fa-arrow-down');
            }
        }
    }
}

function animatePanel($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {

            //Set defaul values for start animation and delay
            var startAnimation = 0;
            var delay = 0.1;   // secunds
            var start = Math.abs(delay) + startAnimation;

            // Set default values for attrs
            if(!attrs.effect) { attrs.effect = 'zoomIn'};
            if(attrs.delay) { delay = attrs.delay / 10 } else { delay = 0.1 };
            if(!attrs.child) { attrs.child = '.row > div'} else {attrs.child = "." + attrs.child};

            // Get all visible element and set opactiy to 0
            var panel = element.find(attrs.child);
            panel.addClass('opacity-0');

            // Wrap to $timeout to execute after ng-repeat
            $timeout(function(){
                // Get all elements and add effect class
                panel = element.find(attrs.child);
                panel.addClass('animated-panel').addClass(attrs.effect);

                // Add delay for each child elements
                panel.each(function(i, elm) {
                    start += delay;
                    var rounded = Math.round( start * 10 ) / 10;
                    $(elm).css('animation-delay', rounded + 's')
                    // Remove opacity 0 after finish
                    $(elm).removeClass('opacity-0');
                });
            });

        }
    }
}

function backToTop() {
    return {
        restrict: 'AE',
        link: function (scope, element, attr) {
            element.click( function (e) {
                $('body').scrollTop(0);
            });
        }
    };
}


function randomQuote() {
    var quotes = [
        "&quot;The best minute you spend is the one you invest in people.&quot;  -- Ken Blanchard", 
        "&quot;If you're too busy to help those around you, you're too busy.&quot; -- Bob Moawad", 
        "&quot;The things we know best are the things we haven't been taught.&quot; -- Marquis de Vauvenargues", 
        "&quot;Successful and unsuccessful people do not vary greatly in their abilities. They vary in their desires to reach their potential.&quot; -- John Maxwell", 
        "&quot;I'm a great believer in luck, and I find the harder I work the more I have of it.&quot; -- Thomas Jefferson", 
        "&quot;If you have a talent, use it in every which way possible. Don't hoard it. Don't dole it out like a miser. Spend it lavishly like a millionaire intent on going broke.&quot; -- Brendan Francis", 
        "&quot;In the beginner's mind, there are many possibilities. In the expert's mind, there are few.&quot; -- Shunryu Suzuki", 
        "&quot;One half of knowing what you want is knowing what you must give up before you get it.&quot; -- Sidney Howard", 
        "&quot;Every book is good to read which sets the reader in a working mood.&quot; -- Ralph Waldo Emerson", 
        "&quot;Your goals, minus your doubts, equal your reality.&quot; -- Ralph Marston", 
        "&quot;Small deeds done are greater than great deeds planned.&quot; -- Peter Marshall", 
        "&quot;The aim of all education is, or should be, to teach people to educate themselves.&quot; -- Arnold J. Toynbee", 
        "&quot;I think there is something more important than believing: Action! The world is full of dreamers. There aren't enough who will move ahead and begin to take concrete steps to actualize their vision.&quot; -- W. Clement Stone",
        "&quot;Why do we put off living the way we want to live, as if we have all the time in the world? -- Barbara de Angelis", 
        "&quot;The truth is that there is nothing noble in being superior to somebody else. The only real nobility is in being superior to your former self.&quot; -- Whitney Young", 
        "&quot;Relentlessly pursue the quality of life you envision.&quot; -- White Eagle", 
        "&quot;Einstein explained his theory to me every day, and on my arrival, I was fully convinced that he understood it.&quot; -- Chaim Weizmann", 
        "&quot;Two roads diverged in a wood, and I - I took the one less traveled by, and that has made all the difference.&quot; -- Robert Frost", 
        "&quot;One person cannot do right in one department of life whilst they are occupied in doing wrong in any other department. Life is one indivisible whole.&quot; -- Mahatma Gandhi",
        "&quot;Lying makes a problem part of the future. Truth makes a problem part of the past.&quot; -- Rick Pitino",
        "&quot;Every man gives his life to what he believes. Every woman gives her life for what she believes. Sometimes people believe in little or nothing, and so they give their lives to little or nothing.&quot; -- Joan of Arc", 
        "&quot;Be who you are and say what you feel, because those who mind don't matter and those who matter don't mind.&quot; -- Dr. Seuss", 
        "&quot;Act as if what you do makes a difference. It does.&quot; -- William James", 
        "&quot;Never confuse motion with action.&quot; -- Benjamin Franklin", 
        "&quot;Efficiency is doing the thing right. Effectiveness is doing the right thing.&quot; --Peter Drucker", 
        "&quot;I find television very educating. Every time somebody turns on the set, I go into the other room and read a book.&quot; -- Groucho Marx", 
        "&quot;You have to expect things of yourself before you can do them.&quot; -- Michael Jordan", 
        "&quot;Between stimulus and response there is a space. In that space lies our freedom and power to choose our response. In our response lies our growth and our happiness.&quot; -- Stephen Covey", 
        "&quot;I like the dreams of the future better than the history of the past.&quot; -- Thomas Jefferson", 
        "&quot;It is not length of life, but depth of life.&quot; -- Ralph Waldo Emerson", 
        "&quot;Let those who would move the world, first move themselves.&quot; -- Socrates",
        "&quot;The outstanding leaders of every age are those who set up their own quotas and constantly exceed them.&quot; -- Thomas J. Watson", 
        "&quot;In the business world, everyone is paid in two coins: cash and experience. Take the experience first; the cash will come later.&quot; -- Harold Geneen", 
        "&quot;They who every morning plan the transactions of the day and follows out that plan carries a thread that will guide them through the labrynth of the most busy life.&quot; -- Victor Hugo", 
        "&quot;There are three marks of a superior person: Being virtuous, they are free from anxiety. Being wise, they are free from perplexity. Being brave, they are free from fear.&quot; -- Confucius",
        "&quot;Wherever a person goes to dwell, their character goes with them.&quot; -- African Proverb", 
        "&quot;The percentage of mistakes in quick decisions is no greater than in long-drown-out vacillations, and the effect of decisiveness itself makes things go and creates confidence.&quot; -- Anne O'Hare McCormick", 
        "&quot;If anyone thinks they have no responsibilities, it is because they have not sought them out.&quot; -- Mary Lyon", 
        "&quot;We are what we repeatedly do. Excellence, then, is not an act, but a habit.&quot; -- Aristotle", 
        "&quot;While one person hesitates because they feel inferior, the other is busy making mistakes and becoming superior.&quot; -- Henry C. Link", 
        "&quot;Success is a process. Goal-setting is a process. The value of both lies not only in achievement, but also in a sense of direction for one's life.&quot; -- Lennon Ledbetter",
        "&quot;The starting point of all achievement is desire.&quot; -- Napoleon Hill", 
        "&quot;A person's success or failure in life is determined as much by how they act during their leisure as by how they act during their work hours. Tell me how a young person spends their evenings and I will tell you how they are likely to spend the latter part of their life.&quot; -- B. C. Forbes", 
        "&quot;Education is when you read the fine print. Experience is what you get if you don't.&quot; -- Peter Seeger", 
        "&quot;Goals determine what you're going to be.&quot; -- Julius Erving", 
        "&quot;What we think, or what we know, or what we believe is, in the end, of little consequence. The only consequence is what we do.&quot; -- John Ruskin", 
        "&quot;Change means movement. Movement means friction.&quot; -- Saul Alinsky", 
        "&quot;Wherever we look upon this earth, the opportunities take shape within the problems.&quot; -- Nelson A. Rockefeller", 
        "&quot;Tell me, I'll forget. Show me, I may remember. Involve me, I'll understand.&quot; -- Confucius", 
        "&quot;If you believe it will work out, you'll see opportunities. If you believe it won't, you'll see obstacles.&quot; -- John Alama", 
        "&quot;My father instilled in me that if you don't see things happening the way you want them to, you get out there and make them happen.&quot; -- Susan Powter", 
        "&quot;As a rule of thumb, involve everyone in everything of any consequence to all of you.&quot; -- Tom Peters", 
        "&quot;They who walk in another's tracks leave no footprints.&quot; -- Joan L. Brannon", 
        "&quot;A leader is a dealer in hope.&quot; -- Napoleon Bonaparte", 
        "&quot;No decision is risk-free. Don't let the negatives blind you to the opportunities.&quot; -- Victor K. Kiam II", 
        "&quot;Leadership is action, not position.&quot; -- D. H. McGannon", 
        "&quot;It is a most mortifying relfection for a person to consider what they have done, compared to what they might have done.&quot; -- Samuel Johnson", 
        "&quot;No decision has been made unless carrying it out in specific steps has become someone's work assignment and responsibility.&quot; -- Peter F. Drucker", 
        "&quot;In the absence of clearly-defined goals, we become strangely loyal to performing daily trivia until ultimately we become enslaved by it.&quot; -- Robert Heinlein", 
        "&quot;Drastic action can be costly, but it can be less expensive than continuing inaction.&quot; -- Richard Neustadt", 
        "&quot;Pain is inevitable.. suffering is optional.&quot; -- H. Witte",
        "&quot;Be absolutely determined to enjoy what you do.&quot; -- Gerry Sikorski", 
        "&quot;You cannot truly listen to anyone and do anything else at the same time.&quot; -- M. Scott Peck", 
        "&quot;There are many wonderful things that will never be done if you do not do them.&quot; -- Charles D. Gill", 
        "&quot;Determine that the thing can and shall be done, and then we shall find the way.&quot; -- Abraham Lincoln", 
        "&quot;Human beings are perhaps never more frightening than when they are convinced beyond doubt that they are right.&quot; -- Laurens van der Post", 
        "&quot;The chief beauty about time is that you cannot waste it in advance. The next year, the next day, the next hour are lying ready for you, as perfect, as unspoiled, as if you had never wasted or misapplied a single moment in all your life. You can turn over a new leaf every hour if you choose.&quot; -- Arnold Bennett", 
        "&quot;Stop chasing the money and start chasing the passion.&quot; -- Tony Hsieh", 
        "&quot;Success is walking from failure to failure with no loss of enthusiasm.&quot; -- Winston Churchill", 
        "&quot;Whenever you see a successful person, you only see the public glories, never the private sacrifices to reach them.&quot; -- Vaibhav Shah", 
        "&quot;Opportunities don't happen. You create them.&quot; -- Chris Grosser", 
        "&quot;Try not to become a person of success, but rather try to become a person of value.&quot; -- Albert Einstein", 
        "&quot;I have not failed. I've just found 10,000 ways that won't work.&quot; -- Thomas Edison", 
        "&quot;If you're going through hell, keep going.&quot; -- Winston Churchill", 
        "&quot;What seems to us as bitter trials are often blessings in disguise.&quot; -- Oscar Wilde", 
        "&quot;The distance between insanity and genius is measured only by success.&quot; -- Bruce Feirstein", 
        "&quot;If you are not willing to risk the usual, you will have to settle for the ordinary.&quot; -- Jim Rohn", 
        "&quot;Don't be afraid to give up the good to go for the great.&quot; -- John D. Rockefeller", 
        "&quot;If you can't explain it simply, you don't understand it well enough.&quot; -- Albert Einstein", 
        "&quot;There are two types of people who will tell you that you cannot make a difference in this world: those who are afraid to try and those who are afraid you will succeed.&quot; -- Ray Goforth", 
        "&quot;Start where you are. Use what you have. Do what you can.&quot; -- Arthur Ashe", 
        "&quot;I find that the harder I work, the more luck I seem to have.&quot; -- Thomas Jefferson", 
        "&quot;Success is the sum of small efforts, repeated day in and day out.&quot; -- Robert Collier", 
        "&quot;The only place where success comes before work is in the dictionary.&quot; -- Vidal Sassoon",
        "&quot;The first step toward success is taken when you refuse to be a captive of the environment in which you first find yourself.&quot; -- Mark Caine", 
        "&quot;Whenever you find yourself on the side of the majority, it is time to pause and reflect.&quot; -- Mark Twain", 
        "&quot;The successful warrior is the average person, with laserlike focus.&quot; -- Bruce Lee", 
        "&quot;The No. 1 reason people fail in life is because they listen to their friends, family, and neighbors.&quot; -- Napoleon Hill", 
        "&quot;To be successful you must accept all challenges that come your way. You can't just accept the ones you like.&quot; -- Mike Gafka", 
        "&quot;You may have to fight a battle more than once to win it.&quot; -- Margaret Thatcher", 
        "&quot;Be patient with yourself. Self-growth is tender - it's holy ground. There's no greater investment.&quot; -- Stephen Covey",
        "&quot;I owe my success to having listened respectfully to the very best advice, and then going away and doing the exact opposite.&quot; -- G. K. Chesterton", 
        "&quot;Many of life's failures are people who did not realize how close they were to success when they gave up.&quot; --Thomas A. Edison", 
        "&quot;What would you attempt to do if you knew you would not fail? -- Robert Schuller", 
        "&quot;Always bear in mind that your own resolution to success is more important than any other one thing.&quot; -- Abraham Lincoln", 
        "&quot;Successful and unsuccessful people do not vary greatly in their abilities. They vary in their desires to reach their potential.&quot; -- John Maxwell", 
        "&quot;Would you like me to give you a formula for success? It's quite simple, really: Double your rate of failure. You are thinking of failure as the enemy of success. But it isn't at all. You can be discouraged by failure or you can learn from it, so go ahead and make mistakes. Make all you can. Because that's where you will find success.&quot; -- Thomas J. Watson", 
        "&quot;Doing what you like is freedom. Liking what you do is happiness.&quot; -- Frank Tyger", 
        "&quot;Be happy with what you have. Be excited about what you want.&quot; -- Alan Cohen", 
        "&quot;We forge the chains we wear in life.&quot; -- Charles Dickens", 
        "&quot;Tension is who you think you should be, relaxation is who you are.&quot; -- Chinese Proverb", 
        "&quot;Keep your fears to yourself, but share your courage with others.&quot; -- Robert Louis Stevenson", 
        "&quot;Surround yourself with great people. Delegate authority. Get out of the way.&quot; -- Ronald Reagan",
        "&quot;Do it or not. There is no try.&quot; -- Yoda", 
        "&quot;The person who says it cannot be done should not interrupt the person who is doing it.&quot; -- Chinese proverb", 
        "&quot;The question isn't who is going to let me; it's who is going to stop me.&quot; -- Ayn Rand", 
        "&quot;The only way to do great work is to love what you do.&quot; -- Steve Jobs",
        "&quot;If I had an hour to solve a problem, I'd spend 55 minutes thinking about the problem and 5 minutes thinking about solutions.&quot; -- Alert Einstein",
        "&quot;The reasonable person adapts themselves to the world. The unreasonable one persists in trying to adapt the world to themselves. Therefore all progress depends on the unreasonable person.&quot; -- George Bernard Shaw",
        "&quot;The truth is, the cost of preventing errors is often far greater than the cost of fixing them.&quot; -- Ed Catmull, President of Pixar",
        "&quot;Believe in yourself. Under-confidence leads to a self-fulfilling prophecy that you are not good enough for your work.&quot; -- Dr. Roopleen",
        "&quot;Change is the essence of life. Be willing to surrender what you are for what you could become.&quot; -- Reinhold Niebuhr",
        "&quot;Fear, uncertainty and discomfort are your compasses toward growth.&quot; -- Unknown",
        "&quot;Respect yourself enough to walk away from anything that no longer serves you, grows you, or makes you happy.&quot; -- Robert Tew"
];
    var rand = quotes[Math.floor(Math.random() * quotes.length)];
    return {
        restrict: 'A',
        replace: true,
        transclude: true,
        template: '<span>' + rand + '</span>'
    };
}

function safeHTML($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
}

function words() {
    return function(text, wordnum) {
        if (text) {
            return text.split(" ")[wordnum];
        }
    };
}

function sentence() {
    return function(text) {
        if (text) {
            return text.split(".")[0] + '.';
        }
    };
}


