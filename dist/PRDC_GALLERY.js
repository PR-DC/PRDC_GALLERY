/**
 * @file Class for responsive JavaScript (jQuery) image gallery and 
 * lightbox with swipe gestures.
 * @author Petar Cosic <pcosic@pr-dc.com> <cpetar112@gmail.com>
 * PR-DC, Republic of Serbia
 * info@pr-dc.com
 * @version 1.0.0
 * --------------------
 * Copyright (C) 2023 PR-DC <info@pr-dc.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

//    ____   ____           ____    ____
//   |  _ \ |  _ \         |  _ \  / ___|
//   | |_) || |_) |  ____  | | | || |
//   |  __/ |  _ <  |____| | |_| || |___
//   |_|    |_| \_\        |____/  \____|
// 
//   We do software development in-house.
//   Do you like what you see?
//   Get in touch with us: info@pr-dc.com
// 
//   ___________________________________________________
//  | Carousel / Window (.prdc-gallery-carousel)       |
//  |__________________________________________________|
//  | Image slider (.prdc-gallery-image-slider)        |
//  |__________________________________________________|_______________________
//  | Images container (.prdc-gallery-images-container)|                       |
//  | _________________________________________________|_______________________|
//  ||  Slide 1   |    Image 1            |            || Slide 2   |  Image 2 |
//  ||            |                       |            ||           |          |
//  ||            |        /`·.¸          |            ||           |        . |
//  ||            |       /¸...¸`:·       |            ||           |       ":"|
//  ||            |   ¸.·´  ¸   `·.¸.·´)  |            ||           |     ___:_|
//  ||            |  : © ):´;      ¸  {   |            ||           |   ,'     |
//  ||            |   `·.¸ `·  ¸.·´\`·¸)  |            ||           |   |  O   |
//  ||            |       `\\´´\¸.·´      |            ||           | ~^~^~^~^~|
//  ||____________|_______________________|____________||___________|__________|
//  |__________________________________________________|_______________________|
//  |__________________________________________________|
//  |__________________________________________________|

// Global variables that can be change based on user desire
var PRDC_GALLERY_IMAGE_LOAD_ANIMATION_SPEED = 400; // Image load animation time from gallery to carousel in [ms] (400 ms recomended)
var PRDC_GALLERY_SLIDE_CHANGE_ANIMATION_SPEED = 200; // Slide change animation time in [ms] (200 ms recomended)
var PRDC_TIME_INTERVAL = 200 // [ms] How fast untill pointer up event to change the slide -> after this time --on pointer up-- will not change the slide
var PRDC_DX_INTERVAL = 50 // [px] How far do you need to drag the slide left or right for it to change
var PRDC_MARGIN_TOP = 100 // [px] How far do you need to drag the slide up or down for it to close
 
// Global variables 
var PRDC_GALLERY_NUMBER = 0; // Global gallery counter

/**
* Class for making a gallery object.
*/
class PRDC_GALLERY_CLASS { 
  /**
  * Create a gallery.
  */
  constructor() {
    this.galleries = [];
  }

  /**
   * Method for connecting galleries and carousels
   * @param {string} gallery_selector - string value representing a gallery selector
   */
  attach(gallery_selector) {
    if(gallery_selector.trim().startsWith('.')) {
      var galleries = document.getElementsByClassName(gallery_selector.slice(1));
      if(galleries.length == 0) {
        throw new Error('No elements with the selector ' + gallery_selector + ' found.');
      } else {
        for(var i = 0; i < galleries.length; i++) {
          this.#createGallery(galleries[i], gallery_selector);
        }
      }
    } else if(gallery_selector.trim().startsWith('#')) {
      var gallery = document.getElementById(gallery_selector.slice(1));
      if(gallery == null) {
        throw new Error('No elements with the selector ' + gallery_selector + ' found.');
      } else {
        this.#createGallery(gallery, gallery_selector);
      }
    } else {
      throw new Error('Gallery selector in the attach method must be a class or an id.');
    }
  }
  
  /**
   * Method for creating carousels from galleries
   * @param {element} gallery - gallery element
   * @param {string} gallery_selector - string value representing a gallery selector
   */
  #createGallery(gallery, gallery_selector) {
    PRDC_GALLERY_NUMBER += 1;
    this.carousel_number = PRDC_GALLERY_NUMBER;
    gallery.classList.add('prdc-gallery');
    gallery.setAttribute('prdc-gallery-number', this.carousel_number);
    var new_gallery = new PRDC_CAROUSEL_CLASS(gallery, this.carousel_number, gallery_selector);
    this.galleries.push(new_gallery);
  }
}

/** Class for making a carousel from a gallery  */
class PRDC_CAROUSEL_CLASS {
  /**
   * Make a carousel from a gallery.
   * @param {element} gallery_element - Gallery element 
   * @param {number} carousel_number - Number of the carousel
   * @param {string} gallery_selector  - Selector for the gallery
   */
  constructor(gallery_element, carousel_number, gallery_selector) {

    var gallery = this;   

    // Flags
    // --------------------------
    this.animation_flag = false;
    this.cycle_right = false;
    this.cycle_left = false;
    this.one_img_flag = false;
    this.first_load_flag = true;

    // Some needed properties
    // --------------------------
    this.slides = [];
    this.slide_sources = [];
    this.thumbnail_images = [];
    this.gallery_element_selector = gallery_selector;
    this.carousel_number = carousel_number;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
      
    // Creating elements
    // --------------------------
    this.animation_element = document.createElement('img');
    this.animation_element.classList.add('prdc-gallery-animation-element');
    this.animation_element.classList.add('prdc-gallery-hidden');
    this.gallery_element = gallery_element;

    this.carousel = document.createElement('div');
    this.carousel.classList.add('prdc-gallery-hidden');
    this.carousel.classList.add('prdc-gallery-carousel');
    this.carousel.setAttribute('carousel-number', this.carousel_number);

    this.gallery = document.createElement('div');
    this.gallery.classList.add('prdc-gallery-carousel-wrapper');

    this.gallery.appendChild(this.animation_element);
    this.gallery.appendChild(this.carousel);
    document.body.appendChild(this.gallery);

    this.image_slider = document.createElement('div');
    this.image_slider.classList.add('prdc-gallery-image-slider');

    this.slide_number = document.createElement('div');
    this.slide_number.classList.add('prdc-gallery-slide-number');

    this.images_container = document.createElement('div');
    this.images_container.classList.add("prdc-gallery-images-container");

    // Creating the arrow and close button elements
    // --------------------------------------------
    // Close button svg img
    var close_button_element_text = '<svg version="1.1" id="svg182" width="229.008" height="233.925" viewBox="0 0 229.008 233.925" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"> <defs id="defs186" /> <g id="g188" transform="translate(-30.50256,-15.191642)"> <path style="fill:#f0f0f0;fill-opacity:1;stroke-width:1.00019" d="m 42.690935,240.09411 c -3.689028,-1.81868 -7.194434,-7.68937 -7.188608,-12.03911 0.0021,-1.53498 0.871698,-4.21488 1.932538,-5.95532 1.06084,-1.74045 21.373077,-22.60744 45.138306,-46.3711 L 125.78267,132.52193 82.237109,88.85908 C 58.287047,64.844522 37.973127,43.755547 37.095065,41.994697 33.938345,35.664263 36.222742,28.657891 42.739433,24.68311 c 3.944458,-2.405877 7.781834,-2.532616 12.058774,-0.398269 1.760183,0.878395 22.869752,21.228613 46.910163,45.222708 l 43.70981,43.625631 43.82792,-43.823503 c 24.10535,-24.102924 44.93585,-44.43719 46.28999,-45.187259 10.58293,-5.861981 23.31228,7.481307 17.52712,18.372467 -0.7892,1.485747 -21.03918,22.28182 -44.99995,46.213499 l -43.56505,43.512136 43.36535,43.52067 c 23.85094,23.93636 44.10092,44.63371 44.99995,45.9941 0.89904,1.36038 1.6346,4.1963 1.6346,6.30204 0,9.88937 -9.31585,16.20662 -18.68485,12.67051 -1.54831,-0.58436 -22.62173,-20.83726 -46.82982,-45.00645 l -44.01473,-43.94396 -43.48508,43.571 c -23.916801,23.96405 -44.70024,44.21695 -46.185424,45.00645 -3.538231,1.88086 -8.495806,1.78619 -12.607271,-0.24077 z" id="path300" /> </g></svg>';
    // Left arrow svg img
    var left_arrow_element_text = '<svg height="512px" id="Layer_1" style="enable-background:new 0 0 512 512;" version="1.1" viewBox="0 0 512 512" width="512px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"><defs id="defs1964" /><polygon points="352,115.4 331.3,96 160,256 331.3,416 352,396.7 201.5,256 " id="polygon1959" style="fill:#ffffff;fill-opacity:1" /></svg>';
    // Right arrow svg img
    var right_arrow_element_text = '<svg height="512px" id="Layer_1" style="enable-background:new 0 0 512 512;" version="1.1" viewBox="0 0 512 512" width="512px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"><defs id="defs7" /><polygon points="160,115.4 180.7,96 352,256 180.7,416 160,396.7 310.5,256 " id="polygon2" style="fill:#ffffff;fill-opacity:1" /></svg>';  
    // Creating HTML elements
    this.close_button = createElementFromText(close_button_element_text, 'prdc-gallery-close-button');
    this.left_arrow = createElementFromText(left_arrow_element_text, 'prdc-gallery-left-arrow');
    this.right_arrow = createElementFromText(right_arrow_element_text, 'prdc-gallery-right-arrow');
    // Appending elements
    this.image_slider.appendChild(this.left_arrow);
    this.image_slider.appendChild(this.right_arrow);
    this.image_slider.appendChild(this.close_button);
    this.image_slider.appendChild(this.slide_number);
    this.image_slider.appendChild(this.images_container);
    this.carousel.appendChild(this.image_slider);

    // Creating slides
    // ------------------
    this.num_slides = $(this.gallery_element).children('img').length;
    if(this.num_slides == 0) {
      throw new Error('No images defined in the current gallery. At least one image has to be used.');
    } else if(this.num_slides == 1) {
      this.one_img_flag = true;
      setSlideNumberText("1/1");
      $(this.left_arrow).addClass('prdc-gallery-hidden');
      $(this.right_arrow).addClass('prdc-gallery-hidden');
      createSlides();
      
      this.slide_elements = [];
      $(this.images_container).children().each(function() {
        gallery.slide_elements.push($(this));
      });
      $(this.images_container).css({'width': gallery.width + "px"});
    } else {
      createSlides();
      this.slide_sources.unshift('prdc_last_to_first_' + this.carousel_number);
      this.slide_sources.push('prdc_first_to_last_' + this.carousel_number);
      $(this.images_container).css({'width': gallery.width * this.slide_sources.length + "px"});
      var slide_0 = createElementFromText('<div class="prdc-gallery-slide" ><img src="" prdc-carousel-number=' + this.carousel_number + ' prdc-slide-number=' + 0 + '></div>', '');
      var slide_end = createElementFromText('<div class="prdc-gallery-slide" ><img src="" prdc-carousel-number=' + this.carousel_number + ' prdc-slide-number=' + (this.num_slides + 1) + '></div>', '');
      $(this.images_container).prepend(slide_0);
      $(this.images_container).append(slide_end);
      $(this.images_container).children().each(function() {
        gallery.slides.push($(this));
      });
      this.slide_elements = [];
      $(this.images_container).children().each(function() {
        gallery.slide_elements.push($(this));
      });
      this.num_slides += 2; // first and last cycle slides added
    }
    
    // Setting the initial slide number 
    // --------------------------------
    if(gallery.one_img_flag == true) {
      this.current_slide_number = 0;
    } else {
      this.current_slide_number = 1;
    }
    $(this.slide_number).text(this.current_slide_number + '/' + (this.slides.length - 2));

    // Close button on click event
    // ---------------------------
    $(this.close_button).on('click', function(e) { 
      e.stopImmediatePropagation(); 
      closeCarousel();
    });
    
    // Gallery img on click event
    // ---------------------------
    var slide_number = 0; // local variable for slide numbering
    $(this.gallery_element).children('img').each(function() {
      slide_number += 1; // increment slide number for each new gallery image
      var current_slide_number = slide_number;
      
      $(this).on('click', function(e) {
        if(gallery.first_load_flag == true) {
					$('div[carousel-number="' + gallery.carousel_number + '"] .prdc-gallery-slide').each(function () {
						$(gallery.images_container).css({'height': gallery.height + "px"});
						$(this).css({'width': gallery.width + "px"});
						$(this).css({'height': gallery.height + "px"});
					});
          gallery.first_load_flag = false;
        }

        gallery.current_slide_number = current_slide_number;
        togglePointerEvents(false);
        if(gallery.one_img_flag == true) {
          setImagesContainerMarginLeft(0);
          setSlideNumberText("1/1");
        } else {
          setSlideNumberText();
        }

        gallery.animation_flag = true;

        if(gallery.one_img_flag == true) { 
          gallery.current_src = gallery.slide_sources[0];
        }else{
          gallery.current_src = gallery.slide_sources[gallery.current_slide_number];
        }

        gallery.current_thumbnail_image = $(this)[0];
        var start_position_open = [gallery.current_thumbnail_image.getBoundingClientRect().width, gallery.current_thumbnail_image.getBoundingClientRect().height, gallery.current_thumbnail_image.getBoundingClientRect().top, gallery.current_thumbnail_image.getBoundingClientRect().left];

        $(gallery.animation_element).css({
          'width': start_position_open[0] + "px",
          'height': start_position_open[1] + "px",
          'top': start_position_open[2] + "px",
          'left': start_position_open[3] + "px"
        });

        $(gallery.animation_element).attr('src', gallery.current_src);
        $(gallery.animation_element).removeClass('prdc-gallery-hidden');
        togglePointerEvents(true, PRDC_GALLERY_IMAGE_LOAD_ANIMATION_SPEED);
      });
    });
    
    // Animation element on load function
    $(gallery.animation_element).on('load', function() {
      if(gallery.animation_flag == true) {
        gallery.current_carousel_image = getSlide()[0];
        if($(gallery.current_carousel_image).attr('src') == '') {          
          $(gallery.current_carousel_image).attr('src', gallery.current_src);
          $(gallery.current_carousel_image).on('load', function() {
            imageLoadAnimation()
          });
        } else {
          imageLoadAnimation()
        }
        gallery.animation_flag = false;
      } else {
        updateSize($(this)[0]);
      }
    });

    // Left arrow on click event
    $(gallery.left_arrow).on('click', function(e) { 
      e.stopImmediatePropagation(); 
      changeSlide('left');
    });
    
    // Right arrow on click event
    $(gallery.right_arrow).on('click', function(e) { 
      e.stopImmediatePropagation(); 
      changeSlide('right');
    });

    // On window resize and orientation change events update image container and slide sizes
    window.addEventListener('resize', onResize, true);
		screen.orientation.addEventListener('change', function() {
      if(gallery.height != gallery.window_height) {
        // Already changed
        onResize();
      } else {
        // Wait for change
        detectOrientationChanged().then(function() {
          onResize();
        });
      }
    });

    // Adding events on all slides
    for(var i = 0; i < gallery.slide_elements.length; i++) {
      var slide = gallery.slide_elements[i];
      dragListeners(slide[0], dragStart, dragMove, dragEnd);
    }

    // Declaring needed variables
    var drag_x0, current_margin_left, start_time, start_to_end,
      drag_y0, new_margin_left, end_time, end_to_start,
      drag_x, new_margin_top, init_flag = true, dir,
      drag_y, dx, dy, move_direction, drag_flag;

    // Funcitons
    // --------------------------------------------------------------------------------------------

    /**
     * createSlides function
     * Function for creating slides from images defined in the gallery element
     */ 
    function createSlides() {
      var counter = 0;
      $(gallery.gallery_element).children('img').each(function () {
        counter += 1;
        gallery.images_container.innerHTML += '<div class="prdc-gallery-slide" ><img src="" prdc-carousel-number=' + gallery.carousel_number + ' prdc-slide-number=' + counter + '></div>';
        gallery.slide_sources.push($(this).attr('high-res-src'));
      });
    }
		
    /**
     * dragStart function
     * Function that executes on element click in the dragListeners function
     * @param {element}  el - element that is clicked
     */
    function dragStart(event, el) {
      gallery.current_carousel_image = $(el).children()[0];

      if($(gallery.images_container).is(':animated')) {
        gallery.is_animated_flag = true;
      } else {
        gallery.is_animated_flag = false;
      }

      gallery.inbetween_flag = false;

			// Case of stoping the animation with another click
      if(gallery.change_slide_flag == true) {
        $(gallery.images_container).stop();
        end_to_start = gallery.cycle_right; // If the animation is stopped at the end-to-start transition
        start_to_end = gallery.cycle_left;  // If the animation is stopped at the start-to-end transition
        gallery.inbetween_flag = true; 
      }

      move_direction = '';
      new_margin_left = 0;
      new_margin_top = 0;
      current_margin_left = parseInt($(gallery.images_container).css('margin-left'));
      dx = 0;
      dy = 0;
      start_time = new Date().getTime();
      drag_x0 = event.pageX;
      drag_y0 = event.pageY;
    }

    /**
     * dragMove function
     * Function that executes every pointer move in the dragListeners function
     */
    function dragMove(event) {
        drag_x = event.pageX;
        drag_y = event.pageY;

        dx = drag_x - drag_x0;
        dy = drag_y - drag_y0;

        dx > 0 ? dir = 'rtl' : dir = 'ltr';
        if(dx > 0) {
          dir = 'rtl';
        } else if(dx < 0) {
          dir = 'ltr';
        } else if(dx == 0) {
          dir = '';
        }

        var next_img = getSlide(gallery.current_slide_number + 1);
        var prev_img = getSlide(gallery.current_slide_number - 1);
				
        if(drag_flag == true) { // Executes only once one the start of every drag move once the direction is sorted
          if(dir == 'ltr' && gallery.current_slide_number + 1 == gallery.num_slides-1) {
            loadImage(next_img, gallery.slide_sources[1]);
          } else if(dir == 'ltr' && next_img.attr('src') == '') {
            loadImage(next_img, gallery.slide_sources[gallery.current_slide_number + 1]);
          } else if(dir == 'rtl' && gallery.current_slide_number - 1 == 0) {
            loadImage(prev_img, gallery.slide_sources[gallery.num_slides - 2]);
          } else if(dir == 'rtl' && prev_img.attr('src') == '') {
            loadImage(prev_img, gallery.slide_sources[gallery.current_slide_number - 1]);
          }
          drag_flag = false;
        }
				
				// Parsing the mouse drag direction 
        if(init_flag == true) {
          Math.abs(dx) > Math.abs(dy) ? move_direction = 'x' : move_direction = 'y';
          init_flag = false;
        }

        new_margin_left = Math.abs(Math.round(current_margin_left + dx));
        new_margin_top = Math.round(dy);

        if(!(current_margin_left == 0 && dx > 0)) {
          new_margin_left = -new_margin_left;
        }
        
        if(move_direction == 'x') {
          setImagesContainerMarginLeft(new_margin_left);
        } else {
          if(gallery.inbetween_flag == false) {
            $(gallery.images_container).css({'margin-top': new_margin_top + 'px'});
            $(gallery.carousel).css({'background-color': 'rgba(0, 0, 0, ' + (0.8 * ((51 - Math.abs(new_margin_top) / 5) / 51)) + ')'});
          }
        }
    };

    /**
     * dragEnd function
     * Function that executes on every pointer-up event in the dragListiners function
     */
    function dragEnd(event) {
      if(gallery.inbetween_flag == false) { // Regular case - pointer up event when pointer down happend normaly, not inbetween slides  
        end_time = new Date().getTime();
        var dt = end_time - start_time;
        var animate = true;
        if(move_direction == 'x') {
          if(dt < PRDC_TIME_INTERVAL || Math.abs(dx) > gallery.width / 2) {   
            if(gallery.one_img_flag == false) {
              if(dx > PRDC_DX_INTERVAL) {  
                if(gallery.is_animated_flag == false) {
                  changeSlide('left');
                } 
                animate = false;
              } else if(dx < -PRDC_DX_INTERVAL) {   
                if(gallery.is_animated_flag == false) {
                  changeSlide('right');
                }
                animate = false;
              }
            }
          } 
          
          if(animate) {
            $(gallery.images_container).animate({margin: '0 0 0 ' + current_margin_left + 'px'}, PRDC_GALLERY_SLIDE_CHANGE_ANIMATION_SPEED);
          }
        } else if(move_direction == 'y') {
          if(Math.abs(new_margin_top) > PRDC_MARGIN_TOP) { 
            gallery.start_position_close = [gallery.current_carousel_image.getBoundingClientRect().width, gallery.current_carousel_image.getBoundingClientRect().height, gallery.current_carousel_image.getBoundingClientRect().top, gallery.current_carousel_image.getBoundingClientRect().left];
            closeCarousel();
            setTimeout(function() {
              $(gallery.images_container).css({'margin-top': '0px'});
              $(gallery.carousel).css({"background-color": "rgba(0, 0, 0, 0.8"});
            }, PRDC_GALLERY_IMAGE_LOAD_ANIMATION_SPEED);
          } else {
            $(gallery.images_container).css({'margin-top': '0px'});
            $(gallery.carousel).css({"background-color": "rgba(0, 0, 0, 0.8"});
          }
        }
      } else { //  Pointer up event in the case of pointer down event inbetween slides  
        gallery.change_slide_flag = false;
        if(end_to_start == true) {
          if((gallery.current_slide_number - 1) * gallery.width + gallery.width / 2 > Math.abs(parseInt($(gallery.images_container).css('margin-left')))) {            
            gallery.current_slide_number = gallery.num_slides - 2;
            animateImagesContainer();
          } else {
            animateImagesContainer(function() {
              gallery.current_slide_number = 1;
            });
          }
        } else if(start_to_end == true) {
          if(Math.abs(parseInt($(gallery.images_container).css('margin-left'))) > gallery.width / 2) {  
            gallery.current_slide_number = 1;
            animateImagesContainer();
          } else {
            animateImagesContainer(function() {
              gallery.current_slide_number = gallery.num_slides - 2;
            });
          }
        } else {
          var d_margin = -gallery.current_slide_number * gallery.width - parseInt($(gallery.images_container).css('margin-left'));
          if(Math.abs(d_margin) > gallery.width / 2) {
            if(d_margin > 0) {
              gallery.current_slide_number = gallery.current_slide_number + 1;
            } else {
              gallery.current_slide_number = gallery.current_slide_number - 1;
            }
          }
          $(gallery.images_container).animate({'margin-left': -gallery.current_slide_number * gallery.width + 'px'})
          setSlideNumberText();
        }
      }
			
      init_flag = true;
      drag_flag = true;
      end_to_start = false;
      start_to_end = false;
    }

    /**
     * closeCarousel function
     * Close the current carousel 
     */
    function closeCarousel() {
      togglePointerEvents(false);
      var start_position_close = [gallery.current_carousel_image.getBoundingClientRect().width, gallery.current_carousel_image.getBoundingClientRect().height, gallery.current_carousel_image.getBoundingClientRect().top, gallery.current_carousel_image.getBoundingClientRect().left];
      var end_position_close = [gallery.current_thumbnail_image.getBoundingClientRect().width, gallery.current_thumbnail_image.getBoundingClientRect().height, gallery.current_thumbnail_image.getBoundingClientRect().top, gallery.current_thumbnail_image.getBoundingClientRect().left];

      $(gallery.animation_element).css({
        'width': start_position_close[0] + "px",
        'height': start_position_close[1] + "px",
        'top': start_position_close[2] + "px",
        'left': start_position_close[3] + "px"
      });

      gallery.animation_element.classList.remove('prdc-gallery-hidden');
      gallery.carousel.classList.remove('prdc-gallery-hidden');
      $(gallery.animation_element).attr('src', gallery.current_thumbnail_image.getAttribute('src'));

      $(gallery.image_slider).css({'opacity': "0"});
      $(gallery.carousel).animate({
        opacity: "0"
      }, PRDC_GALLERY_IMAGE_LOAD_ANIMATION_SPEED, function () {
        gallery.carousel.classList.add('prdc-gallery-hidden');
      });

      $(gallery.animation_element).animate({
        'width': end_position_close[0] + "px",
        'height': end_position_close[1] + "px",
        'top': end_position_close[2] + "px",
        'left': end_position_close[3] + "px"
      }, PRDC_GALLERY_IMAGE_LOAD_ANIMATION_SPEED, function () {
        $(gallery.animation_element).addClass('prdc-gallery-hidden');
        $(gallery.animation_element).attr('src', '');
      });
      togglePointerEvents(true, PRDC_GALLERY_IMAGE_LOAD_ANIMATION_SPEED);
    }

    /**
     * changeSlide function
     * Function for changing slides
     * @param {string} dir - change direction - left / right / ''
     */
    function changeSlide(dir) {
		 gallery.cycle_left = false;
		 gallery.cycle_right = false;

      if(gallery.one_img_flag == false) { // Slides can only change in the case of multiple images in the gallery
        gallery.change_slide_flag = true;
        if(dir == "left") {
          if(gallery.current_slide_number - 1 > 0) {
            gallery.current_slide_number = gallery.current_slide_number - 1;
          } else if(gallery.current_slide_number - 1 == 0) {
            gallery.cycle_left = true;
            gallery.current_slide_number = gallery.current_slide_number - 1;
          } else {
            gallery.change_slide_flag = false;
            return
          }
        } else if(dir == "right") { 
          if(gallery.current_slide_number + 1 < gallery.num_slides - 1) {
            gallery.current_slide_number = gallery.current_slide_number + 1;
          } else if(gallery.current_slide_number + 1 == gallery.num_slides - 1) {
            gallery.cycle_right = true;
            gallery.current_slide_number = gallery.current_slide_number + 1;
          } else {
            gallery.change_slide_flag = false;
            return
          }
        } else { // Change to a position of the image clicked in the gallery 
          setImagesContainerMarginLeft();
        }

        if(dir == "left" || dir == "right") { 
          // Changing slides
          var next_img = getSlide();
          if(next_img.attr('src') == '') { // If the next image is not loaded
            if(gallery.cycle_right == true) {
              var src = gallery.slide_sources[1];
              next_img.attr('src', src);
              next_img.on('load', function () {
                updateSize(next_img[0]);
                animateImagesContainer(function() {
                 gallery.change_slide_flag = false;
                  gallery.current_slide_number = 1;
                  var first_img = getSlide();
                  if(first_img.attr('src') == '') {
                    first_img.attr('src', src);
                    first_img.on('load', function () {
                      updateSize(first_img[0]);
                      setImagesContainerMarginLeft();
                   });
                  }
                });
              });
            } else if(gallery.cycle_left == true) {
              var next_img = getSlide();
              if(next_img.attr('src') == '') {
                var src = gallery.slide_sources[gallery.slide_sources.length - 2];
                next_img.attr('src', src);
                next_img.on('load', function () {
                  updateSize(next_img[0]);
                  animateImagesContainer(function() {
                      gallery.change_slide_flag = false;
                      gallery.current_slide_number = gallery.num_slides - 2;
                      var last_img = getSlide();
                      if(last_img.attr('src') == '') {
                        last_img.attr('src', src);
                        last_img.on('load', function () {
                          updateSize(last_img[0]);
                          setImagesContainerMarginLeft();
                        });
                      }
                  });
                });
              } else {
                animateImagesContainer(function() {
                  gallery.change_slide_flag = false;
                  gallery.current_slide_number = gallery.num_slides - 2;
                  var next_img = getSlide();
                  if(next_img.attr('src') == '') {
                    next_img.attr('src', src);
                    next_img.on('load', function () {
                      updateSize(next_img[0]);
                      setImagesContainerMarginLeft();
                    });
                  }
                });
              }
            } else {
              var src = gallery.slide_sources[gallery.current_slide_number];
              var next_img = getSlide();
              next_img.attr('src', src);
              next_img.on('load', function () {
                animateImagesContainer(function() {
                  gallery.change_slide_flag = false
                });
                updateSize(next_img[0]);
              });
              setSlideNumberText();
            }
          } else { 
            if(gallery.cycle_right == true) { 
              var first_img = getSlide(1);
              if(first_img.attr('src') == '') {
                var src = gallery.slide_sources[1];
                first_img.attr('src', src);
                first_img.on('load', function () {
                  updateSize(first_img[0]);
                });
              }
              animateImagesContainer(function() {
                gallery.change_slide_flag = false;
                gallery.current_slide_number = 1;
              });
            } else if(gallery.cycle_left == true) {
              var last_img = getSlide(gallery.num_slides - 2);
              if($(last_img).attr('src') == '') {
                var src = gallery.slide_sources[gallery.num_slides - 2];
                last_img.attr('src', src);
                last_img.on('load', function () {
                  updateSize(last_img[0]);
                });
              }
              animateImagesContainer(function() {
                gallery.change_slide_flag = false;
                gallery.current_slide_number = gallery.num_slides - 2;
              });
            } else {
              animateImagesContainer(function() {
                gallery.change_slide_flag = false;
              });
            }
          }
					
					// Parsing current carousel and thumbnail images after slide change
          if(gallery.current_slide_number == 0) { // Last image case
            gallery.current_carousel_image = getSlide(gallery.num_slides - 2)[0];
            gallery.current_thumbnail_image = $('div[prdc-gallery-number=' + gallery.carousel_number + '] img[high-res-src="' + gallery.slide_sources[gallery.num_slides - 2] + '"]')[0];
          } else if(gallery.current_slide_number == gallery.num_slides - 1) { // First image case
            gallery.current_carousel_image = getSlide(1)[0];
            gallery.current_thumbnail_image = $('div[prdc-gallery-number=' + gallery.carousel_number + '] img[high-res-src="' + gallery.slide_sources[1] + '"]')[0];
          } else { // Everything inbetween
            gallery.current_carousel_image = getSlide()[0];
            gallery.current_thumbnail_image = $('div[prdc-gallery-number=' + gallery.carousel_number + '] img[high-res-src="' + gallery.slide_sources[gallery.current_slide_number] + '"]')[0];
          }
        } else { // Change to a slide based on clicked image in the gallery
          gallery.change_slide_flag = false;
          setSlideNumberText();
          setImagesContainerMarginLeft();
        }
      }
    }
    
    /**
     * loadImage function
     * Loads image and updates size
     * @param {HTMLElement} img - image html element
     * @param {string} src - image source
    */ 
    function loadImage(img, src) {
      img.attr('src', src);
      img.on('load', function() {
        updateSize(img[0]);
      });
    }

    /**
     * getSlide function
     * Returns a slide based on the passed slide number 
     * @param {number} slide_number - number of a slide
    */ 
    function getSlide(slide_number) {
     if(typeof slide_number == 'undefined') {
       // Return current slide
       slide_number = gallery.current_slide_number;
     }
     return $('img[prdc-carousel-number=' + gallery.carousel_number + '][prdc-slide-number=' + slide_number + ']');
    }
    
    /**
     * animateImagesContainer function
     * Animates images container transition
     * @param {function} callback - callback function after animation end
    */ 
    function animateImagesContainer(callback) {
      $(gallery.images_container).animate({
          'margin-left': -gallery.current_slide_number*gallery.width + 'px'
        }, PRDC_GALLERY_SLIDE_CHANGE_ANIMATION_SPEED,
        function() {
          if(typeof callback == 'function') {
            callback();
          }
          setImagesContainerMarginLeft();
          setSlideNumberText();
      });
    }
    
    /**
     * setImagesContainerMarginLeft function
     * Sets the images container margin value based on the current slide
     * @param {number} num - margin left value in px
    */ 
    function setImagesContainerMarginLeft(num) {
      if(typeof num == 'undefined') {
        // Set nominal left margin
        num = -gallery.width*gallery.current_slide_number;
      }
      $(gallery.images_container).css({'margin-left': num + 'px'});
    }

    /**
     * setSlideNumberText function
     * Set the current slide number text
     * @param {string} str - slide number text
    */ 
    function setSlideNumberText(str) {
      if(typeof str == 'undefined') {
        // Set current slide number
        str = gallery.current_slide_number + '/' + (gallery.num_slides - 2);
      }
      $(gallery.slide_number).text(str);
    }

    /**
     * onResize function
     * Function that executes on window resize and orientation change
    */ 
    function onResize() {
      gallery.width = window.innerWidth;
      gallery.height = window.innerHeight;
      var slides = $('div[carousel-number=' + gallery.carousel_number + '] .prdc-gallery-slide');
      var num_of_slides = slides.length;
      $(gallery.images_container).css({'width': gallery.width*num_of_slides + "px"});
      $(gallery.images_container).css({'height': gallery.height + "px"});
      if(gallery.one_img_flag == true) {
        setImagesContainerMarginLeft(0);
      } else {
        setImagesContainerMarginLeft();
      }
      slides.each(function () {
        $(this).css({'width': gallery.width + "px"});
        $(this).css({'height': gallery.height + "px"});
        updateSize($(this).children()[0]);
      });
    }

    /**
     * imageLoadAnimation function
     * Add animations on animation element image load
     */ 
    function imageLoadAnimation() {
      changeSlide('');
      $(gallery.carousel).css({"opacity": "0"});
      $(gallery.image_slider).css({'opacity': "0"});
      var end_position_open = updateSize(gallery.current_carousel_image);
      $(gallery.carousel).removeClass('prdc-gallery-hidden');
      $(gallery.carousel).animate({opacity: "1"}, PRDC_GALLERY_IMAGE_LOAD_ANIMATION_SPEED);
      $(gallery.animation_element).animate({
        width: end_position_open[0] + "px",
        height: end_position_open[1] + "px",
        top: end_position_open[2] + "px",
        left: end_position_open[3] + "px"
      }, PRDC_GALLERY_IMAGE_LOAD_ANIMATION_SPEED, function () {
        $(gallery.animation_element).addClass('prdc-gallery-hidden');
        $(gallery.image_slider).css({'opacity': "1"});
      });
    }

    /**
     * togglePointerEvents function
     * Toggle pointer events for a given time period
     * @param {flag} flag - Pointer events active - true / false
     * @param {ms} ms - Time for turning pointer events back on
     */ 
    function togglePointerEvents(flag, ms = 300) {
      if(flag == false) {
        $(gallery.carousel).css({'pointer-events': 'none', 'user-select': 'none' });
      } else {
        setTimeout(function() { 
          $(gallery.carousel).css({'pointer-events': 'auto', 'user-select': 'auto' })
        }, ms);
      }
    }

    /**
     * createElementFromText function
     * Create and element from a text string and add a class to it 
     * @param {html_string} html_string - Element in a string form
     * @param {class_name} class_name - Name of the class to be added to the element
     */ 
    function createElementFromText(html_string, class_name = '') {
      var div = document.createElement('div');
      div.innerHTML = html_string.trim();
      if(class_name != '') {
        div.firstChild.classList.add(class_name);
      }
      return div.firstChild;
    }

    /**
     * detectOrientationChanged function
     * Detect if size of document is changed after orientation change
    */ 
    function detectOrientationChanged() {
      const max_frames = 60;
      return new Promise(function(resolve, reject) {
        function checkHeight(i, prev_height) {
          if(window.innerHeight != prev_height && i < max_frames) { 
            resolve();
          } else if(i >= max_frames) {
            reject();
          } else {
            window.requestAnimationFrame(function() {
              checkHeight(i+1, prev_height)
            });
          }
        }
        checkHeight(0, window.innerHeight);
      });
    }
    
    /**
     * dragListeners function
     * Set onclick, onmove and onpointerup behaviour on every element that is dragged
     * @param {element}  el   - element that is dragged
     * @param {function} fun1 - function that is executed at pointer down 
     * @param {function} fun2 - function that is executed at pointer move 
     * @param {function} fun3 - function that is executed at pointer up 
     */
    function dragListeners(el, fun1, fun2, fun3) {
      el.addEventListener('pointerdown', function (e) {
        if(typeof fun1 == "function") {
          fun1(e, el);
        }
        document.addEventListener('pointermove', fun2, false);
        document.addEventListener('pointerup', function pointerUp() {
          document.removeEventListener('pointerup', pointerUp, false);
          document.removeEventListener('pointermove', fun2, false);
          if(typeof fun3 == "function") {
            fun3(e);
          }
        }, false);
      }, false);
    }

    /**
     * updateSize function
     * Update the size of an image based on aspect ratio 
     * @param {element} image - image element that is going to be updated 
     * @param {boolean} change_flag - a flag for changing the size of the image
     */
    function updateSize(image, change_flag = true) {
      var width = gallery.width;
      var height = gallery.height;
      var aspect_ratio = image.naturalWidth / image.naturalHeight;

      if(height * aspect_ratio < width) {
        var new_width = height * aspect_ratio;
        var new_height = height;
      } else {
        var new_width = width;
        var new_height = width / aspect_ratio;
      }

      var left = (width - new_width) / 2;
      var top = (height - new_height) / 2;

      if(change_flag == true) {
        image.style.height = new_height + "px";
        image.style.width = new_width + "px";
        image.style.top = top + "px";
        image.style.left = left + "px";
      }
      return [new_width, new_height, top, left];
    }
  }
}

if(typeof module !== 'undefined' && module.exports) {
  module.exports = new PRDC_GALLERY_CLASS();
} else {
  window.PRDC_GALLERY_CLASS = PRDC_GALLERY_CLASS;
}