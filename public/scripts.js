$(function() {

  var getNextSong = function() {
    var player = $('.player audio')[0];

    $.getJSON('/next_song', {last_song_id: $('.song_key').val()}, function(response) {
      $('.now-playing .title').text(response.title)
      $('.now-playing .artist').text(response.artist)
      $('.now-playing .added_by').text(response.added_by)
      $('.now-playing .download').attr('href', response.url);
      $('.song_key').val(response.key);

      document.title = response.title + " by " + response.artist + " - Ronan";

      $('.vote_to_delete').show();

      player.src = response.url;
      player.currentTime = 0;
    });
  };

  var setMessage = function(data) {
    $('.message').fadeOut(200)
    setTimeout(function() {
      $('.message').text(data.message).fadeIn(200);
    }, 200);

    if(data.status == 'success') {
      $('.message').removeClass('error');
    } else {
      $('.message').addClass('error');
    }
  };

  // when the song ends, get the next song and update all the appropriate values
  if($('.player audio').length > 0) {
    $('.player audio')[0].addEventListener('ended', function() {
      getNextSong();
    }, false);
  }

  // tell the server to delete this song if it gets enough votes
  $('.vote_to_delete').click(function() {
    var $link = $(this);
    $.ajax({
      url: '/vote_to_delete',
      type: 'POST',
      dataType: 'json',
      data: { key: $('.song_key').val() },
      success: function(response) {
        setMessage(response);
        $link.hide();
      }
    });
    return false;
  });

  $('.skip_song').click(function() {
    getNextSong();
    return false;
  });

  // form submission
  $('form.suggest').submit(function() {
    var $form = $(this),
        valid = true;

    // make sure all inputs have a value
    $form.find('input').each(function(i, input) {
      if(valid && $(input).val() == '') {
        setMessage({status: 'error', message: "All inputs gotta have values. Don't skimp on me."});
        valid = false;
      }
    });

    // exit now if the form is invalid
    if(!valid) {
      return false;
    }

    $.ajax({
      url: $form.attr('action'),
      type: $form.attr('method'),
      data: $form.serialize(),
      dataType: 'json',
      success: function(response) {
        // set the message and clear the form
        setMessage(response);

        if(response.status == 'success') {
          $form.find('input[type="text"]').val('');

          // if we haven't been playing anything, refresh the page
          // so there will be music
          if($('audio').length == 0) {
            location.reload();
          }
        }
      }
    });

    return false;
  });

});
