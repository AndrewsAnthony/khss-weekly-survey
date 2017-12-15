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
      numberInbox: {
        required: true,
        remote: "check/inbox"
      },
      dateInbox: {
        required: true,
        date: true
      },
      depatment: {
        required: true
      },
      problem: {
      },
      bindingInbox: {
        rangelength: [3, 50]
      },
      termInbox: {
        required: true,
        date: true
      }
    },
    submitHandler: function(form, e){

      var url  = $(form).attr('action');
      var data = $(form).serialize();

      $('#createInboxModal').modal('hide')
      form.reset()

      $.post(url, data)
      .done(function(responseText) {
        console.log("responseText", responseText);
      })
      .fail(function() {
      })

    },
    onkeyup: $.debounce(1000, function(element, event) {
      $.validator.defaults.onkeyup.call(this, element, event);
    }),
  });

  $("#taskForm").validate({
    debug: true,
    submitHandler: function(form, ev){

      var url = $(form).attr('action')
      var data = $(form).serialize();

      $('#createTaskModal').modal('hide')
      form.reset()

      console.log("data", data);

      $.ajax(url, {
        data : data,
        type : 'POST',
        url: url
      })
      .done(function(response){
        console.log(response)
      })
      .fail(function(err){
        console.log(err)
      })
    },
    rules: {

      maintask: {
        required: true
      },

      lettertype: {
        required: "select[name='maintask'] option[value='1']:selected"
      },

      inboxletter: {
        required: "select[name='maintask'] option[value='letter-type']:selected, select[name='lettertype'] option[value='inbox-letter']:selected"
      },
      authorityletter: {
        required: "select[name='maintask'] option[value='letter-type']:selected, select[name='lettertype'] option[value='authority-letter']:selected"
      },
      infoletter: {
        required: "select[name='maintask'] option[value='letter-type']:selected, select[name='lettertype'] option[value='info-letter']:selected",
        minlength: 5
      },

      photoreporttype: {
        required: "select[name='maintask'] option[value='photoreport-type']:selected"
      },
      inboxphotoreport: {
        required: "select[name='maintask'] option[value='photoreport-type']:selected, select[name='photoreporttype'] option[value='inbox-photoreport']:selected"
      },
      titlephotoreport: {
        required: "select[name='maintask'] option[value='photoreport-type']:selected, select[name='photoreporttype'] option[value='title-photoreport']:selected"
      },
      protocolphotoreport: {
        required: "select[name='maintask'] option[value='photoreport-type']:selected, select[name='photoreporttype'] option[value='protocol-photoreport']:selected"
      },
      repairphotoreport: {
        required: "select[name='maintask'] option[value='photoreport-type']:selected, select[name='photoreporttype'] option[value='repair-photoreport']:selected"
      },
      programphotoreport: {
        required: "select[name='maintask'] option[value='photoreport-type']:selected, select[name='photoreporttype'] option[value='program-photoreport']:selected"
      },
      authorityphotoreport: {
        required: "select[name='maintask'] option[value='photoreport-type']:selected, select[name='photoreporttype'] option[value='authority-photoreport']:selected"
      },
      infophotoreport: {
        required: "select[name='maintask'] option[value='photoreport-type']:selected, select[name='photoreporttype'] option[value='info-photoreport']:selected",
        minlength: 5
      },

      informationtype: {
        required: "select[name='maintask'] option[value='information-type']:selected"
      },
      infoinformation: {
        minlength: 5
      },
      usertask: {
        required: true
      },
      bindingtask: {
        rangelength: [3, 50]
      },
      termtask: {
        required: true,
        date: true
      }

    }
  })



  // $('select').selectpicker({
  //   actionsBox: true
  // });

  // if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
  //   $('.selectpicker').selectpicker('mobile');
  // }

  $('button.startLoadTask').click(function() {
    $(this).addClass('hide')
    $(this).parent().find('.hidden-files').removeClass('hide').find('.lazy').lazy({
      bind: "event"
    });
  });

  // $('button.loadAllTask').click(function() {
  //   $(this).find('.lazy').lazy({
  //     bind: "event",
  //     delay: 0
  //   });
  // });

  // $('.lazy').lazy({
  //   effect: "fadeIn",
  //   effectTime: 1000,
  //   threshold: 0
  // });



  $('.conditional').conditionize({
    hideJS: false
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


  var extradata = {};

$('#createFile').modalSteps({
  btnCancelHtml: 'Выйти',
  btnPreviousHtml: 'Назад',
  btnNextHtml: 'Добавить Файл',
  btnLastStepHtml: 'Закрыть',
  completeCallback: function(event){

  },
  callbacks: {
    '1': function(){

    },
    '2': function(){
      extradata['filedescription'] = $('#fileDescription').val();
      extradata['filename'] = $('#fileName').val();
      extradata['filenote'] = $('#fileNote').val();

      $("#inputFile").fileinput({
        language: 'ru',
        theme: "explorer",
        uploadUrl: "/house/file/upload",
        maxFileCount: (extradata.file == 'document') ? 1 : 15,
        overwriteInitial: false,
        previewFileIcon: '<i class="fa fa-file"></i>',
        uploadExtraData: extradata,
        maxFilePreviewSize: 1000,
        allowedFileTypes : (extradata.file == 'document') ? ['office'] : ['image'],
        required: true,
        fileTypeSettings: {
          image: function(vType, vName) {
            return (typeof vType !== "undefined") ? vType.match('image.*') && !vType.match(/(tiff?|wmf)$/i) : vName.match(/\.(gif|png|jpe?g)$/i);
          },
          office: function (vType, vName) {
            return vType.match(/(word|excel|powerpoint|office|iwork-pages|tiff?)$/i) ||
            vName.match(/\.(rtf|docx?|xlsx?|pptx?|pps|potx?|ods|pdf|odt|pages|ai|dxf|ttf|tiff?|wmf|txt|e?ps)$/i);
          }
        },
        preferIconicPreview: true,
        previewFileIconSettings: {
          'doc': '<i class="fa fa-file-word-o text-primary"></i>',
          'xls': '<i class="fa fa-file-excel-o text-success"></i>',
          'ppt': '<i class="fa fa-file-powerpoint-o text-danger"></i>',
          'pdf': '<i class="fa fa-file-pdf-o text-danger"></i>',
          'zip': '<i class="fa fa-file-archive-o text-muted"></i>',
          'htm': '<i class="fa fa-file-code-o text-info"></i>',
          'txt': '<i class="fa fa-file-text-o text-info"></i>',
          'mov': '<i class="fa fa-file-movie-o text-warning"></i>',
          'mp3': '<i class="fa fa-file-audio-o text-warning"></i>',
          'jpg': '<i class="fa fa-file-photo-o text-danger"></i>',
          'gif': '<i class="fa fa-file-photo-o text-muted"></i>',
          'png': '<i class="fa fa-file-photo-o text-primary"></i>'
        },
        previewFileExtSettings: {
          'doc': function(ext) {
            return ext.match(/(doc|docx)$/i);
          },
          'xls': function(ext) {
            return ext.match(/(xls|xlsx)$/i);
          },
          'ppt': function(ext) {
            return ext.match(/(ppt|pptx)$/i);
          },
          'zip': function(ext) {
            return ext.match(/(zip|rar|tar|gzip|gz|7z)$/i);
          },
          'htm': function(ext) {
            return ext.match(/(htm|html)$/i);
          },
          'txt': function(ext) {
            return ext.match(/(txt|ini|csv|java|php|js|css)$/i);
          },
          'mov': function(ext) {
            return ext.match(/(avi|mpg|mkv|mov|mp4|3gp|webm|wmv)$/i);
          },
          'mp3': function(ext) {
            return ext.match(/(mp3|wav)$/i);
          }
        }
      })
    }
  }
}).on('show.bs.modal', function (event) {
  extradata = {};
  var button = $(event.relatedTarget)
  var object = button.data('object')
  var file = button.data('file')
  var objectid = button.data('objectid')
  var objecthouse = button.data('objecthouse')
  var modal = $(this)

  extradata['object'] = object
  extradata['file'] = file
  extradata['objectid'] = objectid
  extradata['objecthouse'] = objecthouse


  if (file == 'photo') {
    modal.find('.modal-title').text('описание для файлов')
    modal.find('#fileName').val('');
    modal.find('#fileNameBlock').hide();
  } else if (file == 'document'){
    modal.find('.modal-title').text('описание для документа')
    modal.find('#fileNameBlock').show();
  }


}).on('hidden.bs.modal', function(event){
  document.getElementById('formFile').reset();
  $("#inputFile").fileinput('destroy')
  extradata = {}
})

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

$('.taskgallery').each(function() {
  $(this).magnificPopup({
    delegate: 'a',
    type: 'image',
    gallery: {
      enabled:true
    }
  });
});


$('#houseListOptions').multiSelect({
  selectableHeader: "<h5 class='text-center bg-info'>Кандидаты</h5>",
  selectionHeader: "<h5 class='text-center bg-info'>Текущие список</h5>"
})

$('#addStreetOptions').click(function(e){
  $this = $(this)
  $this.addClass('disabled')
  var data = $('#findStreetOptions').val()
  if(data.length > 3) {
    $('#findStreetOptions').val('')
    $.post('/work/addoptions', {street: data})
    .done(function(data){
      var options = data.map(function(house){
        if (house.name_new_rus) {
          return { value: house.id, text: house.street_new_rus + ' ' + house.name_new_rus + ', ' + house.building}
        }
        return { value: house.id, text: house.street_rus + ' ' + house.name_rus + ', ' + house.building}
      })
      $('#houseListOptions').multiSelect('addOption', options)
      $this.removeClass('disabled')
      $('#alertOptions').collapse('show').find('span').text('Добавлено ' + options.length)
    })
    .error(function(err){
      $this.removeClass('disabled')
      $('#alertOptions').collapse('show').find('span').text('Неверный запрос или произошла системная ошибка')
    })
  }
  else {
    $('#alertOptions').collapse('show').find('span').text('Необходимо более 3 символов')
    $this.removeClass('disabled')
  }
})

$('.addDistrictOptions').click(function(e){

  var sector = $(this).data('sector')
  $.post('/work/addoptions', {sector: sector})
  .done(function(data){
    var options = data.map(function(house){
      if (house.name_new_rus) {
        return { value: house.id, text: house.street_new_rus + ' ' + house.name_new_rus + ', ' + house.building}
      }
      return { value: house.id, text: house.street_rus + ' ' + house.name_rus + ', ' + house.building}
    })
    $('#houseListOptions').multiSelect('addOption', options)
    $('#alertOptions').collapse('show').find('span').text('Добавлено ' + options.length)
  })
  .error(function(err){
    $('#alertOptions').collapse('show').find('span').text('Произошла системная ошибка')
  })

})

$('#changeList').on('keyup keypress', "input", function(e) {
  var keyCode = e.keyCode || e.which;
  if (keyCode === 13) {
    e.preventDefault();
    return false;
  }
});


document.getElementById("loading_layer").style.display="none";

})
