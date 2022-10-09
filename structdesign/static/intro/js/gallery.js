$(document).ready(function() {
    for (let i = 0; i < document.getElementsByClassName("desc").length; i++) {
        const desc = document.getElementsByClassName("desc")[i];
        $(".center-section--"+(i+1)).css("margin-left", ((window.innerWidth-desc.offsetWidth)/2)+"px");
    }
    function setUpCarousel(carouselID, variableWidth = false, slidesToShow = 3, responsive = [
        {
          breakpoint: 700,
          settings: {
            slidesToShow: 2,
            autoplay: false
          }
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow: 1,
            autoplay: false
          }
        }
    ]) {
        $("#"+carouselID+" .gallery-carousel-body").slick({
            variableWidth: variableWidth,
            autoplay: true,
            pauseOnDotsHover: true,
            dots: true,
            slidesToShow: 3,
            appendArrows: $("#"+carouselID+" .gallery-carousel-arrows"),
            prevArrow: '<ion-icon name="chevron-back" class="arrow-back"></ion-icon>',
            nextArrow: '<ion-icon name="chevron-forward" class="arrow-forward"></ion-icon>',
            appendDots: $("#"+carouselID+" .gallery-carousel-dots"),
            customPaging: function(slider, i) {
                return '<span class="dot"></span>';
            },
            responsive: responsive
        }).magnificPopup({
            delegate: "a:not(.slick-cloned)",
            type: "image",
            gallery: {
                enabled: true
            },
            callbacks: {
                beforeClose: function() {
                    let carousel = $("#"+carouselID+" .gallery-carousel-body");
                    // First 2 (3 - 1) items don't scroll nicely
                    // first item wants to go -1 and second wants 0. The current position is either 8 or 9.
                    if ((carousel.slick("slickCurrentSlide") >= this.items.length-1-carousel.slick("slickGetOption", "slidesToShow")+1) && (this.index < carousel.slick("slickGetOption", "slidesToShow")-1)) {
                        var goToIndex = (this.items.length-1+this.index); // slick can hanle numbers beyond the range of the number of items in the carousel
                    } else {
                        var goToIndex = this.index-1;
                    }
                    let slidesToShow = parseInt(getComputedStyle($("#"+carouselID).get(0)).getPropertyValue("--slides-per-show"));
                    if (slidesToShow < 3) {
                        goToIndex += 1;
                    }
                    if ($("#"+carouselID).hasClass("carousel-wt-vid")) {
                        if ((this.index == 0) && (slidesToShow == 3)) {
                            goToIndex += 1;
                        } else if (this.index == this.items.length-1) {
                            goToIndex = $("#"+carouselID+" .gallery-carousel-item:not(.slick-cloned)").length-1-slidesToShow;
                        }

                    }
                    console.log(carousel.slick("slickCurrentSlide"));
                    carousel.slick('slickGoTo', goToIndex);
                }
            }
        })
        // To make slick play nice with magnificPopup, clicks on the "cloned" items should pretend to be clicks on the real item they correspond to
        $("#"+carouselID+" .gallery-carousel-item.slick-cloned").click(function(e) {
            e.preventDefault();
            let realItems = $("#"+carouselID+" .gallery-carousel-item:not(.slick-cloned)").get();
            let realIndex = realItems.map(e => e.href).indexOf(e.currentTarget.href);
            $(realItems[realIndex]).click();
        });
    }
    function vidCarouselUpdateDots(carouselID) {
        let slidesToShow = parseInt(getComputedStyle($("#"+carouselID).get(0)).getPropertyValue("--slides-per-show"));
        let vidIndex = $("#"+carouselID+" .gallery-carousel-item:not(.slick-cloned)").length-1;
        $($("#"+carouselID+" .gallery-carousel-dots .slick-dots").children().get().slice(vidIndex-(slidesToShow-1), vidIndex)).css("display", "none");
    }
    function setUpVidCarousel(carouselID) {
        vidCarouselUpdateDots(carouselID);
        $("#"+carouselID+" .gallery-carousel-body").on('breakpoint', function(event, slick) {
            vidCarouselUpdateDots(carouselID);
        });
        $("#"+carouselID+" .gallery-carousel-body").on('beforeChange', function(event, slick, currentSlide, nextSlide) {
            let slidesToShow = parseInt(getComputedStyle($("#"+carouselID).get(0)).getPropertyValue("--slides-per-show"));
            let vidIndex = $("#"+carouselID+" .gallery-carousel-item:not(.slick-cloned)").length-1;
            let style_path = "#"+carouselID+" .gallery-carousel-body"
            if ((nextSlide >= vidIndex - (slidesToShow-1)) && (nextSlide < vidIndex) && (currentSlide!=vidIndex)) {
                $(style_path).slick("slickSetOption", "waitForAnimate", false)
                setTimeout(function() {
                    $(style_path).slick("slickGoTo", vidIndex);
                    $(style_path).slick("slickSetOption", "waitForAnimate", true);
                }, 1);
            } else if ((nextSlide >= vidIndex - (slidesToShow-1)) && (nextSlide < vidIndex) && (currentSlide==vidIndex)) {
                $(style_path).slick("slickSetOption", "waitForAnimate", false)
                setTimeout(function() {
                    $(style_path).slick("slickGoTo", vidIndex-slidesToShow);
                    $(style_path).slick("slickSetOption", "waitForAnimate", true);
                }, 1);
            };
        });
    }

    setUpCarousel("carousel-stability1");
    setUpCarousel("carousel-stability2");
    setUpCarousel("carousel-connections");
    setUpCarousel("carousel-domes");
    setUpCarousel("carousel-brackets");
    setUpCarousel("carousel-vessels1", variableWidth=true);
    setUpVidCarousel("carousel-vessels1");
    setUpCarousel("carousel-vessels2", variableWidth=true);
    setUpVidCarousel("carousel-vessels2");
    setUpCarousel("carousel-vessels3", variableWidth=true);
    setUpVidCarousel("carousel-vessels3");

    $(".clients-carousel-body").slick({
        variableWidth: true,
        autoplay: true,
        autoplaySpeed: 750,
        dots: false,
        appendArrows: $(".clients-carousel-arrows"),
        prevArrow: '<ion-icon name="chevron-back" class="arrow-back"></ion-icon>',
        nextArrow: '<ion-icon name="chevron-forward" class="arrow-forward"></ion-icon>',
        swipeToSlide: true
    })
});