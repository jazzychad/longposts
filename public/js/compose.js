$(document).ready(function() {

  var mdconverter = new Showdown.converter();

  var renderPreview = function(){

    var md = '# ' + $('#post_title').val() + "\n\n\n" + $('#post_body').val();
    var mdhtml = mdconverter.makeHtml(md);
    $('#preview').html(mdhtml);

  };

  $('#post_body').bind('input propertychange', renderPreview);
  $('#post_title').bind('input propertychange', renderPreview);



});