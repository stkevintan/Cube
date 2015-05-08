/**
 * Created by kevin on 15-5-8.
 */
//设置页面行为
var settings = {
    init: function (fm) {
        this.fm=fm;
        $('#music-dir').val(fm.getMusicDir());
        settings.listen();
    },
    listen: function () {
        $('button#openDialog').click(function () {
            $('#fileDialog').trigger('click');
        });
        $('#fileDialog').change(function () {
            var newDir = $(this).val();
            console.log('newDir', newDir);
            if (this.fm.setMusicDir(newDir)) {
                $('#music-dir').val(newDir);
                $('#refresh').trigger('click');
            }
        });
    }
}