angular.module('estabelecimento_controller', [])

.controller('estabelecimentoCtrl', ['$scope', '$state', '$stateParams', 'estabelecimento', 'restful', '$token', 'notificacao', 'coordenadas', 'mascara', 'valida_cpf_cnpj', 'mensagem',
    function($scope, $state, $stateParams, estabelecimento, restful, $token, notificacao, coordenadas, mascara, valida_cpf_cnpj, mensagem) {

    const {ipcRenderer} = require('electron')

    estab = angular.copy(estabelecimento.getEstabelecimento());
    $scope.est = estab;
    var enderecoAtual = estab.endereco;

    var uploadedImage = estab.img;
    $scope.arquivoSalvo = false;
    $scope.filePath = 'img/user.png';

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

    $scope.localizacao = (est)=>{
        if(typeof(est.endereco) != 'undefined' && est.endereco != enderecoAtual){
            estabelecimento.setLocal(est);
            estabelecimento.setEstabelecimento(est);
            $state.go('localizacao');
        }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
    };

    $scope.cnpj_mascara = function(v){
        $scope.est.documento = mascara.documento(v);
    };

    $scope.masc_tel = function(v){
        $scope.est.telefone = mascara.telefone(v);
    }

    $scope.salvar = (dados)=>{
        valida_cpf_cnpj.setValida(dados.documento);

        if(valida_cpf_cnpj.getValida() == true){
            ipcRenderer.send('loading-toggle');
            var link = 'pessoas';
            var metodo = 'POST';
            var tokenize = 0;
            var local = coordenadas.getCoordenadas();
            dados.estabelecimento = true;
            dados.img = uploadedImage;
            if(typeof(local.latitude) != 'undefined' && typeof(local.longitude) != 'undefined'){
                dados.geo = [local.latitude, local.longitude];
            }
            estabelecimento.setEstabelecimento(dados);
            if(typeof(dados.id) != 'undefined'){
                metodo = 'PUT';
                tokenize = $token.getToken();
            }
            dados = angular.toJson(dados);
            restful.generic(dados, link, metodo, tokenize).then(function(data) {
                notificacao.msgCompleta('Estabelecimento', 'Sugerimos que o sistema seja reiniciado!');
                $state.go('inicial');
                ipcRenderer.send('loading-toggle');
            });
        }else{
            mensagem.setMsg('Atenção', 'É necessário informar um CNPJ valido!');
            $scope.est.documento = '';
        }
    };
}])