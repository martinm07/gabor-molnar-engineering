$(document).ready(function() {

    // Button animations
    // hover
    $("#news-submit").mouseenter(function() {
        $("#news-submit").css("box-shadow", "inset 0px 0px 0px 0px #f3f3f3, 3px 3px #eaeaea");
        $("#news-submit").css("width", "105px");
    });
    $("#news-submit").mouseleave(function() {
        setTimeout(function() { $("#news-submit").get(0).style.removeProperty('transition'); }, 10);
        $("#news-submit").get(0).style.removeProperty('transform');
        $("#news-submit").get(0).style.removeProperty('background-color');
        $("#news-submit").get(0).style.removeProperty('box-shadow');
        
        $("#news-submit").get(0).style.removeProperty('box-shadow');
        $("#news-submit").get(0).style.removeProperty('width');
    });
    // click
    $("#news-submit").mousedown(function() {
        $("#news-submit").css("transition", "none")
        $("#news-submit").css("transform", "translate(3px, 3px)");
        $("#news-submit").css("background-color", "#f3f3f3");
        $("#news-submit").css("box-shadow", "inset 0px 0px 0px 0px #f3f3f3, 0 0 #eaeaea");
    });
    $("#news-submit").mouseup(function() {
        $("#news-submit").get(0).style.removeProperty('transform');
        $("#news-submit").get(0).style.removeProperty('background-color');
        $("#news-submit").get(0).style.removeProperty('box-shadow');
        $("#news-submit").trigger("mouseenter");
        setTimeout(function() { $("#news-submit").get(0).style.removeProperty('transition'); }, 200)
    });

    $("#news-submit").click(function() {
        $.getJSON($SCRIPT_ROOT + '/_signup_newsletter', {
            email: $("#news-email-input").val()
        }, function(data) {
            if (data.news_success) {
                $(".error-msg").css("display", "none");
                $(".success-msg").css("display", "flex");

                $(".success-msg span").addClass("animate__animated");
                $(".success-msg span").addClass("animate__tada");
                $(".success-msg span").get(0).addEventListener('animationend', () => {
                    $(".success-msg span").removeClass("animate__animated");
                    $(".success-msg span").removeClass("animate__tada");
                });

                $("#news-email-input").val("");
            } else {
                $(".success-msg").css("display", "none");
                $(".error-msg").css("display", "flex");
                $(".error-msg span").html("<ion-icon name=\"warning-outline\"></ion-icon>"+data.news_error_msgs["email"]);

                $(".error-msg span").addClass("animate__animated");
                $(".error-msg span").addClass("animate__shakeX");
                $(".error-msg span").get(0).addEventListener('animationend', () => {
                    $(".error-msg span").removeClass("animate__animated");
                    $(".error-msg span").removeClass("animate__shakeX");
                });
            }
        });
        return false;
    });

    // BLOG SHOWCASE CAROUSEL
    $(".blog-showcase-body").slick({
        dots: true,
        slidesToShow: 3,
        appendArrows: $(".blog-showcase-arrows"),
        prevArrow: '<ion-icon name="chevron-back" class="arrow-back"></ion-icon>',
        nextArrow: '<ion-icon name="chevron-forward" class="arrow-forward"></ion-icon>',
        appendDots: $(".blog-showcase-dots"),
        customPaging: function(slider, i) {
            return '<span class="dot"></span>';
        },
        responsive: [
            {
              breakpoint: 700,
              settings: {
                slidesToShow: 2
              }
            },
            {
              breakpoint: 480,
              settings: {
                slidesToShow: 1
              }
            }
        ]
    });
});