(function($) {
	'use strict';
	/*
	Testimonial
	=========================== */
    var testimonial = $("#testimonial");
    var author = $("#author");

    testimonial.owlCarousel({
		autoPlay : 9000,
        singleItem : true,
        slideSpeed : 1000,
        navigation: false,
        pagination:false,
        afterAction : syncPosition,
        responsiveRefreshRate : 200,
        transitionStyle : "fade"
    });

    author.owlCarousel({
        items : 5,
        itemsTablet       : [980,3],
        itemsMobile       : [640,2],
        pagination:false,
        responsiveRefreshRate : 100,
        afterInit : function(el){
          el.find(".owl-item").eq(0).addClass("active");
        }
    });

    function syncPosition(el){
        var current = this.currentItem;
        $("#author")
          .find(".owl-item")
          .removeClass("active")
          .eq(current)
          .addClass("active")
        if($("#author").data("owlCarousel") !== undefined){
          center(current)
        }
    }

    $("#author").on("click", ".owl-item", function(e){
        e.preventDefault();
        var number = $(this).data("owlItem");
        testimonial.trigger("owl.goTo",number);
    });

    function center(number){
        var authorvisible = author.data("owlCarousel").owl.visibleItems;
        var num = number;
        var found = false;
        for(var i in authorvisible){
          if(num === authorvisible[i]){
            var found = true;
          }
        }

        if(found===false){
          if(num>authorvisible[authorvisible.length-1]){
            author.trigger("owl.goTo", num - authorvisible.length+2)
          }else{
            if(num - 1 === -1){
              num = 0;
            }
            author.trigger("owl.goTo", num);
          }
        } else if(num === authorvisible[authorvisible.length-1]){
          author.trigger("owl.goTo", authorvisible[1])
        } else if(num === authorvisible[0]){
          author.trigger("owl.goTo", num-1)
        }

    }
})(jQuery);