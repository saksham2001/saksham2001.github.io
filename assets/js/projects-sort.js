$(document).ready(function () {
  // Projects sorting functionality
  var currentSort = 'year'; // default sort by year
  
  // Function to switch between year and category sorting
  function switchSort(sortType) {
    currentSort = sortType;
    
    if (sortType === 'year') {
      // Show year-sorted view
      $('#projects-year-view').show();
      $('#projects-category-view').hide();
      $('.sort-btn-year').addClass('active');
      $('.sort-btn-category').removeClass('active');
    } else {
      // Show category-sorted view
      $('#projects-year-view').hide();
      $('#projects-category-view').show();
      $('.sort-btn-year').removeClass('active');
      $('.sort-btn-category').addClass('active');
    }
  }
  
  // Set up button click handlers
  $('.sort-btn-year').on('click', function(e) {
    e.preventDefault();
    switchSort('year');
  });
  
  $('.sort-btn-category').on('click', function(e) {
    e.preventDefault();
    switchSort('category');
  });
  
  // Initialize with year sort (default)
  switchSort('year');
});

