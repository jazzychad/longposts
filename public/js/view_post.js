$(document).ready(function() {

  $.getJSON('/ajax/replies/'+post_id,
        function(data) {
          //console.log(data);

          var posts = data.data;
          for (var i = posts.length - 2; i >= 0; i--) {
            var post = posts[i];
            //console.log(post.text);
            var block = $('<div class="span8 offset2" style="border-bottom:1px solid #ccc; margin-bottom:8px;" />');
            block.html($('#comment-tmpl').html());
            block.find('.comment .text').html(post.html);
            block.find('.comment .name').text(post.user.username);
            block.find('.comment .img img').attr('src', post.user.avatar_image.url);
            //console.log(block);
            $("#discussion").append(block);
          }

        });

  $.post('/ajax/human_view/'+post_id);

});