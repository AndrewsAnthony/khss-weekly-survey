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

  // $('select').selectpicker({
  //   actionsBox: true
  // });

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
        uploadUrl: "/work/file/upload",
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
  var modal = $(this)

  extradata['object'] = object
  extradata['file'] = file
  extradata['objectid'] = objectid

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

// $('#createNoteTask')
// .on('show.bs.modal', function (event) {
//   var button = $(event.relatedTarget)
//   var taskid = button.data('taskid')
//   var houseid = button.data('houseid')
//   var modal = $(this)
//   $('#hiddenTaskId').val(taskid);
//   $('#hiddenHouseId').val(houseid);
// })
// .on('hidden.bs.modal', function(event){
//   $('#hiddenTaskId').val('');
//   $('#hiddenHouseId').val('');
// })


$('#changeList').on('keyup keypress', "input", function(e) {
  var keyCode = e.keyCode || e.which;
  if (keyCode === 13) {
    e.preventDefault();
    return false;
  }
});

$('button.startLoadFile').click(function() {
    $(this).addClass('hide')
    $(this).parent().find('.hidden-files').removeClass('hide').find('.lazy').lazy({
      bind: "event"
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


// -- create-task-list =============================
var currentHouseListForTask = null;

$('#houseListForTaskOptions').multiSelect({
  selectableHeader: "<h5 class='text-center bg-info'>Кандидаты</h5>",
  selectionHeader: "<h5 class='text-center bg-info'>Выбранный список</h5>"
})

$('#createTask')
.on('show.bs.modal', function (e) {

  var button = $(e.relatedTarget)
  var count = button.data('task')

  if( count == 'all' ){
    currentHouseListForTask = JSON.parse($(this).find('#allHouseList').val());
  }
  if( count == 'filter' ){
    currentHouseListForTask = JSON.parse($(this).find('#noTaskHouseList').val());
  }
  var options = currentHouseListForTask.map(function(house){
    return { value: house[0], text: house[2]}
  })
  $('#houseListForTaskOptions').multiSelect('addOption', options)
})
.on('hide.bs.modal', function (e) {
  currentHouseListForTask = null;
  $('#houseListForTaskOptions').html('').multiSelect('refresh');
})


$('.filterDistrictOptions').click(function(e){

  var sector = $(this).data('sector')
  var options = [];
  if (sector !== 'all') {
    options = currentHouseListForTask
                  .filter(function(house){
                    return house[1] == sector
                  })
                  .map(function(house){
                    return { value: house[0], text: house[2]}
                  })
  }

  else {
    options = currentHouseListForTask
                  .map(function(house){
                    return { value: house[0], text: house[2]}
                  })
  }

  console.log("options", options);

  $('#houseListForTaskOptions').html('').multiSelect('refresh').multiSelect('addOption', options)

})

// -- activate tooltip ===========================

$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip();
});

// -- search in Authority ===========================

var authorityList = new List('tabAuthority', {
  valueNames: ['searchtext']
});

$('#tabAuthority input.search').parent().find('button').on('click', function(event){
  $('input.search').val('')
  authorityList.search('')
})

$('#searchAuthority').submit(function(e){ return e.preventDefault() })

// -- search in Schedule ===========================

var scheduleList = new List('tabSchedule', {
  valueNames: ['searchtext']
});

$('#tabSchedule input.search').parent().find('button').on('click', function(event){
  $('input.search').val('')
  scheduleList.search('')
})

$('#searchSchedule').submit(function(e){ return e.preventDefault() })

// -- search in Protocol ===========================

var protocolList = new List('tabProtocol', {
  valueNames: ['searchtext']
});

$('#tabProtocol input.search').parent().find('button').on('click', function(event){
  $('input.search').val('')
  protocolList.search('')
})

$('#searchProtocol').submit(function(e){ return e.preventDefault() })

// -- search in Program ===========================

var programList = new List('tabProgram', {
  valueNames: ['searchtext']
});

$('#tabProgram input.search').parent().find('button').on('click', function(event){
  $('input.search').val('')
  programList.search('')
})

$('#searchProgram').submit(function(e){ return e.preventDefault() })

// -- close preview ===========================

document.getElementById("loading_layer").style.display="none";

})