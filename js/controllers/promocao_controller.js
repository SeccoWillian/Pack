angular.module('promocao_controller', [])

.controller('promocaoCtrl', ['$scope', '$token', '$state', '$stateParams', 'estabelecimento', 'restful',
    function($scope, $token, $state, $stateParams, estabelecimento, restful) {
    const {ipcRenderer} = require('electron')

    var id_est = estabelecimento.getEstabelecimento().id;
    var est = estabelecimento.getEstabelecimento().nome;
    var tokenize = $token.getToken();
    $scope.filePath = 'img/agenda.png';

    carregarPromo = ()=>{
        ipcRenderer.send('loading-toggle');
        var link = 'promocao/'+id_est;
        var metodo = 'GET';
        restful.generic({}, link, metodo, tokenize).then(function(data) {
            $scope.promo = {id_estabelecimento: id_est, estabelecimento: est};
            if(typeof data.promocao.id != 'undefined'){
                data.promocao.estabelecimento = est;
                $scope.promo = data.promocao;
            }
            ipcRenderer.send('loading-toggle');
        });
    };

    var promocao = carregarPromo();


    $scope.dias = (duracao)=>{
        if(duracao > 30 || duracao < 1){
            $scope.promo.duracao = '';
        }
    }


    // Preparar arquivo para upload
    $scope.processFiles = function(flow){
        var reader = new FileReader();
        reader.onload = function(event) {
            uploadedImage = event.target.result;
            $scope.arquivoSalvo = true;
        };
        reader.onerror = function(event) {
            console.error('O arquivo não pode ser lido! Código ' + event.target.error.code);
        };
        reader.readAsDataURL(flow[0].file);
        $scope.filePath = flow[0].file.path;
    };

    $scope.reset = ()=>{
        $scope.promo = {};
        $scope.promo.id_estabelecimento = id_est;
    };

    $scope.salvar = (dados)=>{
        ipcRenderer.send('loading-toggle');

        if(typeof uploadedImage != 'undefined'){
            dados.img = uploadedImage;
        }else{
            dados.img = $scope.promo.img;
        }
        var link = 'promocao';
        var metodo = 'POST';
        if(typeof(dados.id) != 'undefined' || dados.id != ''){
            metodo = 'PUT';
            dados.data = $scope.promo.data;
        }else{
            var data = moment(new Date()).add(dados.duracao, 'days');
            dados.data = data._d;
        }

        dados = angular.toJson(dados);
        restful.generic(dados, link, metodo, tokenize).then(function(data) {
            ipcRenderer.send('loading-toggle');
        });
    };

}])
