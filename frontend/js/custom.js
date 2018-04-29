(function($) {
	'use strict';
	/*
	Variable
	=========================== */
	var $window_w = $(window).width(),
        $body = $("body"),
        $nav = $("nav");

    /*
	Features
	=========================== */
    $("ul.feature-two").each(function(){
        var $this = $(this),
            $window_w = $(window).width(),
            $gHeight = $this.height();

        $this.append("<span class='line'></span>");
        $("li", this).last().css("margin-bottom","-19px");
    });

    /*
	Animated Scroll
	=========================== */   
    $(window).scroll(function(){
		var scrollTop = $(window).scrollTop();
		if(scrollTop != 0){
            if (!$("nav.navbar").hasClass("nav-fixed")) {
                $("nav.navbar").addClass("nav-fixed");
                $(".scroll.top").fadeIn(1000);
                $(".submenu").slideUp(1000);
                $(".logo").animate({height: "40px", width: "119px"});
                return false;
            }
		} else {
            if ($("nav.navbar").hasClass("nav-fixed")) {
                $("nav.navbar").removeClass("nav-fixed");
                $(".scroll.top").fadeOut(1000);
                $(".submenu").slideDown(1000);
                $(".logo").animate({height: "88px", width: "260px"});
                return false;
            }
		}
	});

})(jQuery);

