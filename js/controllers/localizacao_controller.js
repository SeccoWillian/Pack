angular.module('localizacao_controller', [])

.controller('localizacaoCtrl', ['$scope', 'estabelecimento', 'coordenadas',
    function($scope, estabelecimento, coordenadas) {

    var geocoder = new google.maps.Geocoder();
    var map;
    codeAddress();

    function codeAddress() {
        var address = estabelecimento.getLocal();
        geocoder.geocode( { 'address': address}, function(results, status) {
            if (status == 'OK') {
                var loc=[]; 
                loc[0]=results[0].geometry.location.lat();
                loc[1]=results[0].geometry.location.lng();
                coordenadas.setCoordenadas({'latitude':loc[0], 'longitude':loc[1]});
                var latlng = new google.maps.LatLng(loc[0], loc[1]);
                var mapOptions = {
                    zoom: 18,
                    center: latlng
                }
                map = new google.maps.Map(document.getElementById('map'), mapOptions);
                map.setCenter(results[0].geometry.location);
                var marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location,
                    draggable: false, 
                    title: address, 
                    animation: google.maps.Animation.DROP
                });
                
            } else {
                alert('Não foi possível obter sua localização: ' + status);
            }
        });
    }
}]);

    