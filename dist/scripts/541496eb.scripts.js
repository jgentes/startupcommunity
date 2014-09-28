angular.module("appServices",[]).factory("Account",function($http){return{getProfile:function(){return $http.get("/api/me")},updateProfile:function(profileData){return $http.put("/api/me",profileData)}}}).service("geocoder",function(){this.geocode=function(georequest,outerCallback){var geocoder=new google.maps.Geocoder;geocoder.geocode(georequest,function(results,status){if(status==google.maps.GeocoderStatus.OK){var f="",addresses=[];angular.forEach(results,function(item){if("locality"==item.types[0])for(f=1;f<item.address_components.length;f++)if("administrative_area_level_1"==item.address_components[f].types[0]){addresses.push(item.address_components[0].short_name+", "+item.address_components[f].short_name),console.log("0 "+addresses);break}}),outerCallback(addresses)}else outerCallback({success:!1,err:new Error("Geocode was not successful for the following reason: "+status),results:null})})}}).service("$global",["$rootScope","EnquireService","$document",function($rootScope,EnquireService,$document){this.settings={fixedHeader:!0,headerBarHidden:!0,leftbarCollapsed:!1,leftbarShown:!1,rightbarCollapsed:!1,fullscreen:!1,layoutHorizontal:!1,layoutHorizontalLargeIcons:!1,layoutBoxed:!1,showSearchCollapsed:!1};var brandColors={"default":"#ecf0f1",inverse:"#95a5a6",primary:"#3498db",success:"#2ecc71",warning:"#f1c40f",danger:"#e74c3c",info:"#1abcaf",brown:"#c0392b",indigo:"#9b59b6",orange:"#e67e22",midnightblue:"#34495e",sky:"#82c4e6",magenta:"#e73c68",purple:"#e044ab",green:"#16a085",grape:"#7a869c",toyo:"#556b8d",alizarin:"#e74c3c"};this.getBrandColor=function(name){return brandColors[name]?brandColors[name]:brandColors["default"]},$document.ready(function(){EnquireService.register("screen and (max-width: 767px)",{match:function(){$rootScope.$broadcast("globalStyles:maxWidth767",!0)},unmatch:function(){$rootScope.$broadcast("globalStyles:maxWidth767",!1)}})}),this.get=function(key){return this.settings[key]},this.set=function(key,value){this.settings[key]=value,$rootScope.$broadcast("globalStyles:changed",{key:key,value:this.settings[key]}),$rootScope.$broadcast("globalStyles:changed:"+key,this.settings[key])},this.values=function(){return this.settings}}]).factory("pinesNotifications",function(){return{notify:function(args){var notification=$.pnotify(args);return notification.notify=notification.pnotify,notification},defaults:$.pnotify.defaults}}).factory("progressLoader",function(){return{start:function(){$(document).skylo("start")},set:function(position){$(document).skylo("set",position)},end:function(){$(document).skylo("end")},get:function(){return $(document).skylo("get")},inch:function(amount){$(document).skylo("show",function(){$(document).skylo("inch",amount)})}}}).factory("EnquireService",["$window",function($window){return $window.enquire}]).factory("$bootbox",["$modal",function($modal){return void 0==$.fn.modal&&($.fn.modal=function(directive){var that=this;if("hide"==directive)return void(this.data("bs.modal")&&(this.data("bs.modal").close(),$(that).remove()));if("show"!=directive){var modalInstance=$modal.open({template:$(this).find(".modal-content").html()});this.data("bs.modal",modalInstance),setTimeout(function(){$(".modal.ng-isolate-scope").remove(),$(that).css({opacity:1,display:"block"}).addClass("in")},100)}}),bootbox}]).service("lazyLoad",["$q","$timeout",function($q,$t){var deferred=$q.defer(),promise=deferred.promise;this.load=function(files){return angular.forEach(files,function(file){file.indexOf(".js")>-1&&!function(d,script){var fDeferred=$q.defer();script=d.createElement("script"),script.type="text/javascript",script.async=!0,script.onload=function(){$t(function(){fDeferred.resolve()})},script.onerror=function(){$t(function(){fDeferred.reject()})},promise=promise.then(function(){return script.src=file,d.getElementsByTagName("head")[0].appendChild(script),fDeferred.promise})}(document)}),deferred.resolve(),promise}}]).filter("safe_html",["$sce",function($sce){return function(val){return $sce.trustAsHtml(val)}}]),angular.module("appDirectives",[]).directive("disableAnimation",["$animate",function($animate){return{restrict:"A",link:function($scope,$element,$attrs){$attrs.$observe("disableAnimation",function(value){$animate.enabled(!value,$element)})}}}]).directive("slideOut",function(){return{restrict:"A",scope:{show:"=slideOut"},link:function(scope,element){element.hide(),scope.$watch("show",function(newVal,oldVal){newVal!==oldVal&&element.slideToggle({complete:function(){scope.$apply()}})})}}}).directive("slideOutNav",["$timeout",function($t){return{restrict:"A",scope:{show:"=slideOutNav"},link:function(scope,element){scope.$watch("show",function(newVal){return $("body").hasClass("collapse-leftbar")?void(1==newVal?element.css("display","block"):element.css("display","none")):void(1==newVal?element.slideDown({complete:function(){$t(function(){scope.$apply()})}}):0==newVal&&element.slideUp({complete:function(){$t(function(){scope.$apply()})}}))})}}}]).directive("panel",function(){return{restrict:"E",transclude:!0,scope:{panelClass:"@",heading:"@",panelIcon:"@"},templateUrl:"templates/panel.html"}}).directive("pulsate",function(){return{scope:{pulsate:"="},link:function(scope,element){$(element).pulsate(scope.pulsate)}}}).directive("prettyprint",function(){return{restrict:"C",link:function(scope,element){element.html(prettyPrintOne(element.html(),"",!0))}}}).directive("passwordVerify",function(){return{require:"ngModel",scope:{passwordVerify:"="},link:function(scope,element,attrs,ctrl){scope.$watch(function(){var combined;return(scope.passwordVerify||ctrl.$viewValue)&&(combined=scope.passwordVerify+"_"+ctrl.$viewValue),combined},function(value){value&&ctrl.$parsers.unshift(function(viewValue){var origin=scope.passwordVerify;return origin!==viewValue?void ctrl.$setValidity("passwordVerify",!1):(ctrl.$setValidity("passwordVerify",!0),viewValue)})})}}}).directive("backgroundSwitcher",function(){return{restrict:"EA",link:function(scope,element){$(element).click(function(){$("body").css("background",$(element).css("background"))})}}}).directive("panelControls",[function(){return{restrict:"E",require:"?^tabset",link:function(scope,element){var panel=$(element).closest(".panel");0==panel.hasClass(".ng-isolate-scope")&&$(element).appendTo(panel.find(".options"))}}}]).directive("panelControlCollapse",function(){return{restrict:"EAC",link:function(scope,element){return element.bind("click",function(){$(element).toggleClass("fa-chevron-down fa-chevron-up"),$(element).closest(".panel").find(".panel-body").slideToggle({duration:200}),$(element).closest(".panel-heading").toggleClass("rounded-bottom")}),!1}}}).directive("icheck",function($timeout){return{require:"?ngModel",link:function($scope,element,$attrs,ngModel){return $timeout(function(){var parentLabel=element.parent("label");parentLabel.length&&parentLabel.addClass("icheck-label");var value;return value=$attrs.value,$scope.$watch($attrs.ngModel,function(){$(element).iCheck("update")}),$(element).iCheck({checkboxClass:"icheckbox_minimal-blue",radioClass:"iradio_minimal-blue"}).on("ifChanged",function(event){return"checkbox"===$(element).attr("type")&&$attrs.ngModel&&$scope.$apply(function(){return ngModel.$setViewValue(event.target.checked)}),"radio"===$(element).attr("type")&&$attrs.ngModel?$scope.$apply(function(){return ngModel.$setViewValue(value)}):void 0})})}}}).directive("knob",function(){return{restrict:"EA",template:'<input class="dial" type="text"/>',scope:{options:"="},replace:!0,link:function(scope,element){$(element).knob(scope.options)}}}).directive("uiBsSlider",["$timeout",function($timeout){return{link:function(scope,element){$timeout(function(){element.slider()})}}}]).directive("tileLarge",function(){return{restrict:"E",scope:{item:"=data"},templateUrl:"templates/tile-large.html",transclude:!0}}).directive("tileMini",function(){return{restrict:"E",scope:{item:"=data"},templateUrl:"templates/tile-mini.html"}}).directive("tile",function(){return{restrict:"E",scope:{heading:"@",type:"@"},transclude:!0,templateUrl:"templates/tile-generic.html",link:function(scope,element){var heading=element.find("tile-heading");heading.length&&heading.appendTo(element.find(".tiles-heading"))},replace:!0}}).directive("jscrollpane",["$timeout",function($timeout){return{restrict:"A",scope:{options:"=jscrollpane"},link:function(scope,element){$timeout(function(){element.jScrollPane(-1!=navigator.appVersion.indexOf("Win")?$.extend({mouseWheelSpeed:20},scope.options):scope.options),element.on("click",".jspVerticalBar",function(event){event.preventDefault(),event.stopPropagation()}),element.bind("mousewheel",function(e){e.preventDefault()})})}}}]).directive("stickyScroll",function(){return{restrict:"A",link:function(scope,element,attr){function stickyTop(){var topMax=parseInt(attr.stickyScroll),headerHeight=$("header").height();if(headerHeight>topMax&&(topMax=headerHeight),0==$("body").hasClass("static-header"))return element.css("top",topMax+"px");{var window_top=$(window).scrollTop();element.offset().top}topMax>window_top?element.css("top",topMax-window_top+"px"):element.css("top","0px")}$(function(){$(window).scroll(stickyTop),stickyTop()})}}}).directive("rightbarRightPosition",function(){return{restrict:"A",scope:{isFixedLayout:"=rightbarRightPosition"},link:function(scope){scope.$watch("isFixedLayout",function(newVal,oldVal){newVal!=oldVal&&setTimeout(function(){var $pc=$("#page-content"),ending_right=$(window).width()-($pc.offset().left+$pc.outerWidth());0>ending_right&&(ending_right=0),$("#page-rightbar").css("right",ending_right)},100)})}}}).directive("fitHeight",["$window","$timeout","$location",function($window,$timeout){return{restrict:"A",scope:!0,link:function(scope,element){scope.docHeight=$(document).height();var setHeight=function(newVal){var diff=$("header").height();$("body").hasClass("layout-horizontal")&&(diff+=112),newVal-diff>element.outerHeight()?element.css("min-height",newVal-diff+"px"):element.css("min-height",$(window).height()-diff)};scope.$watch("docHeight",function(newVal){setHeight(newVal)}),$(window).on("resize",function(){setHeight($(document).height())});var resetHeight=function(){scope.docHeight=$(document).height(),$timeout(resetHeight,1e3)};$timeout(resetHeight,1e3)}}}]).directive("jscrollpaneOn",["$timeout",function($timeout){return{restrict:"A",scope:{applyon:"=jscrollpaneOn"},link:function(scope,element){scope.$watch("applyon",function(newVal){if(0==newVal){var api=element.data("jsp");return void(api&&api.destroy())}$timeout(function(){element.jScrollPane({autoReinitialise:!0})})})}}}]).directive("backToTop",function(){return{restrict:"AE",link:function(scope,element){element.click(function(){$("body").scrollTop(0)})}}}),angular.module("appControllers",[]).controller("MainController",["$scope","$window","$global","$timeout","$interval","progressLoader","$location",function($scope,$window,$global,$timeout,$interval,progressLoader){$scope.style_fullscreen=$global.get("fullscreen"),$scope.$on("globalStyles:changed",function(event,newVal){$scope["style_"+newVal.key]=newVal.value}),$scope.$on("globalStyles:maxWidth767",function(event,newVal){$timeout(function(){$scope.style_isSmallScreen=newVal,newVal?$global.set("leftbarCollapsed",!1):$global.set("leftbarShown",!1)})}),$scope.$on("$routeChangeStart",function(){progressLoader.start(),progressLoader.set(50)}),$scope.$on("$routeChangeSuccess",function(){progressLoader.end()})}]).controller("LoginCtrl",["$scope","$auth","$global",function($scope,$auth,$global){$global.set("fullscreen",!0),$scope.$on("$destroy",function(){$global.set("fullscreen",!1)}),$scope.isAuthenticated=function(){return $auth.isAuthenticated()},$scope.login=function(){$auth.login({email:$scope.email,password:$scope.password}).then(function(){console.log("Logged in!")}).catch(function(response){console.log(response.data.message)})},$scope.authenticate=function(provider){$auth.authenticate(provider).then(function(){console.log("Logged in!")}).catch(function(response){console.log(response.data)})}}]).controller("SignupCtrl",["$scope","$auth","$global",function($scope,$auth,$global){$global.set("fullscreen",!0),$scope.$on("$destroy",function(){$global.set("fullscreen",!1)}),$scope.signup=function(){$auth.signup({name:$scope.name,email:$scope.email,password:$scope.password})}}]).controller("ProfileCtrl",function($scope,$auth,$alert,Account){$scope.getProfile=function(){Account.getProfile().success(function(data){$scope.user=data}).error(function(){$alert({content:"Unable to get user information",animation:"fadeZoomFadeDown",type:"material",duration:3})})},$scope.updateProfile=function(){Account.updateProfile({displayName:$scope.user.displayName,email:$scope.user.email}).then(function(){$alert({content:"Profile has been updated",animation:"fadeZoomFadeDown",type:"material",duration:3})})},$scope.link=function(provider){$auth.link(provider).then(function(){$alert({content:"You have successfully linked "+provider+" account",animation:"fadeZoomFadeDown",type:"material",duration:3})}).then(function(){$scope.getProfile()}).catch(function(response){$alert({content:response.data.message,animation:"fadeZoomFadeDown",type:"material",duration:3})})},$scope.unlink=function(provider){$auth.unlink(provider).then(function(){$alert({content:"You have successfully unlinked "+provider+" account",animation:"fadeZoomFadeDown",type:"material",duration:3})}).then(function(){$scope.getProfile()}).catch(function(response){$alert({content:response.data?response.data.message:"Could not unlink "+provider+" account",animation:"fadeZoomFadeDown",type:"material",duration:3})})},$scope.getProfile()}).controller("RegistrationPageController",["$scope","$timeout",function($scope,$timeout){$scope.checking=!1,$scope.checked=!1,$scope.checkAvailability=function(){$scope.reg_form.username.$dirty!==!1&&($scope.checking=!0,$timeout(function(){$scope.checking=!1,$scope.checked=!0},500))}}]).controller("LaunchformController",["$scope","$global","$http","$q","geocoder",function($scope,$global,$http,$q,geocoder){$global.set("fullscreen",!0),$scope.formData={},$scope.subscribe=function(){$http({method:"POST",url:"/sub",data:$.param({email:$scope.formData.email,city:$scope.formData.city}),headers:{"Content-Type":"application/x-www-form-urlencoded"}}).success(function(data){data.success?($scope.alert={msg:"Thanks, we look forward to helping you build a vibrant startup community in <strong>"+$scope.formData.city.substr(0,$scope.formData.city.length-4)+"</strong>!  We'll be in touch soon."},$scope.formData={}):$scope.alert={type:"error",msg:"Something went wrong!"}})},$scope.getLocation=function(val){var deferred=$q.defer();return geocoder.geocode({address:String(val),componentRestrictions:{country:"US"}},function(callbackResult){deferred.resolve(callbackResult)}),deferred.promise}}]).controller("ChatRoomController",["$scope","$timeout",function($scope,$t){var eliza=new ElizaBot,avatars=["potter.png","tennant.png","johansson.png","jackson.png","jobs.png"];$scope.messages=[],$scope.userText="",$scope.elizaTyping=!1,$scope.elizaAvatar="johansson.png",$scope.sendMessage=function(msg){var im={"class":"me",avatar:"jackson.png",text:msg};this.messages.push(im),this.userText="",$t(function(){$scope.elizaAvatar=_.shuffle(avatars).shift(),$scope.elizaTyping=!0},500),$t(function(){var reply=eliza.transform(msg),im={"class":"chat-success",avatar:$scope.elizaAvatar,text:reply};$scope.elizaTyping=!1,$scope.messages.push(im)},1200)}}]).directive("scrollToBottom",function(){return{restrict:"A",scope:{model:"=scrollToBottom"},link:function(scope,element){scope.$watch("model",function(n,o){n!=o&&(element[0].scrollTop=element[0].scrollHeight)})}}}),angular.module("theme.form-components",[]).controller("FormComponentsController",["$scope","$http",function($scope,$http){$scope.switchStatus=1,$scope.switchStatus2=1,$scope.switchStatus3=1,$scope.switchStatus4=1,$scope.switchStatus5=1,$scope.switchStatus6=1,$scope.getLocation=function(val){return $http.get("https://maps.googleapis.com/maps/api/geocode/json",{params:{address:val,sensor:!1}}).then(function(res){var addresses=[];return angular.forEach(res.data.results,function(item){addresses.push(item.formatted_address)}),addresses})},$scope.colorPicked="#fa4d4d",$scope.select2RemoteOptions={placeholder:"Search for a movie",minimumInputLength:3,width:"resolve",ajax:{url:"https://api.rottentomatoes.com/api/public/v1.0/movies.json",dataType:"jsonp",quietMillis:100,data:function(term,page){return{q:term,page_limit:10,page:page,apikey:"8vzys3eka2s9hpvkh7wwzp7e"}},results:function(data,page){var more=10*page<data.total;return{results:data.movies,more:more}}},formatResult:function(movie){var markup="<table class='movie-result'><tr>";return void 0!==movie.posters&&void 0!==movie.posters.thumbnail&&(markup+="<td class='movie-image'><img src='"+movie.posters.thumbnail+"'/></td>"),markup+="<td class='movie-info'><div class='movie-title'>"+movie.title+"</div>",void 0!==movie.critics_consensus?markup+="<div class='movie-synopsis'>"+movie.critics_consensus+"</div>":void 0!==movie.synopsis&&(markup+="<div class='movie-synopsis'>"+movie.synopsis+"</div>"),markup+="</td></tr></table>"},formatSelection:function(movie){return movie.title},dropdownCssClass:"bigdrop",escapeMarkup:function(m){return m}},$scope.tagList=["tag1","tag2"],$scope.select2TaggingOptions={multiple:!0,simple_tags:!0,tags:["tag1","tag2","tag3","tag4"]},$scope.multiSelect1=[],$scope.multiSelect2=[]}]).controller("DatepickerDemoController",["$scope",function($scope){$scope.today=function(){$scope.dt=new Date},$scope.today(),$scope.clear=function(){$scope.dt=null},$scope.disabled=function(date,mode){return"day"===mode&&(0===date.getDay()||6===date.getDay())},$scope.toggleMin=function(){$scope.minDate=$scope.minDate?null:new Date},$scope.toggleMin(),$scope.open=function($event){$event.preventDefault(),$event.stopPropagation(),$scope.opened=!0},$scope.dateOptions={formatYear:"yy",startingDay:1},$scope.initDate=new Date("2016-15-20"),$scope.formats=["dd-MMMM-yyyy","yyyy/MM/dd","dd.MM.yyyy","shortDate"],$scope.format=$scope.formats[0]}]).controller("TimepickerDemoCtrl",["$scope",function($scope){$scope.mytime=new Date,$scope.hstep=1,$scope.mstep=15,$scope.options={hstep:[1,2,3],mstep:[1,5,10,15,25,30]},$scope.ismeridian=!0,$scope.toggleMode=function(){$scope.ismeridian=!$scope.ismeridian},$scope.update=function(){var d=new Date;d.setHours(14),d.setMinutes(0),$scope.mytime=d},$scope.changed=function(){console.log("Time changed to: "+$scope.mytime)},$scope.clear=function(){$scope.mytime=null}}]).controller("DateRangePickerDemo",["$scope",function($scope){$scope.drp_start=moment().subtract("days",1).format("MMMM D, YYYY"),$scope.drp_end=moment().add("days",31).format("MMMM D, YYYY"),$scope.drp_options={ranges:{Today:[moment(),moment()],Yesterday:[moment().subtract("days",1),moment().subtract("days",1)],"Last 7 Days":[moment().subtract("days",6),moment()],"Last 30 Days":[moment().subtract("days",29),moment()],"This Month":[moment().startOf("month"),moment().endOf("month")],"Last Month":[moment().subtract("month",1).startOf("month"),moment().subtract("month",1).endOf("month")]},opens:"left",startDate:moment().subtract("days",29),endDate:moment()}}]),angular.module("theme.form-directives",[]).directive("autosize",function(){return{restrict:"AC",link:function(scope,element){element.autosize({append:"\n"})}}}).directive("fullscreen",function(){return{restrict:"AC",link:function(scope,element){element.fseditor({maxHeight:500})}}}).directive("colorpicker",function(){return{restrict:"AC",link:function(scope,element){element.colorpicker()}}}).directive("daterangepicker",function(){return{restrict:"A",scope:{options:"=daterangepicker",start:"=dateBegin",end:"=dateEnd"},link:function(scope,element){element.daterangepicker(scope.options,function(start,end){scope.start&&(scope.start=start.format("MMMM D, YYYY")),scope.end&&(scope.end=end.format("MMMM D, YYYY")),scope.$apply()})}}}).directive("multiselect",function(){return{restrict:"A",link:function(scope,element){element.multiSelect()}}}).directive("wizard",function(){return{restrict:"A",scope:{options:"=wizard"},link:function(scope,element){scope.options?(element.stepy(scope.options),1==scope.options.validate&&element.validate({errorClass:"help-block",validClass:"help-block",highlight:function(element){$(element).closest(".form-group").addClass("has-error")},unhighlight:function(element){$(element).closest(".form-group").removeClass("has-error")}})):element.stepy(),element.find(".stepy-navigator").wrapInner('<div class="pull-right"></div>')}}}).directive("maskinput",function(){return{restrict:"A",link:function(scope,element){element.inputmask()}}}).directive("wysiwygCkeditor",function(){return{restrict:"A",scope:{options:"=wysiwygCkeditor"},link:function(scope,element,attr){return scope.options&&1==scope.options.inline?CKEDITOR.inline(attr.name||attr.id,scope.options):void CKEDITOR.replace(attr.name||attr.id,scope.options)}}}),angular.module("theme.form-validation",[]).controller("AngularFormValidationController",["$scope",function($scope){$scope.validateDemoForm={};angular.copy($scope.validateDemoForm);$scope.canResetValidationForm=function(){return $scope.validate_demo_form.$dirty},$scope.resetValidationForm=function(){$scope.validateDemoForm=angular.copy($scope.validateDemoFormOriginal),$scope.validate_demo_form.$setPristine()},$scope.canSubmitValidationForm=function(){return $scope.validate_demo_form.$valid},$scope.submit=function(){}}]),angular.module("theme.form-inline",[]).controller("InlineEditableController",["$scope","$filter","$http","$timeout",function($scope,$filter){$scope.user={name:"awesome user",status:2,group:4,groupName:"admin",email:"email@example.com",tel:"123-45-67",number:29,range:10,url:"http://example.com",search:"blabla",color:"#6a4415",date:null,time:"12:30",datetime:null,month:null,week:null,desc:"Awesome user \ndescription!",remember:!0,dob:new Date(1984,4,15),timebs:new Date(1984,4,15,19,20)},$scope.statuses=[{value:1,text:"status1"},{value:2,text:"status2"},{value:3,text:"status3"},{value:4,text:"status4"}],$scope.showStatus=function(){var selected=$filter("filter")($scope.statuses,{value:$scope.user.status});return $scope.user.status&&selected.length?selected[0].text:"Not set"},$scope.groups=[{id:1,text:"MVP"},{id:2,text:"VIP"},{id:3,text:"ADMIN"},{id:4,text:"USER"}],$scope.$watch("user.group",function(newVal,oldVal){if(newVal!==oldVal){var selected=$filter("filter")($scope.groups,{id:$scope.user.group});$scope.user.groupName=selected.length?selected[0].text:null}})}]),angular.module("theme.tables-ng-grid",[]).controller("TablesAdvancedController",["$scope","$filter","$http",function($scope,$filter,$http){$scope.filterOptions={filterText:"",useExternalFilter:!0},$scope.totalServerItems=0,$scope.pagingOptions={pageSizes:[25,50,100],pageSize:25,currentPage:1},$scope.setPagingData=function(data,page,pageSize){var pagedData=data.slice((page-1)*pageSize,page*pageSize);$scope.myData=pagedData,$scope.totalServerItems=data.length,$scope.$$phase||$scope.$apply()},$scope.getPagedDataAsync=function(pageSize,page,searchText){setTimeout(function(){var data;if(searchText){var ft=searchText.toLowerCase();$http.get("assets/demo/ng-data.json").success(function(largeLoad){data=largeLoad.filter(function(item){return-1!=JSON.stringify(item).toLowerCase().indexOf(ft)}),$scope.setPagingData(data,page,pageSize)})}else $http.get("assets/demo/ng-data.json").success(function(largeLoad){$scope.setPagingData(largeLoad,page,pageSize)})},100)},$scope.getPagedDataAsync($scope.pagingOptions.pageSize,$scope.pagingOptions.currentPage),$scope.$watch("pagingOptions",function(newVal,oldVal){newVal!==oldVal&&newVal.currentPage!==oldVal.currentPage&&$scope.getPagedDataAsync($scope.pagingOptions.pageSize,$scope.pagingOptions.currentPage,$scope.filterOptions.filterText)},!0),$scope.$watch("filterOptions",function(newVal,oldVal){newVal!==oldVal&&$scope.getPagedDataAsync($scope.pagingOptions.pageSize,$scope.pagingOptions.currentPage,$scope.filterOptions.filterText)},!0),$scope.gridOptions={data:"myData",enablePaging:!0,showFooter:!0,totalServerItems:"totalServerItems",pagingOptions:$scope.pagingOptions,filterOptions:$scope.filterOptions}}]),angular.module("theme.charts-inline",[]).directive("sparklines",["$timeout",function(){return{restrict:"A",scope:{options:"=sparklines",values:"=data"},link:function(scope,element,attr){var options={};if(scope.options)var options=angular.copy(scope.options);var container=$(element).closest("sparklines-composite"),target=element;container.length&&(container.find("span.sparklines-container").length<1&&container.append('<span class="sparklines-container"></span>'),target=container.find("span.sparklines-container"),target.find("canvas").length&&(options.composite=!0),attr.values?target.attr("values",attr.values):target.removeAttr("values")),scope.$watch(function(){return element.is(":visible")},function(){scope.values?$(target).sparkline(scope.values,options):$(target).sparkline("html",options)})}}}]),angular.module("theme.templates",[]).run(["$templateCache",function($templateCache){"use strict";$templateCache.put("templates/bs-modal.html",'<div class="modal-header">\n    <h3 class="modal-title">I\'m a modal!</h3>\n</div>\n<div class="modal-body">\n    <ul>\n        <li ng-repeat="item in items">\n            <a ng-click="selected.item = item">{{ item }}</a>\n        </li>\n    </ul>\n    Selected: <b>{{ selected.item }}</b>\n</div>\n<div class="modal-footer">\n    <button class="btn btn-primary" ng-click="ok()">OK</button>\n    <button class="btn btn-warning" ng-click="cancel()">Cancel</button>\n</div>\n'),$templateCache.put("templates/contextual-progressbar.html",'<div class="contextual-progress">\n	<div class="clearfix">\n		<div class="progress-title">{{heading}}</div>\n		<div class="progress-percentage">{{percent | number:0}}%</div>\n	</div>\n	<div class="progress">\n		<div class="progress-bar" ng-class="type && \'progress-bar-\' + type" role="progressbar" aria-valuenow="{{value}}" aria-valuemin="0" aria-valuemax="{{max}}" ng-style="{width: percent + \'%\'}" aria-valuetext="{{percent | number:0}}%" ng-transclude></div>\n	</div>\n</div>\n'),$templateCache.put("templates/nav_renderer.html",'<a ng-click="select(item)" ng-href="{{item.url}}">\n	<i ng-if="item.iconClasses" class="{{item.iconClasses}}"></i><span>{{item.label}}</span>\n	<span ng-bind-html="item.html"></span>\n</a>\n<ul ng-if="item.children.length" data-slide-out-nav="item.open">\n    <li ng-repeat="item in item.children"\n	    ng-class="{ hasChild: (item.children!==undefined),\n                      active: item.selected,\n                        open: (item.children!==undefined) && item.open }"\n    	ng-include="\'templates/nav_renderer.html\'"\n    ></li>\n</ul>\n'),$templateCache.put("templates/panel-tabs-without-heading.html",'<div class="panel {{panelClass}}">\n  <div class="panel-heading">\n        <h4>\n            <ul class="nav nav-{{type || \'tabs\'}}" ng-class="{\'nav-stacked\': vertical, \'nav-justified\': justified}" ng-transclude></ul>\n        </h4>\n  </div>\n  <div class="panel-body">\n    <div class="tab-content">\n        <div class="tab-pane"\n            ng-repeat="tab in tabs"\n            ng-class="{active: tab.active}"\n            tab-content-transclude="tab">\n        </div>\n    </div>\n  </div>\n</div>\n'),$templateCache.put("templates/panel-tabs.html",'<div class="panel {{panelClass}}">\n  <div class="panel-heading">\n        <h4><i ng-if="panelIcon" class="{{panelIcon}}"></i>{{(panelIcon? " ":"")+heading}}</h4>\n        <div class="options">\n            <ul class="nav nav-{{type || \'tabs\'}}" ng-class="{\'nav-stacked\': vertical, \'nav-justified\': justified}" ng-transclude></ul>\n        </div>\n  </div>\n  <div class="panel-body">\n    <div class="tab-content">\n        <div class="tab-pane"\n            ng-repeat="tab in tabs"\n            ng-class="{active: tab.active}"\n            tab-content-transclude="tab">\n        </div>\n    </div>\n  </div>\n</div>\n'),$templateCache.put("templates/panel.html",'<div class="panel {{panelClass}}">\n  <div class="panel-heading">\n        <h4><i ng-if="panelIcon" class="{{panelIcon}}"></i>{{(panelIcon? " ":"")+heading}}</h4>\n        <div class="options">\n        </div>\n  </div>\n  <div class="panel-body" ng-transclude>\n  </div>\n</div>\n'),$templateCache.put("templates/themed-tabs-bottom.html",'<div class="tab-container tab-{{theme || \'primary\'}} tab-{{position || \'normal\'}}">\n  <div class="tab-content">\n    <div class="tab-pane"\n        ng-repeat="tab in tabs"\n        ng-class="{active: tab.active}"\n        tab-content-transclude="tab">\n    </div>\n  </div>\n  <ul class="nav nav-{{type || \'tabs\'}}" ng-class="{\'nav-stacked\': vertical, \'nav-justified\': justified}" ng-transclude></ul>\n</div>\n'),$templateCache.put("templates/themed-tabs.html",'<div class="tab-container tab-{{theme || \'primary\'}} tab-{{position || \'normal\'}}">\n  <ul class="nav nav-{{type || \'tabs\'}}" ng-class="{\'nav-stacked\': vertical, \'nav-justified\': justified}" ng-transclude></ul>\n  <div class="tab-content">\n    <div class="tab-pane"\n        ng-repeat="tab in tabs"\n        ng-class="{active: tab.active}"\n        tab-content-transclude="tab">\n    </div>\n  </div>\n</div>\n'),$templateCache.put("templates/tile-generic.html",'<div class="info-tiles tiles-{{type}}">\n	<div class="tiles-heading">\n		{{heading}}\n	</div>\n	<div class="tiles-body" ng-transclude>\n	</div>\n</div>\n'),$templateCache.put("templates/tile-large.html",'<a class="info-tiles tiles-{{item.color}}" ng-href="{{item.href}}">\n    <div class="tiles-heading">\n        <div class="pull-left">{{item.title}}</div>\n        <div class="pull-right">{{item.titleBarInfo}}</div>\n    </div>\n    <div class="tiles-body">\n        <div class="pull-left"><i class="{{item.classes}}"></i></div>\n        <div class="pull-right" ng-show="item.text">{{item.text}}</div>\n        <div class="pull-right" ng-show="!item.text" ng-transclude></div>\n    </div>\n</a>\n'),$templateCache.put("templates/tile-mini.html",'<a class="shortcut-tiles tiles-{{item.color}}" ng-href="{{item.href}}">\n	<div class="tiles-body">\n		<div class="pull-left"><i class="{{item.classes}}"></i></div>\n		<div class="pull-right"><span class="badge">{{item.titleBarInfo}}</span></div>\n	</div>\n	<div class="tiles-footer">\n		{{item.text}}\n	</div>\n</a>\n')}]),angular.module("theme.template-overrides",[]).config(["$provide",function($provide){$provide.decorator("tabsetDirective",function($delegate){return $delegate[0].templateUrl=function(element,attr){return attr.tabPosition||attr.tabTheme?!attr.tabPosition||"'bottom'"!=attr.tabPosition&&"bottom"!=attr.tabPosition?"templates/themed-tabs.html":"templates/themed-tabs-bottom.html":attr.panelTabs&&void 0!==attr.heading?"templates/panel-tabs.html":attr.panelTabs&&void 0==attr.heading?"templates/panel-tabs-without-heading.html":"templates/themed-tabs.html"},angular.extend($delegate[0].scope,{heading:"@",panelClass:"@",panelIcon:"@",theme:"@tabTheme",position:"@tabPosition"}),$delegate}),$provide.decorator("progressbarDirective",function($delegate){return $delegate[0].templateUrl=function(element,attr){return attr.contextual&&"true"==attr.contextual?"templates/contextual-progressbar.html":"template/progressbar/progressbar.html"},angular.extend($delegate[0].scope,{heading:"@"}),$delegate})}]).run(["$templateCache",function($templateCache){$templateCache.put("footerTemplate.html",'<div ng-show="showFooter" class="ng-grid-footer" ng-style="footerStyle()">\r\n    <div class="col-md-4" >\r\n        <div class="ngFooterTotalItems" ng-class="{\'ngNoMultiSelect\': !multiSelect}" >\r\n            <span class="ngLabel">{{i18n.ngTotalItemsLabel}} {{maxRows()}}</span><span ng-show="filterText.length > 0" class="ngLabel">({{i18n.ngShowingItemsLabel}} {{totalFilteredItemsLength()}})</span>\r\n        </div>\r\n        <div class="ngFooterSelectedItems" ng-show="multiSelect">\r\n            <span class="ngLabel">{{i18n.ngSelectedItemsLabel}} {{selectedItems.length}}</span>\r\n        </div>\r\n    </div>\r\n    <div class="col-md-4" ng-show="enablePaging" ng-class="{\'ngNoMultiSelect\': !multiSelect}">\r\n            <label class="control-label ng-grid-pages center-block">{{i18n.ngPageSizeLabel}}\r\n               <select class="form-control input-sm" ng-model="pagingOptions.pageSize" >\r\n                      <option ng-repeat="size in pagingOptions.pageSizes">{{size}}</option>\r\n                </select>\r\n        </label>\r\n</div>\r\n     <div class="col-md-4">\r\n        <div class="pull-right ng-grid-pagination">\r\n            <button type="button" class="btn btn-default btn-sm" ng-click="pageToFirst()" ng-disabled="cantPageBackward()" title="{{i18n.ngPagerFirstTitle}}"><i class="fa fa-angle-double-left"></i></button>\r\n            <button type="button" class="btn btn-default btn-sm" ng-click="pageBackward()" ng-disabled="cantPageBackward()" title="{{i18n.ngPagerPrevTitle}}"><i class="fa fa-angle-left"></i></button>\r\n            <label class="control-label">\r\n                   <input class="form-control input-sm" min="1" max="{{currentMaxPages}}" type="number" style="width:50px; height: 24px; margin-top: 1px; padding: 0 4px;" ng-model="pagingOptions.currentPage"/>\r\n            </label>\r\n            <span class="ngGridMaxPagesNumber" ng-show="maxPages() > 0">/ {{maxPages()}}</span>\r\n            <button type="button" class="btn btn-default btn-sm" ng-click="pageForward()" ng-disabled="cantPageForward()" title="{{i18n.ngPagerNextTitle}}"><i class="fa fa-angle-right"></i></button>\r\n            <button type="button" class="btn btn-default btn-sm" ng-click="pageToLast()" ng-disabled="cantPageToLast()" title="{{i18n.ngPagerLastTitle}}"><i class="fa fa-angle-double-right"></i></button>\r\n        </div>\r\n     </div>\r\n</div>\r\n'),$templateCache.put("template/rating/rating.html",'<span ng-mouseleave="reset()" ng-keydown="onKeydown($event)" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="{{range.length}}" aria-valuenow="{{value}}">\n    <i ng-repeat="r in range track by $index" ng-mouseenter="enter($index + 1)" ng-click="rate($index + 1)" class="fa" ng-class="$index < value && (r.stateOn || \'fa-star\') || (r.stateOff || \'fa-star-o\')">\n        <span class="sr-only">({{ $index < value ? \'*\' : \' \' }})</span>\n    </i>\n</span>')
}]);var app=angular.module("themesApp",["ui.bootstrap","ui.select2","ngGrid","theme.tables-ng-grid","theme.form-components","theme.form-directives","theme.form-validation","theme.form-inline","theme.templates","theme.template-overrides","ngCookies","ngResource","ngSanitize","ngRoute","ngAnimate","appControllers","appServices","appDirectives","angulartics","angulartics.segment.io","satellizer"]);app.config(function($authProvider){$authProvider.linkedin({clientId:"75bqixdv58z1az",url:"/auth/linkedin"})}).config(["$provide","$routeProvider",function($provide,$routeProvider){$routeProvider.when("/",{templateUrl:"views/launchform.html",controller:"LaunchformController"}).when("/login",{templateUrl:"views/login.html",controller:"LoginCtrl"}).when("/signup",{templateUrl:"views/signup.html",controller:"SignupCtrl"}).when("/:templateFile",{templateUrl:function(param){return"views/"+param.templateFile+".html"}}).otherwise({redirectTo:"/"})}]);