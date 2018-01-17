$('document').ready(function(){


  $('button.startLoadTask').click(function() {
    $(this).addClass('hide')
    $(this).parent().find('.hidden-files').removeClass('hide').find('.lazy').lazy({
      bind: "event"
    });
  });

  var addressFetcher = new Bloodhound({
    datumTokenizer: function(datum){
      console.log("datum", datum);
      return Bloodhound.tokenizers.obj.whitespace('address','number')(datum)
    },
    queryTokenizer:  Bloodhound.tokenizers.whitespace,
    identify: function(obj) { return String(obj.id) },
    remote: {
      url: '/house/typeahead',
      wildcard: '%QUERY',
      prepare: function (query, settings) {
        settings.type = "POST";
        settings.data = {address: query}
        return settings;
      }
    }
  });

  addressFetcher.initialize();

  $('#typeahead').typeahead({
    minLength: 1,
    highlight: true
  }, {
    name: 'address',
    limit: 10,
    display: function(item){ return (item.name_new_rus)
      ? item.street_new_rus + ' ' + item.name_new_rus + ', ' + item.building + ' (стр. наз. ' + item.street_rus + ' ' + item.name_rus + ', ' + item.building + ')'
      :  item.street_rus + ' ' + item.name_rus + ', ' + item.building },
    source: addressFetcher
  }).bind('typeahead:select', function(ev, suggestion) {
    $(ev.target.form).attr('action', '/house/' + suggestion.id)
  }).on('sumbit', function(ev){
    ev.target.value = ''
  });

  $(".btn-pref .btn").click(function () {
    $(".btn-pref .btn").removeClass("btn-primary").addClass("btn-default");
    $(".tab").addClass("active");
    $(this).removeClass("btn-default").addClass("btn-primary");
  });

  $('a[href^="#inboxNumber"]').on('click', function(event) {
    $(".btn-pref .btn").removeClass("btn-primary").addClass("btn-default");
    $('[href="#tabInbox"]').tab('show').addClass("btn-primary")
  });


  $('#createNoteTask')
  .on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget)
    var taskid = button.data('taskid')
    var houseid = button.data('houseid')
    var modal = $(this)
    $('#hiddenTaskId').val(taskid);
    $('#hiddenHouseId').val(houseid);
  })
  .on('hidden.bs.modal', function(event){
    $('#hiddenTaskId').val('');
    $('#hiddenHouseId').val('');
  })


  $('.inboxgallery').each(function() {
    $(this).magnificPopup({
      delegate: 'a',
      type: 'image',
      gallery: {
        enabled:true
      }
    });
  });

  $('.photogallery').each(function() {
    $(this).magnificPopup({
      delegate: 'a',
      type: 'image',
      gallery: {
        enabled:true
      }
    });
  });

  $('#changeList').on('keyup keypress', "input", function(e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode === 13) {
      e.preventDefault();
      return false;
    }
  });

  var listSearchColumns = [ 'inboxletter', 'inboximplementer', 'inboxbinding', 'inboxproblem', 'inboxterm' ]
  var inboxList = new List('tabInbox', {
    valueNames: listSearchColumns
  });

  $('.search-panel .dropdown-menu a').click(function(e) {
    e.preventDefault();
    var text = $(this).text() + ' ';
    var searchdata = $(this).data('search')
    console.log("searchdata", searchdata);
    $('.search-panel .replacetext').text(text);
    isNaN(searchdata = parseInt(searchdata, 10))
      ? inboxList.currentSearchColumns = listSearchColumns
      : inboxList.currentSearchColumns = listSearchColumns.slice(searchdata, searchdata + 1)
  });

  $('input.search').parent().find('button').on('click', function(event){
    $('input.search').val('')
    inboxList.search()
  })

  $('input.search').keyup(function() {
    var searchString = $(this).val();
    inboxList.search(searchString, inboxList.currentSearchColumns);
  });

  $('.list-group-item').on('click', function() {
    $('.glyphicon', this)
      .toggleClass('glyphicon-chevron-right')
      .toggleClass('glyphicon-chevron-down');
  });

  $('button.startLoadFile').click(function() {
    $(this).addClass('hide')
    $(this).parent().find('.hidden-files').removeClass('hide').find('.lazy').lazy({
      bind: "event"
    });
  });

  $('.inboxgallery').each(function() {
    $(this).magnificPopup({
      delegate: 'a',
      type: 'image',
      gallery: {
        enabled:true
      }
    });
  });

  $('.photogallery').each(function() {
    $(this).magnificPopup({
      delegate: 'a',
      type: 'image',
      gallery: {
        enabled:true
      }
    });
  });

// -- activate tooltip ===========================

$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip();
});

// -- close preview ===========================

  document.getElementById("loading_layer").style.display="none";

})
