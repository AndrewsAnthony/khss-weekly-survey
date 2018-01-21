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


// -- activate tooltip ===========================

$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip();
});

// -- button change view model - table ==============

$('[data-page-size]').on('click', function(e){
  e.preventDefault();
  var newSize = $(this).data('pageSize');
  FooTable.get('#modelHouseTable').pageSize(newSize);
});


// -- field table activation ======================

var $modal = $('#fieldListModal'),
    $editor = $('#formListField'),
    $editorTitle = $('#headerListField');

$editor.on('submit', function(e){
  if (this.checkValidity && !this.checkValidity()) return;
  e.preventDefault();
  var row = $modal.data('row'),
      values = {
        id: $editor.find('#idField').val(),
        model: $editor.find('#modelField').val(),
        modelid: $editor.find('#modelIdField').val(),
        title: $editor.find('#titleField').val(),
        type: $editor.find('#typeField').val(),
        description: $editor.find('#descriptionField').val()
      };
  
  if (row instanceof FooTable.Row){
    $.post('/table/field/change', values)
     .done(function(response){
       row.val(response);
     })
     .fail(function(response){ console.log(response.error) })
    
  }

  if ( values.id == 'add' ) {
    $.post('/table/field/add', values)
     .done(function(response){
       collapseFooTable.rows.add(response);
     })
     .fail(function(response){ console.log(response.error) })
  }

  $modal.modal('hide');
  
});

var collapseFooTable = FooTable.init('#collapseFieldTable', {
  editing: {
    enabled: true,
    showText: '<span class="fooicon fooicon-pencil" aria-hidden="true"></span> Редактировать',
    hideText: 'Закончить',
    addText: "Добавить столбец",
    deleteText: '<span class="fa fa-exclamation" aria-hidden="true"></span>',
    addRow: function(){
      $modal.removeData('row');
      
      $editor.find('#idField').val('add');
      $editor.find('#titleField').val('');
      $editor.find('#typeField').val('text');
      $editor.find('#descriptionField').val('');

      $editorTitle.text('Добавить новую колонку');
      $modal.modal('show');
    },
    editRow: function(row){
      var values = row.val();
      
      $editor.find('#idField').val(values.id);
      $editor.find('#modelField').val();
      $editor.find('#modelIdField').val();
      $editor.find('#titleField').val(values.title);
      $editor.find('#typeField').val(values.type);
      $editor.find('#descriptionField').val(values.description);

      $modal.data('row', row);
      $editorTitle.text('Редактирование колонки # ' + values.title);
      $modal.modal('show');
    },
    deleteRow: function(row){
      if (confirm('Вы уверенны в удалении (восстановление) колонки?')){
        var values = {
          id: row.value.id,
          status: row.value.status
        };
        $.post('/table/field/delete', values)
         .done(function(response){
           row.val(response);
         })
         .fail(function(response){ window.console.log(response.error) })
      }
    }
  }
})

// -- field table activation ======================
var $modalValues = $('#valueListModal'),
    $editorValues = $('#formListValue'),
    $editorTitleValues = $('#headerListValue');

$editorValues.on('submit', function(e){
  if (this.checkValidity && !this.checkValidity()) return;
  e.preventDefault();
  
  var row = $modalValues.data('row');
  console.log("row", row);
  var values = $editorValues.serialize();
  console.log("values", values);
  
  if (row instanceof FooTable.Row){
    $.post('/table/value/', values)
     .done(function(response){
       console.log("response", response);
       // row.val(response);
     })
     .fail(function(response){ console.log(response.error) }) 
  }

  $modal.modal('hide');
  
});

window.modelFooTable = FooTable.init('#modelHouseTable', {
  editing: {
    enabled: true,
    allowAdd: false,
    allowDelete: false,
    showText: 'Редактировать',
    hideText: 'Закончить',
    editRow: function(row){
      var values = row.val();
      var inputs = $editorValues.find("input[id^='field-name-']")
      inputs.each(function(ind, elm){
        var $elm = $(elm);
        $elm.val(values[$elm.attr('id').slice('field-name-'.length)])
      })
      $editorValues.find('#houseId').val(values.houseid);

      $modalValues.data('row', row);
      $editorTitleValues.text('Редактирование адреса # ' + values.housename);
      $modalValues.modal('show');
    }
  }
})

// -- close preview ===========================

document.getElementById("loading_layer").style.display="none";

})