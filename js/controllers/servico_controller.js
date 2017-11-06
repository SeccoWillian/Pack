angular.module('servico_controller', [])

.controller('servicoCtrl', ['$scope', 'estabelecimento', '$state', '$stateParams', 'restful', 'lista_serv', '$token',
    function($scope, estabelecimento, $state, $stateParams, restful, lista_serv, $token) {
    const {ipcRenderer} = require('electron')
    var tokenize = $token.getToken();
    var svsCopy = angular.copy(lista_serv.getListaServico().servico);
    $scope.svs = svsCopy;
    var id_est = estabelecimento.getEstabelecimento().id;

    $scope.cancelar = ()=>{
        $scope.serv = {};
    };

    $scope.salvar = (dados)=>{
        ipcRenderer.send('loading-toggle');
        var link = 'servico';
        var metodo = 'POST';
        if(typeof dados.id != 'undefined'){
            metodo = 'PUT';
        }
        dados.id_estabelecimento = id_est;
        dados = angular.toJson(dados);
        restful.generic(dados, link, metodo, tokenize).then(function(data) {
            $scope.ativo = false;
            precargaServ(id_est);
            $scope.cancelar();
            ipcRenderer.send('loading-toggle');
        });
    };

    $scope.atualizar = (sv)=>{
        $scope.serv = sv;
    };

    $scope.mascaraMoeda = (sv)=>{
        $scope.serv.preco = sv.replace(",",".");
    };

    $scope.excluir = (id)=>{
        ipcRenderer.send('loading-toggle');
        var link = 'servico/'+id;
        restful.generic({}, link, 'DELETE', tokenize).then(function(data) {
            $scope.ativo = false;
            precargaServ(id_est);
            ipcRenderer.send('loading-toggle');
        });
    };

    precargaServ = ()=>{
        ipcRenderer.send('loading-toggle');
        var link = 'estabelecimento/'+id_est+'/servico';
        restful.generic({}, link, 'GET', tokenize).then(function(data) {
            lista_serv.setListaServico(data);
            ipcRenderer.send('loading-toggle');
        }).then(function(data) {
            $scope.svs = lista_serv.getListaServico().servico;
        });
    };
}])