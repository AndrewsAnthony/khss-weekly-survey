$('document').ready(function(){

  $.validator.setDefaults({
    highlight: function(element) {
      $(element).closest('.form-group').addClass('has-error');
    },
    unhighlight: function(element) {
      $(element).closest('.form-group').removeClass('has-error');
    },
    errorElement: 'span',
    errorClass: 'help-block',
    errorPlacement: function(error, element) {
      if(element.parent('.input-group').length) {
        error.insertAfter(element.parent());
      } else {
        error.insertAfter(element);
      }
    }
  });


  $("#formInbox").validate({
    rules: {
      status: {
        required: '#changeStatusGroup input:checked',
      },
      numberinbox: {
        required: true,
        rangelength: [3, 50]
      },
      dateinbox: {
        required: true,
        date: true
      },
      depatments: {
        required: true
      },
      problems: {
      },
      binding: {
        rangelength: [3, 50]
      },
      term: {
        required: true,
        date: true
      }
    },
    submitHandler: function(form, e){
      form.submit()
    },
    onkeyup: $.debounce(1000, function(element, event) {
      $.validator.defaults.onkeyup.call(this, element, event);
    }),
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

  $('#changeStatusGroup').click(function(event){
    var button = $(event.target)
    var buttons = $('#changeStatusGroup label')
    var classList = ['btn-primary','btn-danger','btn-success', 'btn-default']
    classList.reduce(function(buttons, cls){
      buttons.removeClass(cls)
      buttons.addClass('btn-default')
      return buttons
    }, buttons)
    button.addClass(classList[buttons.index(button)])
  })

  $('.multiSelect').multiSelect()

  document.getElementById("loading_layer").style.display="none";

})