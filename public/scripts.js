$(function() {

  $('.player audio')[0].addEventListener('ended', function() {
    var player = this;

    $.getJSON('/next_song', {last_song_id: $('.song-key').val()}, function(response) {
      $('.now-playing .title').text(response.title)
      $('.now-playing .artist').text(response.artist)
      $('.now-playing .added_by').text(response.added_by)
      $('.now-playing .download').attr('href', response.url);

      player.src = response.url;
      player.currentTime = 0;
    });
  }, false);

});
