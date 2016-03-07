"use strict";
angular.module("Timebridge", ["ngRoute", "ngCookies", "ngResource", "ngSanitize", "ngMaterial", "ngMessages", "homePageController", "headerController", "authController", "tbServices", "timeZonesController", "timeZoneServices", "confirmMeetingServices", "googleService", "sendInvitation", "confirmMeetingServices", "timebridgeService", "notificationController", "notificationServices", "outlookService", "attendeeController", "meetingPageServices", "authorizationService", "calendarNotificationController", "angucomplete-alt", "ngMap", "vsGoogleAutocomplete", "meetWithMeSettingsController", "mwmCalendarController", "ngRaven", "ngFileUpload", "ngImgCrop"]).config(function ($routeProvider) {
    $routeProvider.when("/home", {
        templateUrl: "../../../static/js/app/home/view/home.html",
        controller: HomePageController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/change-proposed-times/:meetingId", {
        templateUrl: "../../../static/js/app/home/view/home.html",
        controller: ChangeProposedTimesController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/reschedule-meeting/:meetingId", {
        templateUrl: "../../../static/js/app/home/view/home.html",
        controller: RescheduleMeetingController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/meetings", {
        templateUrl: "../../../static/js/app/meetings/view/meetings.html",
        controller: MeetingsPageController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/meeting/:meetingId", {
        templateUrl: "../../../static/js/app/meeting-page/view/meeting-page.html",
        controller: MeetingPageController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/reply/:meetingCode", {
        templateUrl: "../../../static/js/app/confirm-meeting-page/view/confirm-meeting.html",
        controller: ReplyController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/confirm-meeting-time/:meetingId", {
        templateUrl: "../../../static/js/app/confirm-meeting-page/view/confirm-meeting.html",
        controller: ConfirmMeetingTimeController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/update-availability/:meetingId", {
        templateUrl: "../../../static/js/app/confirm-meeting-page/view/update-availiability.html",
        controller: UpdateAvailabilityController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/settings", {
        templateUrl: "../../../static/js/app/settings/view/settings.html",
        controller: SettingsPageController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/groups", {
        templateUrl: "../../../static/js/app/groups-page/view/groups-page.html",
        controller: GroupsPageController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/group/:groupId", {
        templateUrl: "../../../static/js/app/group-page/view/group-page.html",
        controller: GroupPageController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/meet/reply/:meetingCode", {
        templateUrl: "../../../static/js/app/meet-with-me/view/meet-with-me-reply-page.html",
        controller: MeetWithMeReplyController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/meet/reschedule/:meetingId", {
        templateUrl: "../../../static/js/app/home/view/home.html",
        controller: MwmProposeDifferentTimesController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/meet/:userPersonalUrl", {
        templateUrl: "../../../static/js/app/meet-with-me/view/meet-with-me-page.html",
        controller: MeetWithMeController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/meet/:userPersonalUrl/:eventTypeUrl", {
        templateUrl: "../../../static/js/app/meet-with-me/view/meet-with-me-page.html",
        controller: MeetWithMeController,
        resolve: {
            authenticated: function (tbAuth) {
                return tbAuth.authenticationStatus()
            }
        }
    }).when("/emailverification/:userCode", {
        templateUrl: "../../../static/js/app/partials/view/user-registration-page.html",
        controller: UserRegistrationController
    }).when("/unsubscribe/:userEmail", {
        templateUrl: "../../../static/js/app/unsubscribe/view/user-unsubscribe-page.html",
        controller: UserUnsubscribeController
    }).when("/404", {templateUrl: "../../../static/js/app/partials/view/404.html"}).when("/registration/almost-complete", {templateUrl: "../../../static/js/app/partials/view/registration-almost-complete.html"}).otherwise({redirectTo: "/home"})
}).run(function ($log) {
    $log.info("Timebridge starting up")
});
var TBConst = {
    calendar: {
        outlookCalendarType: 1,
        googleCalendarType: 2,
        noConnectedCalendars: 0,
        slotDuration: "00:15:00",
        minTime: "00:00",
        maxTime: "24:00",
        workMinTime: "08:00",
        workMaxTime: "18:00",
        accessRoles: {read: "read", readFreeBusy: "read_free_busy", write: "write", owner: "full"}
    },
    hours: [{latinTimeFormat: "12 AM", normalTimeFormat: "00:00"}, {
        latinTimeFormat: "1 AM",
        normalTimeFormat: "01:00"
    }, {latinTimeFormat: "2 AM", normalTimeFormat: "02:00"}, {
        latinTimeFormat: "3 AM",
        normalTimeFormat: "03:00"
    }, {latinTimeFormat: "4 AM", normalTimeFormat: "04:00"}, {
        latinTimeFormat: "5 AM",
        normalTimeFormat: "05:00"
    }, {latinTimeFormat: "6 AM", normalTimeFormat: "06:00"}, {
        latinTimeFormat: "7 AM",
        normalTimeFormat: "07:00"
    }, {latinTimeFormat: "8 AM", normalTimeFormat: "08:00"}, {
        latinTimeFormat: "9 AM",
        normalTimeFormat: "09:00"
    }, {latinTimeFormat: "10 AM", normalTimeFormat: "10:00"}, {
        latinTimeFormat: "11 AM",
        normalTimeFormat: "11:00"
    }, {latinTimeFormat: "12 PM", normalTimeFormat: "12:00"}, {
        latinTimeFormat: "1 PM",
        normalTimeFormat: "13:00"
    }, {latinTimeFormat: "2 PM", normalTimeFormat: "14:00"}, {
        latinTimeFormat: "3 PM",
        normalTimeFormat: "15:00"
    }, {latinTimeFormat: "4 PM", normalTimeFormat: "16:00"}, {
        latinTimeFormat: "5 PM",
        normalTimeFormat: "17:00"
    }, {latinTimeFormat: "6 PM", normalTimeFormat: "18:00"}, {
        latinTimeFormat: "7 PM",
        normalTimeFormat: "19:00"
    }, {latinTimeFormat: "8 PM", normalTimeFormat: "20:00"}, {
        latinTimeFormat: "9 PM",
        normalTimeFormat: "21:00"
    }, {latinTimeFormat: "10 PM", normalTimeFormat: "22:00"}, {
        latinTimeFormat: "11 PM",
        normalTimeFormat: "23:00"
    }, {latinTimeFormat: "12 AM", normalTimeFormat: "23:59"}],
    days: [{key: 0, day: "Sun"}, {key: 1, day: "Mon"}, {key: 2, day: "Tue"}, {key: 3, day: "Wed"}, {
        key: 4,
        day: "Thu"
    }, {key: 5, day: "Fri"}, {key: 6, day: "Sat"}],
    emailTypes: {primary: "Primary", verify: "Verify", makePrimary: "Make Primary"},
    conditions: [{value: "1", title: "15 minutes before meeting"}, {
        value: "2",
        title: "30 minutes before meeting"
    }, {value: "3", title: "1 hour before meeting"}, {value: "4", title: "2 hour before meeting"}, {
        value: "5",
        title: "3 hour before meeting"
    }, {value: "6", title: "1 day before meeting"}, {value: "7", title: "2 day before meeting"}, {
        value: "8",
        title: "1 week before meeting"
    }],
    notificationStatus: {error: "error", success: "success", info: "info", survey: "survey"},
    tabSettings: {account: "account", meeting: "meeting", calendar: "calendar", meetWithMe: "meetWithMe"},
    outlook: {connectionStatus: "OK", timeFormat: "YYYYMMDDTHHMMSS", connectorTimeFormat: "YYYYMMDDThhmmssTZD"},
    maxGroupsCount: 8,
    defaultLocationName: "TBD"
};
var MeetingStatuses = {proposed: "Proposed"};
var CalendarConst = {utc: "UTC", utcZeroOffset: "+00:00", filter: {id: "_id", isAvailability: "isAvailability"}};
var DefaultDatetimeFormats = {
    fullDatetime: "M/d/yy h:mm a",
    dateTimeWithWeekDay: "EEEE, d/M h:mm a",
    dateWithWeekDay: "EEE d/M",
    dateWithWeekAndMonthDay: "EEE, MMM d, yyyy",
    timeFormat: "h:mm a"
};
var ViewDateFormat = [{viewFormat: "MM/DD/YYYY"}, {viewFormat: "DD/MM/YYYY"}];
var CalendarViewSlots = [{time: "15"}, {time: "30"}];
var mainTimebridgeUrl = {url: "http://www.timebridge.com/"};
var eventColor = [{value: "3498DB"}, {value: "79DAED"}, {value: "55FD9B"}, {value: "99C901"}, {value: "FEF035"}, {value: "FFCC99"}, {value: "FF0000"}, {value: "F354A3"}, {value: "D1A5FE"}];
var duration = [{title: "15 minutes", value: 15}, {title: "30 minutes", value: 30}, {
    title: "45 minutes",
    value: 45
}, {title: "1 hour", value: 60}, {title: "1 1/2 hours", value: 90}, {title: "2 hours", value: 120}, {
    title: "3 hours",
    value: 180
}, {title: "4 hours", value: 240}, {title: "5 hours", value: 300}, {title: "6 hours", value: 360}];
var extraTime = [{title: "0 minutes", value: 0}, {title: "15 minutes", value: 15}, {
    title: "30 minutes",
    value: 30
}, {title: "45 minutes", value: 45}, {title: "1 hour", value: 60}];
var scheduledInAdvance = [{title: "1 hour", value: 60}, {title: "4 hours", value: 240}, {
    title: "24 hours",
    value: 1440
}, {title: "48 hours", value: 2880}, {title: "72 hours", value: 4320}, {title: "1 week", value: 10080}];
var maxEventsPerDay = [{title: "Unlimited", value: 0}, {title: "1", value: 1}, {title: "2", value: 2}, {
    title: "3",
    value: 3
}, {title: "4", value: 4}];
var eventType = {
    availableDays: [{day: "Sun", checked: true}, {day: "Mon", checked: true}, {
        day: "Tue",
        checked: true
    }, {day: "Wed", checked: true}, {day: "Thu", checked: true}, {day: "Fri", checked: true}, {
        day: "Sat",
        checked: true
    }]
};
var intercomAppId = "wg4x1i5u";
"use strict";
var homePageController = angular.module("homePageController", ["ui.calendar", "ui.bootstrap"]);
homePageController.controller("CalendarController", function ($scope, $compile, $http, $rootScope, $location, $routeParams, $log, uiCalendarConfig, googleService, timebridgeService, timeZones, outlookService, $mdDialog, confirmMeetingService) {
    var self = this, _maxNewEventsCount = 5, _meetingTimeStorage = null;
    $scope.buttons = [{calendarName: "myCalendar", title: "Day", agenda: "agendaDay"}, {
        calendarName: "myCalendar",
        title: "Week",
        agenda: "agendaWeek"
    }, {calendarName: "myCalendar", title: "Month", agenda: "month"}];
    $scope.newEvents = {color: "#FF8C00", textColor: "white", borderColor: "white", events: []};
    $scope.mwmRequestedEvents = {color: "#CC3399", textColor: "white", borderColor: "white", events: []};
    $scope.googleEvents = {color: "#1E90FF", textColor: "white", borderColor: "white", editable: false, events: []};
    $scope.outlookEvents = {color: "#1E90FF", textColor: "white", borderColor: "white", editable: false, events: []};
    $scope.timebridgeEvents = {textColor: "white", borderColor: "white", editable: false, events: []};
    $scope.initialInfo = $rootScope.initialInfo.userData;
    if ($scope.initialInfo.dateFormat == ViewDateFormat[1].viewFormat) {
        $scope.dateFormat = "D/M"
    } else {
        $scope.dateFormat = "M/D"
    }
    if (!$scope.initialInfo.calendarSlotsFormat) {
        $scope.initialInfo.calendarSlotsFormat = CalendarViewSlots[1].time
    }
    $scope.init = function () {
        $scope.selected = 1;
        timeZones.initTimeZoneData().then(function () {
            $scope.currentTimeZone = $rootScope.initialInfo.userData.time_zone;
            self.now = timeZones.currTimeForCalendar($scope.currentTimeZone);
            $scope.$watch(function () {
                return $rootScope.initialInfo.userData.time_zone
            }, timeZoneWatcher);
            $scope.uiConfig = self.uiConfig
        })
    };
    $scope.onEventClick = function (event, jsEvent, view) {
        if (event.tbId) {
            $location.path("/meeting/" + event.tbId)
        }
    };
    $scope.confirmMwmRequestedTime = function (event, jsEvent, view) {
        if (event.isMwm) {
            $scope.$emit("confirmMwmRequestedTime", event)
        }
    };
    $scope.alertOnDrop = function (event, delta, revertFunc, jsEvent, ui, view) {
        var existingEventStartTime = _existingStartTime(event.start, event._id);
        if (event.start < self.now || existingEventStartTime) {
            if (existingEventStartTime) {
                alert("Sorry, you cannot select two proposed times that start at the same time.")
            }
            event.start = _meetingTimeStorage.start;
            event._start = _meetingTimeStorage.start;
            event.end = _meetingTimeStorage.end;
            event._end = _meetingTimeStorage.end;
            _updateNewEventsData(event)
        }
    };
    $scope.alertOnResize = function (event, delta, revertFunc, jsEvent, ui, view) {
        _updateNewEventsData(event)
    };
    $scope.dragEvent = function (event, jsEvent, ui, view) {
        _updateNewEventsData(event)
    };
    $scope.addRemoveEventSource = function (sources, source) {
        var canAdd = 0;
        angular.forEach(sources, function (value, key) {
            if (sources[key] === source) {
                sources.splice(key, 1);
                canAdd = 1
            }
        });
        if (canAdd === 0) {
            sources.push(source)
        }
    };
    $scope.addEvent = function (start, end, checkForPast) {
        if (typeof(checkForPast) === "undefined") {
            checkForPast = true
        }
        if (checkForPast && start < self.now) {
            alert("Sorry, you cannot propose a meeting time that is in the past.")
        } else {
            if ($scope.newEvents.events.length >= _maxNewEventsCount) {
                alert("You can propose maximum 5 more meeting times.")
            } else {
                if (_existingStartTime(start, "undefined")) {
                    alert("Sorry, you cannot select two proposed times that start at the same time.")
                } else {
                    $scope.newEvents.events.push({
                        start: moment(start).tz(CalendarConst.utc),
                        end: moment(end).tz(CalendarConst.utc),
                        isNew: true
                    });
                    $scope.$emit("updateNewEvents", $scope.newEvents.events)
                }
            }
        }
    };
    $scope.remove = function (index) {
        $scope.newEvents.events.splice(index, 1);
        $scope.$emit("updateNewEvents", $scope.newEvents.events)
    };
    $scope.changeView = function (view, calendar, item) {
        $scope.selected = item;
        $scope.calendar = uiCalendarConfig.calendars[calendar];
        uiCalendarConfig.calendars[calendar].fullCalendar("changeView", view)
    };
    $scope.renderCalender = function (calendar) {
        if (uiCalendarConfig.calendars[calendar]) {
            uiCalendarConfig.calendars[calendar].fullCalendar("render")
        }
    };
    $scope.eventRender = function (event, element, view) {
        if (event.isNew) {
            element.append("<span ng-click='remove(" + _getEventIndex(event._id) + ")' style='z-index: 99999; position: absolute;' class='closebtn'>X</span>");
            $compile(element)($scope)
        }
    };
    $scope.eventDragStart = function (event) {
        _meetingTimeStorage = angular.copy(event)
    };
    $scope.showGetConnected = function () {
        $mdDialog.show({
            controller: HandleDialogController,
            templateUrl: "../../../static/js/app/partials/view/get-connection.html",
            locals: {showSignUp: false, message: ""}
        })
    };
    $scope.showAuthModal = function () {
        $mdDialog.show({
            controller: HandleDialogController,
            templateUrl: "../../../static/js/app/partials/view/login-popup.html",
            locals: {showSignUp: false, message: ""}
        });
        $scope.showLoginModal = true;
        $scope.isLogin = true
    };
    $scope.$on("showEvent", function (event, time) {
        uiCalendarConfig.calendars.myCalendar.fullCalendar("gotoDate", time)
    });
    self.uiConfig = {
        calendar: {
            timezone: CalendarConst.utc,
            height: 800,
            editable: true,
            selectable: true,
            slotDuration: "00:" + $scope.initialInfo.calendarSlotsFormat + ":00",
            defaultView: "agendaWeek",
            header: {right: "title", center: "", left: "today prev,next"},
            views: {
                month: {columnFormat: "ddd"},
                day: {columnFormat: "dddd"},
                week: {columnFormat: "ddd " + $scope.dateFormat}
            },
            select: $scope.addEvent,
            eventDrop: $scope.alertOnDrop,
            eventResize: $scope.alertOnResize,
            eventRender: $scope.eventRender,
            viewRender: function (view, element) {
                if (view.isDisplayed) {
                    $scope.calendarViewName = view.name;
                    loadGoogleEvents(view.start, view.end, $scope.currentTimeZone);
                    loadOutlookEvents(view.start, view.end, $scope.currentTimeZone);
                    loadTimebridgeEvents(view.start, view.end, false);
                    loadNewTimebridgeEvents();
                    _addPastHours();
                    storeUserOutlookAvailability(view.start, view.end.add(7, "days"), $scope.currentTimeZone)
                }
            },
            eventDragStart: $scope.eventDragStart,
            eventDragStop: $scope.dragEvent,
            minTime: TBConst.calendar.minTime,
            maxTime: TBConst.calendar.maxTime,
            hiddenDays: [],
            eventClick: $scope.onEventClick,
            timeFormat: {agenda: "h:mm", month: "h:mm a"}
        },
        previewCalendar: {
            timezone: CalendarConst.utc,
            height: 350,
            header: false,
            editable: false,
            selectable: false,
            slotDuration: "00:" + $scope.initialInfo.calendarSlotsFormat + ":00",
            defaultView: "agendaDay",
            eventRender: $scope.eventRender,
            viewRender: function (view, element) {
                $scope.calendarViewName = view.name;
                loadGoogleEvents(view.start, view.end, $scope.currentTimeZone);
                loadOutlookEvents(view.start, view.end, $scope.currentTimeZone);
                loadTimebridgeEvents(view.start, view.end, false)
            },
            views: {day: {columnFormat: "ddd " + $scope.dateFormat}}
        },
        mwmReplyCalendar: {
            timezone: CalendarConst.utc,
            height: 800,
            editable: false,
            selectable: false,
            slotDuration: "00:" + $scope.initialInfo.calendarSlotsFormat + ":00",
            defaultView: "agendaWeek",
            header: {right: "title", center: "", left: "today prev,next"},
            views: {
                month: {columnFormat: "ddd"},
                day: {columnFormat: "dddd"},
                week: {columnFormat: "ddd " + $scope.dateFormat}
            },
            select: $scope.addEvent,
            eventDrop: $scope.alertOnDrop,
            eventResize: $scope.alertOnResize,
            eventRender: $scope.eventRender,
            viewRender: function (view, element) {
                $scope.googleEvents.color = "#E0E0E0";
                $scope.timebridgeEvents.color = "#E0E0E0";
                $scope.outlookEvents.color = "#E0E0E0";
                $scope.calendarViewName = view.name;
                loadGoogleEvents(view.start, view.end, $scope.currentTimeZone);
                loadOutlookEvents(view.start, view.end, $scope.currentTimeZone);
                loadTimebridgeEvents(view.start, view.end, true);
                loadMwmRequestedTimes();
                _addPastHours()
            },
            eventDragStart: $scope.eventDragStart,
            eventDragStop: $scope.dragEvent,
            minTime: TBConst.calendar.minTime,
            maxTime: TBConst.calendar.maxTime,
            hiddenDays: [],
            eventClick: $scope.confirmMwmRequestedTime,
            timeFormat: {agenda: "h:mm", month: "h:mm a"}
        }
    };
    $scope.eventSources = [$scope.timebridgeEvents, $scope.googleEvents, $scope.newEvents];
    $scope.mwmCalendarEventSources = [$scope.timebridgeEvents, $scope.googleEvents, $scope.newEvents, $scope.mwmRequestedEvents];
    $scope.$on("removeEvent", function (event, eventId) {
        $scope.remove(_getEventIndex(eventId))
    });
    $scope.$on("removeAllNewEvent", function (event) {
        $scope.newEvents.events = [];
        $scope.$emit("updateNewEvents", $scope.newEvents.events)
    });
    $scope.$on("addEvent", function (event, start, end) {
        $scope.addEvent(start, end, false)
    });
    $scope.$on("bussinesDayView", function () {
        var startWorkTime = $scope.initialInfo.workHoursStart;
        var endWorkTime = $scope.initialInfo.workHoursEnd;
        $scope.uiConfig.calendar.minTime = startWorkTime ? startWorkTime : TBConst.calendar.workMinTime;
        $scope.uiConfig.calendar.maxTime = endWorkTime ? endWorkTime : TBConst.calendar.workMaxTime;
        $scope.uiConfig.calendar.hiddenDays = _getBussinesDays();
        $scope.uiConfig.calendar.defaultView = $scope.calendarViewName
    });
    $scope.$on("allDayView", function () {
        $scope.uiConfig.calendar.minTime = TBConst.calendar.minTime;
        $scope.uiConfig.calendar.maxTime = TBConst.calendar.maxTime;
        $scope.uiConfig.calendar.hiddenDays = []
    });
    $scope.$on("gotoDate", function (event, start) {
        uiCalendarConfig.calendars.myCalendar.fullCalendar("gotoDate", start)
    });
    var loadGoogleEvents = function (startTime, endTime, timeZone) {
        if ($rootScope.initialInfo.authenticated && $scope.initialInfo.calendarType == TBConst.calendar.googleCalendarType) {
            $scope.$emit("eventsLoading", true);
            googleService.loadGoogleEvents(angular.toJson(startTime), angular.toJson(endTime), timeZone).success(function (data, status, headers, config) {
                $rootScope.googleEvents = data.events;
                _addGoogleEventsIntoCalendar(data.events);
                $scope.$emit("eventsLoading", false)
            }).error(function (data, status, headers, config) {
                $scope.$emit("eventsLoading", false);
                $scope.$emit("showDataNotificationOnHomePage", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "Error:",
                    dataBody: "Failed to load Google events."
                });
                googleService.disconnectGoogleCalendar().success(function (data, status, headers, config) {
                    $mdDialog.show({
                        controller: HandleDialogController,
                        templateUrl: "../../../static/js/app/partials/view/reconnect-google-calendar.html",
                        locals: {showSignUp: false, message: ""}
                    })
                }).error(function (data, status, headers, config) {
                    $mdDialog.show({
                        controller: HandleDialogController,
                        templateUrl: "../../../static/js/app/partials/view/reconnect-google-calendar.html",
                        locals: {showSignUp: false, message: ""}
                    })
                })
            })
        }
    };
    var changeEventsTimeZone = function (source, oldTimezone, newTimezone) {
        var event, newEvent, startStr, endStr, newEvents = [];
        if (oldTimezone !== newTimezone) {
            while (source.length > 0) {
                event = source.pop();
                if (event.allDay) {
                    newEvents.push(event)
                } else {
                    event.start.subtract({minutes: timeZones.offsetDifference(event.start, newTimezone, oldTimezone)});
                    startStr = event.start.format(moment.ISO_8601());
                    event.end.subtract({minutes: timeZones.offsetDifference(event.end, newTimezone, oldTimezone)});
                    endStr = event.end.format(moment.ISO_8601());
                    newEvent = {
                        title: event.title,
                        end: moment(endStr).tz(CalendarConst.utc),
                        start: moment(startStr).tz(CalendarConst.utc),
                        allDay: event.allDay,
                        tbId: event.tbId,
                        info: event.info,
                        backgroundColor: event.backgroundColor,
                        isNew: event.isNew,
                        isMwm: event.isMwm
                    };
                    uiCalendarConfig.calendars.myCalendar.fullCalendar("removeEvents", event._id);
                    newEvents.push(newEvent)
                }
            }
        }
        angular.extend(source, newEvents)
    };

    function timeZoneWatcher(newTimezone, oldTimezone) {
        $scope.currentTimeZone = newTimezone;
        self.now = timeZones.currTimeForCalendar($scope.currentTimeZone);
        changeEventsTimeZone($scope.googleEvents.events, oldTimezone, newTimezone);
        changeEventsTimeZone($scope.newEvents.events, oldTimezone, newTimezone);
        changeEventsTimeZone($scope.timebridgeEvents.events, oldTimezone, newTimezone);
        changeEventsTimeZone($scope.mwmRequestedEvents.events, oldTimezone, newTimezone);
        _addPastHours();
        if (newTimezone !== oldTimezone) {
            confirmMeetingService.changeTimezone($scope.meeting.meetingTimes, oldTimezone, newTimezone)
        }
    }

    var loadTimebridgeEvents = function (startTime, endTime, isMwm) {
        if ($rootScope.initialInfo.authenticated) {
            timebridgeService.loadTimebridgeEvents(angular.toJson(startTime), angular.toJson(endTime)).success(function (data, status, headers, config) {
                if (isMwm) {
                    _addMwmTimebridgeEventsIntoCalendar(data)
                } else {
                    _addTimebridgeEventsIntoCalendar(data)
                }
            }).error(function (data, status, headers, config) {
                $scope.$emit("showDataNotificationOnHomePage", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "Error:",
                    dataBody: "Failed to load Timebridge events."
                })
            })
        }
    };
    var loadOutlookEvents = function (startTime, endTime, currentTimeZone) {
        if ($rootScope.initialInfo.authenticated && $scope.initialInfo.calendarType == TBConst.calendar.outlookCalendarType) {
            uiCalendarConfig.calendars.myCalendar.fullCalendar("removeEvents");
            $scope.$emit("eventsLoading", true);
            var outlookDomain = $scope.initialInfo.outlookDomain;
            var tbSessionId = $scope.initialInfo.tbSessionId;
            var start = moment(startTime.format(moment.ISO_8601())).tz(CalendarConst.utc).format(TBConst.outlook.timeFormat);
            var end = moment(endTime.format(moment.ISO_8601())).tz(CalendarConst.utc).format(TBConst.outlook.timeFormat);
            var userEmail = $scope.initialInfo.emailAddresses[0][0];
            outlookService.getOutlookEvents(outlookDomain, tbSessionId, start, end, userEmail, currentTimeZone).success(function (data, status, headers, config) {
                _addOutlookEventsIntoCalendar(data);
                $scope.$emit("eventsLoading", false)
            }).error(function (data, status, headers, config) {
                $scope.$emit("showDataNotificationOnHomePage", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "Timebridge Connector:",
                    dataBody: "Can not connect to Timebridge Connector or can not get Outlook events."
                });
                $scope.$emit("eventsLoading", false)
            })
        }
    };
    var storeUserOutlookAvailability = function (startTime, endTime, currentTimeZone) {
        if ($rootScope.initialInfo.authenticated && $scope.initialInfo.calendarType == TBConst.calendar.outlookCalendarType) {
            var outlookDomain = $scope.initialInfo.outlookDomain;
            var tbSessionId = $scope.initialInfo.tbSessionId;
            var start = moment(startTime.format(moment.ISO_8601())).tz(CalendarConst.utc).format(TBConst.outlook.timeFormat);
            var end = moment(endTime.format(moment.ISO_8601())).tz(CalendarConst.utc).format(TBConst.outlook.timeFormat);
            var userEmail = $scope.initialInfo.emailAddresses[0][0];
            outlookService.getOutlookEvents(outlookDomain, tbSessionId, start, end, userEmail, currentTimeZone).success(function (data, status, headers, config) {
                outlookService.saveOutlookEventsForMwm(data.items[0].events, currentTimeZone).success(function (data, status, headers, config) {
                    $log.info("Outlook availability successfully stored.")
                }).error(function (data, status, headers, config) {
                    $log.error("Failed to store outlook availability.")
                })
            }).error(function (data, status, headers, config) {
                $scope.$emit("showDataNotificationOnHomePage", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "Timebridge Connector:",
                    dataBody: "Can not connect to Timebridge Connector or can not get Outlook events."
                })
            })
        }
    };
    var loadNewTimebridgeEvents = function () {
        if ($scope.$parent.newEvents.length) {
            $scope.newEvents.events = $scope.$parent.newEvents
        }
    };
    var loadMwmRequestedTimes = function () {
        timebridgeService.getReplyMeetingInfo($routeParams.meetingCode).success(function (data) {
            _addRequestedTimesIntoCalendar(data.meeting.meetingTimes);
            $scope.$emit("mwmRequestedMeetingInfo", data)
        }).error(function (data) {
            $scope.$emit("showDataNotificationOnHomePage", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Error:",
                dataBody: "Failed when loading meeting information"
            })
        })
    };
    $scope.$on("loadMwmRequestedMeetingInfo", function (event, data) {
        _addRequestedTimesIntoCalendar(data.meeting.meetingTimes)
    });
    var _addRequestedTimesIntoCalendar = function (data) {
        $scope.mwmRequestedEvents.events = [];
        angular.forEach(data, function (event, key) {
            $scope.mwmRequestedEvents.events.push({
                start: timeZones.parseMomentAsUTC(event.start),
                end: timeZones.parseMomentAsUTC(event.end),
                title: event.title,
                allDay: event.allDay,
                isMwm: true
            })
        })
    };
    var _addOutlookEventsIntoCalendar = function (data) {
        $scope.outlookEvents.events = [];
        if (data.status.message == TBConst.outlook.connectionStatus) {
            for (var index = 0; index < data.items.length; index++) {
                var events = data.items[index].events;
                for (var i = 0; i < events.length; i++) {
                    var event = events[i];
                    var eventStartTime = moment(event.start + CalendarConst.utcZeroOffset, TBConst.outlook.connectorTimeFormat);
                    var eventEndTime = moment(event.end + CalendarConst.utcZeroOffset, TBConst.outlook.connectorTimeFormat);
                    if (event.start.length <= 8 || event.all_day_event) {
                        $scope.outlookEvents.events.push({start: eventStartTime, title: event.title, allDay: true})
                    } else {
                        $scope.outlookEvents.events.push({start: eventStartTime, end: eventEndTime, title: event.title})
                    }
                }
            }
            uiCalendarConfig.calendars.myCalendar.fullCalendar("addEventSource", $scope.outlookEvents)
        } else {
            $scope.$emit("showDataNotificationOnHomePage", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Outlook:",
                dataBody: data.status.message
            });
            $scope.$emit("eventsLoading", false)
        }
    };
    var _getEventIndex = function (newEventId) {
        var index = null;
        angular.forEach($scope.newEvents.events, function (value, key) {
            if (value._id == newEventId) {
                index = key;
                return true
            }
        });
        return index
    };
    var _updateNewEventsData = function (event) {
        var index = _getEventIndex(event._id);
        $scope.newEvents.events[index].start = moment(event.start.format(moment.ISO_8601())).tz(CalendarConst.utc);
        $scope.newEvents.events[index].end = moment(event.end.format(moment.ISO_8601())).tz(CalendarConst.utc);
        $scope.$emit("updateNewEvents", $scope.newEvents.events)
    };
    var _addTimebridgeEventsIntoCalendar = function (events) {
        $scope.timebridgeEvents.events = [];
        angular.forEach(events, function (tbEvent, key) {
            if (tbEvent.id !== $scope.meetingId) {
                $scope.timebridgeEvents.events.push({
                    start: timeZones.parseMomentAsUTC(tbEvent.start),
                    end: timeZones.parseMomentAsUTC(tbEvent.end),
                    title: tbEvent.title,
                    allDay: tbEvent.allDay,
                    backgroundColor: timeZones.parseMomentAsUTC(tbEvent.end) < self.now ? "#DADADA" : tbEvent.wasConfirmed ? "#00B067" : "#99C901",
                    tbId: tbEvent.id
                })
            }
        })
    };
    var _addMwmTimebridgeEventsIntoCalendar = function (events) {
        $scope.timebridgeEvents.events = [];
        angular.forEach(events, function (tbEvent, key) {
            if (tbEvent.id !== $scope.meetingId) {
                $scope.timebridgeEvents.events.push({
                    start: timeZones.parseMomentAsUTC(tbEvent.start),
                    end: timeZones.parseMomentAsUTC(tbEvent.end),
                    title: tbEvent.title,
                    allDay: tbEvent.allDay,
                    tbId: tbEvent.id
                })
            }
        })
    };
    var _addGoogleEventsIntoCalendar = function (events) {
        $scope.googleEvents.events = [];
        angular.forEach(events, function (event, key) {
            if (event.info === undefined || !event.info.TBMeetingID) {
                $scope.googleEvents.events.push({
                    start: timeZones.parseMomentAsUTC(event.start),
                    end: timeZones.parseMomentAsUTC(event.end),
                    title: event.title,
                    allDay: event.allDay
                })
            }
        })
    };
    var _getBussinesDays = function () {
        var _bussinesDays = [];
        if ($scope.initialInfo.workDays) {
            var workDays = angular.fromJson($scope.initialInfo.workDays);
            angular.forEach(TBConst.days, function (value, key) {
                if (workDays.indexOf(value.key) == -1) {
                    _bussinesDays.push(value.key)
                }
            })
        }
        return _bussinesDays
    };
    var _addPastHours = function (event) {
        var cellClass = ".fc-time-grid-container .fc-today", getHeightCell = $(cellClass).height(), getHours = self.now.hours(), getMinutes = self.now.minutes(), pastTime = 0, pastCellHeight = 0;
        switch (true) {
            case getMinutes < 15:
                getMinutes = 15;
                break;
            case getMinutes > 15 && getMinutes < 30:
                getMinutes = 30;
                break;
            case getMinutes > 30 && getMinutes < 45:
                getMinutes = 45;
                break;
            default:
                getMinutes = 60
        }
        pastTime = (((getHours * 60) + getMinutes) * (100 / 1440)) / 100;
        pastCellHeight = getHeightCell * pastTime;
        $(cellClass).empty();
        $(cellClass).append('<div style="height:' + pastCellHeight + 'px"></div>')
    };
    var _existingStartTime = function (startTime, eventId) {
        var existingStartTime = false;
        angular.forEach($scope.newEvents.events, function (value, key) {
            if (value.start.format(moment.ISO_8601()) == startTime.format(moment.ISO_8601()) && value._id != eventId) {
                existingStartTime = true
            }
        });
        return existingStartTime
    }
});
angular.module("ui.calendar", []).constant("uiCalendarConfig", {calendars: {}}).controller("uiCalendarCtrl", ["$scope", "$timeout", "$locale", function ($scope, $timeout, $locale) {
    var sourceSerialId = 1, eventSerialId = 1, sources = $scope.eventSources, extraEventSignature = $scope.calendarWatchEvent ? $scope.calendarWatchEvent : angular.noop, wrapFunctionWithScopeApply = function (functionToWrap) {
        var wrapper;
        if (functionToWrap) {
            wrapper = function () {
                var args = arguments;
                var _this = this;
                $timeout(function () {
                    functionToWrap.apply(_this, args)
                })
            }
        }
        return wrapper
    };
    this.eventsFingerprint = function (e) {
        if (!e._id) {
            e._id = eventSerialId++
        }
        return "" + e._id + (e.id || "") + (e.title || "") + (e.url || "") + (+e.start || "") + (+e.end || "") + (e.allDay || "") + (e.className || "") + extraEventSignature(e) || ""
    };
    this.sourcesFingerprint = function (source) {
        return source.__id || (source.__id = sourceSerialId++)
    };
    this.allEvents = function () {
        var arraySources = [];
        for (var i = 0, srcLen = sources.length; i < srcLen; i++) {
            var source = sources[i];
            if (angular.isArray(source)) {
                arraySources.push(source)
            } else {
                if (angular.isObject(source) && angular.isArray(source.events)) {
                    var extEvent = {};
                    for (var key in source) {
                        if (key !== "_uiCalId" && key !== "events") {
                            extEvent[key] = source[key]
                        }
                    }
                    for (var eI = 0; eI < source.events.length; eI++) {
                        angular.extend(source.events[eI], extEvent)
                    }
                    arraySources.push(source.events)
                }
            }
        }
        return Array.prototype.concat.apply([], arraySources)
    };
    this.changeWatcher = function (arraySource, tokenFn) {
        var self;
        var getTokens = function () {
            var array = angular.isFunction(arraySource) ? arraySource() : arraySource;
            var result = [], token, el;
            for (var i = 0, n = array.length; i < n; i++) {
                el = array[i];
                token = tokenFn(el);
                map[token] = el;
                result.push(token)
            }
            return result
        };
        var subtractAsSets = function (a, b) {
            var result = [], inB = {}, i, n;
            for (i = 0, n = b.length; i < n; i++) {
                inB[b[i]] = true
            }
            for (i = 0, n = a.length; i < n; i++) {
                if (!inB[a[i]]) {
                    result.push(a[i])
                }
            }
            return result
        };
        var map = {};
        var applyChanges = function (newTokens, oldTokens) {
            var i, n, el, token;
            var replacedTokens = {};
            var removedTokens = subtractAsSets(oldTokens, newTokens);
            for (i = 0, n = removedTokens.length; i < n; i++) {
                var removedToken = removedTokens[i];
                el = map[removedToken];
                delete map[removedToken];
                var newToken = tokenFn(el);
                if (newToken === removedToken) {
                    self.onRemoved(el)
                } else {
                    replacedTokens[newToken] = removedToken;
                    self.onChanged(el)
                }
            }
            var addedTokens = subtractAsSets(newTokens, oldTokens);
            for (i = 0, n = addedTokens.length; i < n; i++) {
                token = addedTokens[i];
                el = map[token];
                if (!replacedTokens[token]) {
                    self.onAdded(el)
                }
            }
        };
        return self = {
            subscribe: function (scope, onChanged) {
                scope.$watch(getTokens, function (newTokens, oldTokens) {
                    if (!onChanged || onChanged(newTokens, oldTokens) !== false) {
                        applyChanges(newTokens, oldTokens)
                    }
                }, true)
            }, onAdded: angular.noop, onChanged: angular.noop, onRemoved: angular.noop
        }
    };
    this.getFullCalendarConfig = function (calendarSettings, uiCalendarConfig) {
        var config = {};
        angular.extend(config, uiCalendarConfig);
        angular.extend(config, calendarSettings);
        angular.forEach(config, function (value, key) {
            if (typeof value === "function") {
                config[key] = wrapFunctionWithScopeApply(config[key])
            }
        });
        return config
    };
    this.getLocaleConfig = function (fullCalendarConfig) {
        if (!fullCalendarConfig.lang || fullCalendarConfig.useNgLocale) {
            var tValues = function (data) {
                var r, k;
                r = [];
                for (k in data) {
                    r[k] = data[k]
                }
                return r
            };
            var dtf = $locale.DATETIME_FORMATS;
            return {
                monthNames: tValues(dtf.MONTH),
                monthNamesShort: tValues(dtf.SHORTMONTH),
                dayNames: tValues(dtf.DAY),
                dayNamesShort: tValues(dtf.SHORTDAY)
            }
        }
        return {}
    }
}]).directive("uiCalendar", ["uiCalendarConfig", function (uiCalendarConfig) {
    return {
        restrict: "A",
        scope: {eventSources: "=ngModel", calendarWatchEvent: "&"},
        controller: "uiCalendarCtrl",
        link: function (scope, elm, attrs, controller) {
            var sources = scope.eventSources, sourcesChanged = false, calendar, eventSourcesWatcher = controller.changeWatcher(sources, controller.sourcesFingerprint), eventsWatcher = controller.changeWatcher(controller.allEvents, controller.eventsFingerprint), options = null;

            function getOptions() {
                var calendarSettings = attrs.uiCalendar ? scope.$parent.$eval(attrs.uiCalendar) : {}, fullCalendarConfig;
                fullCalendarConfig = controller.getFullCalendarConfig(calendarSettings, uiCalendarConfig);
                var localeFullCalendarConfig = controller.getLocaleConfig(fullCalendarConfig);
                angular.extend(localeFullCalendarConfig, fullCalendarConfig);
                options = {eventSources: sources};
                angular.extend(options, localeFullCalendarConfig);
                options.calendars = null;
                var options2 = {};
                for (var o in options) {
                    if (o !== "eventSources") {
                        options2[o] = options[o]
                    }
                }
                return JSON.stringify(options2)
            }

            scope.destroy = function () {
                if (calendar && calendar.fullCalendar) {
                    calendar.fullCalendar("destroy")
                }
                if (attrs.calendar) {
                    calendar = uiCalendarConfig.calendars[attrs.calendar] = $(elm).html("")
                } else {
                    calendar = $(elm).html("")
                }
            };
            scope.init = function () {
                calendar.fullCalendar(options)
            };
            eventSourcesWatcher.onAdded = function (source) {
                calendar.fullCalendar("addEventSource", source);
                sourcesChanged = true
            };
            eventSourcesWatcher.onRemoved = function (source) {
                calendar.fullCalendar("removeEventSource", source);
                sourcesChanged = true
            };
            eventsWatcher.onAdded = function (event) {
                calendar.fullCalendar("renderEvent", event, true)
            };
            eventsWatcher.onRemoved = function (event) {
                calendar.fullCalendar("removeEvents", function (e) {
                    return e._id === event._id
                })
            };
            eventsWatcher.onChanged = function (event) {
                event._start = $.fullCalendar.moment(event.start);
                event._end = $.fullCalendar.moment(event.end);
                calendar.fullCalendar("updateEvent", event)
            };
            eventSourcesWatcher.subscribe(scope);
            eventsWatcher.subscribe(scope, function (newTokens, oldTokens) {
                if (sourcesChanged === true) {
                    sourcesChanged = false;
                    return false
                }
            });
            scope.$watch(getOptions, function (newO, oldO) {
                scope.destroy();
                scope.init()
            })
        }
    }
}]);
"use strict";
function ReplyController($location, $scope, $routeParams, $mdDialog, $rootScope, $sce, confirmMeetingService, timebridgeService, notifications, meetingPageService) {
    var self = this;
    self.meetingCode = $routeParams.meetingCode;
    self.unknown = "unknown";
    self.yes = "yes";
    self.no = "no";
    self.best = "best";
    $scope.replyPage = "reply";
    $scope.confirmMeetingTimePage = "confirm-meeting-time";
    $scope.editResponsesPage = "update-availability";
    $scope.responses = [{val: "yes", opt: "yes"}, {val: "best", opt: "best"}, {val: "no", opt: "no"}];
    $scope.pageType = $scope.replyPage;
    $scope.dateFormats = DefaultDatetimeFormats;
    $scope.showMap = false;
    $scope.authentificatedUser = $rootScope.initialInfo.authenticated;
    $scope.calendarType = $rootScope.initialInfo.userData.calendarType;
    $scope.calendarStatus = true;
    $scope.loginMessageStatus = true;
    $scope.syncCalendarStatus = false;
    if (!$scope.authentificatedUser) {
        $scope.calendarStatus = false;
        $scope.loginMessageStatus = true;
        $scope.syncCalendarStatus = false
    } else {
        if ($scope.calendarType == 0) {
            $scope.calendarStatus = false;
            $scope.loginMessageStatus = false;
            $scope.syncCalendarStatus = true
        } else {
            if ($scope.authentificatedUser && $scope.calendarType !== 0) {
                $scope.calendarStatus = true;
                $scope.loginMessageStatus = true;
                $scope.syncCalendarStatus = false
            }
        }
    }
    $scope.init = function () {
        timebridgeService.getReplyMeetingInfo(self.meetingCode).success(function (data) {
            if (data.userInfo.preferences.show_help_dialog !== "0") {
                $mdDialog.show({
                    controller: ReplyHelpDialogController,
                    templateUrl: "../../../static/js/app/partials/view/how-to-reply.html",
                    locals: {meetingId: self.meetingId}
                })
            }
            $rootScope.initialInfo.invited = true;
            if (data.userInfo.timeZone) {
                $rootScope.initialInfo.userData.time_zone = data.userInfo.timeZone;
                $scope.$broadcast("updateTimeZone")
            }
            $scope.$watch(function () {
                return $rootScope.initialInfo.userData.time_zone
            }, self.changeTimeZone);
            if (!data.meeting.shouldResponse && !$routeParams.skip_redirect) {
                self.toMeetingPage(data.meeting.id)
            }
            $scope.meeting = data.meeting;
            $scope.user = data.userInfo;
            if ($scope.meeting.isConfirmed) {
                meetingPageService.restrictTimesToConfirmed($scope)
            }
            self.initializeResponses($scope.meeting.meetingTimes, $scope.meeting.attendees, $scope.user.id);
            $scope.meetingMessage = $sce.trustAsHtml($scope.meeting.message);
            var meetingNotes = data.meeting.notes;
            for (var i = 0; i < meetingNotes.length; i++) {
                meetingNotes[i] = $sce.trustAsHtml(meetingNotes[i])
            }
            $scope.meetingNotes = meetingNotes;
            if ($scope.meeting.location.lat != 0) {
                $scope.showMap = true
            }
        }).error(function (data) {
            $location.path("/");
            $location.replace()
        });
        $scope.showclass = "col-md-12";
        $scope.showeventcalendar = false;
        $scope.showlink = true;
        $scope.hidelink = false
    };
    $scope.chooseOptionForTimeslot = function (option_name, index) {
        $scope.meeting.meetingTimes[index].response = option_name
    };
    $scope.optionUnselected = function (option_name, index) {
        return ($scope.meeting.meetingTimes[index].response !== option_name)
    };
    $scope.reply = function () {
        if (!self.responseIsReady($scope.meeting.meetingTimes)) {
            notifications.showNotification($scope, TBConst.notificationStatus.error, "Error:", "You have to reply to all of the meeting times.")
        } else {
            var responses = {};
            var timeSlot;
            for (var i = 0; i < $scope.meeting.meetingTimes.length; i++) {
                timeSlot = $scope.meeting.meetingTimes[i];
                responses[timeSlot.start] = timeSlot.response
            }
            timebridgeService.sendAttendeeReply(self.meetingCode, responses, $rootScope.initialInfo.userData.time_zone, "").success(function (data) {
                self.toMeetingPage(data.meetingId)
            }).error(function (data) {
                notifications.showNotification($scope, TBConst.notificationStatus.error, data)
            })
        }
    };
    self.responseIsReady = function (meetingTimes) {
        var response, someSlotsUnfilled = false, positiveResponse = false;
        for (var i = 0; i < meetingTimes.length; i++) {
            response = meetingTimes[i].response;
            if (response === self.unknown) {
                someSlotsUnfilled = true
            } else {
                if (response == self.yes || response == self.best) {
                    positiveResponse = true
                }
            }
        }
        return meetingTimes.length >= 2 ? !someSlotsUnfilled : positiveResponse || !someSlotsUnfilled
    };
    self.initializeResponses = function (meetingTimes, attendees, userId) {
        var currUserAvailability = attendees.filter(function (attendee) {
            return attendee.id === userId
        }).pop().availability;
        for (var i = 0; i < meetingTimes.length; i++) {
            meetingTimes[i].response = currUserAvailability[i]
        }
    };
    self.toMeetingPage = function (meetingId) {
        $location.path("/meeting/" + meetingId);
        $location.replace()
    };
    self.changeTimeZone = function (newTimezone, oldTimezone) {
        if (oldTimezone && newTimezone !== oldTimezone) {
            confirmMeetingService.changeTimezone($scope.meeting.meetingTimes, oldTimezone, newTimezone)
        }
    };
    $scope.showCalendarView = function (start) {
        $scope.$broadcast("showEvent", start)
    };
    $scope.showEventCalendar = function () {
        $scope.showclass = "col-md-9";
        $scope.showeventcalendar = true;
        $scope.showlink = false;
        $scope.hidelink = true
    };
    $scope.hideEventCalendar = function () {
        $scope.showclass = "col-md-12";
        $scope.showeventcalendar = false;
        $scope.showlink = true;
        $scope.hidelink = false
    }
}
"use strict";
function ConfirmMeetingTimeController($scope, $location, $routeParams, $rootScope, $mdDialog, authenticated, confirmMeetingService, timebridgeService) {
    var self = this;
    self.meetingId = $routeParams.meetingId;
    $scope.replyPage = "reply";
    $scope.confirmMeetingTimePage = "confirm-meeting-time";
    $scope.editResponsesPage = "update-availability";
    $scope.pageType = $scope.confirmMeetingTimePage;
    $scope.dateFormats = DefaultDatetimeFormats;
    $scope.init = function () {
        if (!authenticated) {
            $location.path("/");
            $location.replace()
        } else {
            timebridgeService.getConfirmTimeMeetingInfo(self.meetingId).success(function (data) {
                $scope.meeting = data
            })
        }
    };
    $scope.backToMeetingPage = function () {
        $location.path("/meeting/" + self.meetingId)
    };
    $scope.$watch(function () {
        return $rootScope.initialInfo.userData.time_zone
    }, function (newTimezone, oldTimezone) {
        if (newTimezone !== oldTimezone) {
            confirmMeetingService.changeTimezone($scope.meeting.meetingTimes, oldTimezone, newTimezone)
        }
    });
    $scope.showConfirmationMessage = function (confirmedTime) {
        $mdDialog.show({
            controller: ConfirmMeetingDialogController,
            templateUrl: "../../../static/js/app/partials/view/show-confirmation-message.html",
            locals: {meetingId: self.meetingId, confirmedTime: confirmedTime}
        })
    }
}
"use strict";
function UpdateAvailabilityController($scope, $location, $routeParams, $rootScope, authenticated, confirmMeetingService, timebridgeService) {
    var self = this;
    self.meetingId = $routeParams.meetingId;
    $scope.replyPage = "reply";
    $scope.confirmMeetingTimePage = "confirm-meeting-time";
    $scope.editResponsesPage = "update-availability";
    $scope.pageType = $scope.editResponsesPage;
    $scope.responses = [{val: "yes", opt: "yes"}, {val: "best", opt: "best"}, {val: "no", opt: "no"}];
    $scope.dateFormats = DefaultDatetimeFormats;
    $scope.authentificatedUser = $rootScope.initialInfo.authenticated;
    $scope.calendarType = $rootScope.initialInfo.userData.calendarType;
    $scope.calendarStatus = true;
    $scope.loginMessageStatus = true;
    $scope.syncCalendarStatus = false;
    if ($scope.calendarType == 0) {
        $scope.calendarStatus = false;
        $scope.loginMessageStatus = false;
        $scope.syncCalendarStatus = true
    } else {
        if (!$scope.authentificatedUser) {
            $scope.calendarStatus = false;
            $scope.loginMessageStatus = true;
            $scope.syncCalendarStatus = false
        } else {
            if ($scope.authentificatedUser && $scope.calendarType !== 0) {
                $scope.calendarStatus = true;
                $scope.loginMessageStatus = false;
                $scope.syncCalendarStatus = false
            }
        }
    }
    $scope.init = function () {
        if (!authenticated) {
            $location.path("/");
            $location.replace()
        } else {
            timebridgeService.getUpdateAvailabilityInfo(self.meetingId).success(function (data) {
                $scope.meeting = data;
                if ($scope.meeting.isConfirmed) {
                    $scope.meeting.meetingTimes = confirmMeetingService.restrictTimesToConfirmed($scope.meeting.meetingTimes, $scope.meeting.attendees)
                }
            });
            $scope.showclass = "col-md-12";
            $scope.showeventcalendar = false;
            $scope.showlink = true;
            $scope.hidelink = false
        }
    };
    $scope.backToMeetingPage = function () {
        $location.path("/meeting/" + self.meetingId)
    };
    $scope.update = function () {
        var availabilityData = _availabilityData();
        if (!availabilityData[1].length) {
            timebridgeService.submitUpdateAvailability(self.meetingId, availabilityData[0], $rootScope.initialInfo.userData.time_zone).success(function () {
                $scope.backToMeetingPage()
            }).error(function () {
                $scope.backToMeetingPage()
            })
        } else {
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Error:",
                dataBody: "Please edit all of the proposed meeting times for attendee: " + availabilityData[1]
            })
        }
    };
    $scope.$watch(function () {
        return $rootScope.initialInfo.userData.time_zone
    }, function (newTimezone, oldTimezone) {
        if (newTimezone !== oldTimezone) {
            confirmMeetingService.changeTimezone($scope.meeting.meetingTimes, oldTimezone, newTimezone)
        }
    });
    function _availabilityData() {
        var i, j, availabilityObj, attendeeResponses = {};
        var unfinishedUserEdit = "";
        for (i = 0; i < $scope.meeting.attendees.length; i++) {
            availabilityObj = {};
            for (j = 0; j < $scope.meeting.meetingTimes.length; j++) {
                if ($scope.meeting.attendees[i].availability[j] !== "unknown") {
                    availabilityObj[$scope.meeting.meetingTimes[j].start] = $scope.meeting.attendees[i].availability[j]
                }
            }
            if (Object.keys(availabilityObj).length == $scope.meeting.meetingTimes.length) {
                attendeeResponses[$scope.meeting.attendees[i].id] = availabilityObj
            } else {
                if (Object.keys(availabilityObj).length > 0 && Object.keys(availabilityObj).length < $scope.meeting.meetingTimes.length) {
                    unfinishedUserEdit = $scope.meeting.attendees[i].email
                }
            }
        }
        return [attendeeResponses, unfinishedUserEdit]
    }

    $scope.showCalendarView = function (start) {
        $scope.$broadcast("showEvent", start)
    };
    $scope.showEventCalendar = function () {
        $scope.showclass = "col-md-9";
        $scope.showeventcalendar = true;
        $scope.showlink = false;
        $scope.hidelink = true
    };
    $scope.hideEventCalendar = function () {
        $scope.showclass = "col-md-12";
        $scope.showeventcalendar = false;
        $scope.showlink = true;
        $scope.hidelink = false
    }
}
"use strict";
var ConfirmMeetingService = angular.module("confirmMeetingServices", []);
ConfirmMeetingService.service("confirmMeetingService", function confirmMeetingService(timeZones) {
    function changeTimezone(timeList, oldTimezone, newTimezone) {
        for (var i = 0; i < timeList.length; i++) {
            timeList[i].start = timeZones.convertToTimeZone(timeList[i].start, oldTimezone, newTimezone);
            timeList[i].end = timeZones.convertToTimeZone(timeList[i].end, oldTimezone, newTimezone)
        }
    }

    function restrictTimesToConfirmed(meetingTimes, meetingAttendees) {
        for (var i = 0; i < meetingTimes.length; i++) {
            if (meetingTimes[i].confirmed) {
                for (var j = 0; j < meetingAttendees.length; j++) {
                    meetingAttendees[j].availability = [meetingAttendees[j].availability[i]]
                }
            }
        }
        return meetingTimes.filter(function (val) {
            return val.confirmed
        })
    }

    return {changeTimezone: changeTimezone, restrictTimesToConfirmed: restrictTimesToConfirmed}
});
var headerController = angular.module("headerController", []);
headerController.controller("HeaderController", function ($scope, $rootScope, $mdDialog, timebridgeService, $location, tbAuth) {
    $scope.init = function () {
        $scope.rootScope = $rootScope;
        tbAuth.authenticationStatus().then(function () {
            if ($scope.rootScope.initialInfo.authenticated) {
                window.Intercom("boot", {
                    app_id: intercomAppId,
                    name: $rootScope.initialInfo.userData.firstName + " " + $rootScope.initialInfo.userData.lastName,
                    email: $rootScope.initialInfo.userData.emailAddresses[0][0],
                    user_id: $rootScope.initialInfo.userData.userId
                });
                window.Intercom("update")
            }
        })
    };
    $scope.signOut = function () {
        timebridgeService.logout()
    };
    $scope.showAuthModal = function () {
        $mdDialog.show({
            controller: HandleDialogController,
            templateUrl: "../../../static/js/app/partials/view/login-popup.html",
            locals: {showSignUp: false, message: ""}
        });
        $scope.showLoginModal = true;
        $scope.isLogin = true
    };
    $scope.$on("$locationChangeStart", function (event, next, current) {
        $scope.showSchedule = $location.path() === "/home"
    })
});
"use strict";
function HomePageController($scope, $rootScope, $routeParams, $timeout, $mdDialog, $cookies, $location, authenticated, timeZones, timebridgeService, notifications) {
    var _proposeEventsCount = 5;
    $scope.homePage = "home";
    $scope.changeTimesPage = "change-proposed-times";
    $scope.rescheduleMeetingPage = "reschedule-meeting";
    $scope.conditions = TBConst.conditions;
    $scope.init = function () {
        $scope.allDay = "btn-active";
        $scope.bussinesDay = "btn-default";
        $scope.showCalendar = true;
        $scope.eventsLoaded = false;
        $scope.proposeEventsCount = _proposeEventsCount;
        $scope.pageType = $scope.homePage;
        $scope.dateFormat = "M/D";
        $scope.newEvents = [];
        $scope.options = {};
        _checkMessages();
        timeZones.initTimeZoneData().then(function () {
            $scope.currDate = timeZones.currTimeForCalendar($rootScope.initialInfo.userData.time_zone);
            $scope.tickInterval = 1000;
            $timeout(tick, $scope.tickInterval)
        });
        if (!authenticated) {
            $mdDialog.show({
                controller: HandleDialogController,
                templateUrl: "../../../static/js/app/partials/view/login-popup.html",
                locals: {showSignUp: $routeParams.signup, message: ""}
            })
        } else {
            var redirectUrl = timebridgeService.getRedirectUrl();
            if (redirectUrl) {
                $location.path(redirectUrl)
            } else {
                if ($rootScope.initialInfo.userData.dateFormat == ViewDateFormat[1].viewFormat) {
                    $scope.dateFormat = "D/M"
                }
                if (!$cookies.messageAboutCalendars && $rootScope.initialInfo.userData.calendarType == TBConst.calendar.noConnectedCalendars) {
                    $cookies.messageAboutCalendars = true;
                    $mdDialog.show({
                        controller: HandleDialogController,
                        templateUrl: "../../../static/js/app/partials/view/welcome.html",
                        locals: {showSignUp: false, message: ""}
                    })
                }
            }
        }
    };
    $scope.ReferenceToSurvey = function () {
        $scope.infoNotification = false
    };
    $scope.clearMeetings = function () {
        $scope.newEvents = [];
        $scope.$broadcast("removeAllNewEvent");
        $scope.$broadcast("removeAllAttendees")
    };
    $scope.removeEvent = function (eventId) {
        $scope.$broadcast("removeEvent", eventId);
        $scope.proposeEventsCount = _proposeEventsCount - $scope.newEvents.length
    };
    $scope.bussinesDayView = function () {
        $scope.allDay = "btn-default";
        $scope.bussinesDay = "btn-active";
        $scope.$broadcast("bussinesDayView")
    };
    $scope.allDayView = function () {
        $scope.allDay = "btn-active";
        $scope.bussinesDay = "btn-default";
        $scope.$broadcast("allDayView")
    };
    $scope.goToSendMeetingInvitation = function () {
        if ($scope.newEvents.length) {
            $scope.showCalendar = false;
            $scope.$broadcast("hideDataNotification");
            if (authenticated) {
                timebridgeService.loadAccountSettings().success(function (data, status, headers, config) {
                    if (data.auto_confirm_meeting) {
                        $scope.options.autoConfirmMeeting = angular.fromJson(data.auto_confirm_meeting)
                    }
                    if (data.cc_myself_invitation) {
                        $scope.options.ccMySelfInvitation = angular.fromJson(data.cc_myself_invitation)
                    }
                    if (data.meeting_reminder) {
                        $scope.options.meetingReminder = angular.fromJson(data.meeting_reminder);
                        if (data.meeting_reminder_time) {
                            $scope.options.meetingReminderTime = angular.fromJson(data.meeting_reminder_time)
                        }
                    }
                }).error(function (data, status, headers, config) {
                    $scope.$broadcast("showDataNotification", {
                        dataType: TBConst.notificationStatus.error,
                        dataTitle: "Error:",
                        dataBody: "Failed to load account settings."
                    })
                })
            }
        } else {
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.info,
                dataTitle: "Meeting time:",
                dataBody: "Select up to 5 more times on the calendar."
            })
        }
    };
    $scope.goToScheduleMeeting = function () {
        $scope.showCalendar = true
    };
    $scope.$on("updateNewEvents", function (event, data) {
        $scope.newEvents = data;
        $scope.proposeEventsCount = _proposeEventsCount - $scope.newEvents.length
    });
    $scope.$on("eventsLoading", function (event, value) {
        $scope.eventsLoaded = value
    });
    $scope.$on("showDataNotificationOnHomePage", function (event, value) {
        $scope.$broadcast("showDataNotification", {
            dataType: value.dataType,
            dataTitle: value.dataTitle,
            dataBody: value.dataBody
        })
    });
    $scope.$on("hideDataNotificationOnHomePage", function (event, value) {
        $scope.$broadcast("hideDataNotification")
    });
    $scope.status = {isopen: true};
    $scope.toggleDropdown = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.status.isopen = !$scope.status.isopen
    };
    $scope.reminderCondition = {operator: "15 minutes before meeting"};
    $scope.selectAttendees = function () {
        $mdDialog.show({
            controller: HandleEmailAttendeesController,
            templateUrl: "../../../static/js/app/partials/view/select-attendees.html",
            locals: {meetingId: self.meetingId}
        })
    };
    var tick = function () {
        $scope.currDate = timeZones.currTimeForCalendar($rootScope.initialInfo.userData.time_zone);
        $timeout(tick, $scope.tickInterval)
    };

    function _checkMessages() {
        timebridgeService.getStatusMessages().success(function (data) {
            notifications.showNotificationsFromResponse($scope, data)
        })
    }
}
angular.module("sendInvitation", []).controller("SendMeetingInvitationController", function ($scope, $rootScope, $routeParams, $http, $location, $mdDialog, timeZones, timebridgeService, $window) {
    $window.scrollTo(0, 0);
    $scope.querySearch = querySearch;
    $scope.selectedItemChange = selectedItemChange;
    $scope.searchText = "";
    $scope.userLocations = [];
    $scope.disableSendButton = false;
    var map;
    $scope.init = function () {
        $scope.newEvents = $scope.$parent.$parent.$parent.newEvents;
        var userName = $rootScope.initialInfo.userData.firstName ? $rootScope.initialInfo.userData.firstName : "";
        if (!$scope.options.meetingMessage) {
            $scope.options.meetingMessage = 'Please click the "Reply Now" button to let me know which times work best for you.\n\nThanks!\n' + userName
        }
        $scope.setAudioConferenceInfo = setAudioConferenceInfo;
        if (!$scope.options.audioConference) {
            $scope.options.audioConference = {}
        }
        $scope.address = {components: {location: {latitude: undefined, longitude: undefined}}};
        if ($routeParams.title) {
            $scope.options.meetingTitle = $routeParams.title
        }
        if ($routeParams.message) {
            $scope.options.meetingMessage = $routeParams.message
        }
        if ($routeParams.location) {
            $scope.options.locationInfo = $routeParams.location
        }
        if (!$scope.options.showMap) {
            $scope.options.showMap = false
        }
        if ($rootScope.rescheduleMeeting) {
            var rescheduleMeetingInfo = $rootScope.rescheduleMeeting;
            $scope.options.meetingTitle = rescheduleMeetingInfo.title;
            $scope.options.meetingMessage = rescheduleMeetingInfo.message.replace(/<br \/>/g, "\n");
            $scope.options.locationInfo = rescheduleMeetingInfo.location.comment;
            $scope.options.customInfo = rescheduleMeetingInfo.custommeeting;
            if (rescheduleMeetingInfo.callin.number || rescheduleMeetingInfo.callin.organizercode || rescheduleMeetingInfo.callin.participantcode) {
                $scope.options.audioConference.use = true;
                setAudioConferenceInfo()
            }
            delete $rootScope.rescheduleMeeting
        }
        if ($rootScope.initialInfo.authenticated) {
            getUserLocations()
        }
        $scope.$on("mapInitialized", function (event, newMap) {
            map = newMap;
            if (newMap.center.J == 0) {
                $scope.meetingLocation = "current-location";
                $scope.markerLocation = "current-location"
            }
            _checkMapUndefined(newMap)
        })
    };
    $scope.sendMeetingInvitation = function () {
        if (!$rootScope.initialInfo.authenticated) {
            $mdDialog.show({
                controller: HandleDialogController,
                templateUrl: "../../../static/js/app/partials/view/login-popup.html",
                locals: {showSignUp: $routeParams.signup, message: ""}
            })
        } else {
            if (!$scope.options.meetingTitle) {
                $scope.$emit("showDataNotificationOnHomePage", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "Meeting topic required:",
                    dataBody: "Please add meeting topic."
                })
            } else {
                if (!$rootScope.attendees || !$rootScope.attendees.length) {
                    $scope.$emit("showDataNotificationOnHomePage", {
                        dataType: TBConst.notificationStatus.error,
                        dataTitle: "Attendees required:",
                        dataBody: "Please add attendees to your meeting."
                    })
                } else {
                    _updateMapParameters();
                    $scope.disableSendButton = true;
                    $http.post("meeting/create", {
                        topic: $scope.options.meetingTitle,
                        message: $scope.options.meetingMessage,
                        times: formatMeetingTimes($scope.newEvents),
                        tzid: $rootScope.initialInfo.userData.time_zone,
                        attendees: $rootScope.attendees,
                        options: $scope.options,
                        useAudioConference: $scope.options.audioConference.use
                    }).success(function (data, status, headers, config) {
                        $rootScope.attendees = [];
                        $location.path("/meetings")
                    }).error(function (data, status, headers, config) {
                        $scope.disableSendButton = false;
                        $scope.$emit("showDataNotificationOnHomePage", {
                            dataType: TBConst.notificationStatus.error,
                            dataTitle: "Error:",
                            dataBody: data
                        })
                    })
                }
            }
        }
    };
    $scope.rescheduleMeeting = function () {
        if (!$rootScope.initialInfo.authenticated) {
            $mdDialog.show({
                controller: HandleDialogController,
                templateUrl: "../../../static/js/app/partials/view/login-popup.html",
                locals: {showSignUp: $routeParams.signup, message: ""}
            })
        } else {
            if (!$scope.options.meetingTitle) {
                $scope.$emit("showDataNotificationOnHomePage", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "Meeting topic required:",
                    dataBody: "Please add meeting topic."
                })
            } else {
                if (!$rootScope.attendees || !$rootScope.attendees.length) {
                    $scope.$emit("showDataNotificationOnHomePage", {
                        dataType: TBConst.notificationStatus.error,
                        dataTitle: "Attendees required:",
                        dataBody: "Please add attendees to your meeting."
                    })
                } else {
                    if (!$routeParams.meetingId) {
                        $scope.$emit("showDataNotificationOnHomePage", {
                            dataType: TBConst.notificationStatus.error,
                            dataTitle: "Error: ",
                            dataBody: "Invalid meeting ID."
                        })
                    } else {
                        _updateMapParameters();
                        $http.put("meeting/create", {
                            meetingId: $routeParams.meetingId,
                            topic: $scope.options.meetingTitle,
                            message: $scope.options.meetingMessage,
                            times: formatMeetingTimes($scope.newEvents),
                            tzid: $rootScope.initialInfo.userData.time_zone,
                            attendees: $rootScope.attendees,
                            options: $scope.options,
                            useAudioConference: $scope.options.audioConference.use
                        }).success(function (data, status, headers, config) {
                            $rootScope.attendees = [];
                            $location.path("/meetings")
                        }).error(function (data, status, headers, config) {
                            $scope.$emit("showDataNotificationOnHomePage", {
                                dataType: TBConst.notificationStatus.error,
                                dataTitle: "Error:",
                                dataBody: data
                            })
                        })
                    }
                }
            }
        }
    };
    $scope.updateMap = function () {
        _updateMap()
    };
    $scope.handleLocationInfomodel = function (data) {
        $scope.options.locationInfo = data
    };
    $scope.$watch("options.locationInfo", function () {
        _updateMap();
        $scope.searchText = $scope.options.locationInfo
    }, true);
    var formatMeetingTimes = function (fullCalendarEvents) {
        var i, times = [];
        for (i = 0; i < fullCalendarEvents.length; i++) {
            times.push({
                start: moment(fullCalendarEvents[i].start).format(timeZones.rfc3339),
                end: moment(fullCalendarEvents[i].end).format(timeZones.rfc3339)
            })
        }
        return times
    };
    var setAudioConferenceInfo = function () {
        if (!$scope.options.audioConference.number || !$scope.options.audioConference.accessCode) {
            timebridgeService.getUserCallInfo().success(function (data) {
                $scope.options.audioConference.number = data.number;
                $scope.options.audioConference.accessCode = data.participantcode
            })
        }
    };
    var _updateMapParameters = function () {
        _checkMapUndefined(map);
        if ($scope.meetingLocation == "current-location" || !$scope.options.showMap) {
            $scope.address.components.location.latitude = 0;
            $scope.address.components.location.longitude = 0
        }
        $scope.options.additionalLocation = $scope.address.components.location
    };
    var _updateMap = function () {
        $scope.meetingLocation = $scope.options.locationInfo;
        $scope.markerLocation = $scope.options.locationInfo
    };
    var _checkMapUndefined = function (map) {
        var coordKeys = [];
        if (map != undefined) {
            for (var coord in map.center) {
                if (map.center.hasOwnProperty(coord)) {
                    coordKeys.push(coord)
                }
            }
            $scope.address.components.location.latitude = map.center[coordKeys[0]];
            $scope.address.components.location.longitude = map.center[coordKeys[1]]
        }
    };

    function querySearch(query) {
        var results = query ? $scope.userLocations.filter(createFilterFor(query)) : $scope.userLocations, deferred;
        if ($scope.simulateQuery) {
            deferred = $q.defer();
            $timeout(function () {
                deferred.resolve(results)
            }, Math.random() * 1000, false);
            return deferred.promise
        } else {
            return results
        }
    }

    function selectedItemChange(item) {
        $scope.options.locationInfo = item.location
    }

    function createFilterFor(query) {
        var lowercaseQuery = angular.lowercase(query);
        return function filterFn(item) {
            if (angular.lowercase(item.location).indexOf(lowercaseQuery) >= 0) {
                return true
            } else {
                return false
            }
        }
    }

    function getUserLocations() {
        timebridgeService.loadUserLocations().success(function (data) {
            angular.forEach(data, function (value, key) {
                $scope.userLocations.push({location: value.comment})
            })
        }).error(function (data) {
            $scope.$emit("showDataNotificationOnHomePage", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Timebridge contacts:",
                dataBody: "Can not load Timebridge contacts."
            })
        })
    }
});
"use strict";
function MeetingPageController($scope, $location, $routeParams, $sce, $rootScope, authenticated, $mdDialog, timebridgeService, notifications, meetingPageService) {
    var self = this;
    self.meetingId = $routeParams.meetingId;
    $scope.dateFormats = DefaultDatetimeFormats;
    $scope.init = function () {
        if (!authenticated && !$rootScope.initialInfo.invited) {
            $location.path("/");
            $location.replace()
        } else {
            timebridgeService.getMeetingInfo(self.meetingId).success(function (data) {
                if (data.meetingInfo.shouldResponse) {
                    $location.path("/reply/" + data.meetingInfo.fqcode);
                    $location.replace()
                } else {
                    if (data.meetingInfo.shouldConfirm) {
                        $location.path("/confirm-meeting-time/" + data.meetingInfo.id);
                        $location.replace()
                    }
                }
                _handleParams();
                $scope.meeting = data.meetingInfo;
                $scope.meetingMessage = $sce.trustAsHtml($scope.meeting.message);
                $scope.user = data.userInfo;
                $scope.showMap = false;
                var meetingNotes = data.meetingInfo.notes;
                for (var i = 0; i < meetingNotes.length; i++) {
                    meetingNotes[i] = $sce.trustAsHtml(meetingNotes[i])
                }
                $scope.meetingNotes = meetingNotes;
                if ($scope.meeting.isConfirmed) {
                    meetingPageService.restrictTimesToConfirmed($scope)
                }
                notifications.showNotificationsFromResponse($scope, data);
                $scope.meetingMenuVersion = meetingMenuVersion;
                $scope.downloadToCalendarVisible = (data.meetingInfo.status === "Confirmed" && $rootScope.initialInfo.userData.calendarType === 0);
                if ($routeParams.download_to_calendar) {
                    $scope.showDownloadToCalendar()
                }
                if ($scope.meeting.location.lat != 0) {
                    $scope.showMap = true
                }
            });
            if ($rootScope.initialInfo.userData.dateFormat == ViewDateFormat[1].viewFormat) {
                $scope.dateFormat = "EEEE, d/M h:mm a"
            } else {
                $scope.dateFormat = "EEEE, M/d h:mm a"
            }
        }
    };
    $scope.remindAttendees = function () {
        timebridgeService.sendRemindAttendees(self.meetingId).success(function (data) {
            notifications.showNotification($scope, TBConst.notificationStatus.success, "Success:", data)
        }).error(function (data) {
            notifications.showNotification($scope, TBConst.notificationStatus.error, "Error:", data)
        })
    };
    $scope.snoozeStatusEmail = function (delay) {
        if (delay === undefined) {
            delay = 24
        }
        timebridgeService.sendSnoozeStatusEmail(self.meetingId, delay).success(function (data) {
            notifications.showNotification($scope, TBConst.notificationStatus.success, "Success:", data)
        }).error(function (data) {
            notifications.showNotification($scope, TBConst.notificationStatus.error, "Error:", data)
        })
    };
    $scope.showCancel = function () {
        $mdDialog.show({
            controller: HandleCancelMeetingController,
            templateUrl: "../../../static/js/app/partials/view/cancel-meeting.html",
            scope: $scope,
            preserveScope: true
        })
    };
    $scope.showEditMeeting = function () {
        $mdDialog.show({
            controller: EditMeetingDialogController,
            templateUrl: "../../../static/js/app/partials/view/edit-meeting.html",
            scope: $scope,
            preserveScope: true
        })
    };
    $scope.inviteAttendees = function () {
        $mdDialog.show({
            controller: InviteAttendeesDialogController,
            templateUrl: "../../../static/js/app/partials/view/invite-attendees.html",
            locals: {meetingId: self.meetingId}
        })
    };
    $scope.removeAttendees = function () {
        $mdDialog.show({
            controller: RemoveAttendeesDialogController,
            templateUrl: "../../../static/js/app/partials/view/remove-attendees.html",
            scope: $scope,
            preserveScope: true
        })
    };
    $scope.showEmailAttendees = function () {
        $mdDialog.show({
            controller: HandleEmailAttendeesController,
            templateUrl: "../../../static/js/app/partials/view/email-attendees.html",
            locals: {meetingId: self.meetingId}
        })
    };
    $scope.showDownloadToCalendar = function () {
        $mdDialog.show({
            controller: function ($scope, $mdDialog, $window, meetingId) {
                $scope.hide = function () {
                    $mdDialog.hide()
                };
                $scope.downloadToCalendar = function (calendarType) {
                    $window.open("/meeting/send-to-calendar/" + meetingId + "?calendar_type=" + calendarType);
                    $scope.hide()
                }
            },
            templateUrl: "../../../static/js/app/partials/view/download-to-calendar.html",
            locals: {meetingId: self.meetingId}
        })
    };
    function meetingMenuVersion() {
        switch ($scope.meeting.status) {
            case"Confirmed":
                return $scope.user.isOrganizer ? "confirmedMenu" : "attendeeMenu";
                break;
            case"Deadlocked":
            case"Need Info":
            case"Proposed":
            case"RSVP":
                return $scope.user.isOrganizer ? "fullMenu" : "attendeeMenu";
                break;
            default:
                return undefined
        }
    }

    function _handleParams() {
        if ($routeParams.send_reminders) {
            $scope.remindAttendees()
        }
        if ($routeParams.rsvp_delay) {
            $scope.snoozeStatusEmail($routeParams.rsvp_delay)
        }
    }
}
"use strict";
var MeetingPageService = angular.module("meetingPageServices", []);
MeetingPageService.service("meetingPageService", function meetingPageService(timeZones) {
    function restrictTimesToConfirmed(scope) {
        for (var i = 0; i < scope.meeting.meetingTimes.length; i++) {
            if (scope.meeting.meetingTimes[i].confirmed) {
                for (var j = 0; j < scope.meeting.attendees.length; j++) {
                    scope.meeting.attendees[j].availability = [scope.meeting.attendees[j].availability[i]]
                }
            }
        }
        scope.meeting.meetingTimes = scope.meeting.meetingTimes.filter(function (val) {
            return val.confirmed
        })
    }

    return {restrictTimesToConfirmed: restrictTimesToConfirmed}
});
function EditMeetingDialogController($scope, $rootScope, $routeParams, $mdDialog, $window, timebridgeService) {
    $scope.querySearch = querySearch;
    $scope.selectedItemChange = selectedItemChange;
    $scope.searchText = "";
    $scope.editedUserLocations = [];
    var map;
    $scope.init = function () {
        $scope.editedMeetingInfo = {};
        $scope.editedMeetingInfo.meetingId = $routeParams.meetingId;
        $scope.editedMeetingInfo.meetingTitle = $scope.meeting.title;
        $scope.editedMeetingInfo.meetingMessage = (String($scope.meetingMessage)).replace(/\<br \/>/g, " ");
        $scope.editedMeetingInfo.meetingLocation = {};
        $scope.editedMeetingInfo.meetingLocation.comment = angular.copy($scope.meeting.location.comment);
        $scope.editedMeetingInfo.meetingCustom = $scope.meeting.custommeeting;
        $scope.editedMeetingInfo.meetingNotes = [];
        $scope.editedMeetingInfo.audioConference = angular.copy($scope.meeting.callin);
        $scope.editedMeetingInfo.sendNotification = false;
        $scope.editedMeetingShowMap = angular.copy($scope.showMap);
        $scope.editedAddress = {components: {location: {latitude: 0, longitude: 0}}};
        $scope.editedAudioConference = false;
        $scope.titleErrorMessage = "";
        if ($scope.editedMeetingInfo.meetingLocation.comment == TBConst.defaultLocationName) {
            $scope.editedMeetingInfo.meetingLocation.comment = ""
        }
        $scope.editedAddress.components.location = $scope.editedMeetingInfo.meetingLocation;
        $scope.$on("mapInitialized", function (event, newMap) {
            map = newMap;
            var coord = new google.maps.LatLng(0, 0);
            if (newMap.center == undefined) {
                newMap.setCenter(coord)
            }
        });
        $scope.searchText = $scope.editedMeetingInfo.meetingLocation.comment;
        if ($scope.editedMeetingInfo.audioConference.number || $scope.editedMeetingInfo.audioConference.participantcode) {
            $scope.editedAudioConference = true
        }
        if ($rootScope.initialInfo.authenticated) {
            getUserLocations()
        }
    };
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.editMeeting = function () {
        checkLocationCustomInforamtion();
        if (!$scope.editedMeetingInfo.meetingTitle) {
            $scope.titleErrorMessage = "Title can't be empty."
        } else {
            timebridgeService.editMeeting($scope.editedMeetingInfo).success(function (data) {
                $mdDialog.hide();
                $scope.meeting.title = $scope.editedMeetingInfo.meetingTitle;
                $scope.meetingMessage = $scope.editedMeetingInfo.meetingMessage;
                $scope.meeting.location.comment = $scope.editedMeetingInfo.meetingLocation.comment;
                $scope.meeting.custommeeting = $scope.editedMeetingInfo.meetingCustom;
                $scope.meeting.callin = $scope.editedMeetingInfo.audioConference;
                $scope.showMap = $scope.editedMeetingShowMap;
                $scope.meetingNotes.push($scope.editedMeetingInfo.meetingNotes)
            }).error(function (data) {
                $scope.formErrorMessage = data
            })
        }
    };
    $scope.updateLocationInput = function () {
        if ($scope.editedMeetingShowMap) {
            $scope.searchText = $scope.editedMeetingInfo.meetingLocation.comment
        } else {
            if (($scope.editedMeetingInfo.meetingLocation.comment).match(/^[0-9]+$/) != null) {
                $scope.editedMeetingInfo.meetingLocation.comment = ""
            }
        }
    };
    $scope.editedSetAudioConferenceInfo = function () {
        if (!$scope.editedAudioConference) {
            timebridgeService.getUserCallInfo().success(function (data) {
                $scope.editedMeetingInfo.audioConference.number = data.number;
                $scope.editedMeetingInfo.audioConference.participantcode = data.participantcode
            })
        }
    };
    $scope.handleEditedLocationInfomodel = function (data) {
        $scope.editedMeetingInfo.meetingLocation.comment = data
    };
    var checkLocationCustomInforamtion = function () {
        if (!$scope.editedMeetingShowMap) {
            $scope.editedAddress.components.location.latitude = 0;
            $scope.editedAddress.components.location.longitude = 0
        } else {
            $scope.editedAddress.components.location.latitude = map.center.J;
            $scope.editedAddress.components.location.longitude = map.center.M
        }
        if ($scope.editedAddress.components.location.latitude == 0) {
            $scope.editedMeetingShowMap = false
        }
        $scope.editedMeetingInfo.meetingLocation = $scope.editedAddress.components.location;
        if (!$scope.editedAudioConference) {
            $scope.editedMeetingInfo.audioConference.number = "";
            $scope.editedMeetingInfo.audioConference.participantcode = ""
        }
    };

    function getUserLocations() {
        timebridgeService.loadUserLocations().success(function (data) {
            angular.forEach(data, function (value, key) {
                $scope.editedUserLocations.push({location: value.comment})
            })
        }).error(function (data) {
            $scope.$emit("showDataNotificationOnHomePage", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Timebridge contacts:",
                dataBody: "Can not load Timebridge contacts."
            })
        })
    }

    function createFilterFor(query) {
        return function filterFn(item) {
            return (angular.lowercase(item.location).indexOf(angular.lowercase(query)) >= 0)
        }
    }

    function querySearch(query) {
        var results = query ? $scope.editedUserLocations.filter(createFilterFor(query)) : $scope.editedUserLocations, deferred;
        if ($scope.simulateQuery) {
            deferred = $q.defer();
            $timeout(function () {
                deferred.resolve(results)
            }, Math.random() * 1000, false);
            return deferred.promise
        } else {
            return results
        }
    }

    function selectedItemChange(item) {
        $scope.editedMeetingInfo.meetingLocation.comment = item.location
    }
}
"use strict";
function MeetingsPageController($scope, $rootScope, $http, $location, authenticated) {
    $scope.current = "current";
    $scope.requested = "requested";
    $scope.archived = "archived";
    $scope.topic = "topic";
    $scope.organizer = "organizer";
    $scope.requester = "requester";
    $scope.dateCreated = "dateCreated";
    $scope.meetingTime = "meetingTime";
    $scope.status = "status";
    $scope.showSpinner = false;
    $scope.init = function () {
        if (!authenticated) {
            $location.path("/");
            $location.replace()
        } else {
            if ($location.search().section) {
                $scope.section = $location.search().section
            } else {
                $scope.section = $scope.current
            }
            $scope.reverse = false;
            $scope.showSpinner = true;
            getMeetings().success(function (data) {
                $scope.showSpinner = false;
                $scope.meetings = data
            }).error(function (data) {
                $scope.showSpinner = false
            });
            if ($rootScope.initialInfo.userData.dateFormat == ViewDateFormat[1].viewFormat) {
                $scope.dateFormat = "d/M/yy h:mm a"
            } else {
                $scope.dateFormat = "M/d/yy h:mm a"
            }
        }
    };
    var getMeetings = function () {
        return $http({
            url: "/meeting/my-meetings",
            method: "GET",
            params: {section: $scope.section}
        }).success(function (data) {
            return data
        }).error(function (data) {
            return data
        })
    };
    $scope.sortingOrderClass = function (columnName) {
        return $scope.reverse && ($scope.orderProp === columnName) ? "dropup" : "dropdown"
    };
    $scope.selectSection = function (sectionName) {
        $scope.section = sectionName;
        $scope.orderProp = "topic";
        $location.search("section", sectionName);
        getMeetings().success(function (data) {
            $scope.meetings = data
        })
    };
    $scope.changeSorting = function (colName) {
        if ($scope.orderProp === colName) {
            $scope.reverse = !$scope.reverse
        } else {
            $scope.orderProp = colName
        }
    }
}
"use strict";
function GroupsPageController($scope, $location, $mdDialog, authenticated, notifications, timebridgeService) {
    $scope.groups = [];
    $scope.groupinfo = {};
    $scope.groupinfo.name = "groupinfo.name";
    $scope.statustime = "statustime";
    $scope.maxGroupsCount = TBConst.maxGroupsCount;
    $scope.init = function () {
        if (authenticated) {
            timebridgeService.getUserGroups().success(function (data, status, headers, config) {
                $scope.groups = data;
                angular.forEach($scope.groups, function (value, key) {
                    value.statustime = _formatDate(value.statustime)
                })
            }).error(function (data, status, headers, config) {
                $scope.$broadcast("showDataNotification", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "Timebridge groups:",
                    dataBody: "Can not load groups."
                })
            })
        } else {
            $location.path("/");
            $location.replace()
        }
    };
    $scope.showCreateNewGroup = function () {
        $mdDialog.show({
            controller: CreateNewGroupDialogController,
            templateUrl: "../../../static/js/app/partials/view/create-group.html"
        })
    };
    $scope.showAddMember = function (groupId) {
        $mdDialog.show({
            controller: AddNewGroupMemberDialogController,
            templateUrl: "../../../static/js/app/partials/view/add-group-member.html",
            groupId: groupId
        })
    };
    $scope.emailGroupMembers = function (groupId) {
        $mdDialog.show({
            controller: EmailGroupMembersDialogController,
            templateUrl: "../../../static/js/app/partials/view/email-group-members.html",
            groupId: groupId
        })
    };
    $scope.meetRightNowGroup = function (groupId) {
        $mdDialog.show({
            controller: MeetRightNowGroupDialogController,
            templateUrl: "../../../static/js/app/partials/view/meet-right-now.html",
            groupId: groupId
        })
    };
    $scope.sortingOrderClass = function (columnName) {
        return $scope.reverse && ($scope.orderProp === columnName) ? "dropup" : "dropdown"
    };
    $scope.changeSorting = function (colName) {
        if ($scope.orderProp === colName) {
            $scope.reverse = !$scope.reverse
        } else {
            $scope.orderProp = colName
        }
    };
    var _formatDate = function (date) {
        return date.substring(0, 8) + "T" + date.substring(8)
    }
}
function CreateNewGroupDialogController($scope, $route, $mdDialog, timebridgeService) {
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.createGroupFormErrors = {required: false, email: false};
    $scope.createNewGroup = function () {
        $scope.createGroupFormErrors.message = false;
        $scope.createGroupFormErrors.required = false;
        $scope.createGroupFormErrors.newMember = false;
        $scope.createGroupFormErrors.invalidEmail = false;
        if (!$scope.$$childTail.attendees.length) {
            $scope.createGroupFormErrors.required = true
        } else {
            if (!$scope.$$childTail.groupName) {
                $scope.createGroupFormErrors.message = true
            } else {
                $scope.createGroupFormErrors.required = false;
                $scope.createGroupFormErrors.email = false;
                var data = {
                    groupName: $scope.$$childTail.groupName,
                    groupMembers: $scope.$$childTail.attendees,
                    groupDescription: $scope.$$childTail.groupDescription
                };
                timebridgeService.createNewGroup(data).success(function (data) {
                    $mdDialog.hide();
                    $route.reload()
                }).error(function (data) {
                    $scope.createGroupFormErrors.newMember = true;
                    $scope.invalidMessage = data
                })
            }
        }
    }
}
"use strict";
function GroupPageController($scope, $rootScope, $routeParams, $location, $mdDialog, authenticated, notifications, timebridgeService) {
    $scope.groupMembers = [];
    $scope.groupId = $routeParams.groupId;
    $scope.firstname = "firstname";
    $scope.lastname = "lastname";
    $scope.email = "email";
    $scope.reverse = false;
    $scope.init = function () {
        if (authenticated) {
            timebridgeService.getGroupMembers($routeParams.groupId).success(function (data, status, headers, config) {
                $scope.groupMembers = data
            }).error(function (data, status, headers, config) {
                $scope.$broadcast("showDataNotification", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "Timebridge contacts:",
                    dataBody: "Can not load contacts."
                })
            });
            timebridgeService.getGroupInfo($routeParams.groupId).success(function (data, status, headers, config) {
                $scope.groupInfo = data
            }).error(function (data, status, headers, config) {
                $scope.$broadcast("showDataNotification", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "Timebridge groups:",
                    dataBody: "Can not load groups."
                })
            })
        } else {
            $location.path("/");
            $location.replace()
        }
    };
    $scope.showEditGroup = function () {
        $mdDialog.show({
            controller: EditGroupDialogController,
            templateUrl: "../../../static/js/app/partials/view/edit-group.html"
        })
    };
    $scope.showDeleteGroup = function () {
        $mdDialog.show({
            controller: DeleteGroupDialogController,
            templateUrl: "../../../static/js/app/partials/view/delete-group.html"
        })
    };
    $scope.showRemoveGroupMember = function (memberId, memberName, memberLastName, memberEmail) {
        $mdDialog.show({
            controller: RemoveGroupMemberDialogController,
            templateUrl: "../../../static/js/app/partials/view/remove-group-member.html",
            memberId: memberId,
            memberName: memberName,
            memberLastName: memberLastName,
            memberEmail: memberEmail,
            groupId: $routeParams.groupId
        })
    };
    $scope.showAddMember = function () {
        $mdDialog.show({
            controller: AddNewGroupMemberDialogController,
            templateUrl: "../../../static/js/app/partials/view/add-group-member.html",
            groupId: $routeParams.groupId
        })
    };
    $scope.emailGroupMembers = function () {
        $mdDialog.show({
            controller: EmailGroupMembersDialogController,
            templateUrl: "../../../static/js/app/partials/view/email-group-members.html",
            groupId: $routeParams.groupId
        })
    };
    $scope.meetRightNowGroup = function () {
        $mdDialog.show({
            controller: MeetRightNowGroupDialogController,
            templateUrl: "../../../static/js/app/partials/view/meet-right-now.html",
            groupId: $routeParams.groupId
        })
    };
    $scope.$watch(function () {
        return $rootScope.removedMember
    }, function () {
        if ($rootScope.removedMember) {
            angular.forEach($scope.groupMembers, function (value, key) {
                if (value.id == $rootScope.removedMember) {
                    $scope.groupMembers.splice(key, 1)
                }
            })
        }
    });
    $scope.sortingOrderClass = function () {
        return ($scope.reverse) ? "dropup" : "dropdown"
    };
    $scope.changeSorting = function () {
        $scope.reverse = ($scope.reverse) ? false : true
    }
}
function EditGroupDialogController($scope, $routeParams, $mdDialog, $window, timebridgeService) {
    $scope.init = function () {
        timebridgeService.getGroupInfo($routeParams.groupId).success(function (data, status, headers, config) {
            $scope.groupInfo = data;
            $scope.groupName = $scope.groupInfo.name;
            $scope.groupDescription = $scope.groupInfo.description
        }).error(function (data, status, headers, config) {
            $scope.$emit("showDataNotificationOnHomePage", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Timebridge contacts:",
                dataBody: "Can not load contacts."
            })
        })
    };
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.editGroupErrors = {required: false, email: false};
    $scope.editGroup = function () {
        $scope.editGroupErrors.message = false;
        $scope.editGroupErrors.message2 = false;
        if (!$scope.$$childTail.groupName) {
            $scope.editGroupErrors.message = true
        } else {
            if (!$scope.$$childTail.groupDescription) {
                $scope.groupDescription = " "
            } else {
                var data = {
                    groupName: $scope.$$childTail.groupName,
                    groupDescription: $scope.$$childTail.groupDescription
                };
                timebridgeService.editGroup($routeParams.groupId, data).success(function (data) {
                    $mdDialog.hide();
                    $window.location.reload()
                }).error(function (data) {
                    $scope.editGroupErrors.message2 = true
                })
            }
        }
    }
}
function DeleteGroupDialogController($scope, $routeParams, $location, $mdDialog, timebridgeService) {
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.init = function () {
        timebridgeService.getGroupInfo($routeParams.groupId).success(function (data, status, headers, config) {
            $scope.groupInfo = data;
            $scope.groupName = $scope.groupInfo.name;
            $scope.groupDescription = $scope.groupInfo.description
        }).error(function (data, status, headers, config) {
            $scope.$emit("showDataNotificationOnHomePage", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Timebridge groups:",
                dataBody: "Can not load group information."
            })
        })
    };
    $scope.deleteGroup = function () {
        timebridgeService.deleteGroup($routeParams.groupId).success(function () {
            $mdDialog.hide();
            $location.path("/groups");
            $location.replace()
        }).error(function () {
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Error:",
                dataBody: "Failed when delete this group."
            });
            $mdDialog.hide()
        })
    }
}
function RemoveGroupMemberDialogController($scope, $rootScope, $routeParams, $route, $mdDialog, timebridgeService, memberId, memberName, memberLastName, memberEmail, groupId) {
    $rootScope.removedMember = null;
    $scope.memberName = memberName;
    $scope.memberLastName = memberLastName;
    $scope.memberEmail = memberEmail;
    $scope.init = function () {
        timebridgeService.getGroupInfo($routeParams.groupId).success(function (data, status, headers, config) {
            $scope.groupInfo = data;
            $scope.groupName = $scope.groupInfo.name
        }).error(function (data, status, headers, config) {
        })
    };
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.removeGroupMemberErrors = {required: false, email: false};
    $scope.removeGroupMember = function () {
        $scope.removeGroupMemberErrors.cannotSentData = false;
        timebridgeService.removeGroupMember(groupId, memberId).success(function (data, status, headers, config) {
            $rootScope.removedMember = memberId;
            $mdDialog.hide()
        }).error(function (data, status, headers, config) {
            $scope.removeGroupMemberErrors.cannotSentData = true
        })
    }
}
function AddNewGroupMemberDialogController($scope, $rootScope, $route, $mdDialog, timebridgeService, groupId) {
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.addGroupMemberErrors = {required: false, email: false};
    $scope.addNewGroupMember = function () {
        $scope.addGroupMemberErrors.required = false;
        $scope.addGroupMemberErrors.invalidEmail = false;
        if (!$scope.$$childTail.attendees.length) {
            $scope.addGroupMemberErrors.required = true
        } else {
            $scope.addGroupMemberErrors.required = false;
            $scope.addGroupMemberErrors.email = false;
            var data = {groupMembers: $scope.$$childTail.attendees};
            timebridgeService.addNewGroupMember(groupId, $scope.$$childTail.attendees).success(function (data) {
                $mdDialog.hide();
                $route.reload()
            }).error(function (data) {
                $scope.addGroupMemberErrors.cannotSentData = true
            })
        }
    }
}
function EmailGroupMembersDialogController($scope, $mdDialog, timebridgeService, groupId) {
    timebridgeService.getGroupMembers(groupId).success(function (data, status, headers, config) {
        $scope.$$childTail.attendees = data
    }).error(function (data, status, headers, config) {
        $scope.$broadcast("showDataNotification", {
            dataType: TBConst.notificationStatus.error,
            dataTitle: "Timebridge groups:",
            dataBody: "Can not load group members."
        })
    });
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.emailGroupMembersErrors = {required: false, email: false};
    $scope.emailGroupMembers = function () {
        $scope.emailGroupMembersErrors.required = false;
        $scope.emailGroupMembersErrors.subject = false;
        $scope.emailGroupMembersErrors.message = false;
        if (!$scope.$$childTail.attendees.length) {
            $scope.emailGroupMembersErrors.required = true
        } else {
            if (!$scope.$$childTail.emailGroupSubject) {
                $scope.emailGroupMembersErrors.subject = true
            } else {
                if (!$scope.$$childTail.emailGroupMessage) {
                    $scope.emailGroupMembersErrors.message = true
                } else {
                    var data = {
                        groupMembers: $scope.$$childTail.attendees,
                        emailGroupSubject: $scope.$$childTail.emailGroupSubject,
                        emailGroupMessage: $scope.$$childTail.emailGroupMessage
                    };
                    timebridgeService.emailGroupMembers(groupId, data).success(function (data) {
                        $mdDialog.hide()
                    }).error(function (data) {
                        $scope.emailGroupMembersErrors.cannotSentData = true
                    })
                }
            }
        }
    }
}
function MeetRightNowGroupDialogController($scope, $mdDialog, timebridgeService, groupId) {
    $scope.audioConference = {};
    $scope.audioConference.use = true;
    $scope.meetRightNowGroupErrors = {required: false, email: false};
    $scope.init = function () {
        timebridgeService.getGroupMembers(groupId).success(function (data, status, headers, config) {
            $scope.$$childTail.attendees = data
        }).error(function (data, status, headers, config) {
            console.log("data: ", data)
        });
        _getAudioCallData()
    };
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.setAudioConferenceInfo = function () {
        _getAudioCallData()
    };
    $scope.meetRightNowGroup = function () {
        $scope.meetRightNowGroupErrors.required = false;
        $scope.meetRightNowGroupErrors.topic = false;
        if (!$scope.$$childTail.attendees.length) {
            $scope.meetRightNowGroupErrors.required = true
        } else {
            if (!$scope.$$childTail.meetRightNowGroupTopic) {
                $scope.meetRightNowGroupErrors.topic = true
            } else {
                var data = {
                    meetingTopic: $scope.$$childTail.meetRightNowGroupTopic,
                    meetingMessage: $scope.$$childTail.meetRightNowMessage,
                    groupMembers: $scope.$$childTail.attendees,
                    useAudioConference: $scope.audioConference.use
                };
                timebridgeService.meetRightNowGroup(data).success(function (data) {
                    $mdDialog.hide()
                }).error(function (data) {
                    $scope.meetRightNowGroupErrors.cannotSentData = true
                })
            }
        }
    };
    var _getAudioCallData = function () {
        if (!$scope.audioConference.number || !$scope.audioConference.accessCode) {
            timebridgeService.getUserCallInfo().success(function (data) {
                $scope.audioConference.number = data.number;
                $scope.audioConference.accessCode = data.participantcode
            })
        }
    }
}
"use strict";
function SettingsPageController($scope, $rootScope, $timeout, $window, authenticated, googleService, timebridgeService, outlookService, $location, $routeParams, $mdDialog) {
    $scope.items = ["info", "calendar", "meeting", "meetWithMe", "notifications"];
    $scope.conditions = TBConst.conditions;
    $scope.selection = $scope.items[0];
    $scope.accountSettingsSaved = false;
    $scope.accountSaveButtonDisabled = false;
    $scope.downloadStarted = false;
    $scope.calendarsSynced = false;
    $scope.allHours = TBConst.hours;
    $scope.allDays = TBConst.days;
    $scope.dateFormats = ViewDateFormat;
    $scope.calendarSlotsFormats = CalendarViewSlots;
    $scope.hourIndex = -1;
    $scope.additionalEmailAddresses = {};
    $scope.userEmailsToDelete = [];
    $scope.writeGoogleEmails = [];
    $scope.reminderCondition = {operator: "15 minutes before meeting"};
    $scope.timeFormats = DefaultDatetimeFormats;
    $scope.primary = "Primary";
    var userInfoData = {};
    var workDays = [];
    var startWorkHours = [];
    var endWorkHours = [];
    $scope.init = function () {
        $scope.selection = "account";
        if (authenticated) {
            $scope.userInfo = $rootScope.initialInfo.userData;
            $scope.userInfo.emails = [];
            $scope.userInfo.workingDays = [];
            $scope.mainEmailAddress = _handleEmailAddress($scope.userInfo.emailAddresses);
            if (!$scope.userInfo.dateFormat) {
                $scope.userInfo.dateFormat = ViewDateFormat[0].viewFormat
            }
            if (!$scope.userInfo.calendarSlotsFormat) {
                $scope.userInfo.calendarSlotsFormat = CalendarViewSlots[1].time
            }
            _handleAccountSettings();
            userInfoData = angular.copy($scope.userInfo);
            if ($rootScope.initialInfo.userData.calendarType == TBConst.calendar.googleCalendarType) {
                $scope.googleCalendarConnected = true;
                $scope.outlookCalendarConnected = false;
                $scope.outlookCalendarConnect = false;
                $scope.userInfo.writeGoogleEmail = $scope.userInfo.syncCalendar;
                _handleGoogleCalendarsSettings($scope.userInfo.calendarData)
            } else {
                if ($rootScope.initialInfo.userData.calendarType == TBConst.calendar.outlookCalendarType) {
                    $scope.outlookCalendarConnected = true;
                    $scope.googleCalendarConnected = false;
                    $scope.outlookCalendarConnect = false
                } else {
                    $scope.googleCalendarConnected = false;
                    $scope.outlookCalendarConnect = false;
                    $scope.outlookCalendarConnected = false
                }
            }
            if ($routeParams.tab == TBConst.tabSettings.account) {
                $scope.userInfo = angular.copy(userInfoData);
                $scope.userInfo.startWorkingHours = angular.copy(startWorkHours);
                $scope.userInfo.endWorkingHours = angular.copy(endWorkHours);
                $scope.selection = TBConst.tabSettings.account
            } else {
                if ($routeParams.tab == TBConst.tabSettings.meeting) {
                    $scope.selection = TBConst.tabSettings.meeting
                } else {
                    if ($routeParams.tab == TBConst.tabSettings.calendar) {
                        $scope.selection = TBConst.tabSettings.calendar
                    } else {
                        if ($routeParams.tab == TBConst.tabSettings.meetWithMe) {
                            $scope.selection = TBConst.tabSettings.meetWithMe
                        }
                    }
                }
            }
        } else {
            $location.path("/");
            $location.replace()
        }
    };
    $scope.cancel = function () {
        $scope.userInfo = angular.copy(userInfoData);
        $scope.userInfo.startWorkingHours = angular.copy(startWorkHours);
        $scope.userInfo.endWorkingHours = angular.copy(endWorkHours);
        _handleAccountSettings();
        $scope.allDays = angular.copy(workDays);
        if ($scope.outlookCalendarConnect) {
            $scope.outlookCalendarConnect = false
        }
    };
    $scope.changeTab = function (item) {
        $scope.selection = item
    };
    $scope.downloadOutlookConnector = function () {
        $scope.downloadStarted = true
    };
    $scope.connectOutlook = function () {
        $scope.googleCalendarConnected = false;
        $scope.outlookCalendarConnected = false;
        $scope.outlookCalendarConnect = true
    };
    $scope.syncWithGoogleCalendar = function () {
        googleService.syncWithGoogleCalendar().success(function (data, status, headers, config) {
            $scope.calendarsSynced = true;
            $timeout(function () {
                $scope.calendarsSynced = false
            }, 4000)
        }).error(function (data, status, headers, config) {
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Error:",
                dataBody: "Sync calendars failed."
            })
        })
    };
    $scope.disconnectGoogleCalendar = function () {
        googleService.disconnectGoogleCalendar().success(function (data, status, headers, config) {
            $scope.googleCalendarConnected = false;
            $scope.outlookCalendarConnected = false;
            $scope.outlookCalendarConnect = false;
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.success,
                dataTitle: "Google calendar:",
                dataBody: "Calendar successfully disconnected."
            });
            $scope.userInfo.calendarType = 0;
            $rootScope.initialInfo.userData.calendarType = 0;
            $rootScope.initialInfo.userData.reconnectGoogleCalendar = false
        }).error(function (data, status, headers, config) {
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Google calendar:",
                dataBody: "Failed when disconnect calendar. Please try again."
            })
        })
    };
    $scope.handleWorkingDays = function (key) {
        var idx = $scope.userInfo.workingDays.indexOf(key);
        if (idx > -1) {
            $scope.userInfo.workingDays.splice(idx, 1);
            $scope.allDays[key].checked = false
        } else {
            $scope.userInfo.workingDays.push(key)
        }
    };
    $scope.addUserEmail = function (emailAddr) {
        if (emailAddr != undefined && emailAddr != null) {
            if (_userEmailExists(emailAddr)) {
                alert(emailAddr + " email already exists.")
            } else {
                timebridgeService.updateUserInfo($scope.additionalEmailAddresses).success(function (data, status, headers, config) {
                    $scope.userInfo.emails.push({address: emailAddr, status: TBConst.emailTypes.verify});
                    $scope.additionalEmailAddresses = {};
                    $scope.$broadcast("showDataNotification", {
                        dataType: TBConst.notificationStatus.success,
                        dataTitle: "",
                        dataBody: "Email added and verification successfully sent."
                    })
                }).error(function (data, status, headers, config) {
                    alert("Invalid user email")
                })
            }
        }
    };
    $scope.handleUserEmails = function (status, email) {
        var idx = $scope.userEmailsToDelete.indexOf(email);
        if (idx > -1) {
            $scope.userEmailsToDelete.splice(idx, 1)
        } else {
            if (status != $scope.primary) {
                $scope.userEmailsToDelete.push(email)
            }
        }
    };
    $scope.deleteUserEmails = function () {
        timebridgeService.deleteUserInfo($scope.userEmailsToDelete).success(function (data, status, headers, config) {
            _deleteUserEmails()
        }).error(function (data, status, headers, config) {
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Error:",
                dataBody: "Failed when delete selected users."
            })
        })
    };
    $scope.handleEmail = function (user_email_status, user_email) {
        if (user_email_status == TBConst.emailTypes.verify) {
            timebridgeService.sendVerificationEmail([user_email]).success(function (data, status, headers, config) {
                $scope.$broadcast("showDataNotification", {
                    dataType: TBConst.notificationStatus.success,
                    dataTitle: "",
                    dataBody: data
                })
            }).error(function (data, status, headers, config) {
                $scope.$broadcast("showDataNotification", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "Error:",
                    dataBody: data
                })
            })
        } else {
            if (user_email_status == TBConst.emailTypes.makePrimary) {
                timebridgeService.updateUserInfo({makePrimary: user_email}).success(function (data, status, headers, config) {
                    _updatePrimaryEmail(user_email)
                }).error(function (data, status, headers, config) {
                    $scope.$broadcast("showDataNotification", {
                        dataType: TBConst.notificationStatus.error,
                        dataTitle: "Error:",
                        dataBody: data
                    })
                })
            }
        }
    };
    $scope.deactivateUserAccount = function () {
        $mdDialog.show({
            controller: DeactivateUserController,
            templateUrl: "../../../static/js/app/settings/view/deactivate-user-popup.html"
        })
    };
    $scope.saveAccountSettings = function () {
        var makeLogout = false;
        $scope.accountSaveButtonDisabled = true;
        if ($scope.userInfo.newPassword && $scope.userInfo.oldPassword && $scope.userInfo.confirmPassword) {
            makeLogout = true
        }
        timebridgeService.saveAccountSettings($scope.userInfo).success(function (data, status, headers, config) {
            $scope.accountSettingsSaved = true;
            $timeout(function () {
                $scope.accountSettingsSaved = false
            }, 3000);
            if (makeLogout) {
                timebridgeService.logout()
            } else {
                $scope.allDays = angular.copy(workDays);
                $window.location.reload()
            }
        }).error(function (data, status, headers, config) {
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Error:",
                dataBody: data
            });
            $scope.accountSaveButtonDisabled = false;
            $scope.error = status
        })
    };
    $scope.disconnectOutlookCalendar = function () {
        outlookService.disconnect().success(function (data, status, headers, config) {
            $scope.googleCalendarConnected = false;
            $scope.outlookCalendarConnected = false;
            $scope.outlookCalendarConnect = false;
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.success,
                dataTitle: "Outlook calendar:",
                dataBody: "Calendar successfully disconnected."
            });
            $scope.userInfo.calendarType = 0;
            $rootScope.initialInfo.userData.calendarType = 0
        }).error(function (data, status, headers, config) {
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Outlook calendar:",
                dataBody: "Failed when disconnect calendar. Please try again."
            })
        })
    };
    $scope.showAvatarPopUp = function () {
        $mdDialog.show({
            controller: AvatarPopupController,
            templateUrl: "../../../static/js/app/settings/view/avatar-popup.html",
            scope: $scope,
            preserveScope: true,
            options: {}
        })
    };
    $scope.$on("showSettingsNotification", function (event, notificationType, notificationTitle, notificationMessage) {
        $scope.$broadcast("showDataNotification", {
            dataType: notificationType,
            dataTitle: notificationTitle,
            dataBody: notificationMessage
        })
    });
    var _updatePrimaryEmail = function (new_primaryEmail) {
        angular.forEach($scope.userInfo.emails, function (value, key) {
            if (value.address == new_primaryEmail) {
                $scope.userInfo.emails[key].status = TBConst.emailTypes.primary
            } else {
                if (value.status == TBConst.emailTypes.primary) {
                    $scope.userInfo.emails[key].status = TBConst.emailTypes.makePrimary
                }
            }
        })
    };
    var _handleAccountSettings = function () {
        timebridgeService.loadAccountSettings().success(function (data, status, headers, config) {
            if (data.account_work_hours_start) {
                $scope.userInfo.startWorkingHours = data.account_work_hours_start
            }
            if (data.account_work_hours_end) {
                $scope.userInfo.endWorkingHours = data.account_work_hours_end
            }
            if (data.account_work_days) {
                $scope.userInfo.workingDays = angular.fromJson(data.account_work_days);
                angular.forEach($scope.allDays, function (value, key) {
                    if ($scope.userInfo.workingDays.indexOf(value.key) > -1) {
                        $scope.allDays[key].checked = true
                    }
                })
            }
            if (data.auto_confirm_meeting) {
                $scope.userInfo.autoConfirmMeeting = angular.fromJson(data.auto_confirm_meeting)
            }
            if (data.cc_myself_invitation) {
                $scope.userInfo.ccMySelfInvitation = angular.fromJson(data.cc_myself_invitation)
            }
            if (data.meeting_reminder) {
                $scope.userInfo.meetingReminder = angular.fromJson(data.meeting_reminder)
            }
            if (data.meeting_reminder_time) {
                $scope.userInfo.meetingReminderTime = angular.fromJson(data.meeting_reminder_time)
            } else {
                $scope.userInfo.meetingReminderTime = 0
            }
            startWorkHours = angular.copy($scope.userInfo.startWorkingHours);
            endWorkHours = angular.copy($scope.userInfo.endWorkingHours);
            workDays = angular.copy($scope.allDays)
        }).error(function (data, status, headers, config) {
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Error:",
                dataBody: "Failed to load account settings."
            })
        })
    };
    var _deleteUserEmails = function () {
        var allEmails = angular.copy($scope.userInfo.emails);
        angular.forEach(allEmails, function (value, key) {
            var index = $scope.userEmailsToDelete.indexOf(value.address);
            if (index > -1) {
                $scope.userInfo.emails.splice(_getUserEmailIndex(value.address), 1);
                $scope.userEmailsToDelete.splice(index, 1)
            }
        })
    };
    var _getUserEmailIndex = function (address) {
        var keyData = null;
        angular.forEach($scope.userInfo.emails, function (value, key) {
            if (value.address == address) {
                keyData = key
            }
        });
        return keyData
    };
    var _handleEmailAddress = function (allUserEmails) {
        var allEmails = angular.copy(allUserEmails);
        var primaryEmail = allEmails.shift()[0];
        $scope.userInfo.emails.push({address: primaryEmail, status: TBConst.emailTypes.primary});
        angular.forEach(allEmails, function (value, key) {
            if (value[2] || (!value[1] && !value[2])) {
                $scope.userInfo.emails.push({address: value[0], status: TBConst.emailTypes.verify})
            } else {
                $scope.userInfo.emails.push({address: value[0], status: TBConst.emailTypes.makePrimary})
            }
        });
        return primaryEmail
    };
    var _userEmailExists = function (userEmail) {
        var exists = false;
        angular.forEach($scope.userInfo.emails, function (value, key) {
            if (value.address == userEmail) {
                exists = true
            }
        });
        return exists
    };
    var _handleGoogleCalendarsSettings = function (calendarsData) {
        angular.forEach(calendarsData, function (calendar, key) {
            if (calendar.availabilityCalendar) {
                calendar.googleAvailabilityCalendar = true
            }
            if (calendar.accessRole == TBConst.calendar.accessRoles.owner) {
                $scope.writeGoogleEmails.push(calendar)
            }
        })
    }
}
function DeactivateUserController($scope, $mdDialog, timebridgeService) {
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.deactivateUser = function () {
        timebridgeService.deactivateAccount().success(function (data, status, headers, config) {
            timebridgeService.logout()
        }).error(function (data, status, headers, config) {
            $scope.errorMessage = "Error: Failed to deactivate account."
        })
    }
}
angular.module("meetWithMeSettingsController", ["ngClipboard"]).config(["ngClipProvider", function (ngClipProvider) {
    ngClipProvider.setPath("//cdnjs.cloudflare.com/ajax/libs/zeroclipboard/2.1.6/ZeroClipboard.swf")
}]).controller("MeetWithMeSettingsController", function ($scope, $cookies, $mdDialog, $routeParams, timebridgeService) {
    var initialMwmSettings = {};
    $scope.meetWithMeSettings = {
        meetWithMeStatus: false,
        userPersonalUrl: "",
        isPublic: false,
        workHoursOnly: false,
        eventTypeStatus: true,
        eventTypes: []
    };
    $scope.eventColor = eventColor;
    $scope.duration = duration;
    $scope.extraTime = extraTime;
    $scope.availbleDays = TBConst.days;
    $scope.fromToHours = TBConst.hours;
    $scope.scheduledInAdvance = scheduledInAdvance;
    $scope.maxEventsPerDay = maxEventsPerDay;
    $scope.showCreateEventTypes = false;
    $scope.showEditEventTypes = false;
    var initialEventType = {
        name: "",
        eventTypeStatus: true,
        description: "",
        eventTypeUrl: "",
        location: "",
        phoneNumber: "",
        eventColor: "#3498DB",
        duration: 30,
        extraTimeBefore: 0,
        extraTimeAfter: 0,
        availableDays: eventType.availableDays,
        allowedRequestFromTime: "08:00",
        allowedRequestToTime: "18:00",
        scheduledInAdvance: 1440,
        maxEventsPerDay: 0,
        autoConfirmMeetingRequests: true
    };
    $scope.eventType = angular.copy(initialEventType);
    $scope.init = function () {
        if ($routeParams.tab == TBConst.tabSettings.meetWithMe) {
            timebridgeService.getMeetWithMeSettings().success(function (data, status, headers, config) {
                $scope.meetWithMeSettings = data;
                if (data.isPublic == null || data.isPublic) {
                    $scope.meetWithMeSettings.isPublic = false
                } else {
                    $scope.meetWithMeSettings.isPublic = true
                }
                $scope.blockWrongInput();
                if ($cookies.mwmShowHelp != "false") {
                    $mdDialog.show({
                        controller: MeetWithMeHelpController,
                        templateUrl: "../../../static/js/app/meet-with-me/view/meet-with-me-help.html",
                        options: {}
                    })
                }
                initialMwmSettings = angular.copy($scope.meetWithMeSettings)
            }).error(function (data, status, headers, config) {
                $scope.$emit("showSettingsNotification", TBConst.notificationStatus.error, "", data)
            })
        }
    };
    $scope.cancelMwmSettingsChanges = function () {
        $scope.eventType = angular.copy(initialEventType);
        $scope.showCreateEventTypes = false;
        $scope.showEditEventTypes = false;
        $scope.meetWithMeSettings = angular.copy(initialMwmSettings)
    };
    $scope.saveMeetWithMeSettings = function () {
        $scope.blockWrongInput();
        var data = angular.copy($scope.meetWithMeSettings);
        data.isPublic = data.isPublic ? false : true;
        timebridgeService.saveMeetWithMeSettings(data).success(function (data, status, headers, config) {
            initialMwmSettings = angular.copy($scope.meetWithMeSettings);
            $scope.$emit("showSettingsNotification", TBConst.notificationStatus.success, "", data)
        }).error(function (data, status, headers, config) {
            $scope.$emit("showSettingsNotification", TBConst.notificationStatus.error, "", data)
        })
    };
    $scope.saveNewEventType = function () {
        var eventType = angular.copy($scope.eventType);
        if (eventTypeIsValid(eventType)) {
            timebridgeService.saveMwmEventType(eventType).success(function (data, status, headers, config) {
                $scope.eventType = angular.copy(initialEventType);
                eventType.id = data.event_id;
                $scope.$emit("showSettingsNotification", TBConst.notificationStatus.success, "", data.message);
                $scope.showCreateEventTypes = false;
                $scope.meetWithMeSettings.eventTypes.push(eventType)
            }).error(function (data, status, headers, config) {
                $scope.$emit("showSettingsNotification", TBConst.notificationStatus.error, "", data)
            })
        } else {
            $scope.$emit("showSettingsNotification", TBConst.notificationStatus.error, "", "Please fill all required fields")
        }
    };
    $scope.updateEventType = function () {
        var eventType = angular.copy($scope.eventType);
        $scope.blockWrongPhoneNumber();
        if (eventTypeIsValid(eventType)) {
            timebridgeService.updateMwmEventType(eventType).success(function (data, status, headers, config) {
                $scope.eventType = angular.copy(initialEventType);
                $scope.$emit("showSettingsNotification", TBConst.notificationStatus.success, "", data);
                $scope.showEditEventTypes = false
            }).error(function (data, status, headers, config) {
                $scope.$emit("showSettingsNotification", TBConst.notificationStatus.error, "", data)
            })
        } else {
            $scope.$emit("showSettingsNotification", TBConst.notificationStatus.error, "", "Please fill all required fields")
        }
    };
    var eventTypeIsValid = function (eventType) {
        return (eventType.name && eventType.description && eventType.eventTypeUrl) ? true : false
    };
    $scope.linkCopy = function () {
        var urlField = "http://app.timebridge.com/#/meet/";
        if ($scope.showCreateEventTypes || $scope.showEditEventTypes) {
            urlField += $scope.meetWithMeSettings.userPersonalUrl + "/" + $scope.eventType.eventTypeUrl
        } else {
            urlField += $scope.meetWithMeSettings.userPersonalUrl
        }
        if (!document.execCommand) {
            return urlField
        } else {
            window.prompt('Press "Ctrl+C" to copy your URL, then press "Enter"', urlField)
        }
    };
    $scope.showAddNewEventTypeForm = function () {
        if (blockCreateEditEventType()) {
            $scope.$emit("showSettingsNotification", TBConst.notificationStatus.error, "", "Please save your Meet With Me settings first.")
        } else {
            $scope.showCreateEventTypes = true;
            $scope.eventType = angular.copy(initialEventType)
        }
    };
    $scope.showEditEventTypeForm = function (eventTypeId) {
        if (blockCreateEditEventType()) {
            $scope.$emit("showSettingsNotification", TBConst.notificationStatus.error, "", "Please save your Meet With Me settings first.")
        } else {
            $scope.showEditEventTypes = true;
            angular.forEach($scope.meetWithMeSettings.eventTypes, function (value, key) {
                if (value.id == eventTypeId) {
                    $scope.eventType = value
                }
            })
        }
    };
    $scope.deleteEventType = function (eventTypeId) {
        timebridgeService.deleteMwmEventType(eventTypeId).success(function (data, status, headers, config) {
            $scope.$emit("showSettingsNotification", TBConst.notificationStatus.success, "", data);
            $scope.showEditEventTypes = false;
            var allEventTypes = angular.copy($scope.meetWithMeSettings.eventTypes);
            $scope.meetWithMeSettings.eventTypes = [];
            angular.forEach(allEventTypes, function (value, key) {
                if (value.id != eventTypeId) {
                    $scope.meetWithMeSettings.eventTypes.push(value)
                }
            })
        }).error(function (data, status, headers, config) {
            $scope.$emit("showSettingsNotification", TBConst.notificationStatus.error, "", data)
        })
    };
    $scope.blockWrongInput = function () {
        $scope.meetWithMeSettings.userPersonalUrl = $scope.meetWithMeSettings.userPersonalUrl.replace(/([^a-z0-9]+)/gi, "");
        $scope.eventType.eventTypeUrl = $scope.eventType.eventTypeUrl.replace(/([^a-z0-9]+)/gi, "")
    };
    $scope.handleAvailableDays = function (day, checked) {
        angular.forEach($scope.eventType.availableDays, function (value, key) {
            if (value.day == day) {
                value.checked = checked ? false : true
            }
        })
    };
    $scope.blockWrongPhoneNumber = function () {
        $scope.eventType.phoneNumber = $scope.eventType.phoneNumber.replace(/([^0-9-+() ])+/g, "")
    };
    $scope.calculateDurationValue = function (time, difference) {
        return (parseInt(time) * 60) + parseInt(difference)
    };
    var blockCreateEditEventType = function () {
        return !initialMwmSettings.eventTypeStatus || !initialMwmSettings.meetWithMeStatus
    }
});
"use strict";
function AvatarPopupController($rootScope, $scope, $mdDialog, $route, Upload, timebridgeService) {
    $scope.log = "";
    $scope.avatarPath = "";
    $scope.croppedAvatarPath = "";
    $scope.fullAvatarPath = "";
    var canvas, context, image = null;
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.uploadAvatar = function () {
        Upload.upload({
            url: "/branding/avatars",
            method: "POST",
            data: {file: Upload.dataUrltoBlob($("#avatar").get(0).toDataURL())}
        }).then(function (response) {
            $scope.hide();
            $rootScope.initialInfo.userData.avatarLink = response.data;
            $route.reload()
        }, function (response) {
            if (response.status > 0) {
            }
        }, function (evt) {
            $scope.progress = parseInt(100 * evt.loaded / evt.total)
        })
    };
    $scope.deleteAvatar = function () {
        timebridgeService.deleteAvatar().success(function (data, status, headers, config) {
            $scope.hide();
            $rootScope.initialInfo.userData.avatarLink = data;
            $route.reload()
        }).error(function (data, status, headers, config) {
            $scope.hide()
        })
    };
    $scope.cancelAvatar = function () {
        $scope.avatarPath = "";
        $scope.croppedAvatarPath = ""
    };
    $scope.rotateLeft = function () {
        var degrees = -Math.PI / 2;
        rotateImage($scope.croppedAvatarPath, degrees, -120, 0, 120, 120)
    };
    $scope.rotateRight = function () {
        var degrees = Math.PI / 2;
        rotateImage($scope.croppedAvatarPath, degrees, 0, -120, 120, 120)
    };
    $scope.$watch("croppedAvatarPath", function (newValue, oldValue) {
        rotateImage($scope.croppedAvatarPath, 0, 0, 0, 120, 120)
    });
    function rotateImage(data, degrees, x, y, width, height) {
        canvas = $("#avatar").get(0);
        if (canvas) {
            context = canvas.getContext("2d");
            image = new Image();
            image.src = data;
            image.addEventListener("load", function () {
                context.rotate(degrees);
                context.translate(x, y);
                context.clearRect(0, 0, width, height);
                context.drawImage(image, 0, 0, width, height)
            }, true)
        }
    }
}
"use strict";
function ChangeProposedTimesController($scope, $injector, $location, $routeParams, $mdDialog, authenticated, timebridgeService, timeZones, notifications) {
    $injector.invoke(HomePageController, this, {$scope: $scope, authenticated: authenticated, $mdDialog: $mdDialog});
    var self = this;
    self._maxProposedEvents = 5;
    self.meetingId = $routeParams.meetingId;
    $scope.init = function () {
        $scope.meetingId = self.meetingId;
        $scope.allDay = "btn-active";
        $scope.bussinesDay = "btn-default";
        $scope.showCalendar = true;
        $scope.eventsLoaded = false;
        $scope.pageType = $scope.changeTimesPage;
        if (!authenticated) {
            $location.path("/");
            $location.replace()
        } else {
            timebridgeService.getProposedTimes(self.meetingId).success(function (meetingInfo) {
                $scope.meeting = meetingInfo;
                self.initialTimes = meetingInfo.meetingTimes;
                setCalendarStartDate(meetingInfo.meetingTimes);
                for (var i = 0; i < meetingInfo.meetingTimes.length; i++) {
                    $scope.$broadcast("addEvent", timeZones.parseMomentAsUTC(meetingInfo.meetingTimes[i].start), timeZones.parseMomentAsUTC(meetingInfo.meetingTimes[i].end))
                }
                $scope.proposeEventsCount = self._maxProposedEvents - $scope.newEvents.length
            })
        }
    };
    $scope.showUpdateTimesDialog = function () {
        if ($scope.newEvents.length > 0) {
            $mdDialog.show({
                controller: UpdateTimesDialogController,
                templateUrl: "../../../static/js/app/partials/view/review-confirm-changes.html",
                locals: {meetingId: self.meetingId, times: getChangedTimes()}
            })
        } else {
            notifications.showNotification($scope, TBConst.notificationStatus.error, "Error:", "Missing proposed times.")
        }
    };
    $scope.backToMeetingPage = function () {
        $location.path("/meeting/" + self.meetingId);
        $location.replace()
    };
    function formatProposedTimes(proposedTimes) {
        var formattedTimes = [];
        for (var i = 0; i < proposedTimes.length; i++) {
            formattedTimes.push({
                start: moment($scope.newEvents[i].start).format(timeZones.rfc3339),
                end: moment($scope.newEvents[i].end).format(timeZones.rfc3339)
            })
        }
        return formattedTimes
    }

    function getChangedTimes() {
        var newEvent, i, j, eventFound, addedTimes = [], removedTimes = self.initialTimes.slice(), currentProposedTimes = formatProposedTimes($scope.newEvents);
        for (i = 0; i < currentProposedTimes.length; i++) {
            newEvent = currentProposedTimes[i];
            j = removedTimes.length;
            eventFound = false;
            while (j--) {
                if (removedTimes[j].start === newEvent.start && removedTimes[j].end == newEvent.end) {
                    removedTimes.splice(j, 1);
                    eventFound = true;
                    break
                }
            }
            if (!eventFound) {
                addedTimes.push(newEvent)
            }
        }
        return {removedTimes: removedTimes, addedTimes: addedTimes, allTimes: currentProposedTimes}
    }

    function setCalendarStartDate(times) {
        var earliestDate = timeZones.parseMomentAsUTC(times[0].start), calendarStart = earliestDate.startOf("week");
        $scope.$broadcast("gotoDate", calendarStart)
    }
}
"use strict";
function RescheduleMeetingController($scope, $rootScope, $injector, $location, $routeParams, $mdDialog, authenticated, timebridgeService) {
    $injector.invoke(HomePageController, this, {$scope: $scope, authenticated: authenticated, $mdDialog: $mdDialog});
    var self = this;
    self._maxProposedEvents = 5;
    self.meetingId = $routeParams.meetingId;
    $scope.init = function () {
        $scope.meetingId = self.meetingId;
        $scope.allDay = "btn-active";
        $scope.bussinesDay = "btn-default";
        $scope.showCalendar = true;
        $scope.eventsLoaded = false;
        $scope.pageType = $scope.rescheduleMeetingPage;
        $scope.newEvents = [];
        $scope.options = {};
        if (!authenticated) {
            $location.path("/");
            $location.replace()
        } else {
            timebridgeService.getMeetingInfo(self.meetingId).success(function (meetingInfo) {
                $scope.meeting = meetingInfo.meetingInfo;
                $scope.meeting.title = "RESCHEDULED: " + $scope.meeting.title;
                $rootScope.attendees = _filterMeetingAttendees($scope.meeting.attendees);
                $rootScope.rescheduleMeeting = $scope.meeting;
                $scope.$broadcast("updateAttendees", $rootScope.attendees)
            })
        }
    };
    var _filterMeetingAttendees = function (attendees) {
        var filteredAttendees = [];
        angular.forEach(attendees, function (value, key) {
            if (!value.isOrganizer) {
                filteredAttendees.push(value)
            }
        });
        return filteredAttendees
    }
}
function MeetWithMeController($scope, $rootScope, $routeParams, $cookies, $location, $mdDialog, timebridgeService, authenticated) {
    $scope.showMwmCalendarPage = true;
    $scope.requestedMeetingInfo = {proposedMeetingTimes: []};
    $scope.userInfo = {eventTypes: []};
    $scope.showMwmPage = true;
    $scope.isPreview = false;
    $scope.scheduleButtonDisabled = false;
    $scope.eventTypes = [];
    $scope.address = {components: {location: {latitude: undefined, longitude: undefined}}};
    var userData = $rootScope.initialInfo.userData;
    var _proposeEventsCount = 5, map;
    $scope.init = function () {
        var mwmData = JSON.parse(localStorage.getItem("mwmRequestMeetingInfo"));
        localStorage.removeItem("mwmRequestMeetingInfo");
        localStorage.removeItem("redirectUrl");
        if (mwmData) {
            $scope.requestedMeetingInfo = mwmData
        }
        $scope.proposedMeetingTimesCount = _proposeEventsCount;
        timebridgeService.getMeetWithMeUserInfo($routeParams.userPersonalUrl, $routeParams.eventTypeUrl ? $routeParams.eventTypeUrl : "").success(function (data, status, headers, config) {
            if ($routeParams.eventTypeUrl && !data.eventType) {
                $location.path("/meet/" + $routeParams.userPersonalUrl)
            } else {
                $scope.userAuthenticated = authenticated;
                $scope.userInfo = data;
                if (data.eventType) {
                    $scope.requestedMeetingInfo.meetingTitle = data.eventType.name;
                    $scope.requestedMeetingInfo.locationInfo = data.eventType.location;
                    $scope.requestedMeetingInfo.autoConfirmMeetingRequests = data.eventType.autoConfirmMeetingRequests
                }
                $scope.isPreview = data.is_preview;
                $scope.$broadcast("setCalendarState", $scope.isPreview);
                if ($scope.isPreview) {
                    $scope.$broadcast("showDataNotification", {
                        dataType: TBConst.notificationStatus.info,
                        dataTitle: "",
                        dataBody: "Preview of my Meet With Me page."
                    })
                }
                if ($cookies.mwmRequestShowHelp != "false" && data.eventTypes.length == 0) {
                    $mdDialog.show({
                        controller: MeetWithMeHelpController,
                        templateUrl: "../../../static/js/app/meet-with-me/view/mwm-request-help.html",
                        options: {ownerFirstName: $scope.userInfo.first_name}
                    })
                } else {
                    if (!data.is_public) {
                        $mdDialog.show({
                            controller: NotificationModalWindowController,
                            templateUrl: "../../../static/js/app/partials/view/notification-modal-window-template.html",
                            title: "Notification",
                            message: $scope.userInfo.first_name + " " + $scope.userInfo.last_name + " is only accepting meeting requests from his/her existing Timebridge contacts right now. If you are not in user's contacts you will not be able to request a meeting.",
                            options: {}
                        })
                    }
                }
            }
        }).error(function (data, status, headers, config) {
            if (status == 404) {
                $scope.showMwmPage = false
            } else {
                $scope.$broadcast("showDataNotification", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "Error:",
                    dataBody: data
                })
            }
        });
        $scope.$on("mapInitialized", function (event, newMap) {
            map = newMap;
            _checkMapUndefined(newMap)
        })
    };
    $scope.goToRequestMeeting = function () {
        $scope.showMwmPage = false
    };
    $scope.goToEventTypePage = function (path) {
        $location.path("/meet/" + $routeParams.userPersonalUrl + "/" + path)
    };
    $scope.removeProposedMeetingTime = function (eventId) {
        $scope.$broadcast("removeProposedMeetingTime", eventId);
        $scope.proposedMeetingTimesCount = _proposeEventsCount - $scope.requestedMeetingInfo.proposedMeetingTimes.length
    };
    $scope.goToRequestMeetingPage = function () {
        $scope.$broadcast("hideDataNotification");
        if (!$scope.requestedMeetingInfo.meetingTitle) {
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.info,
                dataTitle: "",
                dataBody: "You should add some meeting title before continue."
            })
        } else {
            if (!$scope.requestedMeetingInfo.proposedMeetingTimes.length) {
                $scope.$broadcast("showDataNotification", {
                    dataType: TBConst.notificationStatus.info,
                    dataTitle: "",
                    dataBody: "You should propose some meeting times before continue."
                })
            } else {
                $scope.showMwmCalendarPage = false;
                if (authenticated) {
                    $scope.requestedMeetingInfo.requesterFirstName = userData.firstName;
                    $scope.requestedMeetingInfo.requesterLastName = userData.lastName;
                    $scope.requestedMeetingInfo.requesterEmail = userData.emailAddresses[0][0]
                }
            }
        }
    };
    $scope.backToCalendarPage = function () {
        $scope.showMwmCalendarPage = true;
        $scope.clearMeetings();
        $scope.proposedMeetingTimesCount = _proposeEventsCount
    };
    $scope.scheduleMwmMeeting = function () {
        $scope.$broadcast("hideDataNotification");
        if (!$scope.requestedMeetingInfo.requesterFirstName || !$scope.requestedMeetingInfo.requesterLastName || !$scope.requestedMeetingInfo.requesterEmail || !$scope.requestedMeetingInfo.requesterMessage) {
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.info,
                dataTitle: "",
                dataBody: "Please fill all required fields."
            })
        } else {
            if (!isEmailValid($scope.requestedMeetingInfo.requesterEmail)) {
                $scope.$broadcast("showDataNotification", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "",
                    dataBody: "Email is incorrect."
                })
            } else {
                $scope.scheduleButtonDisabled = true;
                _updateMapParameters();
                $scope.requestedMeetingInfo.eventTypeUrl = $routeParams.eventTypeUrl ? $routeParams.eventTypeUrl : "";
                $scope.requestedMeetingInfo.requesterTimezone = $rootScope.initialInfo.userData.time_zone;
                timebridgeService.requestMeetWithMeMeeting($routeParams.userPersonalUrl, $scope.requestedMeetingInfo).success(function (data, status, headers, config) {
                    if (data.not_in_contacts == true) {
                        $scope.$broadcast("showDataNotification", {
                            dataType: TBConst.notificationStatus.error,
                            dataTitle: "",
                            dataBody: "Sorry, " + $scope.userInfo.first_name + " " + $scope.userInfo.last_name + " has limited meeting requests to his/her existing Timebridge contacts right now. You can not request a meeting, as " + $scope.requestedMeetingInfo.requesterEmail + " email address is not in user's TimeBridge contacts."
                        })
                    } else {
                        if (data.is_new_user) {
                            $mdDialog.show({
                                controller: NotificationModalWindowController,
                                templateUrl: "../../../static/js/app/partials/view/notification-modal-window-template.html",
                                title: "FINAL STEP: CONFIRM YOUR<br/>EMAIL WITHIN 1 HOUR",
                                message: "Before we can send your meeting request <b>you must click on the link in the email that we just sent you</b>. (If you don't confirm your email within 1 hour your request will not be sent.) If " + $scope.userInfo.first_name + " accepts your meeting request you will receive an invitation to the meeting.",
                                options: {
                                    underButtonMessage: '<a target="_blank" href="http://www.timebridge.com/blog/">Learn more about Timebridge</a>',
                                    redirectUrl: "/home"
                                }
                            })
                        } else {
                            $mdDialog.show({
                                controller: NotificationModalWindowController,
                                templateUrl: "../../../static/js/app/partials/view/notification-modal-window-template.html",
                                title: "SUCCESS",
                                message: "Your meeting request has been successfully sent. Once " + $scope.userInfo.first_name + " accepts your meeting request you will receive an invitation to the meeting.",
                                options: {redirectUrl: "/home"}
                            })
                        }
                    }
                    $scope.scheduleButtonDisabled = false
                }).error(function (data, status, headers, config) {
                    $scope.$broadcast("showDataNotification", {
                        dataType: TBConst.notificationStatus.error,
                        dataTitle: "Error",
                        dataBody: data
                    });
                    $scope.scheduleButtonDisabled = false
                })
            }
        }
    };
    $scope.updateMap = function () {
        $scope.meetingLocation = $scope.requestedMeetingInfo.locationInfo;
        $scope.markerLocation = $scope.requestedMeetingInfo.locationInfo
    };
    $scope.$on("updateProposedMeetingTimes", function (event, data) {
        $scope.requestedMeetingInfo.proposedMeetingTimes = data;
        $scope.proposedMeetingTimesCount = _proposeEventsCount - $scope.requestedMeetingInfo.proposedMeetingTimes.length
    });
    $scope.backToAllEventTypes = function () {
        $location.path("/meet/" + $routeParams.userPersonalUrl)
    };
    $scope.clearMeetings = function () {
        $scope.requestedMeetingInfo.proposedMeetingTimes = [];
        $scope.$broadcast("removeAllNewEvent")
    };
    $scope.$on("showDataNotificationOnMwmPage", function (event, value) {
        $scope.$broadcast("showDataNotification", {
            dataType: value.dataType,
            dataTitle: value.dataTitle,
            dataBody: value.dataBody
        })
    });
    var _updateMapParameters = function () {
        _checkMapUndefined(map);
        if (!$scope.userInfo.showMap) {
            $scope.address.components.location.latitude = 0;
            $scope.address.components.location.longitude = 0
        }
        $scope.requestedMeetingInfo.location = $scope.address.components.location
    };
    var _checkMapUndefined = function (map) {
        var coordKeys = [];
        if (map != undefined) {
            for (var coord in map.center) {
                if (map.center.hasOwnProperty(coord)) {
                    coordKeys.push(coord)
                }
            }
            $scope.address.components.location.latitude = map.center[coordKeys[0]];
            $scope.address.components.location.longitude = map.center[coordKeys[1]]
        }
    };

    function isEmailValid(email) {
        var EMAIL_REGEXP = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21| [\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))){2,6}$/i;
        var isMatchRegex = EMAIL_REGEXP.test(email);
        if (isMatchRegex || email == "") {
            return true
        } else {
            if (isMatchRegex == false) {
                return false
            }
        }
    }
}
"use strict";
angular.module("mwmCalendarController", ["ui.calendar", "ui.bootstrap"]).controller("MwmCalendarController", function ($scope, $compile, $http, $routeParams, $rootScope, $location, uiCalendarConfig, googleService, timebridgeService, timeZones, outlookService, $mdDialog) {
    var self = this, _maxNewEventsCount = 5, _meetingTimeStorage = null, currentTime = null;
    $scope.buttons = [{calendarName: "myCalendar", title: "Day", agenda: "agendaDay"}, {
        calendarName: "myCalendar",
        title: "Week",
        agenda: "agendaWeek"
    }];
    $scope.newEvents = {color: "#FF8C00", textColor: "white", borderColor: "white", events: []};
    $scope.userAvailabilityInfo = {
        color: "#E0E0E0",
        textColor: "#E0E0E0",
        borderColor: "#E0E0E0",
        editable: false,
        events: []
    };
    $scope.initialInfo = $rootScope.initialInfo.userData;
    if ($scope.initialInfo.dateFormat == ViewDateFormat[1].viewFormat) {
        $scope.dateFormat = "D/M"
    } else {
        $scope.dateFormat = "M/D"
    }
    $scope.init = function () {
        $scope.selected = 1;
        $scope.currentTimeZone = CalendarConst.utc;
        self.now = timeZones.currTimeForCalendar($scope.currentTimeZone);
        currentTime = self.now;
        timeZones.initTimeZoneData().then(function () {
            $scope.currentTimeZone = $rootScope.initialInfo.userData.time_zone;
            self.now = timeZones.currTimeForCalendar($scope.currentTimeZone);
            _defineCurrentTime();
            $scope.$watch(function () {
                return $rootScope.initialInfo.userData.time_zone
            }, timeZoneWatcher);
            $scope.uiConfig = self.uiConfig
        })
    };
    $scope.onEventClick = function (event, jsEvent, view) {
        if (event.tbId) {
            $location.path("/meeting/" + event.tbId)
        }
    };
    $scope.alertOnDrop = function (event, delta, revertFunc, jsEvent, ui, view) {
        var existingEventStartTime = _existingStartTime(event.start, event._id);
        if (event.start < currentTime || existingEventStartTime) {
            if (existingEventStartTime) {
                alert("Sorry, you cannot select two proposed times that start at the same time.")
            }
            _handleEventOutOfCalendarRange(event)
        } else {
            if ($scope.userInfo.eventType && _isOutOfCalendarRange(event.start, event.end)) {
                alert("Sorry, the meeting can't be scheduled out of allowed time range.");
                _handleEventOutOfCalendarRange(event)
            }
        }
    };
    $scope.alertOnResize = function (event, delta, revertFunc, jsEvent, ui, view) {
        _updateNewEventsData(event)
    };
    $scope.dragEvent = function (event, jsEvent, ui, view) {
        _updateNewEventsData(event)
    };
    $scope.addRemoveEventSource = function (sources, source) {
        var canAdd = 0;
        angular.forEach(sources, function (value, key) {
            if (sources[key] === source) {
                sources.splice(key, 1);
                canAdd = 1
            }
        });
        if (canAdd === 0) {
            sources.push(source)
        }
    };
    $scope.addEvent = function (start, end, checkForPast) {
        if (typeof(checkForPast) === "undefined") {
            checkForPast = true
        }
        if (checkForPast && start < currentTime) {
            alert("Sorry, this time is not available.")
        } else {
            if ($scope.newEvents.events.length >= _maxNewEventsCount) {
                alert("You can propose maximum 5 more meeting times.")
            } else {
                if (_existingStartTime(start, "undefined")) {
                    alert("Sorry, you cannot select two proposed times that start at the same time.")
                } else {
                    if ($scope.userInfo.eventType && $scope.userInfo.eventType.duration) {
                        if (_isOutOfCalendarRange(start, end)) {
                            alert("Sorry, the meeting can't be scheduled out of allowed time range.")
                        } else {
                            if ((end - start) / 1000 / 60 != $scope.userInfo.eventType.duration) {
                                _pushNewEventsIntoCalendarDurationLimited(start, $scope.userInfo.eventType.duration)
                            } else {
                                _pushNewEventsIntoCalendar(start, end)
                            }
                        }
                    } else {
                        _pushNewEventsIntoCalendar(start, end)
                    }
                    $scope.$emit("updateProposedMeetingTimes", $scope.newEvents.events)
                }
            }
        }
    };
    $scope.remove = function (index) {
        $scope.newEvents.events.splice(index, 1);
        $scope.$emit("updateProposedMeetingTimes", $scope.newEvents.events)
    };
    $scope.changeView = function (view, calendar, item) {
        $scope.selected = item;
        $scope.calendar = uiCalendarConfig.calendars[calendar];
        uiCalendarConfig.calendars[calendar].fullCalendar("changeView", view)
    };
    $scope.renderCalender = function (calendar) {
        if (uiCalendarConfig.calendars[calendar]) {
            uiCalendarConfig.calendars[calendar].fullCalendar("render")
        }
    };
    $scope.eventRender = function (event, element, view) {
        if (event.isNew) {
            element.append("<span ng-click='remove(" + _getEventIndex(event._id) + ")' style='z-index: 99999; position: absolute;' class='closebtn'>X</span>");
            $compile(element)($scope)
        } else {
            $(element).empty()
        }
    };
    $scope.eventDragStart = function (event) {
        _meetingTimeStorage = angular.copy(event)
    };
    $scope.$on("showEvent", function (event, time) {
        uiCalendarConfig.calendars.myCalendar.fullCalendar("gotoDate", time)
    });
    self.uiConfig = {
        calendar: {
            timezone: CalendarConst.utc,
            height: 800,
            editable: true,
            selectable: true,
            slotDuration: TBConst.calendar.slotDuration,
            eventOverlap: false,
            selectOverlap: false,
            slotEventOverlap: false,
            eventLimit: true,
            allDayDefault: false,
            allDaySlot: true,
            defaultView: "agendaWeek",
            header: {right: "title", center: "", left: "today prev,next"},
            views: {
                month: {columnFormat: "ddd"},
                day: {columnFormat: "dddd"},
                week: {columnFormat: "ddd " + $scope.dateFormat}
            },
            select: $scope.addEvent,
            eventDrop: $scope.alertOnDrop,
            eventResize: $scope.alertOnResize,
            eventRender: $scope.eventRender,
            viewRender: function (view, element) {
                uiCalendarConfig.calendars.myCalendar.fullCalendar("removeEvents");
                $scope.calendarViewName = view.name;
                view.options.editable = false;
                view.options.selectable = false;
                $scope.eventsLoaded = true;
                $scope.userAvailabilityInfo.events = [];
                timebridgeService.getMeetWithMeUserAvailability($routeParams.userPersonalUrl, angular.toJson(view.start), angular.toJson(view.end), $scope.currentTimeZone).success(function (data, status, headers, config) {
                    if (!$scope.isPreview) {
                        view.options.editable = true;
                        view.options.selectable = true
                    }
                    $scope.eventsLoaded = false;
                    if (status == 204) {
                        $location.path("/home")
                    } else {
                        $scope.userAvailabilityInfo.events = [];
                        if ($scope.userInfo.eventType) {
                            angular.forEach(data, function (busyTime, key) {
                                var start_time = timeZones.parseMomentAsUTC(busyTime.start_time).subtract($scope.userInfo.eventType.extraTimeAfter, "minutes");
                                var end_time = timeZones.parseMomentAsUTC(busyTime.end_time).add($scope.userInfo.eventType.extraTimeBefore, "minutes");
                                $scope.userAvailabilityInfo.events.push({
                                    start: start_time.subtract({minutes: timeZones.offsetDifference(start_time, $rootScope.initialInfo.userData.time_zone, CalendarConst.utc)}),
                                    end: end_time.subtract({minutes: timeZones.offsetDifference(end_time, $rootScope.initialInfo.userData.time_zone, CalendarConst.utc)}),
                                    title: "",
                                    isAvailability: true
                                })
                            })
                        } else {
                            angular.forEach(data, function (busyTime, key) {
                                var start_time = timeZones.parseMomentAsUTC(busyTime.start_time);
                                var end_time = timeZones.parseMomentAsUTC(busyTime.end_time);
                                $scope.userAvailabilityInfo.events.push({
                                    start: start_time.subtract({minutes: timeZones.offsetDifference(start_time, $rootScope.initialInfo.userData.time_zone, CalendarConst.utc)}),
                                    end: end_time.subtract({minutes: timeZones.offsetDifference(end_time, $rootScope.initialInfo.userData.time_zone, CalendarConst.utc)}),
                                    title: "",
                                    isAvailability: true
                                })
                            })
                        }
                        uiCalendarConfig.calendars.myCalendar.fullCalendar("addEventSource", $scope.userAvailabilityInfo)
                    }
                    if ($scope.userInfo.eventType) {
                        if ($scope.userInfo.eventType.allowedRequestFromTime != TBConst.calendar.minTime || $scope.userInfo.eventType.allowedRequestToTime != TBConst.calendar.maxTime) {
                            _renderWithWorkHours($scope.userInfo.eventType.allowedRequestFromTime, $scope.userInfo.eventType.allowedRequestToTime, view.start, view.end)
                        }
                    } else {
                        if ($scope.userInfo.account_work_hours_start && $scope.userInfo.account_work_hours_end) {
                            if ($scope.userInfo.account_work_hours_start != TBConst.calendar.minTime || $scope.userInfo.account_work_hours_end != TBConst.calendar.maxTime) {
                                _renderWithWorkHours($scope.userInfo.account_work_hours_start, $scope.userInfo.account_work_hours_end, view.start, view.end)
                            }
                        }
                    }
                }).error(function (data, status, headers, config) {
                    view.options.editable = true;
                    view.options.selectable = true;
                    $scope.eventsLoaded = false;
                    $scope.$emit("showDataNotificationOnMwmPage", {
                        dataType: TBConst.notificationStatus.error,
                        dataTitle: "Error:",
                        dataBody: "Failed to load user availability."
                    })
                });
                _addPastHours();
                if ($scope.userInfo.eventType) {
                    $scope.uiConfig.calendar.eventDurationEditable = $scope.userInfo.eventType.duration ? false : true
                } else {
                    if ($scope.userInfo.account_work_hours_start || $scope.userInfo.account_work_days) {
                        $scope.uiConfig.calendar.hiddenDays = _getBussinesDays($scope.userInfo.account_work_days)
                    }
                }
            },
            eventDragStart: $scope.eventDragStart,
            eventDragStop: $scope.dragEvent,
            minTime: TBConst.calendar.minTime,
            maxTime: TBConst.calendar.maxTime,
            hiddenDays: [],
            eventClick: $scope.onEventClick
        }
    };
    $scope.$watch(function () {
        return $scope.userInfo.eventType
    }, function (newValue, oldValue) {
        if ($scope.userInfo.eventType) {
            $scope.uiConfig.calendar.eventDurationEditable = $scope.userInfo.eventType.duration ? false : true;
            $scope.uiConfig.calendar.hiddenDays = _getAvailableDays($scope.userInfo.eventType.availableDays);
            $scope.newEvents.color = $scope.userInfo.eventType.eventColor;
            _defineCurrentTime()
        }
    });
    $scope.eventSources = [$scope.newEvents];
    $scope.$on("removeProposedMeetingTime", function (event, eventId) {
        $scope.remove(_getEventIndex(eventId))
    });
    $scope.$on("setCalendarState", function (event, isDisabled) {
        self.uiConfig.calendar.editable = !isDisabled;
        self.uiConfig.calendar.selectable = !isDisabled;
        $scope.uiConfig = self.uiConfig
    });
    $scope.$on("removeAllNewEvent", function (event) {
        $scope.newEvents.events = [];
        $scope.$emit("updateProposedMeetingTimes", $scope.newEvents.events)
    });
    $scope.$on("addEvent", function (event, start, end) {
        $scope.addEvent(start, end, false)
    });
    $scope.$on("bussinesDayView", function () {
        var startWorkTime = $scope.initialInfo.workHoursStart;
        var endWorkTime = $scope.initialInfo.workHoursEnd;
        $scope.uiConfig.calendar.minTime = startWorkTime ? startWorkTime : TBConst.calendar.workMinTime;
        $scope.uiConfig.calendar.maxTime = endWorkTime ? endWorkTime : TBConst.calendar.workMaxTime;
        $scope.uiConfig.calendar.hiddenDays = _getBussinesDays($scope.initialInfo.workDays);
        $scope.uiConfig.calendar.defaultView = $scope.calendarViewName
    });
    $scope.$on("allDayView", function () {
        $scope.uiConfig.calendar.minTime = TBConst.calendar.minTime;
        $scope.uiConfig.calendar.maxTime = TBConst.calendar.maxTime;
        $scope.uiConfig.calendar.hiddenDays = []
    });
    $scope.$on("gotoDate", function (event, start) {
        uiCalendarConfig.calendars.myCalendar.fullCalendar("gotoDate", start)
    });
    var changeEventsTimeZone = function (source, oldTimezone, newTimezone, filter) {
        var newSource = angular.copy(source);
        newSource.events = [];
        var event, newEvent, startStr, endStr, newEvents = [];
        if (oldTimezone !== newTimezone) {
            while (source.events.length > 0) {
                event = source.events.pop();
                if (event.allDay) {
                    newSource.events.push(event)
                } else {
                    event.start.subtract({minutes: timeZones.offsetDifference(event.start, newTimezone, oldTimezone)});
                    startStr = event.start.format(moment.ISO_8601());
                    event.end.subtract({minutes: timeZones.offsetDifference(event.end, newTimezone, oldTimezone)});
                    endStr = event.end.format(moment.ISO_8601());
                    newEvent = {
                        title: event.title,
                        end: moment(endStr).tz(CalendarConst.utc),
                        start: moment(startStr).tz(CalendarConst.utc),
                        allDay: event.allDay,
                        tbId: event.tbId,
                        info: event.info,
                        backgroundColor: event.backgroundColor
                    };
                    uiCalendarConfig.calendars.myCalendar.fullCalendar("removeEvents", event[filter]);
                    newSource.events.push(newEvent)
                }
            }
        }
        angular.extend(source, newSource);
        uiCalendarConfig.calendars.myCalendar.fullCalendar("addEventSource", newSource)
    };

    function timeZoneWatcher(newTimezone, oldTimezone) {
        $scope.currentTimeZone = newTimezone;
        self.now = timeZones.currTimeForCalendar($scope.currentTimeZone);
        _defineCurrentTime();
        changeEventsTimeZone($scope.newEvents, oldTimezone, newTimezone, CalendarConst.filter.id);
        changeEventsTimeZone($scope.userAvailabilityInfo, oldTimezone, newTimezone, CalendarConst.filter.id);
        _addPastHours()
    }

    var _getEventIndex = function (newEventId) {
        var index = null;
        angular.forEach($scope.newEvents.events, function (value, key) {
            if (value._id == newEventId) {
                index = key;
                return true
            }
        });
        return index
    };
    var _updateNewEventsData = function (event) {
        var index = _getEventIndex(event._id);
        event.start = moment(event.start.format(moment.ISO_8601())).tz(CalendarConst.utc);
        event.end = moment(event.end.format(moment.ISO_8601())).tz(CalendarConst.utc);
        $scope.newEvents.events[index].start = event.start;
        $scope.newEvents.events[index].end = event.end;
        $scope.$emit("updateProposedMeetingTimes", $scope.newEvents.events)
    };
    var _getBussinesDays = function (data) {
        var _bussinesDays = [];
        if (data) {
            var workDays = angular.fromJson(data);
            angular.forEach(TBConst.days, function (value, key) {
                if (workDays.indexOf(value.key) == -1) {
                    _bussinesDays.push(value.key)
                }
            })
        }
        return _bussinesDays
    };
    var _addPastHours = function (event) {
        var timeGridClass = ".fc-time-grid ", cellClass = timeGridClass + ".fc-bg tr td:nth-child(2)", timeFormat = currentTime.format("YYYY-MM-DD"), cellTillEnd = "td[data-date=" + timeFormat.toString() + "]", getHeightCell = $(".fc-slats").height(), getHours = currentTime.hours() - parseInt($scope.uiConfig.calendar.minTime), getMinutes = currentTime.minutes(), pastTime = 0, pastCellHeight = 0, fullHoursMinutes = (parseInt($scope.uiConfig.calendar.maxTime) - parseInt($scope.uiConfig.calendar.minTime)) * 60;
        while ($(cellClass).attr("data-date") < timeFormat) {
            $(cellClass).addClass("fc-past");
            cellClass = $(cellClass).next()
        }
        switch (true) {
            case getMinutes < 15:
                getMinutes = 15;
                break;
            case getMinutes > 15 && getMinutes < 30:
                getMinutes = 30;
                break;
            case getMinutes > 30 && getMinutes < 45:
                getMinutes = 45;
                break;
            default:
                getMinutes = 60
        }
        pastTime = (((getHours * 60) + getMinutes) * (100 / fullHoursMinutes)) / 100;
        pastCellHeight = getHeightCell * pastTime;
        $(timeGridClass + cellTillEnd).empty();
        $(timeGridClass + cellTillEnd).append('<div style="height:' + pastCellHeight + 'px;"></div>')
    };
    var _existingStartTime = function (startTime, eventId) {
        var existingStartTime = false;
        angular.forEach($scope.newEvents.events, function (value, key) {
            if (value.start.format(moment.ISO_8601()) == startTime.format(moment.ISO_8601()) && value._id != eventId) {
                existingStartTime = true
            }
        });
        return existingStartTime
    };
    var _renderWithWorkHours = function (startTime, endTime, calendarStartDay, calendarEndDay) {
        var difference_time = $scope.userInfo.ownerTimezoneOffset - moment().tz($scope.currentTimeZone).utcOffset();
        var timeFormat = "HH:mm";
        var startCheck = moment(startTime, timeFormat).minutes(moment(startTime, timeFormat).minutes() - difference_time);
        var endCheck = moment(endTime, timeFormat).minutes(moment(endTime, timeFormat).minutes() - difference_time);
        if (startCheck.format(timeFormat) > endCheck.format(timeFormat)) {
            uiCalendarConfig.calendars.myCalendar.fullCalendar("removeEvents");
            for (var m = calendarStartDay; m.isBefore(calendarEndDay); m.add(1, "days")) {
                var current = angular.copy(m);
                var startTime = angular.copy(current.set({
                    hour: startCheck.format("HH"),
                    minute: startCheck.format("mm")
                }));
                var endTime = angular.copy(current.set({hour: endCheck.format("HH"), minute: endCheck.format("mm")}));
                $scope.userAvailabilityInfo.events.push({
                    start: endTime.tz(CalendarConst.utc),
                    end: startTime.tz(CalendarConst.utc),
                    title: "",
                    isAvailability: true
                })
            }
            uiCalendarConfig.calendars.myCalendar.fullCalendar("addEventSource", $scope.userAvailabilityInfo)
        } else {
            $scope.uiConfig.calendar.minTime = startCheck.format(timeFormat);
            $scope.uiConfig.calendar.maxTime = endCheck.format(timeFormat)
        }
    };
    var _pushNewEventsIntoCalendarDurationLimited = function (start, duration) {
        var allowAddEvent = true;
        if (duration) {
            angular.forEach($scope.userAvailabilityInfo.events, function (value, key) {
                if (start < value.start && value.start < moment(start).minutes(moment(start).minutes() + duration)) {
                    allowAddEvent = false
                }
            })
        }
        if (allowAddEvent) {
            $scope.newEvents.events.push({
                start: moment(start).tz(CalendarConst.utc),
                end: moment(start).minutes(moment(start).minutes() + duration).tz(CalendarConst.utc),
                isNew: true
            })
        } else {
            alert("Sorry, you cannot propose meeting time when " + $scope.userInfo.first_name + " is busy.")
        }
    };
    var _pushNewEventsIntoCalendar = function (start, end) {
        $scope.newEvents.events.push({
            start: moment(start).tz(CalendarConst.utc),
            end: moment(end).tz(CalendarConst.utc),
            isNew: true
        })
    };
    var _getAvailableDays = function (data) {
        var _bussinesDays = [];
        if (data) {
            var workDays = angular.fromJson(data);
            angular.forEach(workDays, function (value, key) {
                if (value.checked == false) {
                    _bussinesDays.push(key)
                }
            })
        }
        return _bussinesDays
    };
    var _defineCurrentTime = function () {
        if ($scope.userInfo.eventType) {
            currentTime = self.now.minutes(self.now.minutes() + $scope.userInfo.eventType.scheduledInAdvance).tz(CalendarConst.utc)
        } else {
            currentTime = self.now
        }
    };
    var _handleEventOutOfCalendarRange = function (event) {
        event.start = _meetingTimeStorage.start;
        event._start = _meetingTimeStorage.start;
        event.end = _meetingTimeStorage.end;
        event._end = _meetingTimeStorage.end;
        _updateNewEventsData(event)
    };
    var _isOutOfCalendarRange = function (start, end) {
        var timeFormat = "HH:mm";
        var endTime = moment(start).minutes(moment(start).minutes() + $scope.userInfo.eventType.duration);
        if ($scope.uiConfig.calendar.minTime == TBConst.calendar.minTime && $scope.uiConfig.calendar.maxTime == TBConst.calendar.maxTime) {
            if ($scope.userInfo.eventType.duration) {
                return start.format(timeFormat) > endTime.format(timeFormat)
            } else {
                return start.format(timeFormat) < end.format(timeFormat)
            }
        } else {
            if ($scope.userInfo.eventType.duration) {
                return (start.format(timeFormat) < $scope.uiConfig.calendar.minTime || endTime.format(timeFormat) > $scope.uiConfig.calendar.maxTime)
            } else {
                return (start.format(timeFormat) < $scope.uiConfig.calendar.minTime || end.format(timeFormat) > $scope.uiConfig.calendar.maxTime)
            }
        }
    }
});
function MeetWithMeReplyController($scope, $mdDialog, $location, authenticated) {
    $scope.eventsLoaded = true;
    $scope.showDeclineMeetingModal = function () {
        $mdDialog.show({
            controller: MeetingDeclineDialogController,
            templateUrl: "../../../static/js/app/meet-with-me/view/meeting-decline-popup.html",
            meetingInfo: $scope.meeting
        })
    };
    $scope.$on("mwmRequestedMeetingInfo", function (event, data) {
        if (!authenticated) {
            $mdDialog.show({
                controller: HandleDialogController,
                templateUrl: "../../../static/js/app/partials/view/login-popup.html",
                locals: {showSignUp: false, message: "Please login to confirm<br/>the meeting request"}
            })
        } else {
            if (data.meeting.status != MeetingStatuses.proposed) {
                $location.path("/meeting/" + data.meeting.id);
                $location.replace()
            } else {
                $scope.meeting = data.meeting;
                $scope.showMap = $scope.meeting.location.lat != 0 || false;
                _getUrlParameters();
                $scope.eventsLoaded = false
            }
        }
    });
    $scope.$on("confirmMwmRequestedTime", function (event, data) {
        $scope.meeting.acceptedTime = data;
        _meetingReplyPopUp()
    });
    var _getUrlParameters = function () {
        var urlParameter = $location.search();
        if (urlParameter) {
            if (urlParameter.start == "decline") {
                $scope.showDeclineMeetingModal()
            } else {
                if (urlParameter.start && urlParameter.end) {
                    urlParameter.start = moment(urlParameter.start);
                    urlParameter.end = moment(urlParameter.end);
                    $scope.meeting.acceptedTime = urlParameter;
                    _meetingReplyPopUp()
                }
            }
        }
    };
    var _meetingReplyPopUp = function () {
        $mdDialog.show({
            controller: MeetingReplyDialogController,
            templateUrl: "../../../static/js/app/meet-with-me/view/meeting-reply-popup.html",
            meetingInfo: $scope.meeting
        })
    }
}
function MeetingReplyDialogController($scope, $rootScope, $window, $location, $mdDialog, timebridgeService, timeZones, meetingInfo) {
    $scope.init = function () {
        $scope.meeting = meetingInfo;
        angular.forEach(meetingInfo.attendees, function (attendee, key) {
            if (attendee.isOrganizer) {
                $scope.requester = attendee
            } else {
                $scope.attendee = attendee
            }
        });
        $scope.meeting.replyMessage = "Hello " + $scope.requester.name + ", " + $scope.attendee.name + " has accepted your meeting request and has added this meeting to his/her calendar."
    };
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.replyToMeeting = function () {
        var responses = {};
        angular.forEach($scope.meeting.meetingTimes, function (meetingTime, key) {
            if (moment($scope.meeting.acceptedTime.start, TBConst.outlook.connectorTimeFormat).format(timeZones.rfc3339) == meetingTime.start) {
                responses[meetingTime.start] = "yes"
            } else {
                responses[meetingTime.start] = "no"
            }
        });
        timebridgeService.sendAttendeeReply($scope.meeting.fqcode, responses, $rootScope.initialInfo.userData.time_zone, $scope.meeting.replyMessage).success(function (data) {
            $mdDialog.hide();
            $window.scrollTo(0, 0);
            $location.path("/meeting/" + $scope.meeting.id)
        }).error(function (data) {
            $scope.errorMessage = "Error: Failed when reply to meeting request."
        })
    }
}
function MeetingDeclineDialogController($scope, $window, $location, $mdDialog, timebridgeService, meetingInfo) {
    $scope.init = function () {
        $scope.meeting = meetingInfo;
        $scope.cancelDialogData = false;
        angular.forEach(meetingInfo.attendees, function (attendee, key) {
            if (attendee.isOrganizer) {
                $scope.requester = attendee
            } else {
                $scope.attendee = attendee
            }
        });
        $scope.meeting.declineMessage = "Sorry " + $scope.requester.name + ", " + $scope.attendee.name + " has declined your meeting request at this time."
    };
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.declineMeeting = function () {
        timebridgeService.cancelMwmMeeting($scope.meeting.id, {
            message: $scope.meeting.declineMessage,
            suppressNotification: $scope.cancelDialogData
        }).success(function (data) {
            $mdDialog.hide();
            $window.scrollTo(0, 0);
            $location.path("/home")
        }).error(function (data) {
            $scope.errorMessage = "Error: Failed to decline meeting request."
        })
    }
}
function MwmProposeDifferentTimesController($scope, $injector, $mdDialog, authenticated) {
    $injector.invoke(ChangeProposedTimesController, this, {
        $scope: $scope,
        authenticated: authenticated,
        $mdDialog: $mdDialog
    })
}
"use strict";
function MeetWithMeHelpController($scope, $mdDialog, $cookies, options) {
    $scope.options = options;
    $scope.hide = function () {
        if ($scope.notShowAgain) {
            $cookies.mwmShowHelp = "false"
        }
        if ($scope.notShowAgain) {
            $cookies.mwmRequestShowHelp = "false"
        }
        $mdDialog.hide()
    }
}
"use strict";
function UserUnsubscribeController($scope, $log, $http, $routeParams) {
    if ($routeParams.userEmail) {
        $http.get("/accounts/unsubscribe?email=" + $routeParams.userEmail).success(function (data, status) {
            $scope.unsubscribed = true
        }).error(function (data, status) {
            $scope.unsubscribed = false
        })
    }
}
angular.module("authController", []).controller("AuthController", function ($scope, $window, $location, $routeParams, authorizationService, $mdDialog) {
    $scope.error = "";
    $scope.regError = "";
    $scope.forgetPasswordError = "";
    $scope.regInfo = {};
    $scope.logInfo = {};
    $scope.resetInfo = {};
    $scope.isLogin = true;
    $scope.isSignup = false;
    $scope.isForgot = false;
    if ($routeParams.fname) {
        $scope.regFirstName = $routeParams.fname
    }
    if ($routeParams.lname) {
        $scope.regLastName = $routeParams.lname
    }
    if ($routeParams.email) {
        $scope.regEmail = $routeParams.email
    }
    $scope.closeModal = function () {
        $scope.showLoginModal = false
    };
    $scope.showSignUp = function () {
        $scope.isLogin = false;
        $scope.isSignup = true
    };
    $scope.showSignIn = function () {
        $scope.isLogin = true;
        $scope.isSignup = false
    };
    $scope.showForgetPassword = function () {
        $scope.isLogin = false;
        $scope.isSignup = false;
        $scope.isForgot = true
    };
    $scope.signIn = function () {
        $scope.error = "";
        authorizationService.signIn($scope.logInfo.email, $scope.logInfo.password).success(function (data) {
            $window.location.reload()
        }).error(function (data) {
            $scope.error = data
        })
    };
    $scope.signUp = function () {
        $scope.regError = "";
        if ($scope.regInfo.regTimeZone == undefined) {
            $scope.regError = "Time zone is required."
        } else {
            if ($scope.regInfo.regPassword != $scope.regInfo.regPasswordConfirm) {
                $scope.regError = "Passwords do not match."
            } else {
                authorizationService.signUp($scope.regInfo.regFirstName, $scope.regInfo.regLastName, $scope.regInfo.regEmail, $scope.regInfo.regPassword, $scope.regInfo.regPasswordConfirm, $scope.regInfo.regTimeZone).success(function (data, status) {
                    $mdDialog.hide();
                    $scope.regInfo = {};
                    $location.path("/registration/almost-complete")
                }).error(function (data) {
                    $scope.regError = data
                })
            }
        }
    };
    $scope.resetPassword = function () {
        $scope.forgetPasswordError = "";
        authorizationService.resetPassword($scope.resetInfo.resetPasswordEmail).success(function (data) {
            $scope.isForgot = false;
            $scope.isLogin = true
        }).error(function (data) {
            $scope.forgetPasswordError = "Error: " + data
        })
    }
});
angular.module("attendeeController", []).controller("AttendeeController", function ($scope, $rootScope, $timeout, $q, $routeParams, $log, timebridgeService, googleService, outlookService) {
    $scope.attendeeToAdd = null;
    $scope.attendees = [];
    $scope.userContacts = [];
    $scope.focusState = false;
    $scope.init = function () {
        $scope.userData = $rootScope.initialInfo.userData;
        if ($rootScope.initialInfo.authenticated) {
            if ($scope.userData.calendarType == TBConst.calendar.outlookCalendarType) {
                getOutlookContacts()
            }
            if ($routeParams.attendees) {
                addOutllookAttendee()
            }
            if ($routeParams.groupId && $scope.homePage == "home") {
                getGroupMember()
            }
        }
    };
    $scope.handleAddNewAttendee = function () {
        if ($scope.attendeeToAdd) {
            addNewAttendee($scope.attendeeToAdd);
            $scope.attendeeToAdd = null
        }
    };
    $scope.addAttendee = function (attendee) {
        $scope.attendeeToAdd = attendee;
        if ($scope.focusState) {
            addNewAttendee(attendee)
        }
    };
    $scope.focusIn = function () {
        $scope.focusState = true
    };
    $scope.focusOut = function () {
        $scope.focusState = false
    };
    $scope.removeAttendee = function (attendee) {
        angular.forEach($scope.attendees, function (value, key) {
            if (value.email === attendee.email) {
                $scope.attendees.splice(key, 1)
            }
        });
        $rootScope.attendees = $scope.attendees
    };
    $scope.$on("updateAttendees", function (event, value) {
        $scope.attendees = [];
        angular.forEach(value, function (value, key) {
            if (isEmailValid(value.name)) {
                $scope.attendees.push({firstname: "", lastname: "", email: value.email, avatarlink: ""})
            } else {
                $scope.attendees.push({
                    firstname: value.name,
                    lastname: "",
                    email: value.email,
                    avatarlink: value.avatarLink
                })
            }
        })
    });
    $scope.$on("removeAllAttendees", function () {
        $scope.attendees = [];
        $rootScope.attendees = []
    });
    function addNewAttendee(attendee) {
        if (attendee.originalObject.groupId) {
            $routeParams.groupId = attendee.originalObject.groupId;
            getGroupMember()
        } else {
            if (attendee.originalObject.email) {
                if (isEmailUnique(attendee.originalObject.email)) {
                    $scope.attendees.push(attendee.originalObject);
                    $rootScope.attendees = $scope.attendees
                }
            } else {
                if (attendee.originalObject && isEmailUnique(attendee.originalObject)) {
                    if (isEmailValid(attendee.originalObject)) {
                        $scope.$emit("hideDataNotificationOnHomePage");
                        $scope.searchText = "";
                        $scope.attendees.push({firstname: "", lastname: "", email: attendee.originalObject});
                        $rootScope.attendees = $scope.attendees
                    } else {
                        $scope.$emit("showDataNotificationOnHomePage", {
                            dataType: TBConst.notificationStatus.info,
                            dataTitle: "Attendees:",
                            dataBody: "Please enter valid attendee email."
                        });
                        $scope.$emit("invalidAttendeeEmail")
                    }
                }
            }
        }
    }

    function getGroupMember() {
        timebridgeService.getGroupMembers($routeParams.groupId).success(function (data, status, headers, config) {
            angular.forEach(data, function (value, key) {
                if (isEmailUnique(value.email)) {
                    $scope.attendees.push({
                        firstname: value.firstname,
                        lastname: value.lastname,
                        email: value.email,
                        avatarlink: value.avatarlink
                    })
                }
            })
        }).error(function (data, status, headers, config) {
            $scope.$emit("showDataNotificationOnHomePage", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Timebridge contacts:",
                dataBody: "Can not load group contacts."
            })
        });
        $rootScope.attendees = $scope.attendees
    }

    function getOutlookContacts() {
        outlookService.getOutlookContacts($scope.userData.outlookDomain, $scope.userData.tbSessionId, $scope.userData.emailAddresses[0][0]).success(function (data) {
            if (data.status.message == TBConst.outlook.connectionStatus) {
                var outlookContacts = [];
                angular.forEach(data.contacts, function (value, key) {
                    if (value.E.length) {
                        outlookContacts.push({firstname: value.First, lastname: value.Last, email: value.E[0]})
                    }
                });
                storeOutlookContacts(outlookContacts)
            } else {
                $scope.$emit("showDataNotificationOnHomePage", {
                    dataType: TBConst.notificationStatus.error,
                    dataTitle: "Timebridge Connector:",
                    dataBody: "Can not connect to Timebridge Connector or can not get Outlook contacts."
                })
            }
        }).error(function (data) {
            $scope.$emit("showDataNotificationOnHomePage", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Timebridge Connector:",
                dataBody: "Can not connect to Timebridge Connector."
            })
        })
    }

    function isEmailValid(email) {
        var EMAIL_REGEXP = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21| [\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))){2,6}$/i;
        var isMatchRegex = EMAIL_REGEXP.test(email);
        if (isMatchRegex || email == "") {
            return true
        } else {
            if (isMatchRegex == false) {
                return false
            }
        }
    }

    function isEmailUnique(email) {
        if ($scope.userData.emailAddresses && email == $scope.userData.emailAddresses[0][0]) {
            return false
        }
        var isUnique = true;
        angular.forEach($scope.attendees, function (value, key) {
            if ((value.email).toLowerCase() == email.toLowerCase()) {
                isUnique = false
            }
        });
        return isUnique
    }

    function addOutllookAttendee() {
        var allAttenddes = $routeParams.attendees.split(",");
        var regex = (/\<([^\]]*)\>/g);
        angular.forEach(allAttenddes, function (attendee, key) {
            var att = attendee.match(regex);
            if (att && att.length) {
                var newAttendee = att[0].replace("<", "").replace(">", "");
                if (isEmailUnique(newAttendee) && isEmailValid(newAttendee)) {
                    $scope.attendees.push({firstname: "", lastname: "", email: newAttendee})
                }
            }
        });
        $rootScope.attendees = $scope.attendees
    }

    function storeOutlookContacts(outlookContacts) {
        outlookService.saveOutlookContacts(outlookContacts).success(function (data) {
            $log.info("Outlook contacts successfully stored")
        }).error(function (data) {
            $log.info("Failed to store Outlook contacts")
        })
    }
});
"use strict";
function HandleCancelMeetingController($scope, $mdDialog, timebridgeService, notifications, meetingPageService) {
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.initCancelForm = function () {
        $scope.cancelDialogData = {};
        timebridgeService.getCancelFormDefaults($scope.meeting.id).success(function (data) {
            $scope.cancelDialogData = data
        })
    };
    $scope.submitCancelForm = function () {
        timebridgeService.cancelMeeting($scope.meeting.id, $scope.cancelDialogData).success(function (data) {
            notifications.showNotification($scope, TBConst.notificationStatus.success, "Canceled:", "Meeting successfully canceled.");
            $scope.meeting = data;
            if ($scope.meeting.isConfirmed) {
                meetingPageService.restrictTimesToConfirmed($scope)
            }
            $scope.showCancelDialog = false;
            $mdDialog.hide()
        }).error(function (data) {
            notifications.showNotification($scope, TBConst.notificationStatus.error, "Meeting not canceled:", data);
            $mdDialog.hide()
        })
    }
}
"use strict";
function HandleCancelMeetingController($scope, $mdDialog, timebridgeService, notifications, meetingPageService) {
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.initCancelForm = function () {
        $scope.cancelDialogData = {};
        timebridgeService.getCancelFormDefaults($scope.meeting.id).success(function (data) {
            $scope.cancelDialogData = data
        })
    };
    $scope.submitCancelForm = function () {
        timebridgeService.cancelMeeting($scope.meeting.id, $scope.cancelDialogData).success(function (data) {
            notifications.showNotification($scope, TBConst.notificationStatus.success, "Canceled:", "Meeting successfully canceled.");
            $scope.meeting = data;
            if ($scope.meeting.isConfirmed) {
                meetingPageService.restrictTimesToConfirmed($scope)
            }
            $scope.showCancelDialog = false;
            $mdDialog.hide()
        }).error(function (data) {
            notifications.showNotification($scope, TBConst.notificationStatus.error, "Meeting not canceled:", data);
            $mdDialog.hide()
        })
    }
}
function ConfirmMeetingDialogController($scope, $rootScope, $mdDialog, $location, timebridgeService, meetingId, confirmedTime) {
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.formData = {message: "", suppress_notification: false, existing_start: confirmedTime.start};
    if ($rootScope.initialInfo.userData.dateFormat == ViewDateFormat[1].viewFormat) {
        $scope.dateFormat = "EEE d/M"
    } else {
        $scope.dateFormat = "EEE M/d"
    }
    $scope.confirmedTime = confirmedTime;
    $scope.dateFormats = DefaultDatetimeFormats;
    $scope.submitConfirmMeetingTimeForm = function () {
        timebridgeService.submitConfirmMeetingTimeForm(meetingId, $scope.formData).success(function () {
            $mdDialog.hide();
            backToMeetingPage()
        }).error(function () {
            backToMeetingPage()
        })
    };
    function backToMeetingPage() {
        $location.path("/meeting/" + meetingId);
        $location.replace()
    }
}
function HandleEmailAttendeesController($scope, $mdDialog, timebridgeService, notifications, meetingId) {
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.toggleSelectAll = function () {
        var i, check = $scope.allAttendeesSelected;
        for (i = 0; i < $scope.emailAttendeesFormChoices.send_to.length; i++) {
            $scope.emailAttendeesFormChoices.send_to[i].checked = check
        }
    };
    $scope.initEmailAttendeesForm = function () {
        $scope.allAttendeesSelected = false;
        $scope.emailAttendeesFormErrors = {required: false};
        $scope.emailAttendeesData = {};
        timebridgeService.getEmailAttendeesFormChoices(meetingId).success(function (data) {
            var i;
            angular.forEach(data, function (value, key) {
                for (i = 0; i < value.length; i++) {
                    value[i] = {value: value[i][0], label: value[i][1], checked: false}
                }
            });
            $scope.emailAttendeesFormChoices = data
        })
    };
    $scope.submitEmailAttendeesForm = function () {
        angular.forEach($scope.emailAttendeesFormChoices, function (value, key) {
            $scope.emailAttendeesData[key] = value.filter(function (element, index, array) {
                return element.checked
            }).map(function (element, index, array) {
                return element.value
            })
        });
        if ($scope.emailAttendeesData.send_to.length > 0) {
            timebridgeService.sendAttendeesEmails(meetingId, $scope.emailAttendeesData).success(function (data) {
                notifications.showNotification($scope.$parent, TBConst.notificationStatus.success, "Email Sent", data);
                $mdDialog.hide()
            }).error(function (data) {
                notifications.showNotification($scope.$parent, TBConst.notificationStatus.error, "Error", data);
                $mdDialog.hide()
            })
        } else {
            $scope.emailAttendeesFormErrors.required = true
        }
    }
}
function HandleDialogController($scope, $rootScope, $mdDialog, $sce, showSignUp, message) {
    $scope.showLoginModal = false;
    $scope.isLogin = true;
    $scope.isSignup = false;
    if (showSignUp) {
        $scope.showLoginModal = true;
        $scope.isLogin = false;
        $scope.isSignup = true
    } else {
        $scope.message = $sce.trustAsHtml(message);
        $scope.showLoginModal = true;
        $scope.isLogin = true;
        $scope.isSignup = false
    }
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.hideSurvey = function () {
        $rootScope.$broadcast("showDataNotification", {dataType: TBConst.notificationStatus.survey});
        $mdDialog.hide()
    };
    $scope.referenceToSurvey = function () {
        $mdDialog.hide()
    }
}
function InviteAttendeesDialogController($scope, $route, $mdDialog, timebridgeService, meetingId) {
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.inviteAttendeesFormErrors = {required: false, email: false};
    $scope.$on("invalidAttendeeEmail", function (event, data) {
        $scope.inviteAttendeesFormErrors.invalidEmail = true
    });
    $scope.submitInviteAttendeesForm = function () {
        $scope.inviteAttendeesFormErrors.message = false;
        $scope.inviteAttendeesFormErrors.required = false;
        $scope.inviteAttendeesFormErrors.newAttendee = false;
        $scope.inviteAttendeesFormErrors.invalidEmail = false;
        if (!$scope.$$childTail.attendees.length) {
            $scope.inviteAttendeesFormErrors.required = true
        } else {
            if (!$scope.$$childTail.attendeeMessage) {
                $scope.inviteAttendeesFormErrors.message = true
            } else {
                $scope.inviteAttendeesFormErrors.required = false;
                $scope.inviteAttendeesFormErrors.email = false;
                var data = {newAttendees: $scope.$$childTail.attendees, message: $scope.$$childTail.attendeeMessage};
                timebridgeService.sendInviteAttendeesForm(meetingId, data).success(function (data) {
                    $mdDialog.hide();
                    $route.reload()
                }).error(function (data) {
                    $scope.invalidEmailsMessage = data;
                    $scope.inviteAttendeesFormErrors.newAttendee = true
                })
            }
        }
    }
}
angular.module("notificationController", []).controller("NotificationController", function ($scope, $window) {
    $scope.closeNotification = function () {
        $scope.successNotification = false;
        $scope.errorNotification = false;
        $scope.infoNotification = false;
        $scope.surveyNotification = false;
        $scope.notificationTitle = "";
        $scope.notificationInfo = ""
    };
    $scope.$on("showDataNotification", function (event, data) {
        $window.scrollTo(0, 0);
        $scope.infoNotification = false;
        $scope.errorNotification = false;
        $scope.successNotification = false;
        $scope.surveyNotification = false;
        if (data.dataType == TBConst.notificationStatus.success) {
            $scope.successNotification = true
        } else {
            if (data.dataType == TBConst.notificationStatus.error) {
                $scope.errorNotification = true
            } else {
                if (data.dataType == TBConst.notificationStatus.info) {
                    $scope.infoNotification = true
                } else {
                    if (data.dataType == TBConst.notificationStatus.survey) {
                        $scope.surveyNotification = true
                    }
                }
            }
        }
        $scope.notificationClass = data.dataType;
        $scope.notificationTitle = data.dataTitle;
        $scope.notificationInfo = data.dataBody
    });
    $scope.$on("hideDataNotification", function (event, data) {
        $scope.successNotification = false;
        $scope.errorNotification = false;
        $scope.infoNotification = false;
        $scope.surveyNotification = false
    })
});
function RemoveAttendeesDialogController($scope, $route, $mdDialog, timebridgeService) {
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.toggleSelectAll = function () {
        var i, check = $scope.allAttendeesSelected;
        for (i = 0; i < $scope.removeAttendeesData.remove.length; i++) {
            $scope.removeAttendeesData.remove[i].checked = check
        }
    };
    $scope.attendeesToList = function (attendees) {
        return attendees.filter(function (attendee) {
            return attendee.checked
        }).map(function (attendee) {
            return attendee.label
        }).join(", ")
    };
    $scope.initRemoveAttendeesForm = function () {
        $scope.allAttendeesSelected = false;
        $scope.emailAttendeesFormErrors = {required: false};
        $scope.removeAttendeesData = {remove: [], message: ""};
        for (var i = 0; i < $scope.meeting.attendees.length; i++) {
            if (!$scope.meeting.attendees[i].isOrganizer) {
                $scope.removeAttendeesData.remove.push({
                    value: $scope.meeting.attendees[i].id,
                    label: $scope.meeting.attendees[i].name,
                    checked: false
                })
            }
        }
    };
    $scope.submitRemoveAttendeesForm = function () {
        var formData = angular.extend({}, $scope.removeAttendeesData);
        formData.remove = formData.remove.filter(function (element) {
            return element.checked
        }).map(function (element) {
            return element.value
        });
        if (formData.remove.length > 0) {
            timebridgeService.sendRemoveAttendeesForm($scope.meeting.id, formData).success(function (data) {
                $mdDialog.hide();
                $route.reload()
            }).error(function (data) {
                $mdDialog.hide();
                $route.reload()
            })
        } else {
            $scope.emailAttendeesFormErrors.required = true
        }
    }
}
"use strict";
function ReplyHelpDialogController($scope, $mdDialog, timebridgeService) {
    $scope.hide = function () {
        if ($scope.notShowAgain) {
            timebridgeService.setReplyHelpDialogPrefs("0")
        }
        $mdDialog.hide()
    };
    $scope.notShowAgain = false
}
angular.module("timeZonesController", []).controller("TimeZonesController", function ($scope, $rootScope, timeZones) {
    $scope.init = function () {
        timeZones.initTimeZoneData().then(function () {
            $scope.timeZones = {
                currentTimezone: $rootScope.initialInfo.userData.time_zone,
                options: $rootScope.timeZoneList
            }
        })
    };
    $scope.changeTimezone = function () {
        $rootScope.initialInfo.userData.time_zone = $scope.timeZones.currentTimezone;
        if ($rootScope.initialInfo.authenticated || $rootScope.initialInfo.invited) {
            timeZones.changeUsersTimeZone($scope.timeZones.currentTimezone)
        }
    };
    $scope.$on("updateTimeZone", function () {
        $scope.timeZones.currentTimezone = $rootScope.initialInfo.userData.time_zone
    })
});
function UpdateTimesDialogController($scope, $rootScope, $mdDialog, $location, timebridgeService, meetingId, times) {
    $scope.hide = function () {
        $mdDialog.hide()
    };
    $scope.cancel = function () {
        $mdDialog.cancel()
    };
    $scope.formData = {message: "", suppressNotification: false, proposedTimes: times.allTimes};
    $scope.addedTimes = times.addedTimes;
    $scope.removedTimes = times.removedTimes;
    $scope.dateFormats = DefaultDatetimeFormats;
    if ($rootScope.initialInfo.userData.dateFormat == ViewDateFormat[1].viewFormat) {
        $scope.dateFormat = "EEE d/M"
    } else {
        $scope.dateFormat = "EEE M/d"
    }
    $scope.submitUpdateProposedTimesForm = function () {
        timebridgeService.submitUpdateProposedTimesForm(meetingId, $scope.formData).success(function () {
            backToMeetingPage(meetingId)
        }).error(function () {
            backToMeetingPage(meetingId)
        })
    };
    function backToMeetingPage(meetingId) {
        $location.path("/meeting/" + meetingId);
        $location.replace();
        $mdDialog.hide()
    }
}
angular.module("calendarNotificationController", []).controller("CalendarNotificationController", function ($scope) {
    $scope.showMainVeiw = true;
    $scope.showDownloadOutlook = false;
    $scope.showAfterDownloadOurlook = false;
    $scope.startOutlookConnect = function () {
        $scope.showMainVeiw = false;
        $scope.showDownloadOutlook = true
    };
    $scope.startDownloadOutlookConnector = function () {
        $scope.showMainVeiw = false;
        $scope.showDownloadOutlook = false;
        $scope.showAfterDownloadOurlook = true
    }
});
"use strict";
function UserRegistrationController($scope, $location, $routeParams, timebridgeService) {
    var self = this;
    self.userCode = $routeParams.userCode;
    $scope.userInfo = {};
    $scope.userData = {};
    $scope.userInfo.userCode = self.userCode;
    $scope.showSetPasswordForm = false;
    $scope.veryfied = false;
    $scope.init = function () {
        timebridgeService.getEmailVerificationInfo($scope.userInfo).success(function (data, status) {
            if (data.haspassword == 0) {
                $scope.showSetPasswordForm = true
            }
            $scope.userData = data
        }).error(function (data, status) {
            $location.path("/");
            $location.replace()
        }).then(function () {
            if ($scope.userData.haspassword == 1) {
                $scope.showSetPasswordForm = false;
                $scope.veryfied = true
            }
        })
    };
    $scope.setPassword = function () {
        timebridgeService.setEmailPassword($scope.userInfo).success(function (data) {
            $scope.showSetPasswordForm = false;
            $scope.veryfied = true
        }).error(function (data, status) {
            $scope.$broadcast("showDataNotification", {
                dataType: TBConst.notificationStatus.error,
                dataTitle: "Error:",
                dataBody: data
            });
            $scope.error = status
        })
    }
}
function NotificationModalWindowController($scope, $mdDialog, $window, $location, title, message, options) {
    $scope.title = title;
    $scope.message = message;
    if (options.underButtonMessage) {
        $scope.underButtonMessage = options.underButtonMessage
    }
    $scope.close = function () {
        $mdDialog.hide();
        if (options.redirectUrl) {
            $window.scrollTo(0, 0);
            $location.path(options.redirectUrl)
        }
    }
}
"use strict";
var TBService = angular.module("tbServices", []);
TBService.service("tbAuth", function tbAuth($q, $http, $cookies, $rootScope) {
    var authData = $http.get("/accounts/status").then(function (payload) {
        $rootScope.initialInfo = payload.data;
        return angular.fromJson(payload.data.authenticated)
    });
    return {
        authenticationStatus: function () {
            return authData
        }
    }
});
angular.module("authorizationService", []).service("authorizationService", function tbAuth($http) {
    var _signInUrl = "/accounts/login";
    var _signUpUrl = "/accounts/register";
    var _resetPasswordUrl = "/accounts/reset-password";

    function signIn(email, password) {
        return $http.post(_signInUrl, {email: email, password: password})
    }

    function signUp(firstName, lastName, email, password, passwordConfirm, timezone) {
        return $http.post(_signUpUrl, {
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password,
            password_confirm: passwordConfirm,
            time_zone: timezone
        })
    }

    function resetPassword(email) {
        return $http.post(_resetPasswordUrl, {email: email})
    }

    return {signIn: signIn, signUp: signUp, resetPassword: resetPassword}
});
var GoogleService = angular.module("googleService", []);
GoogleService.service("googleService", function googleService($http) {
    var _getGoogleEventsUrl = "/api/events";
    var _disconnectGoogleCalendarUrl = "/api/disconnect";
    var _syncWithGoogleCalendarUrl = "/api/sync";
    var _googleContactsUrl = "/api/contacts";

    function disconnectGoogleCalendar() {
        return $http.get(_disconnectGoogleCalendarUrl)
    }

    function loadGoogleEvents(startTime, endTime, timeZone) {
        return $http({
            method: "GET",
            url: _getGoogleEventsUrl,
            params: {start: startTime, end: endTime, tzid: timeZone}
        })
    }

    function loadGoogleContacts() {
        return $http.get(_googleContactsUrl)
    }

    function syncWithGoogleCalendar() {
        return $http.get(_syncWithGoogleCalendarUrl)
    }

    return {
        loadGoogleEvents: loadGoogleEvents,
        loadGoogleContacts: loadGoogleContacts,
        disconnectGoogleCalendar: disconnectGoogleCalendar,
        syncWithGoogleCalendar: syncWithGoogleCalendar
    }
});
"use strict";
var NotificationServices = angular.module("notificationServices", []);
NotificationServices.service("notifications", function notifications() {
    function showNotificationsFromResponse(scope, requestData) {
        if (requestData.messages) {
            for (var i = 0; i < requestData.messages.length; i++) {
                showNotification(scope, requestData.messages[i].status, "", requestData.messages[i].text)
            }
        }
    }

    function showNotification(scope, type, title, message) {
        scope.$broadcast("showDataNotification", {dataType: type, dataTitle: title, dataBody: message})
    }

    return {showNotification: showNotification, showNotificationsFromResponse: showNotificationsFromResponse}
});
angular.module("outlookService", []).service("outlookService", function outlookService($http) {
    var _сallbackParam = "JSON_CALLBACK";
    var _connectorStatusUrl = "/connectorinformation";
    var _disconnectOutlookUrl = "/api/disconnect_outlook";
    var _outlookContactsUrl = "/contacts";
    var _outlookEventsUrl = "/events";
    var _storeOutlookContactsUrl = "/accounts/outlook-contacts";
    var _outlookEventsForMwmUrl = "/meet/events";

    function checkOutlookConnectorStatus(outlookConnectorDomain, tbSessionId) {
        return $http.jsonp(outlookConnectorDomain + _connectorStatusUrl, {
            params: {
                callback: _сallbackParam,
                sessionId: tbSessionId,
                callbackParam: (new Date()).getTime()
            }
        })
    }

    function getOutlookEvents(outlookConnectorDomain, tbSessionId, startTime, endTime, userEmail, currentTimeZone) {
        return $http.jsonp(outlookConnectorDomain + _outlookEventsUrl, {
            params: {
                start: startTime,
                end: endTime,
                userid: userEmail,
                callback: _сallbackParam,
                sessionid: tbSessionId,
                callbackParam: (new Date()).getTime(),
                tzid: currentTimeZone
            }
        })
    }

    function getOutlookContacts(outlookConnectorDomain, tbSessionId, userEmail) {
        return $http.jsonp(outlookConnectorDomain + _outlookContactsUrl, {
            params: {
                mask: "basic,phones",
                callback: _сallbackParam,
                sessionId: tbSessionId,
                userid: userEmail,
                callbackParam: (new Date()).getTime()
            }
        })
    }

    function disconnect() {
        return $http.get(_disconnectOutlookUrl)
    }

    function saveOutlookContacts(outlookContacts) {
        return $http.post(_storeOutlookContactsUrl, outlookContacts)
    }

    function saveOutlookEventsForMwm(events, timezone) {
        return $http.post(_outlookEventsForMwmUrl, {events: events, timezone: timezone})
    }

    return {
        checkOutlookConnectorStatus: checkOutlookConnectorStatus,
        getOutlookEvents: getOutlookEvents,
        getOutlookContacts: getOutlookContacts,
        disconnect: disconnect,
        saveOutlookContacts: saveOutlookContacts,
        saveOutlookEventsForMwm: saveOutlookEventsForMwm
    }
});
var TimebridgeService = angular.module("timebridgeService", []);
TimebridgeService.service("timebridgeService", function timebridgeService($http, $window, $log) {
    var _accountSettingsUrl = "/accounts/settings", _confirmMeetingTimeUrl = "/meeting/update-confirmed-time/", _deactivateAccountUrl = "/accounts/deactivate", _getTimebridgeEventsUrl = "/meeting/meetings", _cancelMeetingUrl = "/meeting/cancel/", _emailAttendeesUrl = "/meeting/email-attendees/", _inviteAttendeesUrl = "/meeting/invite-attendees/", _logoutUrl = "/accounts/logout", _meetingInfoUrl = "/meeting/", _meetingReplyUrl = "/meeting/reply/", _remindAttendeesUrl = "/meeting/remind-attendees/", _removeAttendeesUrl = "/meeting/remove-attendees/", _replyHelpDialogUrl = "/accounts/reply-help-dialog", _snoozeMeetingEmailUrl = "/meeting/snooze/", _statusMessagesUrl = "/accounts/status-messages", _updateAvailabilityUrl = "/meeting/update-availability/", _updateProposedTimesUrl = "/meeting/update-proposed-times/", _userContactsUrl = "/accounts/contacts", _userContactsSearchUrl = "/accounts/contacts/search", _userUpdateUrl = "/accounts/update", _userCallInfoUrl = "/accounts/user-call-info", _sendVerificationEmailUrl = "/accounts/verify", _userLocationsUrl = "/accounts/locations", _groupsUrl = "/groups/", _createNewGroupUrl = "/groups/create", _getUserGroupsUrl = "/groups/my-groups", _meetNowMeetingUrl = "/meeting/meet-now", _editMeetingUrl = "/meeting/edit", _meetWithMeUrl = "/meet/", _meetWithMeInfoUrl = "/meet/info/", _meetWithMeSettingsUrl = "/meet/settings", _meetWithMeEventTypeUrl = "/meet/event-type", _cancelMwmMeetingUrl = "/meet/cancel/", _emailVerificationUrl = "/accounts/emailverification/", _deleteAvatarUrl = "/branding/avatars";
    var logout = function () {
        $http.get(_logoutUrl).success(function (data, status, headers, config) {
            $window.location.reload();
            $log.info("User logged out.")
        })
    };

    function cancelMeeting(meetingId, cancelOptions) {
        return $http.post(_cancelMeetingUrl + meetingId, cancelOptions)
    }

    function cancelMwmMeeting(meetingId, message) {
        return $http.post(_cancelMwmMeetingUrl + meetingId, message)
    }

    function getCancelFormDefaults(meetingId) {
        return $http.get(_cancelMeetingUrl + meetingId)
    }

    function getConfirmTimeMeetingInfo(meetingId) {
        return $http.get(_confirmMeetingTimeUrl + meetingId)
    }

    function getEmailAttendeesFormChoices(meetingId) {
        return $http.get(_emailAttendeesUrl + meetingId)
    }

    function getMeetingInfo(meetingId) {
        return $http.get(_meetingInfoUrl + meetingId)
    }

    function getProposedTimes(meetingId) {
        return $http.get(_updateProposedTimesUrl + meetingId)
    }

    function getReplyMeetingInfo(meetingCode) {
        return $http.get(_meetingReplyUrl + meetingCode)
    }

    function getStatusMessages() {
        return $http.get(_statusMessagesUrl)
    }

    function getUpdateAvailabilityInfo(meetingId) {
        return $http.get(_updateAvailabilityUrl + meetingId)
    }

    function getUserCallInfo() {
        return $http.get(_userCallInfoUrl)
    }

    var loadAccountSettings = function () {
        return $http.get(_accountSettingsUrl)
    };
    var loadTimebridgeEvents = function (startTime, endTime) {
        return $http.get(_getTimebridgeEventsUrl, {params: {start: startTime, end: endTime}})
    };
    var loadTimebridgeContacts = function () {
        return $http.get(_userContactsUrl)
    };
    var loadFilteredUserContacts = function (query) {
        return $http.get(_userContactsSearchUrl + "?q=" + query)
    };
    var saveAccountSettings = function (data) {
        return $http.post(_accountSettingsUrl, data)
    };
    var updateUserInfo = function (data) {
        return $http.put(_userUpdateUrl, data)
    };
    var deleteUserInfo = function (data) {
        return $http.post(_userUpdateUrl, data)
    };
    var deactivateAccount = function () {
        return $http.post(_deactivateAccountUrl)
    };
    var loadUserLocations = function () {
        return $http.get(_userLocationsUrl)
    };

    function sendAttendeeReply(meetingCode, responses, timeZone, message) {
        return $http.post(_meetingReplyUrl + meetingCode, {responses: responses, timeZone: timeZone, message: message})
    }

    function sendAttendeesEmails(meetingId, data) {
        return $http.post(_emailAttendeesUrl + meetingId, data)
    }

    function sendInviteAttendeesForm(meetingId, data) {
        return $http.post(_inviteAttendeesUrl + meetingId, data)
    }

    function sendRemindAttendees(meetingId) {
        return $http.get(_remindAttendeesUrl + meetingId)
    }

    function sendRemoveAttendeesForm(meetingId, data) {
        return $http.post(_removeAttendeesUrl + meetingId, data)
    }

    function sendSnoozeStatusEmail(meetingId, delay) {
        return $http.get(_snoozeMeetingEmailUrl + meetingId, {params: {delay: delay}})
    }

    function setReplyHelpDialogPrefs(show) {
        return $http.post(_replyHelpDialogUrl, {show_help_dialog: show})
    }

    function submitConfirmMeetingTimeForm(meetingId, data) {
        return $http.post(_confirmMeetingTimeUrl + meetingId, data)
    }

    function submitUpdateAvailability(meetingId, attendeeResponses, timeZone) {
        return $http.post(_updateAvailabilityUrl + meetingId, {responses: attendeeResponses, timeZone: timeZone})
    }

    function submitUpdateProposedTimesForm(meetingId, data) {
        return $http.post(_updateProposedTimesUrl + meetingId, data)
    }

    function sendVerificationEmail(email_addresses) {
        return $http.put(_sendVerificationEmailUrl, email_addresses)
    }

    function createNewGroup(data) {
        return $http.post(_createNewGroupUrl, data)
    }

    function editGroup(groupId, data) {
        return $http.put(_groupsUrl + groupId, data)
    }

    function getUserGroups() {
        return $http.get(_getUserGroupsUrl)
    }

    function getGroupInfo(groupId) {
        return $http.get(_groupsUrl + groupId)
    }

    function deleteGroup(groupId) {
        return $http({url: _groupsUrl + groupId, method: "DELETE"})
    }

    function addNewGroupMember(groupId, data) {
        return $http.post("/groups/" + groupId + "/members", data)
    }

    function getGroupMembers(groupId) {
        return $http.get("/groups/" + groupId + "/members")
    }

    function removeGroupMember(groupId, memberId) {
        return $http({url: "/groups/" + groupId + "/member/" + memberId, method: "DELETE"})
    }

    function emailGroupMembers(groupId, data) {
        return $http.put("/groups/" + groupId + "/members", data)
    }

    function meetRightNowGroup(data) {
        return $http.post(_meetNowMeetingUrl, data)
    }

    function editMeeting(data) {
        return $http.put(_editMeetingUrl, data)
    }

    function getMeetWithMeUserAvailability(userPersonalUrl, startTime, endTime, timezoneName) {
        return $http.get(_meetWithMeUrl + userPersonalUrl, {
            params: {
                start: startTime,
                end: endTime,
                tzid: timezoneName
            }
        })
    }

    function getMeetWithMeUserInfo(userPersonalUrl, eventTypeUrl) {
        return $http.get(_meetWithMeInfoUrl + userPersonalUrl, {params: {eventTypeUrl: eventTypeUrl}})
    }

    function saveMeetWithMeSettings(data) {
        return $http.put(_meetWithMeSettingsUrl, data)
    }

    function getMeetWithMeSettings() {
        return $http.get(_meetWithMeSettingsUrl)
    }

    function saveMwmEventType(data) {
        return $http.post(_meetWithMeEventTypeUrl, data)
    }

    function updateMwmEventType(data) {
        return $http.put(_meetWithMeEventTypeUrl, data)
    }

    function deleteMwmEventType(eventTypeId) {
        return $http({url: _meetWithMeEventTypeUrl, method: "DELETE", data: eventTypeId})
    }

    function requestMeetWithMeMeeting(userPersonalUrl, requestedMeetingInfo) {
        return $http.post(_meetWithMeUrl + userPersonalUrl, requestedMeetingInfo)
    }

    function getEmailVerificationInfo(data) {
        return $http.get(_emailVerificationUrl + data.userCode)
    }

    function setEmailPassword(data) {
        return $http.post(_emailVerificationUrl + data.userCode, data)
    }

    function setRedirectUrl(redirectUrl) {
        localStorage.setItem("redirectUrl", redirectUrl)
    }

    function getRedirectUrl() {
        var redirectUrl = localStorage.getItem("redirectUrl");
        localStorage.removeItem("redirectUrl");
        return redirectUrl
    }

    function deleteAvatar() {
        return $http.put(_deleteAvatarUrl)
    }

    return {
        cancelMeeting: cancelMeeting,
        deactivateAccount: deactivateAccount,
        deleteUserInfo: deleteUserInfo,
        getEmailAttendeesFormChoices: getEmailAttendeesFormChoices,
        getCancelFormDefaults: getCancelFormDefaults,
        getConfirmTimeMeetingInfo: getConfirmTimeMeetingInfo,
        getMeetingInfo: getMeetingInfo,
        getProposedTimes: getProposedTimes,
        getReplyMeetingInfo: getReplyMeetingInfo,
        getStatusMessages: getStatusMessages,
        getUpdateAvailabilityInfo: getUpdateAvailabilityInfo,
        getUserCallInfo: getUserCallInfo,
        loadAccountSettings: loadAccountSettings,
        loadTimebridgeEvents: loadTimebridgeEvents,
        loadTimebridgeContacts: loadTimebridgeContacts,
        loadFilteredUserContacts: loadFilteredUserContacts,
        loadUserLocations: loadUserLocations,
        logout: logout,
        saveAccountSettings: saveAccountSettings,
        sendAttendeesEmails: sendAttendeesEmails,
        sendAttendeeReply: sendAttendeeReply,
        sendInviteAttendeesForm: sendInviteAttendeesForm,
        sendRemindAttendees: sendRemindAttendees,
        sendRemoveAttendeesForm: sendRemoveAttendeesForm,
        sendSnoozeStatusEmail: sendSnoozeStatusEmail,
        setReplyHelpDialogPrefs: setReplyHelpDialogPrefs,
        submitConfirmMeetingTimeForm: submitConfirmMeetingTimeForm,
        submitUpdateAvailability: submitUpdateAvailability,
        submitUpdateProposedTimesForm: submitUpdateProposedTimesForm,
        updateUserInfo: updateUserInfo,
        sendVerificationEmail: sendVerificationEmail,
        createNewGroup: createNewGroup,
        editGroup: editGroup,
        getUserGroups: getUserGroups,
        deleteGroup: deleteGroup,
        addNewGroupMember: addNewGroupMember,
        getGroupInfo: getGroupInfo,
        getGroupMembers: getGroupMembers,
        removeGroupMember: removeGroupMember,
        emailGroupMembers: emailGroupMembers,
        meetRightNowGroup: meetRightNowGroup,
        editMeeting: editMeeting,
        getMeetWithMeUserAvailability: getMeetWithMeUserAvailability,
        saveMeetWithMeSettings: saveMeetWithMeSettings,
        getMeetWithMeSettings: getMeetWithMeSettings,
        getMeetWithMeUserInfo: getMeetWithMeUserInfo,
        saveMwmEventType: saveMwmEventType,
        updateMwmEventType: updateMwmEventType,
        deleteMwmEventType: deleteMwmEventType,
        requestMeetWithMeMeeting: requestMeetWithMeMeeting,
        getEmailVerificationInfo: getEmailVerificationInfo,
        cancelMwmMeeting: cancelMwmMeeting,
        setEmailPassword: setEmailPassword,
        setRedirectUrl: setRedirectUrl,
        getRedirectUrl: getRedirectUrl,
        deleteAvatar: deleteAvatar
    }
});
"use strict";
var TimeZoneService = angular.module("timeZoneServices", []);
TimeZoneService.service("timeZones", function timeZones($http, $rootScope, $q) {
    var self = this;
    self.rfc3339 = "YYYY-MM-DDTHH:mm:ss";
    self.timeZoneCurrentOffset = function (timeZoneName) {
        return moment(Date.now()).tz(timeZoneName).format("Z")
    };
    function convertToTimeZone(datetime, fromTimeZone, toTimeZone, format) {
        if (typeof(format) === "undefined") {
            format = self.rfc3339
        }
        return moment.tz(datetime, format, fromTimeZone).tz(toTimeZone).format(format)
    }

    function parseMomentAsUTC(date_str) {
        return moment(date_str + CalendarConst.utcZeroOffset).tz(CalendarConst.utc)
    }

    function timeZoneList() {
        return $http({url: "/api/time_zones", method: "GET"}).success(function (data) {
            return data
        }).error(function () {
            alert("Wasn't able to get timezones.")
        })
    }

    function offsetDifference(dateTime, newTimezone, oldTimezone) {
        return (moment.tz.zone(newTimezone).offset(dateTime) - moment.tz.zone(oldTimezone).offset(dateTime))
    }

    function changeUsersTimeZone(timeZoneName) {
        return $http({
            url: "/accounts/change-time-zone",
            method: "POST",
            data: {timeZone: timeZoneName},
            headers: {"Content-Type": "application/json; charset=utf-8"}
        })
    }

    function initTimeZoneData() {
        return $q(function (successFunc) {
            if (!$rootScope.timeZoneList) {
                timeZoneList().success(function (data) {
                    $rootScope.timeZoneList = data;
                    if (!$rootScope.initialInfo.userData.time_zone) {
                        $rootScope.initialInfo.userData.time_zone = guessCurrentTimezone($rootScope.timeZoneList)
                    }
                    successFunc()
                })
            } else {
                if (!$rootScope.initialInfo.userData.time_zone) {
                    $rootScope.initialInfo.userData.time_zone = guessCurrentTimezone($rootScope.timeZoneList)
                }
                successFunc()
            }
        })
    }

    function currTimeForCalendar(usersTimezone) {
        return parseMomentAsUTC(moment.utc(moment()).tz(usersTimezone).format(self.rfc3339))
    }

    function guessCurrentTimezone(timeZones) {
        var results = [], now = Date.now(), makekey = function (timeZoneName) {
            return [0, 4, 8, -5 * 12, 4 - 5 * 12, 8 - 5 * 12, 4 - 2 * 12, 8 - 2 * 12].map(function (months) {
                var m = moment(now + months * 30 * 24 * 60 * 60 * 1000);
                if (timeZoneName) {
                    m.tz(timeZoneName)
                }
                return m.format("DDHHmm")
            }).join(" ")
        }, lockey = makekey();
        timeZones.forEach(function (timeZone) {
            if (makekey(timeZone.name) === lockey) {
                results.push(timeZone.name)
            }
        });
        return results.length > 0 ? results[0] : CalendarConst.utc
    }

    return {
        rfc3339: self.rfc3339,
        timeZoneCurrentOffset: self.timeZoneCurrentOffset,
        convertToTimeZone: convertToTimeZone,
        currTimeForCalendar: currTimeForCalendar,
        changeUsersTimeZone: changeUsersTimeZone,
        initTimeZoneData: initTimeZoneData,
        guessCurrentTimezone: guessCurrentTimezone,
        offsetDifference: offsetDifference,
        parseMomentAsUTC: parseMomentAsUTC,
        timeZoneList: timeZoneList
    }
});