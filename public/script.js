let list = document.getElementsByClassName("navLink-tab");
const OnClickNav = (i) => {
  for (let j = 0; j < list.length; j++) {
    list[j].classList.remove("active");
  }
  list[i].classList.add("active");
};

// for teams section
// Intersection Observer from top to bottom
const sections = document.querySelectorAll(".teams-container > h1");

const options = {
  threshold: 0.5,
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      console.log("Section in view:", entry.target.textContent);
    }
  });
}, options);

sections.forEach((section) => {
  observer.observe(section);
});

const reverseSections = document.querySelectorAll(".teams-container > h1");
const reverseOptions = {
  root: null,
  rootMargin: "10px",
  threshold: 0.5,
};

const reverseObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      console.log("Section in view (reverse):", entry.target.textContent);
    }
  });
}, reverseOptions);

reverseSections.forEach((section) => {
  reverseObserver.observe(section);
});

// footer
const footer = document.querySelector("footer");

const options1 = {
  threshold: 0.5,
};

const observer1 = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      console.log("Footer in view");
    }
  });
}, options1);

observer1.observe(footer);



// slider
jQuery(document).ready(function ($) {

  $('#checkbox').change(function(){
    setInterval(function () {
        moveRight();
    }, 3000);
  });
  
	var slideCount = $('#slider ul li').length;
	var slideWidth = $('#slider ul li').width();
	var slideHeight = $('#slider ul li').height();
	var sliderUlWidth = slideCount * slideWidth;
	
	$('#slider').css({ width: slideWidth, height: slideHeight });
	
	$('#slider ul').css({ width: sliderUlWidth, marginLeft: - slideWidth });
	
    $('#slider ul li:last-child').prependTo('#slider ul');

    function moveLeft() {
        $('#slider ul').animate({
            left: + slideWidth
        }, 200, function () {
            $('#slider ul li:last-child').prependTo('#slider ul');
            $('#slider ul').css('left', '');
        });
    };

    function moveRight() {
        $('#slider ul').animate({
            left: - slideWidth
        }, 200, function () {
            $('#slider ul li:first-child').appendTo('#slider ul');
            $('#slider ul').css('left', '');
        });
    };

    $('a.control_prev').click(function () {
        moveLeft();
    });

    $('a.control_next').click(function () {
        moveRight();
    });

});    

