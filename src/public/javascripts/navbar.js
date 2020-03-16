var aboutButton = document.getElementById('offcanvas-about');
var aboutSlider = document.getElementById('offcanvas-about-slider');
aboutButton.addEventListener('click', function (event) {
  console.log('in here');
  aboutSlider.style.display = aboutSlider.style.display === 'none' ? 'block' : 'none';
});
