function StudioEdit(runtime, element) {

    var CHARACTER_LIMIT = 675;
    var currentJsonPath;
    var currentJsonValidation;

    var $element = $(element);
    var $saveBtn = $element.find('.save-button');
    var $cancelBtn = $element.find('.cancel-button');
    var $jsonUpload = $element.find('input[name=json_data]');
    var $jsonUploadErrorSpan = $element.find('span.json-upload-error');

    $jsonUpload.on('change', function (event) {
        var reader = new FileReader();
        reader.onload = onReaderLoad;
        reader.readAsText(event.target.files[0]);
    });

    function onReaderLoad(event) {
        try {
            var obj = JSON.parse(event.target.result);

            if (obj.nodes) {
                currentJsonPath = '';
                currentJsonValidation = {valid: true};

                checkLength(obj.nodes);

                if (currentJsonValidation.valid) {
                    enableSave();
                } else {
                    disableSave('Invalid JSON file, too many characters in: ' + currentJsonValidation.path);
                }
            } else {
                disableSave('JSON file should contain "nodes" array!');
            }
        } catch (e) {
            console.log(e);
            disableSave('Please provide a valid JSON file!');
        }
    }

    function checkLength(node) {
        if (node.id) {
            currentJsonPath = node.id;
        }
        for (var prop in node) {
            if (node.hasOwnProperty(prop)) {
                var nodeProp = node[prop];
                if (typeof nodeProp === 'string' && nodeProp.length > CHARACTER_LIMIT) {
                    currentJsonValidation = {valid: false, path: currentJsonPath + '/' + prop};
                } else if (typeof nodeProp === 'object') {
                    checkLength(nodeProp);
                }
            }
        }
    }

    function enableSave() {
        $saveBtn.removeClass('disabled');
        $jsonUploadErrorSpan.hide();
    }

    function disableSave(message) {
        $saveBtn.addClass('disabled');
        $jsonUploadErrorSpan.text(message);
        $jsonUploadErrorSpan.show();
    }

    $saveBtn.on('click', onClickSave);

    $cancelBtn.on('click', function () {
        runtime.notify('cancel', {});
    });

    function onClickSave() {
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');

        var data = new FormData();
        data.append('usage_id', $element.data('usage-id'));
        data.append('display_name', $element.find('input[name=display_name]').val());
        data.append('json_data', $element.find('input[name=json_data]')[0].files[0]);
        data.append('display_description', $element.find('input[name=display_description]').val());
        data.append('thumbnail', $element.find('input[name=thumbnail]')[0].files[0]);

        runtime.notify('save', {state: 'start'});

        $.ajax({
            url: handlerUrl,
            type: 'POST',
            data: data,
            cache: false,
            dataType: 'json',
            processData: false,
            contentType: false
        }).done(function (response) {
            runtime.notify('save', {state: 'end'});
        });
    }
}
