$(document).ready(function () {
  let root = document.documentElement;
  var styles = getComputedStyle(document.documentElement);

  function getScrollbarWidth() {
    // Creating invisible container
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll"; // forcing scrollbar to appear
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
    document.body.appendChild(outer);

    // Creating inner element and placing it in the container
    const inner = document.createElement("div");
    outer.appendChild(inner);

    // Calculating difference between container's full width and the child width
    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

    // Removing temporary elements from the DOM
    outer.parentNode.removeChild(outer);

    return scrollbarWidth;
  }

  function ajust100vw(selector) {
    $(selector).css(
      "width",
      "calc(100vw - " + (getScrollbarWidth() + 1) + "px)"
    );
  }
  ajust100vw("header");

  // Navigation menu dropdowns
  $(".mobile-hamburger").click(function () {
    if (styles.getPropertyValue("--is-mobile-nav").trim() == "true") {
      if ($(".mobile-hamburger-open").css("display") == "none") {
        $(".mobile-hamburger-close").css("display", "none");
        $(".mobile-hamburger-open").css("display", "flex");
        $(".sticky-home-menu").css("opacity", "0");
        $(".sticky-home-menu").css("transform", "translateY(-10px)");
        setTimeout(function () {
          $(".sticky-home-menu").css("display", "none");
        }, 200);
      } else {
        $(".mobile-hamburger-close").css("display", "flex");
        $(".mobile-hamburger-open").css("display", "none");
        $(".sticky-home-menu").css("display", "flex");
        setTimeout(function () {
          $(".sticky-home-menu").css("opacity", "1");
          $(".sticky-home-menu").css("transform", "translateY(0)");
        }, 1);
      }
    }
  });
  $(document).click(function (event) {
    // Check if navigation was clicked
    if (styles.getPropertyValue("--is-mobile-nav").trim() == "true") {
      if (
        $(event.target)
          .parents("*")
          .get()
          .includes($(".sticky-home-header").get(0)) ||
        $(event.target).get(0) == $(".sticky-home-header").get(0)
      ) {
        return;
      } else if ($(".mobile-hamburger-open").css("display") == "none") {
        $(".mobile-hamburger-close").css("display", "none");
        $(".mobile-hamburger-open").css("display", "flex");

        $(".sticky-home-menu").css("opacity", "0");
        $(".sticky-home-menu").css("transform", "translateY(-10px)");
        setTimeout(function () {
          $(".sticky-home-menu").css("display", "none");
        }, 200);
      }
    }
  });

  $("#sticky-home-menu-structures button").click(function () {
    if (styles.getPropertyValue("--is-mobile-nav").trim() == "true") {
      if ($("#sticky-home-dropdown-structures").css("display") == "block") {
        $(this).trigger("mouseleave");
      } else {
        $(this).trigger("mouseenter");
      }
    }
  });
  var sticky_menu_structures_leave_timer;
  $("#sticky-home-menu-structures").mouseenter(function () {
    try {
      clearTimeout(sticky_menu_structures_leave_timer);
    } catch (error) {}
    $("#sticky-home-menu-structures button").css("border-bottom", "none");

    setTimeout(function () {
      $("#sticky-home-dropdown-structures").css("display", "block");
      while (true) {
        if ($("#sticky-home-dropdown-structures").css("display") == "block") {
          $("#sticky-home-dropdown-structures").css(
            "transform",
            "translateY(0)"
          );
          $("#sticky-home-dropdown-structures").css("opacity", "0.99");
          break;
        }
      }
      // setTimeout(function() {
      //     $("#sticky-home-dropdown-structures").css("transform", "translateY(0)");
      //     $("#sticky-home-dropdown-structures").css("opacity", "0.99");
      // }, 1);
      // $("#sticky-home-dropdown-structures").css("transform", "translateY(0)");
      // $("#sticky-home-dropdown-structures").css("opacity", "0.99");
    }, 1);
    if (styles.getPropertyValue("--is-mobile-nav").trim() == "true") {
      // If we're on a mobile device
      $("#sticky-home-menu-vessels").trigger("mouseleave");
      $(this).css("margin-left", "0px");
      $(this).css("padding-left", "10px");
      $(this).css(
        "background",
        "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgb(241 241 241) 100%)"
      );
      $(this).children("button").css("background-color", "#0000");
      $(this)
        .children("button")
        .children(".sticky-home-mobile-caret")
        .children("ion-icon")
        .css("transform", "rotate(180deg)");
    } else {
      $("#sticky-home-menu-structures button").css(
        "border-top",
        "2px solid #bfbfbf"
      );
      $("#sticky-home-menu-structures button").css(
        "box-shadow",
        "inset 0px 85px 20px -100px black"
      );
    }
  });
  $("#sticky-home-menu-structures").mouseleave(function () {
    $("#sticky-home-menu-structures button").css("border-top", "none");
    $("#sticky-home-menu-structures button").css("box-shadow", "none");
    $("#sticky-home-dropdown-structures").css("transform", "translateY(-10px)");
    $("#sticky-home-dropdown-structures").css("opacity", "0");
    sticky_menu_structures_leave_timer = setTimeout(function () {
      $("#sticky-home-dropdown-structures").css("display", "none");
    }, 250);
    if (styles.getPropertyValue("--is-mobile-nav").trim() == "true") {
      $(this).get(0).style.removeProperty("margin-left");
      $(this).get(0).style.removeProperty("padding-left");
      $(this).get(0).style.removeProperty("background");
      $(this)
        .children("button")
        .get(0)
        .style.removeProperty("background-color");
      $(this)
        .children("button")
        .children(".sticky-home-mobile-caret")
        .children("ion-icon")
        .get(0)
        .style.removeProperty("transform");
    }
  });

  $("#sticky-home-menu-vessels button").click(function () {
    if (styles.getPropertyValue("--is-mobile-nav").trim() == "true") {
      if ($("#sticky-home-dropdown-vessels").css("display") == "block") {
        $(this).trigger("mouseleave");
      } else {
        $(this).trigger("mouseenter");
      }
    }
  });
  var sticky_menu_vessels_leave_timer;
  $("#sticky-home-menu-vessels").mouseenter(function () {
    try {
      clearTimeout(sticky_menu_vessels_leave_timer);
    } catch (error) {}
    $("#sticky-home-menu-vessels button").css("border-bottom", "none");

    setTimeout(function () {
      $("#sticky-home-dropdown-vessels").css("display", "block");
      while (true) {
        if ($("#sticky-home-dropdown-vessels").css("display") == "block") {
          $("#sticky-home-dropdown-vessels").css("transform", "translateY(0)");
          $("#sticky-home-dropdown-vessels").css("opacity", "0.99");
          break;
        }
      }
    }, 1);

    if (styles.getPropertyValue("--is-mobile-nav").trim() == "true") {
      $("#sticky-home-menu-structures").trigger("mouseleave");
      $(this).css("margin-left", "0px");
      $(this).css("padding-left", "10px");
      $(this).css(
        "background",
        "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgb(241 241 241) 100%)"
      );
      $(this).children("button").css("background-color", "#0000");
      $(this)
        .children("button")
        .children(".sticky-home-mobile-caret")
        .children("ion-icon")
        .css("transform", "rotate(180deg)");
    } else {
      $("#sticky-home-menu-vessels button").css(
        "border-top",
        "2px solid #bfbfbf"
      );
      $("#sticky-home-menu-vessels button").css(
        "box-shadow",
        "inset 0px 85px 20px -100px black"
      );
    }
  });
  $("#sticky-home-menu-vessels").mouseleave(function () {
    $("#sticky-home-menu-vessels button").css("border-top", "none");
    $("#sticky-home-menu-vessels button").css("box-shadow", "none");
    $("#sticky-home-dropdown-vessels").css("transform", "translateY(-10px)");
    $("#sticky-home-dropdown-vessels").css("opacity", "0");
    sticky_menu_vessels_leave_timer = setTimeout(function () {
      $("#sticky-home-dropdown-vessels").css("display", "none");
    }, 250);
    if (styles.getPropertyValue("--is-mobile-nav").trim() == "true") {
      $(this).get(0).style.removeProperty("margin-left");
      $(this).get(0).style.removeProperty("padding-left");
      $(this).get(0).style.removeProperty("background");
      $(this)
        .children("button")
        .get(0)
        .style.removeProperty("background-color");
      $(this)
        .children("button")
        .children(".sticky-home-mobile-caret")
        .children("ion-icon")
        .get(0)
        .style.removeProperty("transform");
    }
  });

  var isMobileNav = styles.getPropertyValue("--is-mobile-nav").trim();
  $(window).resize(function () {
    if (isMobileNav != styles.getPropertyValue("--is-mobile-nav").trim()) {
      $(".sticky-home-menu").removeAttr("style");
      $(".sticky-home-menu-item").removeAttr("style");
      $(".sticky-home-menu-item button").removeAttr("style");
      $(".sticky-home-dropdown").removeAttr("style");
      $(".mobile-hamburger-open").removeAttr("style");
      $(".mobile-hamburger-close").removeAttr("style");
    }
    isMobileNav = styles.getPropertyValue("--is-mobile-nav").trim();
  });

  function removeHash() {
    history.pushState(
      "",
      document.title,
      window.location.pathname + window.location.search
    );
  }
  try {
    $("html, body").animate(
      { scrollTop: $(window.location.hash).offset().top - 70 },
      0
    );
    removeHash();
  } catch (error) {}
  $("div.sticky-home-dropdown-item")
    .get()
    .forEach(function (dropdownItem) {
      $(dropdownItem).click(function () {
        $("html, body").animate(
          { scrollTop: $("#" + dropdownItem.id.slice(7)).offset().top - 70 },
          750
        );
      });
    });
  $(".js-scroll-contact").click((e) => {
    $("html, body").animate({ scrollTop: $("footer").offset().top }, 750);
  });
  $(".header-more-btn").click(() => {
    $("html, body").animate(
      { scrollTop: $(".our-work-p1").offset().top },
      1000
    );
  });
});
