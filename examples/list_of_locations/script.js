function fetchData(key) {
  Qminder.setKey(key);
  Qminder.locations.list(function (response) {
    response.data.forEach(function (location) {
      $('body').append('<p>' + location.name + '</p>');

      Qminder.events.onLinesChanged(location.id, function (lines) {
        $('body').append('<b>Lines changed for ' + location.name + '</b>');
        lines.forEach(function (line) {
          $('body').append('<p>' + line.name + '</p>');
        });
      });
    });
  });
}

$(function () {
  $('form').submit(function () {
    var key = $('input').val();
    fetchData(key);
    return false;
  });
});
