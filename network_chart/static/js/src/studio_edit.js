function StudioEdit(runtime, element) {

    var $element = $(element);
    $element.find('.save-button').bind('click', function () {
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        var data = {
            display_name: $element.find('input[name=display_name]').val(),
            json_url: $element.find('input[name=json_url]').val(),
            thumbnail_url: $element.find('input[name=thumbnail_url]').val(),
            display_description: $element.find('input[name=display_description]').val()
        };
        runtime.notify('save', {state: 'start'});
        $.post(handlerUrl, JSON.stringify(data)).done(function (response) {
            runtime.notify('save', {state: 'end'});
        });
    });

    $element.find('.cancel-button').bind('click', function () {
        runtime.notify('cancel', {});
    });
}
