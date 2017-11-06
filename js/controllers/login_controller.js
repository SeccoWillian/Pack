angular.module('login_controller', [])

.controller('loginCtrl', ['$scope', '$state', '$stateParams', 'restful', 'estabelecimento', 'lista_prof', 'lista_serv', '$token', '$rootScope', 'configuracao', 'preinicio', 'mensagem',
    function($scope, $state, $stateParams, restful, estabelecimento, lista_prof, lista_serv, $token, $rootScope, configuracao, preinicio, mensagem) {

    const {ipcRenderer} = require('electron')

    ipcRenderer.on('send-login', function(event, arg) {
        $scope.logar(arg)
    });

    $scope.logar = function(dados){
        var link = 'login';
        var senha = dados.senha;
        dados = JSON.stringify(dados);
        restful.generic(dados, link, 'POST', 0).then(function(data) {
            if(data.user){
                data.user.senha = senha;
                estabelecimento.setEstabelecimento(data.user);
            }
            if(typeof data.token != 'undefined'){
                var dados = data;
                return dados;
            }else{
                ipcRenderer.send('login-nok');
            }
            
        }).then(function(dados){
            $token.setToken(dados.token);

            var link = 'configuracao/'+dados.user.id;
            restful.generic({}, link, 'GET', dados.token).then(function(data) {
                configuracao.setConfiguracao(data);
                var limite;

                if(data.configuracao !== null){
                    var dt_limite = data.configuracao.data_limite.split("/");
                    var data_limite = dt_limite[2]+"-"+dt_limite[1]+"-"+dt_limite[0];
                    var atual = moment(new Date()).format('YYYY-MM-DD');
                    limite = moment(data_limite).isAfter(atual);
                    var paginicial = '';
                }else{
                    limite = false;
                }

                if(limite){
                    paginicial = 'inicial';
                }else{
                    mensagem.setMsg('Mensagem', 'Modifique a data limite, ela é menor ou igual a data atual');
                    if(data.configuracao !== null){
                        configuracao.getConfiguracao().configuracao.data_limite = '';
                    }
                    paginicial = 'configuracao';
                }

                var link = 'estabelecimento/'+dados.user.id+'/profissionais';
                restful.generic({}, link, 'GET', dados.token).then(function(data) {
                    lista_prof.setListaProfissional(data);

                    var link = 'estabelecimento/'+dados.user.id+'/servico';
                    restful.generic({}, link, 'GET', dados.token).then(function(data) {
                        lista_serv.setListaServico(data);
                    }).then(function(){
                        $rootScope.estabOrigem = dados.user;
                        ipcRenderer.send('loading-toggle');
                        ipcRenderer.send('login-ok');
                        $state.go(paginicial);

                        preinicio.setPre(dados.user.id, dados.token);
                        
                    });
                });
            });
            
        });
    };
}])