angular
  .module('appDirectives', [])
  .directive('disableAnimation', ['$animate', function($animate){
    return {
        restrict: 'A',
        link: function($scope, $element, $attrs){
            $attrs.$observe('disableAnimation', function(value){
                $animate.enabled(!value, $element);
            });
        }
    };
  }])
  
  .directive('slideOut', function() {
    return {
      restrict: 'A',
      scope: {
        show: '=slideOut'
      },
      link: function (scope, element, attr) {
        element.hide();
        scope.$watch('show', function (newVal, oldVal) {
          if (newVal !== oldVal) {
            element.slideToggle({
              complete: function () { scope.$apply(); }
            });
          }
        });
      }
    };
  })
  .directive('slideOutNav', ['$timeout', function($t) {
    return {
      restrict: 'A',
      scope: {
        show: '=slideOutNav'
      },
      link: function (scope, element, attr) {
        scope.$watch('show', function (newVal, oldVal) {
          if ($('body').hasClass('collapse-leftbar')) {
            if (newVal == true)
              element.css('display', 'block');
            else
              element.css('display', 'none');
            return;
          }
          if (newVal == true) {
            element.slideDown({
              complete: function () {
                $t(function () { scope.$apply() });
              }
            });
          } else if (newVal == false) {
            element.slideUp({
              complete: function () {
                $t(function () { scope.$apply() });
              }
            });
          }
        });
      }
    };
  }])
  .directive('pulsate', function () {
    return {
      scope: {
        pulsate: '='
      },
      link: function (scope, element, attr) {
        // stupid hack to prevent FF from throwing error
        if (element.css('background-color') == "transparent") {
          element.css('background-color', "rgba(0,0,0,0.01)");
        }
        $(element).pulsate(scope.pulsate);
      }
    };
  })
  .directive('prettyprint', function() {
    return {
    restrict: 'C',
        link: function postLink(scope, element, attrs) {
            element.html(prettyPrintOne(element.html(),'',true));
        }
    };
  })
  .directive("passwordVerify", function() {
    return {
      require: "ngModel",
      scope: {
        passwordVerify: '='
      },
      link: function(scope, element, attrs, ctrl) {
        scope.$watch(function() {
            var combined;

            if (scope.passwordVerify || ctrl.$viewValue) {
               combined = scope.passwordVerify + '_' + ctrl.$viewValue; 
            }                    
            return combined;
        }, function(value) {
            if (value) {
                ctrl.$parsers.unshift(function(viewValue) {
                    var origin = scope.passwordVerify;
                    if (origin !== viewValue) {
                        ctrl.$setValidity("passwordVerify", false);
                        return undefined;
                    } else {
                        ctrl.$setValidity("passwordVerify", true);
                        return viewValue;
                    }
                });
            }
        });
     }
    };
  })
  .directive('backgroundSwitcher', function () {
    return {
      restrict: 'EA',
      link: function (scope, element, attr) {
        $(element).click( function () {
          $('body').css('background', $(element).css('background'));
        });
      }
    };
  })
  .directive('panelControls', [function() {
    return {
      restrict: 'E',
      require: '?^tabset',
      link: function(scope, element, attrs, tabsetCtrl) {
        var panel = $(element).closest('.panel');
        if (panel.hasClass('.ng-isolate-scope') == false) {
          $(element).appendTo(panel.find('.options'));
        }
      }
    };
  }])
  .directive('panelControlCollapse', function () {
    return {
      restrict: 'EAC',
      link: function (scope, element, attr) {
        element.bind('click', function () {
          $(element).toggleClass("fa-chevron-down fa-chevron-up");
          $(element).closest(".panel").find('.panel-body').slideToggle({duration: 200});
          $(element).closest(".panel-heading").toggleClass('rounded-bottom');
        });
        return false;
      }
    };
  })
  .directive('icheck', function($timeout, $parse) {
      return {
          require: '?ngModel',
          link: function($scope, element, $attrs, ngModel) {
              return $timeout(function() {
                  var parentLabel = element.parent('label');
                  if (parentLabel.length)
                    parentLabel.addClass('icheck-label');
                  var value;
                  value = $attrs['value'];

                  $scope.$watch($attrs['ngModel'], function(newValue){
                      $(element).iCheck('update');
                  });

                  return $(element).iCheck({
                      checkboxClass: 'icheckbox_minimal-blue',
                      radioClass: 'iradio_minimal-blue'

                  }).on('ifChanged', function(event) {
                      if ($(element).attr('type') === 'checkbox' && $attrs['ngModel']) {
                          $scope.$apply(function() {
                              return ngModel.$setViewValue(event.target.checked);
                          });
                      }
                      if ($(element).attr('type') === 'radio' && $attrs['ngModel']) {
                          return $scope.$apply(function() {
                              return ngModel.$setViewValue(value);
                          });
                      }
                  });
              });
          }
      };
  })
  .directive('knob', function () {
    return {
      restrict: 'EA',
      template: '<input class="dial" type="text"/>',
      scope: {
        options: '='
      },
      replace: true,
      link: function (scope, element, attr) {
        $(element).knob(scope.options);
      }
    };
  })
  .directive('uiBsSlider', ['$timeout', function ($timeout) {
    return {
      link: function (scope, element, attr) {
        // $timeout is needed because certain wrapper directives don't
        // allow for a correct calculaiton of width
        $timeout(function () {
          element.slider();
        });
      }
    };
  }])

  .directive('jscrollpane', ['$timeout', function ($timeout) {
    return {
      restrict: 'A',
      scope: {
        options: '=jscrollpane'
      },
      link: function (scope, element, attr) {
        $timeout( function () {
          if (navigator.appVersion.indexOf("Win")!=-1)
            element.jScrollPane($.extend({mouseWheelSpeed: 20},scope.options));
          else
            element.jScrollPane(scope.options);
          element.on('click', '.jspVerticalBar', function(event) { event.preventDefault(); event.stopPropagation(); });
          element.bind('mousewheel', function(e) {
            e.preventDefault();
          });
        });
      }
    };
  }])
  // specific to app
  .directive('stickyScroll', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        function stickyTop() {
            var topMax = parseInt(attr.stickyScroll);
            var headerHeight = $('header').height();
            if (headerHeight>topMax) topMax = headerHeight;
            if ($('body').hasClass('static-header') == false)
              return element.css('top', topMax+'px');
            var window_top = $(window).scrollTop();
            var div_top = element.offset().top;
            if (window_top < topMax) {
                element.css('top', (topMax-window_top)+'px');
            } else {
                element.css('top', 0+'px');
            }
        }

        $(function () {
            $(window).scroll(stickyTop);
            stickyTop();
        });
      }
    };
  })
  .directive('rightbarRightPosition', function () {
    return {
      restrict: 'A',
      scope: {
        isFixedLayout: '=rightbarRightPosition'
      },
      link: function (scope, element, attr) {
        scope.$watch('isFixedLayout', function (newVal, oldVal) {
          if (newVal!=oldVal) {
            setTimeout( function () {
              var $pc = $('#page-content');
              var ending_right = ($(window).width() - ($pc.offset().left + $pc.outerWidth()));
              if (ending_right<0) ending_right=0;
              $('#page-rightbar').css('right',ending_right);
            }, 100);
          }
        });
      }
    };
  })
  .directive('fitHeight', ['$window', '$timeout', '$location', function ($window, $timeout, $location) {
    return {
      restrict: 'A',
      scope: true,
      link: function (scope, element, attr) {
        scope.docHeight = $(document).height();
        var setHeight = function (newVal) {
          var diff = $('header').height();
          if ($('body').hasClass('layout-horizontal')) diff += 112;
          if ((newVal-diff)>element.outerHeight()) {
            element.css('min-height', (newVal-diff)+'px');
          } else {
            element.css('min-height', $(window).height()-diff);
          }
        };
        scope.$watch('docHeight', function (newVal, oldVal) {
          setHeight(newVal);
        });
        $(window).on('resize', function () {
          setHeight($(document).height());
        });
        var resetHeight = function () {
            scope.docHeight = $(document).height();
            $timeout(resetHeight, 1000);
          };
        $timeout(resetHeight , 1000);
      }
    };
  }])
  .directive('jscrollpaneOn', ['$timeout', function ($timeout) {
    return {
      restrict: 'A',
      scope: {
        applyon: '=jscrollpaneOn'
      },
      link: function (scope, element, attr) {
        scope.$watch('applyon', function (newVal) {
          if (newVal == false) {
            var api = element.data('jsp');
            if (api) api.destroy();
            return;
          }
          $timeout( function () {
            element.jScrollPane({autoReinitialise:true});
          });
        });
      }
    };
  }])
  .directive('backToTop', function () {
    return {
      restrict: 'AE',
      link: function (scope, element, attr) {
        element.click( function (e) {
          $('body').scrollTop(0);
        });
      }
    };
  })
  .directive('randomQuote', function() {
    var quotes = [
      "The best minute you spend is the one you invest in people.  -- Ken Blanchard",
      "If you're too busy to help those around you, you're too busy. -- Bob Moawad",
      "The things we know best are the things we haven't been taught. -- Marquis de Vauvenargues",
      "Successful and unsuccessful people do not vary greatly in their abilities. They vary in their desires to reach their potential. -- John Maxwell",
      "I'm a great believer in luck, and I find the harder I work the more I have of it. -- Thomas Jefferson",
      "If you have a talent, use it in every which way possible. Don't hoard it. Don't dole it out like a miser. Spend it lavishly like a millionaire intent on going broke. -- Brendan Francis",
      "In the beginner's mind, there are many possibilities. In the expert's mind, there are few. -- Shunryu Suzuki",
      "One half of knowing what you want is knowing what you must give up before you get it. -- Sidney Howard",
      "Every book is good to read which sets the reader in a working mood. -- Ralph Waldo Emerson",
      "Your goals, minus your doubts, equal your reality. -- Ralph Marston",
      "Small deeds done are greater than great deeds planned. -- Peter Marshall",
      "The aim of all education is, or should be, to teach people to educate themselves. -- Arnold J. Toynbee",
      "I think there is something more important that believing: Action! The world is full of dreamers, there aren't enough who will move ahead and begin to take concrete steps to actualize their vision. -- W. Clement Stone",
      "Why do we put off living the way we want to live, as if we have all the time in the world? -- Barbara de Angelis",
      "The truth is that there is nothing noble in being superior to somebody else. The only real nobility is in being superior to your former self. -- Whitney Young",
      "Relentlessly pursue the quality of life you envision. -- White Eagle",
      "Einstein explained his theory to me every day, and on my arrival, I was fully convinced that he understood it. -- Chaim Weizmann",
      "Two roads diverged in a wood, and I - I took the one less traveled by, and that has made all the difference. -- Robert Frost",
      "One man cannot do right in one department of life whilst he is occupied in doing wrong in any other departnment. Life is one indivisible whole. -- Mahatma Gandhi",
      "Lying makes a problem part of the future; truth makes a problem part of the past. -- Rick Pitino",
      "Every man gives his life to what he believes. Every woman gives her life for what she believes. Sometimes people believe in little or nothing, and so they give their lives to little or nothing. -- Joan of Arc",
      "Be who you are and say what you feel, because those who mind don't matter and those who matter don't mind. -- Dr. Seuss",
      "Act as if what you do makes a difference. It does. -- William James",
      "Never confuse motion with action. -- Benjamin Franklin",
      "Efficiency is doing the thing right. Effectiveness is doing the right thing. --Peter Drucker",
      "I find television very educating. Every time somebody turns on the set, I go into the other room and read a book. -- Groucho Marx",
      "You have to expect things of yourself before you can do them. -- Michael Jordan",
      "Between stimulus and response there is a space. In that space lies our freedom and power to choose our response. In our response lies our growth and our happiness. -- Stephen Covey",
      "I like the dreams of the future better than the history of the past. -- Thomas Jefferson",
      "It is not length of life, but depth of life. -- Ralph Waldo Emerson",
      "Let him who would move the world, first move himself. -- Socrates",
      "The outstanding leaders of every age are those who set up their own quotas and constantly exceed them. -- Thomas J. Watson",
      "In the business world, everyone is paid in two coins: cash and experience. Take the experience first; the cash will come later. -- Harold Geneen",
      "He who every morning plans the transactions of the day and follows out that plan carries a thread that will guide him through the labrynth of the most busy life. -- Victor Hugo",
      "There are three marks of a superior man: being virtuous, he is free from anxiety; being wise, he is free from perplexity; being brave, he is free from fear. -- Confucius",
      "Wherever a man goes to dwell, his character goes with him. -- African Proverb",
      "The percentage of mistakes in quick decisions is no greater than in long-drown-out vacillations, and the effect of decisiveness itself makes things go and creates confidence. -- Anne O'Hare McCormick",
      "If anyone thinks he has no responsibilities, it is because he has not sought them out. -- Mary Lyon",
      "We are what we repeatedly do. Excellence, then, is not an act, but a habit. -- Aristotle",
      "While one person hesitates because he feels inferior, the other is busy making mistakes and becoming superior. -- Henry C. Link",
      "Success is a process; goal-setting is a process; the value of both lies not only in achievement, but also in a sense of direction for one's life. -- Lennon Ledbetter",
      "The starting point of all achievement is desire. -- Napoleon Hill",
      "A man's success or failure in life is determined as much by how he acts during his leisure as by how he acts during his work hours. Tell me how a young man spends his evenings and I will tell you how he is likely to spend the latter part of his life. -- B. C. Forbes",
      "Education is when you read the fine print. Experience is what you get if you don't. -- Peter Seeger",
      "Goals determine what you're going to be. -- Julius Erving",
      "What we think, or what we know, or what we believe is, in the end, of little consequence. The only consequence is what we do. -- John Ruskin",
      "Change means movement. Movement means friction. -- Saul Alinsky",
      "Wherever we look upon this earth, the opportunities take shape within the problems. -- Nelson A. Rockefeller",
      "Tell me, I'll forget. Show me, I may remember. Involve me, I'll understand. -- Confucius",
      "If you believe it will work out, you'll see opportunities. If you believe it won't, you'll see obstacles. -- John Alama",
      "My father instilled in me that if you don't see things happening the way you want them to, you get out there and make them happen. -- Susan Powter",
      "As a rule of thumb, involve everyone in everything of any consequence to all of you. -- Tom Peters",
      "He who walks in another's tracks leaves no footprints. -- Joan L. Brannon",
      "A leader is a dealer in hope. -- Napoleon Bonaparte",
      "No decision is risk-free. Don't let the negatives blind you to the opportunities. -- Victor K. Kiam II",
      "Leadership is action, not position. -- D. H. McGannon",
      "It is a most mortifying relfection for a man to consider what he has done, compared to what he might have done. -- Samuel Johnson",
      "No decision has been made unless carrying it out in specific steps has become someone's work assignment and responsibility. -- Peter F. Drucker",
      "In the absence of clearly-defined goals, we become strangely loyal to performing daily trivia until ultimately we become enslaved by it. -- Robert Heinlein",
      "Drastic action can be costly, but it can be less expensive than continuing inaction. -- Richard Neustadt",
      "Pain is inevitable; suffering is optional. -- H. Witte",
      "Be absolutely determined to enjoy what you do. -- Gerry Sikorski",
      "You cannot truly listen to anyone and do anything else at the same time. -- M. Scott Peck",
      "There are many wonderful things that will never be done if you do not do them. -- Charles D. Gill",
      "Determine that the thing can and shall be done, and then we shall find the way. -- Abraham Lincoln",
      "Human beings are perhaps never more frightening than when they are convinced beyond doubt that they are right. -- Laurens van der Post",
      "The chief beauty about time is that you cannot waste it in advance. The next year, the next day, the next hour are lying ready for you, as perfect, as unspoiled, as if you had never wasted or misapplied a single moment in all your life. You can turn over a new leaf every hour if you choose. -- Arnold Bennett",
      "I fully realize that I have not succeeded in answering all of your questions.. Indeed, I feel I have not answered any of them completely. The answers I have found only serve to raise a whole new set of questions, which only lead to more problems, some of which we weren't even aware were problems. To sum it up.. In some ways I feel we are confused as ever, but I believe we are confused on a higher level, and about more important things. -- Jack Handey",
      "Stop chasing the money and start chasing the passion. -- Tony Hsieh",
      "Success is walking from failure to failure with no loss of enthusiasm. -- Winston Churchill",
      "Whenever you see a successful person, you only see the public glories, never the private sacrifices to reach them. -- Vaibhav Shah",
      "Opportunities don't happen. You create them. -- Chris Grosser",
      "Try not to become a person of success, but rather try to become a person of value. -- Albert Einstein",
      "I have not failed. I've just found 10,000 ways that won't work. -- Thomas Edison",
      "If you're going through hell, keep going. -- Winston Churchill",
      "What seems to us as bitter trials are often blessings in disguise. -- Oscar Wilde",
      "The distance between insanity and genius is measured only by success. -- Bruce Feirstein",
      "If you are not willing to risk the usual, you will have to settle for the ordinary. -- Jim Rohn",
      "Don't be afraid to give up the good to go for the great. -- John D. Rockefeller",
      "If you can't explain it simply, you don't understand it well enough. -- Albert Einstein",
      "There are two types of people who will tell you that you cannot make a difference in this world: those who are afraid to try and those who are afraid you will succeed. -- Ray Goforth",
      "Start where you are. Use what you have. Do what you can. -- Arthur Ashe",
      "I find that the harder I work, the more luck I seem to have. -- Thomas Jefferson",
      "Success is the sum of small efforts, repeated day in and day out. -- Robert Collier",
      "The only place where success comes before work is in the dictionary. -- Vidal Sassoon",
      "I don't know the key to success, but the key to failure is trying to please everyone. -- Bill Cosby",
      "The first step toward success is taken when you refuse to be a captive of the environment in which you first find yourself. -- Mark Caine",
      "Whenever you find yourself on the side of the majority, it is time to pause and reflect. -- Mark Twain",
      "The successful warrior is the average man, with laserlike focus. -- Bruce Lee",
      "The No. 1 reason people fail in life is because they listen to their friends, family, and neighbors. -- Napoleon Hill",
      "To be successful you must accept all challenges that come your way. You can't just accept the ones you like. -- Mike Gafka",
      "You may have to fight a battle more than once to win it. -- Margaret Thatcher",
      "Be patient with yourself. Self-growth is tender; it's holy ground. There's no greater investment. -- Stephen Covey",
      "I owe my success to having listened respectfully to the very best advice, and then going away and doing the exact opposite. -- G. K. Chesterton",
      "Many of life's failures are people who did not realize how close they were to success when they gave up. --Thomas A. Edison",
      "What would you attempt to do if you knew you would not fail? -- Robert Schuller",
      "Always bear in mind that your own resolution to success is more important than any other one thing. -- Abraham Lincoln",
      "Successful and unsuccessful people do not vary greatly in their abilities. They vary in their desires to reach their potential. -- John Maxwell",
      "Would you like me to give you a formula for success? It's quite simple, really: Double your rate of failure. You are thinking of failure as the enemy of success. But it isn't at all. You can be discouraged by failure or you can learn from it, so go ahead and make mistakes. Make all you can. Because remember, that's where you will find success. -- Thomas J. Watson",
      "Doing what you like is freedom. Liking what you do is happiness. -- Frank Tyger",
      "Be happy with what you have. Be excited about what you want. -- Alan Cohen",
      "We forge the chains we wear in life. -- Charles Dickens",
      "Tension is who you think you should be, relaxation is who you are. -- Chinese Proverb",
      "Keep your fears to yourself, but share your courage with others. -- Robert Louis Stevenson",
      "Surround yourself with great people; delegate authority; get out of the way. -- Ronald Reagan",
      "Do it or not. There is no try. -- Yoda",
      "The person who says it cannot be done should not interrupt the person who is doing it. -- Chinese proverb",
      "The question isn't who is going to let me; it's who is going to stop me. -- Ayn Rand",
      "The only way to do great work is to love what you do. -- Steve Jobs"
    ];
    var rand = quotes[Math.floor(Math.random() * quotes.length)];
    return {
      restrict: 'A',
      replace: true,
      transclude: true,
      template: '<li>' + rand + '</li>'
    };
  });