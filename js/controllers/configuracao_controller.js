angular.module('configuracao_controller', [])

.controller('configuracaoCtrl',['$scope', 'estabelecimento', '$token', 'configuracao', 'restful', 'mensagem',
    function($scope, estabelecimento, $token, configuracao, restful, mensagem) {

    const {ipcRenderer} = require('electron')

    var est_id = estabelecimento.getEstabelecimento().id;
    var tokenize = $token.getToken();
    var feriado = new Array();
    var dataEspecial = new Array();
    var config;

    $scope.tab = (tipo)=>{
        if(tipo == 'padrao'){
            $scope.padrao = true;
            $scope.sabado = false;
            $scope.domingo = false;
            $scope.p_class = 'active';
            $scope.s_class = '';
            $scope.d_class = '';
        }
        if(tipo == 'sabado'){
            $scope.padrao = false;
            $scope.sabado = true;
            $scope.domingo = false;
            $scope.p_class = '';
            $scope.s_class = 'active';
            $scope.d_class = '';
        }
        if(tipo == 'domingo'){
            $scope.padrao = false;
            $scope.sabado = false;
            $scope.domingo = true;
            $scope.p_class = '';
            $scope.s_class = '';
            $scope.d_class = 'active';
        }
    }

    var construtor = ()=>{
        var configCopy = configuracao.getConfiguracao().configuracao;
        config = configCopy;
        $scope.conf = config;

        if(config != null){
            if(typeof config.feriados != 'undefined'){
                feriado = config.feriados;
            }

            if(typeof config.data_especial != 'undefined'){
                dataEspecial = config.data_especial;
            }
        }

        $scope.listaFeriados = feriado;
        $scope.listaEspeciais = dataEspecial;
    };

    construtor();

    $scope.salvar = (conf)=>{
        if(conf.data_limite != ''){
            ipcRenderer.send('loading-toggle');
            var link = 'configuracao';
            var metodo = 'PUT';
            conf.feriados = feriado;
            conf.data_especial = dataEspecial;
            if(typeof conf.id == 'undefined'){
                conf.id = est_id;
                metodo = 'POST';
            }
            restful.generic(conf, link, metodo, tokenize).then(function(data) {
                precargaConf(est_id, tokenize);
                construtor();
                ipcRenderer.send('loading-toggle');
            });
        }else{
            mensagem.setMsg('Mensagem', 'Necessário preenchimento da data limite!');
        }
        
    };

    precargaConf = (id, token)=>{
        ipcRenderer.send('loading-toggle');
        var link = 'configuracao/'+id;
        var tokenize = token;
        restful.generic({}, link, 'GET', tokenize).then(function(data) {
            configuracao.setConfiguracao(data);
            ipcRenderer.send('loading-toggle');
        });
    };

    $scope.cancelar = ()=>{
        $scope.fer = {};
        $scope.esp = {};
    };

    $scope.addFeriado = (dados)=>{
        feriado.push(dados);
        $scope.fer = {};
    };

    $scope.addEspecial = (dados)=>{
        dataEspecial.push(dados);
        $scope.esp = {};
    };

    $scope.deletarFeriado = (chave)=>{
        if(chave != -1) {
            feriado.splice(chave, 1);
        }
    };

    $scope.deletarEspecial = (chave)=>{
        if(chave != -1) {
            dataEspecial.splice(chave, 1);
        }
    };

}])