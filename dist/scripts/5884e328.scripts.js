angular.module("appServices",[]).factory("userService",function($http){return{search:function(city,query){return $http.get("/api/"+city+"/users"+(query?"?search="+query:""))},getUsers:function(city,cluster,role,limit,alturl){return $http.get(alturl||"/api/"+city+"/users"+(cluster?"?cluster="+cluster:"")+(cluster&&role?"&":"?")+(role?"role="+role:"")+(limit?cluster||role?"&limit="+limit:"?limit="+limit:""))},putUser:function(userid,profile,callback){$http.put("/api/user/"+userid+"?profile="+profile).success(function(response){callback(response)}).error(function(response){callback(response)})},getProfile:function(userid){return $http.get(userid?"/api/profile/"+userid:"/api/profile")},putProfile:function(profileData){return $http.put("/api/profile",profileData)},removeProfile:function(userid,callback){$http.post("/api/profile/remove/"+userid).success(function(response){callback(response)}).error(function(response){callback(response)})},addPerson:function(url,email,userid,callback){$http.get('/api/addPerson?user={"url":"'+url+'","email":"'+email+'","userid":"'+userid+'"}').success(function(response){callback(response)}).error(function(response){callback(response)})},getKey:function(){return $http.get("/api/profile/getkey")},setCityAdvisor:function(userkey,citykey,role,status,callback){$http.put("/api/profile/role?userkey="+userkey+"&citykey="+citykey+"&role="+role+"&status="+status).success(function(data,status){callback(data,status)}).error(function(data,status){callback(data,status)})},setRole:function(userkey,citykey,cluster,role,status,callback){$http.put("/api/profile/role?userkey="+userkey+"&citykey="+citykey+"&cluster="+cluster+"&role="+role+"&status="+status).success(function(data,status){callback(data,status)}).error(function(data,status){callback(data,status)})}}}).factory("cityService",function($http){return{getCity:function(city){return $http.get("/api/city/"+city)}}}).service("geocoder",function(){this.geocode=function(georequest,outerCallback){var geocoder=new google.maps.Geocoder;geocoder.geocode(georequest,function(results,status){if(status==google.maps.GeocoderStatus.OK){var f="",addresses=[];angular.forEach(results,function(item){if("locality"==item.types[0])for(f=1;f<item.address_components.length;f++)if("administrative_area_level_1"==item.address_components[f].types[0]){addresses.push(item.address_components[0].short_name+", "+item.address_components[f].short_name);break}}),outerCallback(addresses)}else outerCallback({success:!1,err:new Error("Geocode was not successful for the following reason: "+status),results:null})})}}).service("$global",["$rootScope","EnquireService","$document",function($rootScope,EnquireService,$document){this.settings={fixedHeader:!0,headerBarHidden:!0,leftbarCollapsed:!1,leftbarShown:!1,rightbarCollapsed:!1,fullscreen:!1,layoutHorizontal:!1,layoutHorizontalLargeIcons:!1,layoutBoxed:!1};var brandColors={"default":"#ecf0f1",inverse:"#95a5a6",primary:"#3498db",success:"#2ecc71",warning:"#f1c40f",danger:"#e74c3c",info:"#1abcaf",brown:"#c0392b",indigo:"#9b59b6",orange:"#e67e22",midnightblue:"#34495e",sky:"#82c4e6",magenta:"#e73c68",purple:"#e044ab",green:"#16a085",grape:"#7a869c",toyo:"#556b8d",alizarin:"#e74c3c"};this.getBrandColor=function(name){return brandColors[name]?brandColors[name]:brandColors["default"]},$document.ready(function(){EnquireService.register("screen and (max-width: 767px)",{match:function(){$rootScope.$broadcast("globalStyles:maxWidth767",!0)},unmatch:function(){$rootScope.$broadcast("globalStyles:maxWidth767",!1)}})}),this.get=function(key){return this.settings[key]},this.set=function(key,value){this.settings[key]=value,$rootScope.$broadcast("globalStyles:changed",{key:key,value:this.settings[key]}),$rootScope.$broadcast("globalStyles:changed:"+key,this.settings[key])},this.values=function(){return this.settings}}]).factory("pinesNotifications",function(){return{notify:function(args){var notification=new PNotify(args);return notification.notify=notification.update,notification}}}).factory("progressLoader",function(){return{start:function(){$(document).skylo("start")},set:function(position){$(document).skylo("set",position)},end:function(){$(document).skylo("end")},get:function(){return $(document).skylo("get")},inch:function(amount){$(document).skylo("show",function(){$(document).skylo("inch",amount)})}}}).factory("EnquireService",["$window",function($window){return $window.enquire}]).factory("$bootbox",["$modal",function($modal){return void 0==$.fn.modal&&($.fn.modal=function(directive){var that=this;if("hide"==directive)return void(this.data("bs.modal")&&(this.data("bs.modal").close(),$(that).remove()));if("show"!=directive){var modalInstance=$modal.open({template:$(this).find(".modal-content").html()});this.data("bs.modal",modalInstance),setTimeout(function(){$(".modal.ng-isolate-scope").remove(),$(that).css({opacity:1,display:"block"}).addClass("in")},100)}}),bootbox}]).service("lazyLoad",["$q","$timeout",function($q,$t){var deferred=$q.defer(),promise=deferred.promise;this.load=function(files){return angular.forEach(files,function(file){file.indexOf(".js")>-1&&!function(d,script){var fDeferred=$q.defer();script=d.createElement("script"),script.type="text/javascript",script.async=!0,script.onload=function(){$t(function(){fDeferred.resolve()})},script.onerror=function(){$t(function(){fDeferred.reject()})},promise=promise.then(function(){return script.src=file,d.getElementsByTagName("head")[0].appendChild(script),fDeferred.promise})}(document)}),deferred.resolve(),promise}}]).filter("safe_html",["$sce",function($sce){return function(val){return $sce.trustAsHtml(val)}}]),angular.module("appDirectives",[]).directive("disableAnimation",["$animate",function($animate){return{restrict:"A",link:function($scope,$element,$attrs){$attrs.$observe("disableAnimation",function(value){$animate.enabled(!value,$element)})}}}]).directive("slideOut",function(){return{restrict:"A",scope:{show:"=slideOut"},link:function(scope,element){element.hide(),scope.$watch("show",function(newVal,oldVal){newVal!==oldVal&&element.slideToggle({complete:function(){scope.$apply()}})})}}}).directive("slideOutNav",["$timeout",function($t){return{restrict:"A",scope:{show:"=slideOutNav"},link:function(scope,element){scope.$watch("show",function(newVal){return $("body").hasClass("collapse-leftbar")?void(1==newVal?element.css("display","block"):element.css("display","none")):void(1==newVal?element.slideDown({complete:function(){$t(function(){scope.$apply()})}}):0==newVal&&element.slideUp({complete:function(){$t(function(){scope.$apply()})}}))})}}}]).directive("pulsate",function(){return{scope:{pulsate:"="},link:function(scope,element){"transparent"==element.css("background-color")&&element.css("background-color","rgba(0,0,0,0.01)"),$(element).pulsate(scope.pulsate)}}}).directive("prettyprint",function(){return{restrict:"C",link:function(scope,element){element.html(prettyPrintOne(element.html(),"",!0))}}}).directive("passwordVerify",function(){return{require:"ngModel",scope:{passwordVerify:"="},link:function(scope,element,attrs,ctrl){scope.$watch(function(){var combined;return(scope.passwordVerify||ctrl.$viewValue)&&(combined=scope.passwordVerify+"_"+ctrl.$viewValue),combined},function(value){value&&ctrl.$parsers.unshift(function(viewValue){var origin=scope.passwordVerify;return origin!==viewValue?void ctrl.$setValidity("passwordVerify",!1):(ctrl.$setValidity("passwordVerify",!0),viewValue)})})}}}).directive("backgroundSwitcher",function(){return{restrict:"EA",link:function(scope,element){$(element).click(function(){$("body").css("background",$(element).css("background"))})}}}).directive("panelControls",[function(){return{restrict:"E",require:"?^tabset",link:function(scope,element){var panel=$(element).closest(".panel");0==panel.hasClass(".ng-isolate-scope")&&$(element).appendTo(panel.find(".options"))}}}]).directive("panelControlCollapse",function(){return{restrict:"EAC",link:function(scope,element){return element.bind("click",function(){$(element).toggleClass("fa-chevron-down fa-chevron-up"),$(element).closest(".panel").find(".panel-body").slideToggle({duration:200}),$(element).closest(".panel-heading").toggleClass("rounded-bottom")}),!1}}}).directive("icheck",function($timeout){return{require:"?ngModel",link:function($scope,element,$attrs,ngModel){return $timeout(function(){var parentLabel=element.parent("label");parentLabel.length&&parentLabel.addClass("icheck-label");var value;return value=$attrs.value,$scope.$watch($attrs.ngModel,function(){$(element).iCheck("update")}),$(element).iCheck({checkboxClass:"icheckbox_minimal-blue",radioClass:"iradio_minimal-blue"}).on("ifChanged",function(event){return"checkbox"===$(element).attr("type")&&$attrs.ngModel&&$scope.$apply(function(){return ngModel.$setViewValue(event.target.checked)}),"radio"===$(element).attr("type")&&$attrs.ngModel?$scope.$apply(function(){return ngModel.$setViewValue(value)}):void 0})})}}}).directive("knob",function(){return{restrict:"EA",template:'<input class="dial" type="text"/>',scope:{options:"="},replace:!0,link:function(scope,element){$(element).knob(scope.options)}}}).directive("uiBsSlider",["$timeout",function($timeout){return{link:function(scope,element){$timeout(function(){element.slider()})}}}]).directive("jscrollpane",["$timeout",function($timeout){return{restrict:"A",scope:{options:"=jscrollpane"},link:function(scope,element){$timeout(function(){element.jScrollPane(-1!=navigator.appVersion.indexOf("Win")?$.extend({mouseWheelSpeed:20},scope.options):scope.options),element.on("click",".jspVerticalBar",function(event){event.preventDefault(),event.stopPropagation()}),element.bind("mousewheel",function(e){e.preventDefault()})})}}}]).directive("stickyScroll",function(){return{restrict:"A",link:function(scope,element,attr){function stickyTop(){var topMax=parseInt(attr.stickyScroll),headerHeight=$("header").height();if(headerHeight>topMax&&(topMax=headerHeight),0==$("body").hasClass("static-header"))return element.css("top",topMax+"px");{var window_top=$(window).scrollTop();element.offset().top}topMax>window_top?element.css("top",topMax-window_top+"px"):element.css("top","0px")}$(function(){$(window).scroll(stickyTop),stickyTop()})}}}).directive("rightbarRightPosition",function(){return{restrict:"A",scope:{isFixedLayout:"=rightbarRightPosition"},link:function(scope){scope.$watch("isFixedLayout",function(newVal,oldVal){newVal!=oldVal&&setTimeout(function(){var $pc=$("#page-content"),ending_right=$(window).width()-($pc.offset().left+$pc.outerWidth());0>ending_right&&(ending_right=0),$("#page-rightbar").css("right",ending_right)},100)})}}}).directive("fitHeight",["$window","$timeout","$location",function($window,$timeout){return{restrict:"A",scope:!0,link:function(scope,element){scope.docHeight=$(document).height();var setHeight=function(newVal){var diff=$("header").height();$("body").hasClass("layout-horizontal")&&(diff+=112),newVal-diff>element.outerHeight()?element.css("min-height",newVal-diff+"px"):element.css("min-height",$(window).height()-diff)};scope.$watch("docHeight",function(newVal){setHeight(newVal)}),$(window).on("resize",function(){setHeight($(document).height())});var resetHeight=function(){scope.docHeight=$(document).height(),$timeout(resetHeight,1e3)};$timeout(resetHeight,1e3)}}}]).directive("jscrollpaneOn",["$timeout",function($timeout){return{restrict:"A",scope:{applyon:"=jscrollpaneOn"},link:function(scope,element){scope.$watch("applyon",function(newVal){if(0==newVal){var api=element.data("jsp");return void(api&&api.destroy())}$timeout(function(){element.jScrollPane({autoReinitialise:!0})})})}}}]).directive("backToTop",function(){return{restrict:"AE",link:function(scope,element){element.click(function(){$("body").scrollTop(0)})}}}),angular.module("appControllers",[]).controller("MainController",["$scope","$window","$global","$route","$timeout","$interval","progressLoader","$location","$auth","userService","cityService",function($scope,$window,$global,$route,$timeout,$interval,progressLoader,$location,$auth,userService,cityService){$scope.style_fixedHeader=$global.get("fixedHeader"),$scope.style_headerBarHidden=$global.get("headerBarHidden"),$scope.style_layoutBoxed=$global.get("layoutBoxed"),$scope.style_fullscreen=$global.get("fullscreen"),$scope.style_leftbarCollapsed=$global.get("leftbarCollapsed"),$scope.style_leftbarShown=$global.get("leftbarShown"),$scope.style_rightbarCollapsed=$global.get("rightbarCollapsed"),$scope.style_isSmallScreen=!1,$scope.style_layoutHorizontal=$global.get("layoutHorizontal"),$scope.global={alert:void 0},$scope.toggleLeftBar=function(){return $scope.style_isSmallScreen?$global.set("leftbarShown",!$scope.style_leftbarShown):void $global.set("leftbarCollapsed",!$scope.style_leftbarCollapsed)},$scope.$on("globalStyles:changed",function(event,newVal){$scope["style_"+newVal.key]=newVal.value}),$scope.$on("globalStyles:maxWidth767",function(event,newVal){$timeout(function(){$scope.style_isSmallScreen=newVal,newVal?$global.set("leftbarCollapsed",!1):$global.set("leftbarShown",!1)})}),$scope.$on("$routeChangeStart",function(){progressLoader.start(),progressLoader.set(50)}),$scope.$on("$routeChangeSuccess",function(){progressLoader.end()}),$scope.isAuthenticated=function(){return $auth.isAuthenticated()},$scope.search=function(query){userService.search($scope.global.city.path.key,query).then(function(results){$scope.global.search=results.data,$location.path("/search")})},$scope.editProfile=function(){$scope.global.profile=$scope.global.user,$location.path("/profile"),$route.reload()},$scope.logOut=function(){$auth.logout().then(function(){$scope.global.user=void 0,$scope.global.alert=void 0,$location.path("/login")})},$scope.closeAlert=function(){$scope.global.alert=void 0},$scope.global.sessionReady=function(){$scope.global.user&&$scope.global.city?$scope.$broadcast("sessionReady",!0):userService.getProfile().then(function(response){if(response.data){$scope.global.user=response.data,$scope.global.profile||($scope.global.profile=response.data);for(var citystate in $scope.global.user.value.cities)break;cityService.getCity(citystate).then(function(response){response.data&&($scope.global.city=response.data,$scope.$broadcast("sessionReady",!0))})}})},$scope.global.sessionReady()}]).filter("words",function(){return function(text,wordnum){return text?text.split(" ")[wordnum]:void 0}}).controller("PeopleController",["$scope","$location","userService",function($scope,$location,userService){function setPage(){$scope.users.next?($scope.users.start=Number($scope.users.next.match(/offset=([^&]+)/)[1])-Number($scope.users.count)+1,$scope.users.end=Number($scope.users.next.match(/offset=([^&]+)/)[1])):$scope.users.prev?($scope.users.start=Number($scope.users.total_count)-Number($scope.users.count),$scope.users.end=$scope.users.total_count):0===$scope.users.count||void 0===$scope.users?($scope.users.start=0,$scope.users.end=0):($scope.users.start=1,$scope.users.end=$scope.users.total_count)}function getData(){"/people"==$location.$$path||void 0===$scope.global.search?$scope.getUsers("/api/"+$scope.global.city.path.key+"/users?limit=32"):"/search"==$location.$$path&&($scope.users=$scope.global.search,setPage()),$scope.global.city.selectedCluster=["*"],$scope.selectedRole=["*"],setTitle()}function setTitle(){var item,role="",cluster="";if("*"==$scope.selectedRole[0])role="People";else for(item in $scope.selectedRole)role+=$scope.selectedRole[item],item<$scope.selectedRole.length-1&&(role+=item<$scope.selectedRole.length-2?"</strong>,<strong> ":" </strong>&<strong> ");if("*"==$scope.global.city.selectedCluster[0])cluster=$scope.global.city.value.citystate.split(",")[0];else{item=0;for(item in $scope.global.city.selectedCluster)cluster+=$scope.global.city.selectedCluster[item],item<$scope.global.city.selectedCluster.length-1&&(cluster+=item<$scope.global.city.selectedCluster.length-2?", ":" & ")}$scope.title="<strong>"+role+"</strong> in "+cluster}$scope.rotateWidgetClass=function(){var arr=["'themed-background-dark'","themed-background-dark-night","themed-background-dark-modern","themed-background-dark-autumn","themed-background-dark-fancy","themed-background-dark-fire"],idx=Math.floor(Math.random()*arr.length);return arr[idx]},$scope.getUsers=function(alturl){userService.getUsers($scope.global.city.path.key,void 0,void 0,32,alturl).then(function(response){$scope.users=response.data,setPage()})},$scope.viewUser=function(user){$scope.global.profile=user,$location.path("/profile")},$scope.filterCluster=function(cluster){$scope.loadingCluster=!0,"*"==cluster?$scope.global.city.selectedCluster=["*"]:($scope.global.city.selectedCluster.indexOf("*")>=0&&$scope.global.city.selectedCluster.splice($scope.global.city.selectedCluster.indexOf("*"),1),$scope.global.city.selectedCluster.indexOf(cluster)<0?$scope.global.city.selectedCluster.push(cluster):$scope.global.city.selectedCluster.splice($scope.global.city.selectedCluster.indexOf(cluster),1),0===$scope.global.city.selectedCluster.length&&($scope.global.city.selectedCluster=["*"])),userService.getUsers($scope.global.city.path.key,$scope.global.city.selectedCluster,$scope.selectedRole,32,void 0).then(function(response){$scope.loadingCluster=!1,$scope.users=response.data,setPage(),setTitle()})},$scope.filterRole=function(role){$scope.loadingRole=!0,"*"==role?$scope.selectedRole=["*"]:($scope.selectedRole.indexOf("*")>=0&&$scope.selectedRole.splice($scope.selectedRole.indexOf("*"),1),$scope.selectedRole.indexOf(role)<0?$scope.selectedRole.push(role):$scope.selectedRole.splice($scope.selectedRole.indexOf(role),1),0===$scope.selectedRole.length&&($scope.selectedRole=["*"])),userService.getUsers($scope.global.city.path.key,$scope.global.city.selectedCluster,$scope.selectedRole,32,void 0).then(function(response){$scope.loadingRole=!1,$scope.users=response.data,setPage(),setTitle()})},$scope.global.city?getData():$scope.$on("sessionReady",function(){getData()})}]).controller("ProfileController",["$scope","userService","$location","$auth","$bootbox",function($scope,userService,$location,$auth,$bootbox){$scope.putProfile=function(userid,profile){userService.putProfile(userid,profile,function(response){200!==response.status?($scope.global.alert={type:"danger",msg:"There was a problem: "+String(response.message)},console.warn(response.message)):($scope.profile=response.data,$scope.global.alert={type:"success",msg:"Person updated! "+response.data.name+" is good to go."})})},$scope.removeProfile=function(userid,name){$bootbox.confirm("Are you sure you want to remove "+name+"?",function(result){result&&userService.removeProfile(userid,function(){$location.path("/people"),$scope.global.alert={type:"success",msg:"Person removed. Hopefully they'll return some day."}})})},$scope.updateProfile=function(){userService.updateProfile({displayName:$scope.global.user.value.displayName,email:$scope.global.user.value.email}).then(function(){$scope.global.alert={type:"success",msg:"Great news. Your profile has been updated."}})},$scope.getKey=function(){$scope.global.user.value.api_key?$bootbox.alert({title:"See our <a href='https://www.mashape.com/jgentes/applications/startupcommunity-org' target='_blank'>API documentation</a> for help using your key:",message:"<pre>"+$scope.global.user.value.api_key+"</pre>"}):userService.getKey().then(function(response){$scope.global.user.value.api_key=response.data,$bootbox.alert({title:"See our <a href='https://www.mashape.com/jgentes/applications/startupcommunity-org' target='_blank'>API documentation</a> for help using your key:",message:"<pre>"+$scope.global.user.value.api_key+"</pre>"})})},$scope.isCityAdvisor=function(status){userService.setCityAdvisor($scope.global.profile.path.key,$scope.global.city.path.key,"cityAdvisor",status,function(response,rescode){var cluster,sameuser=!1;if(201==rescode){$scope.global.profile.path.key==$scope.global.user.path.key&&(sameuser=!0),void 0===$scope.global.profile.value.cities[$scope.global.city.path.key].cityAdvisor&&($scope.global.profile.value.cities[$scope.global.city.path.key].cityAdvisor=!1),$scope.global.profile.value.cities[$scope.global.city.path.key].cityAdvisor=status;for(cluster in $scope.global.city.value.clusters)status===!0?$scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster]&&($scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].advisorStatus=!0):$scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].advisorStatus=!$scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].roles||$scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].roles.indexOf("Advisor")<0?!1:!0;sameuser&&($scope.global.user.value.cities[$scope.global.city.path.key].cityAdvisor=status)}else $scope.global.alert={type:"danger",msg:"There was a problem: "+String(response.message)},console.warn(response.message)})},$scope.setRole=function(cluster,role,status){userService.setRole($scope.global.profile.path.key,$scope.global.city.path.key,cluster,role,status,function(response,rescode){var sameuser=!1;if(201==rescode){$scope.global.profile.path.key==$scope.global.user.path.key&&(sameuser=!0),void 0===$scope.global.profile.value.cities[$scope.global.city.path.key].clusters&&($scope.global.profile.value.cities[$scope.global.city.path.key].clusters={}),void 0===$scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster]&&($scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster]={roles:[]}),void 0===$scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].roles&&($scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster].roles=[]);var thiscluster=$scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster];status===!0?thiscluster.roles.indexOf(role)<0&&thiscluster.roles.push(role):thiscluster.roles.indexOf(role)>=0&&thiscluster.roles.splice(thiscluster.roles.indexOf(role),1),$scope.global.profile.value.cities[$scope.global.city.path.key].clusters[cluster]=thiscluster,sameuser&&($scope.global.user.value.cities[$scope.global.city.path.key].clusters[cluster]=thiscluster)}else $scope.global.alert={type:"danger",msg:"There was a problem: "+String(response.message)},console.warn(response.message)})},$scope.link=function(provider){$auth.link(provider).then(function(){$scope.global.alert={type:"success",msg:"Well done. You have successfully linked your "+provider+" account"}}).then(function(){$scope.getProfile()}).catch(function(response){$scope.global.alert={type:"danger",msg:"Sorry, but we ran into this error: "+response.data.message}})},$scope.unlink=function(provider){$auth.unlink(provider).then(function(){$scope.global.alert={type:"success",msg:"Bam. You have successfully unlinked your "+provider+" account"}}).then(function(){$scope.getProfile()}).catch(function(response){$scope.global.alert={type:"danger",msg:"Aww, shucks. We ran into this error while unlinking your "+provider+" account: "+response.data.message}})}}]).controller("AddPeopleController",["$scope","$auth","userService",function($scope,$auth,userService){$scope.addPerson=function(url,email,userid){$scope.disabled=!0,userService.addPerson(url,email,userid,function(response){$scope.disabled=!1,200!==response.status?($scope.global.alert={type:"danger",msg:"There was a problem: "+String(response.message)},console.warn(response.message)):$scope.global.alert={type:"success",msg:"Person imported! "+response.data.name+" is good to go."}})},$scope.disabled=!1}]).controller("LoginCtrl",["$scope","$auth","$global","$location","$route",function($scope,$auth,$global,$location,$route){$global.set("fullscreen",!0),$scope.$on("$destroy",function(){$global.set("fullscreen",!1)}),$scope.isAuthenticated=function(){return $auth.isAuthenticated()},$scope.login=function(){$auth.login({email:$scope.email,password:$scope.password}).then(function(response){$scope.global.user=response.data.user,$scope.global.alert=void 0,$scope.global.sessionReady(),$location.path("/"),console.log("Logged in!")}).catch(function(response){$scope.global.alert={type:"danger",msg:"There was a problem: "+String(response.data.message)},console.warn(response.data.message)})},$scope.authenticate=function(provider){$auth.authenticate(provider).then(function(response){$scope.global.user=response.data.user,$scope.global.alert=void 0,$scope.global.sessionReady(),console.log("Logged in!"),$location.path("/"),$route.reload()}).catch(function(response){$scope.global.alert={type:"danger",msg:"There was a problem: "+String(response.data.message)},console.warn(response.data.message)})}}]).controller("SignupCtrl",["$scope","$auth","$global","$location",function($scope,$auth,$global,$location){$global.set("fullscreen",!0),$scope.$on("$destroy",function(){$global.set("fullscreen",!1)}),$scope.signup=function(){$auth.signup({name:$scope.name,email:$scope.email,password:$scope.password}).then(function(){$scope.global.alert={type:"success",msg:"You're in! Registration was successful - welcome aboard."},$location.path("/login")})}}]).controller("RegistrationPageController",["$scope","$timeout",function($scope,$timeout){$scope.checking=!1,$scope.checked=!1,$scope.checkAvailability=function(){$scope.reg_form.username.$dirty!==!1&&($scope.checking=!0,$timeout(function(){$scope.checking=!1,$scope.checked=!0},500))}}]).controller("LaunchformController",["$scope","$global","$http","$q","geocoder",function($scope,$global,$http,$q,geocoder){$global.set("fullscreen",!0),$scope.$on("$destroy",function(){$global.set("fullscreen",!1)}),$scope.formData={},$scope.subscribe=function(){$http({method:"POST",url:"/sub",data:$.param({email:$scope.formData.email,city:$scope.formData.city}),headers:{"Content-Type":"application/x-www-form-urlencoded"}}).success(function(data){data.success?($scope.global.alert={type:"success",msg:"Thanks, we look forward to helping you build a vibrant startup community in <strong>"+$scope.formData.city.substr(0,$scope.formData.city.length-4)+"</strong>!  We'll be in touch soon."},$scope.formData={}):$scope.global.alert={type:"danger",msg:"Something went wrong!"}})},$scope.getLocation=function(val){var deferred=$q.defer();return geocoder.geocode({address:String(val),componentRestrictions:{country:"US"}},function(callbackResult){deferred.resolve(callbackResult)}),deferred.promise}}]).controller("ErrorPageController",["$scope","$global","$location","$window","userService",function($scope,$global,$location,$window,userService){$global.set("fullscreen",!0),$scope.$on("$destroy",function(){$global.set("fullscreen",!1)}),$scope.formData={},$scope.search=function(query){try{userService.search($scope.global.city.path.key,query).then(function(results){$scope.global.search=results.data,$location.path("/search")})}catch(err){$scope.global.alert={type:"danger",msg:"Whoops, we need you to login first."}}},$scope.goBack=function(){$window.history.back()}}]),angular.module("form-directives",[]).directive("autosize",function(){return{restrict:"AC",link:function(scope,element){element.autosize({append:"\n"})}}}).directive("fullscreen",function(){return{restrict:"AC",link:function(scope,element){element.fseditor({maxHeight:500})}}}).directive("colorpicker",function(){return{restrict:"AC",link:function(scope,element){element.colorpicker()}}}).directive("daterangepicker",function(){return{restrict:"A",scope:{options:"=daterangepicker",start:"=dateBegin",end:"=dateEnd"},link:function(scope,element){element.daterangepicker(scope.options,function(start,end){scope.start&&(scope.start=start.format("MMMM D, YYYY")),scope.end&&(scope.end=end.format("MMMM D, YYYY")),scope.$apply()})}}}).directive("multiselect",["$timeout",function($t){return{restrict:"A",link:function(scope,element){$t(function(){element.multiSelect()})}}}]).directive("wizard",function(){return{restrict:"A",scope:{options:"=wizard"},link:function(scope,element){scope.options?(element.stepy(scope.options),1==scope.options.validate&&element.validate({errorClass:"help-block",validClass:"help-block",highlight:function(element){$(element).closest(".form-group").addClass("has-error")},unhighlight:function(element){$(element).closest(".form-group").removeClass("has-error")}})):element.stepy(),element.find(".stepy-navigator").wrapInner('<div class="pull-right"></div>')}}}).directive("maskinput",function(){return{restrict:"A",link:function(scope,element){element.inputmask()}}}).directive("wysiwygCkeditor",function(){return{restrict:"A",scope:{options:"=wysiwygCkeditor"},link:function(scope,element,attr){return scope.options&&1==scope.options.inline?CKEDITOR.inline(attr.name||attr.id,scope.options):void CKEDITOR.replace(attr.name||attr.id,scope.options)}}}),angular.module("theme.templates",[]).run(["$templateCache",function($templateCache){"use strict";$templateCache.put("app/templates/nav_renderer.html",'<a ng-if="!item.heading" ng-click="select(item)" ng-href="{{item.url}}">\n	<i ng-if="item.iconClasses" class="{{item.iconClasses}}"></i><span>{{item.label}}</span>\n	<span ng-bind-html="item.html"></span>\n</a>\n<h5 ng-if="item.heading" class="heading">{{item.heading}}</h5>\n<ul ng-if="item.children.length" data-slide-out-nav="item.open">\n    <li ng-repeat="item in item.children"\n	    ng-class="{ hasChild: (item.children!==undefined),\n                      active: item.selected,\n                        open: (item.children!==undefined) && item.open }"\n    	ng-include="\'views/templates/nav_renderer.html\'"\n    ></li>\n</ul>\n'),$templateCache.put("app/templates/people_renderer.html","<div class=\"widget\">\n    <div style=\"overflow: hidden;\" class=\"widget-simple\" ng-class=\"['themed-background-dark','themed-background-dark-night', 'themed-background-dark-fire', 'themed-background-dark-autumn', 'themed-background-dark-fancy', 'themed-background-dark-flatie'][$index % 6]\">\n        <div>\n            <a ng-click=\"viewUser(item)\" title=\"View {{::item.value.name | words:0}}'s Profile\"><img ng-src=\"{{::item.value.avatar || item.value.linkedin.pictureUrl || '/public/blank_avatar.png'}}\" alt=\"{{::item.value.name}}\" class=\"widget-image img-circle pull-left\"></a>\n        </div>\n        <h4 class=\"widget-content widget-content-light\">\n            <div ng-class=\"['themed-color','themed-color-night', 'themed-color-fire', 'themed-color-autumn', 'themed-color-fancy', 'themed-color-flatie'][$index % 6]\">\n"+'                <a ng-click="viewUser(item)" title="View {{::item.value.name | words:0}}\'s Profile" style="color: inherit; text-decoration: none;"><strong>{{::item.value.name}}</strong></a>\n                <a ng-show="{{(item.value.linkedin.summary).length > 0}}" title="Show Summary" ng-click="showSummary = !showSummary" class="btn btn-xs" ng-class="[\'themed-color\', \'themed-color-night\', \'themed-color-fire\', \'themed-color-autumn\', \'themed-color-fancy\', \'themed-color-flatie\'][$index % 6]" style="float:right">\n                    <i class="fa fa-chevron-down fa-fw"></i>\n                </a>\n            </div>\n            <small>{{::item.value.linkedin.headline}}</small>\n        </h4>\n        \n    </div>\n    <div class="widget-extra" ng-show="showSummary">\n        <h4 class="sub-header">Summary</h4>\n        <p style="white-space:pre-wrap;">{{::item.value.linkedin.summary}}</p>\n    </div>\n</div>')}]),angular.module("theme.template-overrides",[]).config(["$provide",function($provide){$provide.decorator("progressbarDirective",function($delegate){return $delegate[0].templateUrl=function(){return"template/progressbar/progressbar.html"},angular.extend($delegate[0].scope,{heading:"@"}),$delegate})}]).run(["$templateCache",function($templateCache){$templateCache.put("footerTemplate.html",'<div ng-show="showFooter" class="ng-grid-footer" ng-style="footerStyle()">\r\n    <div class="col-md-4" >\r\n        <div class="ngFooterTotalItems" ng-class="{\'ngNoMultiSelect\': !multiSelect}" >\r\n            <span class="ngLabel">{{i18n.ngTotalItemsLabel}} {{maxRows()}}</span><span ng-show="filterText.length > 0" class="ngLabel">({{i18n.ngShowingItemsLabel}} {{totalFilteredItemsLength()}})</span>\r\n        </div>\r\n        <div class="ngFooterSelectedItems" ng-show="multiSelect">\r\n            <span class="ngLabel">{{i18n.ngSelectedItemsLabel}} {{selectedItems.length}}</span>\r\n        </div>\r\n    </div>\r\n    <div class="col-md-4" ng-show="enablePaging" ng-class="{\'ngNoMultiSelect\': !multiSelect}">\r\n            <label class="control-label ng-grid-pages center-block">{{i18n.ngPageSizeLabel}}\r\n               <select class="form-control input-sm" ng-model="pagingOptions.pageSize" >\r\n                      <option ng-repeat="size in pagingOptions.pageSizes">{{size}}</option>\r\n                </select>\r\n        </label>\r\n</div>\r\n     <div class="col-md-4">\r\n        <div class="pull-right ng-grid-pagination">\r\n            <button type="button" class="btn btn-default btn-sm" ng-click="pageToFirst()" ng-disabled="cantPageBackward()" title="{{i18n.ngPagerFirstTitle}}"><i class="fa fa-angle-double-left"></i></button>\r\n            <button type="button" class="btn btn-default btn-sm" ng-click="pageBackward()" ng-disabled="cantPageBackward()" title="{{i18n.ngPagerPrevTitle}}"><i class="fa fa-angle-left"></i></button>\r\n            <label class="control-label">\r\n                   <input class="form-control input-sm" min="1" max="{{currentMaxPages}}" type="number" style="width:50px; height: 24px; margin-top: 1px; padding: 0 4px;" ng-model="pagingOptions.currentPage"/>\r\n            </label>\r\n            <span class="ngGridMaxPagesNumber" ng-show="maxPages() > 0">/ {{maxPages()}}</span>\r\n            <button type="button" class="btn btn-default btn-sm" ng-click="pageForward()" ng-disabled="cantPageForward()" title="{{i18n.ngPagerNextTitle}}"><i class="fa fa-angle-right"></i></button>\r\n            <button type="button" class="btn btn-default btn-sm" ng-click="pageToLast()" ng-disabled="cantPageToLast()" title="{{i18n.ngPagerLastTitle}}"><i class="fa fa-angle-double-right"></i></button>\r\n        </div>\r\n     </div>\r\n</div>\r\n'),$templateCache.put("template/rating/rating.html",'<span ng-mouseleave="reset()" ng-keydown="onKeydown($event)" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="{{range.length}}" aria-valuenow="{{value}}">\n    <i ng-repeat="r in range track by $index" ng-mouseenter="enter($index + 1)" ng-click="rate($index + 1)" class="fa" ng-class="$index < value && (r.stateOn || \'fa-star\') || (r.stateOff || \'fa-star-o\')">\n        <span class="sr-only">({{ $index < value ? \'*\' : \' \' }})</span>\n    </i>\n</span>')
}]),angular.module("navigation-controller",[]).controller("NavigationController",["$scope","$location","$timeout","$global","userService",function($scope,$location,$timeout,$global,userService){var buildNav=function(){var menu=[{label:$scope.global.city.value.citystate.split(",")[0],iconClasses:"fa fa-globe",url:"/"},{heading:"COMMUNITY"},{label:"People",iconClasses:"fa fa-leaf",url:"/people",children:[{label:"Add People",url:"/people/add"}]},{label:"Startups",iconClasses:"fa fa-rocket"},{heading:"CLUSTERS"}];for(var cluster in $scope.global.city.value.clusters)menu.push({label:cluster,cluster:!0,iconClasses:"fa "+$scope.global.city.value.clusters[cluster].icon,url:"/cluster"});var setParent=function(children,parent){angular.forEach(children,function(child){child.parent=parent,void 0!==child.children&&setParent(child.children,child)})};$scope.menu=menu,setParent($scope.menu,null),$scope.openItems=[],$scope.selectedItems=[],$scope.selectedFromNavMenu=!1,$scope.findItemByUrl=function(children,url){for(var i=0,length=children.length;length>i;i++){if(children[i].url&&children[i].url.replace("#","")==url)return children[i];if(void 0!==children[i].children){var item=$scope.findItemByUrl(children[i].children,url);if(item)return item}}},$scope.select=function(item){if(item.open)return void(item.open=!1);for(var i=$scope.openItems.length-1;i>=0;i--)$scope.openItems[i].open=!1;$scope.openItems=[];for(var parentRef=item;null!==parentRef;)parentRef.open=!0,$scope.openItems.push(parentRef),parentRef=parentRef.parent;$scope.selectedFromNavMenu=!0;for(var j=$scope.selectedItems.length-1;j>=0;j--)$scope.selectedItems[j].selected=!1;for($scope.selectedItems=[],parentRef=item;null!==parentRef;)parentRef.selected=!0,$scope.selectedItems.push(parentRef),parentRef=parentRef.parent;item.cluster&&userService.getUsers($scope.global.city.path.key,item.label,void 0,void 0).then(function(response){$scope.global.search=response.data,$location.path(item.url)}),item.role&&userService.getUsers($scope.global.city.path.key,void 0,item.label.slice(0,-1),void 0).then(function(response){$scope.global.search=response.data,$location.path(item.url)})},$scope.$watch(function(){return $location.path()},function(newVal){if($scope.selectedFromNavMenu===!1){var item=$scope.findItemByUrl($scope.menu,newVal);item&&$timeout(function(){$scope.select(item)})}$scope.selectedFromNavMenu=!1})};$scope.global.city?buildNav():$scope.$on("sessionReady",function(event,status){status&&buildNav()})}]);var app=angular.module("StartupCommunity",["ui.bootstrap","ui.select2","toggle-switch","form-directives","navigation-controller","ngCookies","ngResource","ngSanitize","ngRoute","ngAnimate","appControllers","appServices","appDirectives","theme.templates","theme.template-overrides","angulartics","angulartics.segment.io","satellizer"]);app.config(function($authProvider){$authProvider.linkedin({clientId:"75bqixdv58z1az",url:"/auth/linkedin"})}).config(["$provide","$routeProvider","$locationProvider",function($provide,$routeProvider,$locationProvider){$routeProvider.when("/",{redirectTo:"/people"}).when("/launchform",{templateUrl:"views/launchform.html"}).when("/people",{templateUrl:"views/people.html",resolve:{authenticated:["$location","$auth",function($location,$auth){return $auth.isAuthenticated()?void 0:$location.path("/launchform")}]}}).when("/search",{templateUrl:"views/people.html",resolve:{authenticated:["$location","$auth",function($location,$auth){return $auth.isAuthenticated()?void 0:$location.path("/launchform")}]}}).when("/people/add",{templateUrl:"views/add_people.html",resolve:{authenticated:["$location","$auth",function($location,$auth){return $auth.isAuthenticated()?void 0:$location.path("/launchform")}],lazyLoad:["lazyLoad",function(lazyLoad){return lazyLoad.load(["bower_components/jquery-validation/dist/jquery.validate.js","bower_components/stepy/lib/jquery.stepy.js"])}]}}).when("/profile",{templateUrl:"views/user_profile.html",resolve:{authenticated:["$location","$auth",function($location,$auth){return $auth.isAuthenticated()?void 0:$location.path("/launchform")}]}}).when("/alpha",{templateUrl:"views/home.html"}).when("/login",{templateUrl:"views/login.html"}).when("/logout",{controller:"LogoutCtrl"}).otherwise({templateUrl:"views/404.html"}),$locationProvider.html5Mode(!0)}]);