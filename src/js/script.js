(function($) {
  'use strict';

  var $window = $(window);

  // :: Preloader Active Code
  $window.on('load', function() {
    console.log('loaded')
    $('#preloader').fadeOut('1000', function() {
      $(this).remove();
    });
  });
  // :: Sticky Active Code
  $window.on('scroll', function() {
    var st = $window.scrollTop();
    if (st > 0) {
      $('.header-area').addClass('sticky');
    } else {
      $('.header-area').removeClass('sticky');
    }
    if (st > 100) {
      $('.go-top').removeClass('fadeOut').addClass('fadeIn');
    } else {
      $('.go-top').removeClass('fadeIn').addClass('fadeOut');
    }
  });

  if ($.fn.scrollTo) {
    $('.go-top').click(function() {
      console.log('go-top')
      window.scrolling = true;
      $.scrollTo(0, {
        duration: 1000,
        easing: 'easeOutQuad',
        onAfter: function() {
          console.log('go-top done');
          setTimeout(function() {
            window.scrolling = false;
          }, 10)
        }
      })
    })
  }

  $(document).activeNavigation('#nav');
})(jQuery);
