angular.module("appServices",[]).factory("userService",function($http){return{search:function(query){return $http.get("/api/bend-or/users"+(query?"?search="+query:""))},getUsers:function(alturl){return $http.get(alturl||"/api/bend-or/users")},putUser:function(userid,profile,callback){$http.put("/api/user/"+userid+"?profile="+profile).success(function(response){callback(response)}).error(function(response){callback(response)})},getProfile:function(userid){return $http.get(userid?"/api/profile/"+userid:"/api/profile")},putProfile:function(profileData){return $http.put("/api/profile",profileData)},removeProfile:function(userid,callback){$http.post("/api/profile/remove/"+userid).success(function(response){callback(response)}).error(function(response){callback(response)})},addMentor:function(url,email,userid,callback){$http.get('/api/addMentor?user={"url":"'+url+'","email":"'+email+'","userid":"'+userid+'"}').success(function(response){callback(response)}).error(function(response){callback(response)})}}}).service("geocoder",function(){this.geocode=function(georequest,outerCallback){var geocoder=new google.maps.Geocoder;geocoder.geocode(georequest,function(results,status){if(status==google.maps.GeocoderStatus.OK){var f="",addresses=[];angular.forEach(results,function(item){if("locality"==item.types[0])for(f=1;f<item.address_components.length;f++)if("administrative_area_level_1"==item.address_components[f].types[0]){addresses.push(item.address_components[0].short_name+", "+item.address_components[f].short_name);break}}),outerCallback(addresses)}else outerCallback({success:!1,err:new Error("Geocode was not successful for the following reason: "+status),results:null})})}}).service("$global",["$rootScope","EnquireService","$document",function($rootScope,EnquireService,$document){this.settings={fixedHeader:!0,headerBarHidden:!0,leftbarCollapsed:!1,leftbarShown:!1,rightbarCollapsed:!1,fullscreen:!1,layoutHorizontal:!1,layoutHorizontalLargeIcons:!1,layoutBoxed:!1};var brandColors={"default":"#ecf0f1",inverse:"#95a5a6",primary:"#3498db",success:"#2ecc71",warning:"#f1c40f",danger:"#e74c3c",info:"#1abcaf",brown:"#c0392b",indigo:"#9b59b6",orange:"#e67e22",midnightblue:"#34495e",sky:"#82c4e6",magenta:"#e73c68",purple:"#e044ab",green:"#16a085",grape:"#7a869c",toyo:"#556b8d",alizarin:"#e74c3c"};this.getBrandColor=function(name){return brandColors[name]?brandColors[name]:brandColors["default"]},$document.ready(function(){EnquireService.register("screen and (max-width: 767px)",{match:function(){$rootScope.$broadcast("globalStyles:maxWidth767",!0)},unmatch:function(){$rootScope.$broadcast("globalStyles:maxWidth767",!1)}})}),this.get=function(key){return this.settings[key]},this.set=function(key,value){this.settings[key]=value,$rootScope.$broadcast("globalStyles:changed",{key:key,value:this.settings[key]}),$rootScope.$broadcast("globalStyles:changed:"+key,this.settings[key])},this.values=function(){return this.settings}}]).factory("pinesNotifications",function(){return{notify:function(args){var notification=new PNotify(args);return notification.notify=notification.update,notification}}}).factory("progressLoader",function(){return{start:function(){$(document).skylo("start")},set:function(position){$(document).skylo("set",position)},end:function(){$(document).skylo("end")},get:function(){return $(document).skylo("get")},inch:function(amount){$(document).skylo("show",function(){$(document).skylo("inch",amount)})}}}).factory("EnquireService",["$window",function($window){return $window.enquire}]).factory("$bootbox",["$modal",function($modal){return void 0==$.fn.modal&&($.fn.modal=function(directive){var that=this;if("hide"==directive)return void(this.data("bs.modal")&&(this.data("bs.modal").close(),$(that).remove()));if("show"!=directive){var modalInstance=$modal.open({template:$(this).find(".modal-content").html()});this.data("bs.modal",modalInstance),setTimeout(function(){$(".modal.ng-isolate-scope").remove(),$(that).css({opacity:1,display:"block"}).addClass("in")},100)}}),bootbox}]).service("lazyLoad",["$q","$timeout",function($q,$t){var deferred=$q.defer(),promise=deferred.promise;this.load=function(files){return angular.forEach(files,function(file){file.indexOf(".js")>-1&&!function(d,script){var fDeferred=$q.defer();script=d.createElement("script"),script.type="text/javascript",script.async=!0,script.onload=function(){$t(function(){fDeferred.resolve()})},script.onerror=function(){$t(function(){fDeferred.reject()})},promise=promise.then(function(){return script.src=file,d.getElementsByTagName("head")[0].appendChild(script),fDeferred.promise})}(document)}),deferred.resolve(),promise}}]).filter("safe_html",["$sce",function($sce){return function(val){return $sce.trustAsHtml(val)}}]),angular.module("appDirectives",[]).directive("disableAnimation",["$animate",function($animate){return{restrict:"A",link:function($scope,$element,$attrs){$attrs.$observe("disableAnimation",function(value){$animate.enabled(!value,$element)})}}}]).directive("slideOut",function(){return{restrict:"A",scope:{show:"=slideOut"},link:function(scope,element){element.hide(),scope.$watch("show",function(newVal,oldVal){newVal!==oldVal&&element.slideToggle({complete:function(){scope.$apply()}})})}}}).directive("slideOutNav",["$timeout",function($t){return{restrict:"A",scope:{show:"=slideOutNav"},link:function(scope,element){scope.$watch("show",function(newVal){return $("body").hasClass("collapse-leftbar")?void(1==newVal?element.css("display","block"):element.css("display","none")):void(1==newVal?element.slideDown({complete:function(){$t(function(){scope.$apply()})}}):0==newVal&&element.slideUp({complete:function(){$t(function(){scope.$apply()})}}))})}}}]).directive("pulsate",function(){return{scope:{pulsate:"="},link:function(scope,element){"transparent"==element.css("background-color")&&element.css("background-color","rgba(0,0,0,0.01)"),$(element).pulsate(scope.pulsate)}}}).directive("prettyprint",function(){return{restrict:"C",link:function(scope,element){element.html(prettyPrintOne(element.html(),"",!0))}}}).directive("passwordVerify",function(){return{require:"ngModel",scope:{passwordVerify:"="},link:function(scope,element,attrs,ctrl){scope.$watch(function(){var combined;return(scope.passwordVerify||ctrl.$viewValue)&&(combined=scope.passwordVerify+"_"+ctrl.$viewValue),combined},function(value){value&&ctrl.$parsers.unshift(function(viewValue){var origin=scope.passwordVerify;return origin!==viewValue?void ctrl.$setValidity("passwordVerify",!1):(ctrl.$setValidity("passwordVerify",!0),viewValue)})})}}}).directive("backgroundSwitcher",function(){return{restrict:"EA",link:function(scope,element){$(element).click(function(){$("body").css("background",$(element).css("background"))})}}}).directive("panelControls",[function(){return{restrict:"E",require:"?^tabset",link:function(scope,element){var panel=$(element).closest(".panel");0==panel.hasClass(".ng-isolate-scope")&&$(element).appendTo(panel.find(".options"))}}}]).directive("panelControlCollapse",function(){return{restrict:"EAC",link:function(scope,element){return element.bind("click",function(){$(element).toggleClass("fa-chevron-down fa-chevron-up"),$(element).closest(".panel").find(".panel-body").slideToggle({duration:200}),$(element).closest(".panel-heading").toggleClass("rounded-bottom")}),!1}}}).directive("icheck",function($timeout){return{require:"?ngModel",link:function($scope,element,$attrs,ngModel){return $timeout(function(){var parentLabel=element.parent("label");parentLabel.length&&parentLabel.addClass("icheck-label");var value;return value=$attrs.value,$scope.$watch($attrs.ngModel,function(){$(element).iCheck("update")}),$(element).iCheck({checkboxClass:"icheckbox_minimal-blue",radioClass:"iradio_minimal-blue"}).on("ifChanged",function(event){return"checkbox"===$(element).attr("type")&&$attrs.ngModel&&$scope.$apply(function(){return ngModel.$setViewValue(event.target.checked)}),"radio"===$(element).attr("type")&&$attrs.ngModel?$scope.$apply(function(){return ngModel.$setViewValue(value)}):void 0})})}}}).directive("knob",function(){return{restrict:"EA",template:'<input class="dial" type="text"/>',scope:{options:"="},replace:!0,link:function(scope,element){$(element).knob(scope.options)}}}).directive("uiBsSlider",["$timeout",function($timeout){return{link:function(scope,element){$timeout(function(){element.slider()})}}}]).directive("jscrollpane",["$timeout",function($timeout){return{restrict:"A",scope:{options:"=jscrollpane"},link:function(scope,element){$timeout(function(){element.jScrollPane(-1!=navigator.appVersion.indexOf("Win")?$.extend({mouseWheelSpeed:20},scope.options):scope.options),element.on("click",".jspVerticalBar",function(event){event.preventDefault(),event.stopPropagation()}),element.bind("mousewheel",function(e){e.preventDefault()})})}}}]).directive("stickyScroll",function(){return{restrict:"A",link:function(scope,element,attr){function stickyTop(){var topMax=parseInt(attr.stickyScroll),headerHeight=$("header").height();if(headerHeight>topMax&&(topMax=headerHeight),0==$("body").hasClass("static-header"))return element.css("top",topMax+"px");{var window_top=$(window).scrollTop();element.offset().top}topMax>window_top?element.css("top",topMax-window_top+"px"):element.css("top","0px")}$(function(){$(window).scroll(stickyTop),stickyTop()})}}}).directive("rightbarRightPosition",function(){return{restrict:"A",scope:{isFixedLayout:"=rightbarRightPosition"},link:function(scope){scope.$watch("isFixedLayout",function(newVal,oldVal){newVal!=oldVal&&setTimeout(function(){var $pc=$("#page-content"),ending_right=$(window).width()-($pc.offset().left+$pc.outerWidth());0>ending_right&&(ending_right=0),$("#page-rightbar").css("right",ending_right)},100)})}}}).directive("fitHeight",["$window","$timeout","$location",function($window,$timeout){return{restrict:"A",scope:!0,link:function(scope,element){scope.docHeight=$(document).height();var setHeight=function(newVal){var diff=$("header").height();$("body").hasClass("layout-horizontal")&&(diff+=112),newVal-diff>element.outerHeight()?element.css("min-height",newVal-diff+"px"):element.css("min-height",$(window).height()-diff)};scope.$watch("docHeight",function(newVal){setHeight(newVal)}),$(window).on("resize",function(){setHeight($(document).height())});var resetHeight=function(){scope.docHeight=$(document).height(),$timeout(resetHeight,1e3)};$timeout(resetHeight,1e3)}}}]).directive("jscrollpaneOn",["$timeout",function($timeout){return{restrict:"A",scope:{applyon:"=jscrollpaneOn"},link:function(scope,element){scope.$watch("applyon",function(newVal){if(0==newVal){var api=element.data("jsp");return void(api&&api.destroy())}$timeout(function(){element.jScrollPane({autoReinitialise:!0})})})}}}]).directive("backToTop",function(){return{restrict:"AE",link:function(scope,element){element.click(function(){$("body").scrollTop(0)})}}}),angular.module("appControllers",[]).controller("MainController",["$scope","$window","$global","$route","$timeout","$interval","progressLoader","$location","$auth","userService",function($scope,$window,$global,$route,$timeout,$interval,progressLoader,$location,$auth,userService){$scope.style_fixedHeader=$global.get("fixedHeader"),$scope.style_headerBarHidden=$global.get("headerBarHidden"),$scope.style_layoutBoxed=$global.get("layoutBoxed"),$scope.style_fullscreen=$global.get("fullscreen"),$scope.style_leftbarCollapsed=$global.get("leftbarCollapsed"),$scope.style_leftbarShown=$global.get("leftbarShown"),$scope.style_rightbarCollapsed=$global.get("rightbarCollapsed"),$scope.style_isSmallScreen=!1,$scope.style_layoutHorizontal=$global.get("layoutHorizontal"),$scope.global={alert:void 0},$scope.hideHeaderBar=function(){$global.set("headerBarHidden",!0)},$scope.showHeaderBar=function($event){$event.stopPropagation(),$global.set("headerBarHidden",!1)},$scope.toggleLeftBar=function(){return $scope.style_isSmallScreen?$global.set("leftbarShown",!$scope.style_leftbarShown):void $global.set("leftbarCollapsed",!$scope.style_leftbarCollapsed)},$scope.toggleRightBar=function(){$global.set("rightbarCollapsed",!$scope.style_rightbarCollapsed)},$scope.$on("globalStyles:changed",function(event,newVal){$scope["style_"+newVal.key]=newVal.value}),$scope.$on("globalStyles:maxWidth767",function(event,newVal){$timeout(function(){$scope.style_isSmallScreen=newVal,newVal?$global.set("leftbarCollapsed",!1):$global.set("leftbarShown",!1)})}),$scope.$on("$routeChangeStart",function(){progressLoader.start(),progressLoader.set(50)}),$scope.$on("$routeChangeSuccess",function(){progressLoader.end()}),$scope.isAuthenticated=function(){return $auth.isAuthenticated()},$scope.search=function(query){userService.search(query).then(function(results){$scope.global.search=results.data,$location.path("/search")})},$scope.editProfile=function(){$scope.global.profile=$scope.global.user,$location.path("/profile"),$route.reload()},$scope.logOut=function(){$auth.logout().then(function(){$scope.global.user=void 0,$scope.global.alert=void 0,$location.path("/login")})},$scope.closeAlert=function(){$scope.global.alert=void 0},$scope.global.user||userService.getProfile().then(function(response){response.data.value&&($scope.global.user=response.data,$scope.global.profile||($scope.global.profile=response.data))})}]).filter("words",function(){return function(text,wordnum){return text?text.split(" ")[wordnum]:void 0}}).controller("PeopleController",["$scope","$location","userService",function($scope,$location,userService){$scope.rotateWidgetClass=function(){var arr=["'themed-background-dark'","themed-background-dark-night","themed-background-dark-amethyst","themed-background-dark-modern","themed-background-dark-autumn","themed-background-dark-flatie","themed-background-dark-spring","themed-background-dark-fancy","themed-background-dark-fire"],idx=Math.floor(Math.random()*arr.length);return arr[idx]},$scope.getUsers=function(alturl){userService.getUsers(alturl).then(function(response){$scope.users=response.data})},$scope.getUsers("/api/bend-or/users?limit=32"),$scope.viewUser=function(userindex){$scope.global.profile="/search"==$location.$$path?$scope.global.search.results[userindex]:$scope.users.results[userindex],$location.path("/profile")}}]).controller("ProfileController",["$scope","userService","$location","$auth",function($scope,userService,$location,$auth){$scope.putProfile=function(userid,profile){userService.putProfile(userid,profile,function(response){200!==response.status?($scope.global.alert={type:"danger",msg:"There was a problem: "+String(response.message)},console.warn(response.message)):($scope.profile=response.data,$scope.global.alert={type:"success",msg:"Mentor updated! "+response.data.name+" is good to go."})})},$scope.removeProfile=function(userid){userService.removeProfile(userid,function(){$location.path("/mentors"),$scope.global.alert={type:"success",msg:"Mentor removed. Hopefully they'll return some day."}})},$scope.updateProfile=function(){userService.updateProfile({displayName:$scope.global.user.displayName,email:$scope.global.user.email}).then(function(){$scope.global.alert={type:"success",msg:"Great news. Your profile has been updated."}})},$scope.link=function(provider){$auth.link(provider).then(function(){$scope.global.alert={type:"success",msg:"Well done. You have successfully linked your "+provider+" account"}}).then(function(){$scope.getProfile()}).catch(function(response){$scope.global.alert={type:"danger",msg:"Sorry, but we ran into this error: "+response.data.message}})},$scope.unlink=function(provider){$auth.unlink(provider).then(function(){$scope.global.alert={type:"success",msg:"Bam. You have successfully unlinked your "+provider+" account"}}).then(function(){$scope.getProfile()}).catch(function(response){$scope.global.alert={type:"danger",msg:"Aww, shucks. We ran into this error while unlinking your "+provider+" account: "+response.data.message}})}}]).controller("AddMentorController",["$scope","$auth","userService",function($scope,$auth,userService){$scope.addMentor=function(url,email,userid){userService.addMentor(url,email,userid,function(response){200!==response.status?($scope.global.alert={type:"danger",msg:"There was a problem: "+String(response.message)},console.warn(response.message)):$scope.global.alert={type:"success",msg:"Mentor imported! "+response.data.name+" is good to go."}})}}]).controller("LoginCtrl",["$scope","$auth","$global","$location","$route",function($scope,$auth,$global,$location,$route){$global.set("fullscreen",!0),$scope.$on("$destroy",function(){$global.set("fullscreen",!1)}),$scope.isAuthenticated=function(){return $auth.isAuthenticated()},$scope.login=function(){$auth.login({email:$scope.email,password:$scope.password}).then(function(response){$scope.global.user=response.data.user,$scope.global.alert=void 0,console.log("Logged in!")}).catch(function(response){$scope.global.alert={type:"danger",msg:"There was a problem: "+String(response.data.message)},console.warn(response.data.message)})},$scope.authenticate=function(provider){$auth.authenticate(provider).then(function(response){$scope.global.user=response.data.user,$scope.global.alert=void 0,console.log("Logged in!"),$route.reload()}).catch(function(response){$scope.global.alert={type:"danger",msg:"There was a problem: "+String(response.data.message)},console.warn(response.data.message)})}}]).controller("SignupCtrl",["$scope","$auth","$global","$location",function($scope,$auth,$global,$location){$global.set("fullscreen",!0),$scope.$on("$destroy",function(){$global.set("fullscreen",!1)}),$scope.signup=function(){$auth.signup({name:$scope.name,email:$scope.email,password:$scope.password}).then(function(){$scope.global.alert={type:"success",msg:"You're in! Registration was successful - welcome aboard."},$location.path("/login")})}}]).controller("RegistrationPageController",["$scope","$timeout",function($scope,$timeout){$scope.checking=!1,$scope.checked=!1,$scope.checkAvailability=function(){$scope.reg_form.username.$dirty!==!1&&($scope.checking=!0,$timeout(function(){$scope.checking=!1,$scope.checked=!0},500))}}]).controller("LaunchformController",["$scope","$global","$http","$q","geocoder",function($scope,$global,$http,$q,geocoder){$global.set("fullscreen",!0),$scope.$on("$destroy",function(){$global.set("fullscreen",!1)}),$scope.formData={},$scope.subscribe=function(){$http({method:"POST",url:"/sub",data:$.param({email:$scope.formData.email,city:$scope.formData.city}),headers:{"Content-Type":"application/x-www-form-urlencoded"}}).success(function(data){data.success?($scope.global.alert={type:"success",msg:"Thanks, we look forward to helping you build a vibrant startup community in <strong>"+$scope.formData.city.substr(0,$scope.formData.city.length-4)+"</strong>!  We'll be in touch soon."},$scope.formData={}):$scope.global.alert={type:"danger",msg:"Something went wrong!"}})},$scope.getLocation=function(val){var deferred=$q.defer();return geocoder.geocode({address:String(val),componentRestrictions:{country:"US"}},function(callbackResult){deferred.resolve(callbackResult)}),deferred.promise}}]).directive("scrollToBottom",function(){return{restrict:"A",scope:{model:"=scrollToBottom"},link:function(scope,element){scope.$watch("model",function(n,o){n!=o&&(element[0].scrollTop=element[0].scrollHeight)})}}}),angular.module("form-directives",[]).directive("autosize",function(){return{restrict:"AC",link:function(scope,element){element.autosize({append:"\n"})}}}).directive("fullscreen",function(){return{restrict:"AC",link:function(scope,element){element.fseditor({maxHeight:500})}}}).directive("colorpicker",function(){return{restrict:"AC",link:function(scope,element){element.colorpicker()}}}).directive("daterangepicker",function(){return{restrict:"A",scope:{options:"=daterangepicker",start:"=dateBegin",end:"=dateEnd"},link:function(scope,element){element.daterangepicker(scope.options,function(start,end){scope.start&&(scope.start=start.format("MMMM D, YYYY")),scope.end&&(scope.end=end.format("MMMM D, YYYY")),scope.$apply()})}}}).directive("multiselect",["$timeout",function($t){return{restrict:"A",link:function(scope,element){$t(function(){element.multiSelect()})}}}]).directive("wizard",function(){return{restrict:"A",scope:{options:"=wizard"},link:function(scope,element){scope.options?(element.stepy(scope.options),1==scope.options.validate&&element.validate({errorClass:"help-block",validClass:"help-block",highlight:function(element){$(element).closest(".form-group").addClass("has-error")},unhighlight:function(element){$(element).closest(".form-group").removeClass("has-error")}})):element.stepy(),element.find(".stepy-navigator").wrapInner('<div class="pull-right"></div>')}}}).directive("maskinput",function(){return{restrict:"A",link:function(scope,element){element.inputmask()}}}).directive("wysiwygCkeditor",function(){return{restrict:"A",scope:{options:"=wysiwygCkeditor"},link:function(scope,element,attr){return scope.options&&1==scope.options.inline?CKEDITOR.inline(attr.name||attr.id,scope.options):void CKEDITOR.replace(attr.name||attr.id,scope.options)}}}),angular.module("theme.templates",[]).run(["$templateCache",function($templateCache){"use strict";$templateCache.put("app/templates/nav_renderer.html",'<a ng-if="!item.heading" ng-click="select(item)" ng-href="{{item.url}}">\n	<i ng-if="item.iconClasses" class="{{item.iconClasses}}"></i><span>{{item.label}}</span>\n	<span ng-bind-html="item.html"></span>\n</a>\n<h5 ng-if="item.heading" class="heading">{{item.heading}}</h5>\n<ul ng-if="item.children.length" data-slide-out-nav="item.open">\n    <li ng-repeat="item in item.children"\n	    ng-class="{ hasChild: (item.children!==undefined),\n                      active: item.selected,\n                        open: (item.children!==undefined) && item.open }"\n    	ng-include="\'views/templates/nav_renderer.html\'"\n    ></li>\n</ul>\n'),$templateCache.put("app/templates/people_renderer.html","<div class=\"widget\">\n    <div style=\"overflow: hidden;\" class=\"widget-simple\" ng-class=\"['themed-background-dark','themed-background-dark-night','themed-background-dark-amethyst', 'themed-background-dark-autumn', 'themed-background-dark-flatie', 'themed-background-dark-spring', 'themed-background-dark-fancy', 'themed-background-dark-fire'][$index % 8]\">\n        <div>\n            <a ng-click=\"viewUser($index)\" title=\"View {{item.value.name | words:0}}'s Profile\"><img ng-src=\"{{item.value.avatar || item.value.linkedin.pictureUrl || '/public/blank_avatar.png'}}\" alt=\"{{item.value.name}}\" class=\"widget-image img-circle pull-left\"></a>\n        </div>\n        <h4 class=\"widget-content widget-content-light\">\n            <div ng-class=\"['themed-color','themed-color-night','themed-color-amethyst', 'themed-color-autumn', 'themed-color-flatie', 'themed-color-spring', 'themed-color-fancy', 'themed-color-fire'][$index % 8]\">\n                <a ng-click=\"viewUser($index)\" title=\"View {{item.value.name | words:0}}'s Profile\" style=\"color: inherit; text-decoration: none;\"><strong>{{item.value.name}}</strong></a>\n                <a ng-show=\"{{(item.value.linkedin.summary).length > 0}}\" title=\"Show Summary\" ng-click=\"showSummary = !showSummary\" class=\"btn btn-xs\" ng-class=\"['themed-color','themed-color-night','themed-color-amethyst', 'themed-color-autumn', 'themed-color-flatie', 'themed-color-spring', 'themed-color-fancy', 'themed-color-fire'][$index % 8]\" style=\"float:right\">\n                    <i class=\"fa fa-chevron-down fa-fw\"></i>\n                </a>\n            </div>\n            <small>{{item.value.linkedin.headline}}</small>\n        </h4>\n        \n    </div>\n"+'    <div class="widget-extra" ng-show="showSummary">\n        <h4 class="sub-header">Summary</h4>\n        <p style="white-space:pre-wrap;">{{item.value.linkedin.summary}}</p>\n    </div>\n</div>')}]),angular.module("theme.template-overrides",[]).config(["$provide",function($provide){$provide.decorator("progressbarDirective",function($delegate){return $delegate[0].templateUrl=function(){return"template/progressbar/progressbar.html"},angular.extend($delegate[0].scope,{heading:"@"}),$delegate})}]).run(["$templateCache",function($templateCache){$templateCache.put("footerTemplate.html",'<div ng-show="showFooter" class="ng-grid-footer" ng-style="footerStyle()">\r\n    <div class="col-md-4" >\r\n        <div class="ngFooterTotalItems" ng-class="{\'ngNoMultiSelect\': !multiSelect}" >\r\n            <span class="ngLabel">{{i18n.ngTotalItemsLabel}} {{maxRows()}}</span><span ng-show="filterText.length > 0" class="ngLabel">({{i18n.ngShowingItemsLabel}} {{totalFilteredItemsLength()}})</span>\r\n        </div>\r\n        <div class="ngFooterSelectedItems" ng-show="multiSelect">\r\n            <span class="ngLabel">{{i18n.ngSelectedItemsLabel}} {{selectedItems.length}}</span>\r\n        </div>\r\n    </div>\r\n    <div class="col-md-4" ng-show="enablePaging" ng-class="{\'ngNoMultiSelect\': !multiSelect}">\r\n            <label class="control-label ng-grid-pages center-block">{{i18n.ngPageSizeLabel}}\r\n               <select class="form-control input-sm" ng-model="pagingOptions.pageSize" >\r\n                      <option ng-repeat="size in pagingOptions.pageSizes">{{size}}</option>\r\n                </select>\r\n        </label>\r\n</div>\r\n     <div class="col-md-4">\r\n        <div class="pull-right ng-grid-pagination">\r\n            <button type="button" class="btn btn-default btn-sm" ng-click="pageToFirst()" ng-disabled="cantPageBackward()" title="{{i18n.ngPagerFirstTitle}}"><i class="fa fa-angle-double-left"></i></button>\r\n            <button type="button" class="btn btn-default btn-sm" ng-click="pageBackward()" ng-disabled="cantPageBackward()" title="{{i18n.ngPagerPrevTitle}}"><i class="fa fa-angle-left"></i></button>\r\n            <label class="control-label">\r\n                   <input class="form-control input-sm" min="1" max="{{currentMaxPages}}" type="number" style="width:50px; height: 24px; margin-top: 1px; padding: 0 4px;" ng-model="pagingOptions.currentPage"/>\r\n            </label>\r\n            <span class="ngGridMaxPagesNumber" ng-show="maxPages() > 0">/ {{maxPages()}}</span>\r\n            <button type="button" class="btn btn-default btn-sm" ng-click="pageForward()" ng-disabled="cantPageForward()" title="{{i18n.ngPagerNextTitle}}"><i class="fa fa-angle-right"></i></button>\r\n            <button type="button" class="btn btn-default btn-sm" ng-click="pageToLast()" ng-disabled="cantPageToLast()" title="{{i18n.ngPagerLastTitle}}"><i class="fa fa-angle-double-right"></i></button>\r\n        </div>\r\n     </div>\r\n</div>\r\n'),$templateCache.put("template/rating/rating.html",'<span ng-mouseleave="reset()" ng-keydown="onKeydown($event)" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="{{range.length}}" aria-valuenow="{{value}}">\n    <i ng-repeat="r in range track by $index" ng-mouseenter="enter($index + 1)" ng-click="rate($index + 1)" class="fa" ng-class="$index < value && (r.stateOn || \'fa-star\') || (r.stateOff || \'fa-star-o\')">\n        <span class="sr-only">({{ $index < value ? \'*\' : \' \' }})</span>\n    </i>\n</span>')}]),angular.module("navigation-controller",[]).controller("NavigationController",["$scope","$location","$timeout","$global",function($scope,$location,$timeout){$scope.menu=[{label:"Bend",iconClasses:"fa fa-globe",url:"/"},{heading:"COMMUNITY"},{label:"Leaders",iconClasses:"fa fa-flag-o"},{label:"Mentors",iconClasses:"fa fa-graduation-cap",url:"/mentors",children:[{label:"Add Mentors",url:"/mentors/add"}]},{label:"Startups",iconClasses:"fa fa-rocket"},{heading:"CLUSTERS"},{label:"Tech",iconClasses:"fa fa-code"},{label:"Bio-Science",iconClasses:"fa fa-flask"},{label:"Outdoor",iconClasses:"fa fa-tree"},{label:"Makers",iconClasses:"fa fa-wrench"}];var setParent=function(children,parent){angular.forEach(children,function(child){child.parent=parent,void 0!==child.children&&setParent(child.children,child)})};$scope.findItemByUrl=function(children,url){for(var i=0,length=children.length;length>i;i++){if(children[i].url&&children[i].url.replace("#","")==url)return children[i];if(void 0!==children[i].children){var item=$scope.findItemByUrl(children[i].children,url);if(item)return item}}},setParent($scope.menu,null),$scope.openItems=[],$scope.selectedItems=[],$scope.selectedFromNavMenu=!1,$scope.select=function(item){if(item.open)return void(item.open=!1);for(var i=$scope.openItems.length-1;i>=0;i--)$scope.openItems[i].open=!1;$scope.openItems=[];for(var parentRef=item;null!==parentRef;)parentRef.open=!0,$scope.openItems.push(parentRef),parentRef=parentRef.parent;$scope.selectedFromNavMenu=!0;for(var j=$scope.selectedItems.length-1;j>=0;j--)$scope.selectedItems[j].selected=!1;$scope.selectedItems=[];for(var parentRef=item;null!==parentRef;)parentRef.selected=!0,$scope.selectedItems.push(parentRef),parentRef=parentRef.parent},$scope.$watch(function(){return $location.path()},function(newVal){if(0==$scope.selectedFromNavMenu){var item=$scope.findItemByUrl($scope.menu,newVal);item&&$timeout(function(){$scope.select(item)})}$scope.selectedFromNavMenu=!1})}]);var app=angular.module("StartupCommunity",["ui.bootstrap","ui.select2","form-directives","navigation-controller","ngCookies","ngResource","ngSanitize","ngRoute","ngAnimate","appControllers","appServices","appDirectives","theme.templates","theme.template-overrides","angulartics","angulartics.segment.io","satellizer"]);app.config(function($authProvider){$authProvider.linkedin({clientId:"75bqixdv58z1az",url:"/auth/linkedin"})}).config(["$provide","$routeProvider","$locationProvider",function($provide,$routeProvider,$locationProvider){$routeProvider.when("/",{redirectTo:"/mentors"}).when("/mentors",{templateUrl:"views/mentors.html",resolve:{authenticated:["$location","$auth",function($location,$auth){return $auth.isAuthenticated()?void 0:$location.path("/launchform")}]}}).when("/mentors/add",{templateUrl:"views/add_mentors.html",resolve:{authenticated:["$location","$auth",function($location,$auth){return $auth.isAuthenticated()?void 0:$location.path("/launchform")}],lazyLoad:["lazyLoad",function(lazyLoad){return lazyLoad.load(["bower_components/jquery-validation/dist/jquery.validate.js","bower_components/stepy/lib/jquery.stepy.js"])}]}}).when("/profile",{templateUrl:"views/user_profile.html",resolve:{authenticated:["$location","$auth",function($location,$auth){return $auth.isAuthenticated()?void 0:$location.path("/launchform")}]}}).when("/alpha",{templateUrl:"views/home.html"}).when("/login",{templateUrl:"views/login.html"}).when("/logout",{controller:"LogoutCtrl"}).when("/:templateFile",{templateUrl:function(param){return"views/"+param.templateFile+".html"}}).otherwise({redirectTo:"/"}),$locationProvider.html5Mode(!0)}]);