function clock(){
    var now = new Date();
    var h = now.getHours(); // 0 - 23
    var m = now.getMinutes(); // 0 - 59
    var s = now.getSeconds(); // 0 - 59
    var session = "AM";
    
    if(h == 0) h = 12;
    
    if(h > 12){
        h = h - 12;
        session = "PM";
    }
    
    h = (h < 10) ? "0" + h : h;
    m = (m < 10) ? "0" + m : m;
    s = (s < 10) ? "0" + s : s;
    
    let time = h + ":" + m + ":" + s + " " + session;
    $("#clock").text(time);

    if($('#auto').is(':checked')) {
        time = new SimpleDateFormat().formatWith("yyyy-MM-dd'T'HH:mm", now);
        $('#data-ora').val(time);
    }

    setTimeout(clock, 1000);
}
clock();

$('#auto').on('change', () => {
    //TODO finire il entra/esce in base al select
    $('#dataora').addClass('disabled');
    $('#entraesce').addClass('disabled');
    $('#entra').prop("checked", false);
    $('#esce').prop("checked", false);
});

$('#man').on('change', () => {
    $('#data-ora').val('');
    $('#dataora').removeClass('disabled');
    $('#entraesce').removeClass('disabled');
    $('#entra').prop("checked", false);
    $('#esce').prop("checked", false);
});

$('#dipendente').on('change', function() {
    if($('#auto').is(':checked')) {
        if($(this).children("option:selected").data('entrata') == 1)
            $('#entra').prop("checked", true);
        else
            $('#esce').prop("checked", true);
    }
});

var confermato = false;
$('#form').on('submit', (e) => {
    if(!confermato) {
        e.preventDefault();
        let d = new Date($('#data-ora').val());
        let data = new SimpleDateFormat().formatWith('dd/MM/yyyy', d);
        let ora = new SimpleDateFormat().formatWith('HH:mm', d);
        let dip = $('#dipendente').children("option:selected").text();
        let en_esc = $('#entra').prop("checked")==1?'ENTRA':'ESCE';
        $.confirm({
            title: 'Segur?',
            content: `<center><strong>${dip} ${en_esc}</strong><br>alle <strong>${ora}</strong><br>del <strong>${data}</strong></center>`,
            width: 'auto',
            resizable: false,
            buttons: {
                invia: {
                    text: 'Certo!',
                    btnClass: 'btn-blue',
                    keys: ['enter', 'shift'],
                    action: function() { confermato = true; $('#form').submit(); }
                },
                annulla: {
                    text: 'Scherzavo...',
                    btnClass: 'btn-red'
                }
            }
        });
    }
});