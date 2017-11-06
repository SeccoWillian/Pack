angular.module('profissional_controller', [])

.controller('listaProfissionalAgendaCtrl', ['$scope', '$token', 'lista_prof', 'profissional', '$state', '$stateParams', '$fabricaEventos', 'restful', 'estabelecimento', 'preinicio', 
    function($scope, $token, lista_prof, profissional, $state, $stateParams, $fabricaEventos, restful, estabelecimento, preinicio) {
    const {ipcRenderer} = require('electron')
    
    var nova_lista = lista_prof.getListaProfissional().profissional;
    var id_est = estabelecimento.getEstabelecimento().id;
    var tokenize = $token.getToken();

    preinicio.setPre(id_est, tokenize);

    $scope.lista = nova_lista;
    $scope.atualizar = (lista)=>{
        ipcRenderer.send('loading-toggle');
        profissional.setProfissional(lista);
        var link = 'profissionais/'+lista.id+'/agenda';
        $state.go('agenda');
        restful.generic({}, link, 'GET', tokenize).then(function(data) {
            // $fabricaEventos.setEventoGeral(data.Agenda)
            ipcRenderer.send('loading-toggle');
        });
    };

}])

.controller('profissionalCtrl', ['$scope', 'lista_serv', 'estabelecimento', '$token', 'profissional', 'lista_prof', '$state', '$stateParams', 'restful', 'mascara',
    function($scope, lista_serv, estabelecimento, $token, profissional, lista_prof, $state, $stateParams, restful, mascara) {
    const {ipcRenderer} = require('electron')

    var id_est = estabelecimento.getEstabelecimento().id;
    var tokenize = $token.getToken();
    var getProf = angular.copy(profissional.getProfissional());
    $scope.servicos = lista_serv.getListaServico().servico;
    $scope.prof = getProf;
    $scope.prof.id_estabelecimento = id_est;

    var uploadedImage = getProf.img;
    $scope.arquivoSalvo = false;
    $scope.filePath = 'img/user.png';

    $scope.prof_tel = function(v){
        $scope.prof.telefone = mascara.telefone(v);
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
        $scope.prof = {};
        $scope.prof.id_estabelecimento = id_est;
        profissional.setProfissional({});
    };

    $scope.salvar = (dados)=>{
        ipcRenderer.send('loading-toggle');
        var link = 'profissionais';
        var metodo = 'POST';
        if(typeof(dados.id) != 'undefined'){
            metodo = 'PUT';
        }
        dados.img = uploadedImage;
        dados = angular.toJson(dados);
        restful.generic(dados, link, metodo, tokenize).then(function(data) {
            profissional.setProfissional({});
            lista_prof.setListaProfissional({});
        }).then(function(){
            $scope.buscar();
            ipcRenderer.send('loading-toggle');
        });
    };

    $scope.buscar = ()=>{
        ipcRenderer.send('loading-toggle');
        var link = 'estabelecimento/'+id_est+'/profissionais';
        if(typeof lista_prof.getListaProfissional().profissional == 'undefined'){
            restful.generic({}, link, 'GET', tokenize).then(function(data) {
                lista_prof.setListaProfissional(data);
                $state.go('lista_profissional');
                ipcRenderer.send('loading-toggle');
            });
        }else{
            $state.go('lista_profissional');
            ipcRenderer.send('loading-toggle');
        }
    };

}])

.controller('listaProfissionalCtrl', ['$scope', '$token', 'lista_prof', 'profissional', '$state', '$stateParams', 'restful',
    function($scope, $token, lista_prof, profissional, $state, $stateParams, restful) {
    const {ipcRenderer} = require('electron')

    var nova_lista = lista_prof.getListaProfissional().profissional;
    var tokenize = $token.getToken();
    $scope.lista = nova_lista;
    $scope.atualizar = (lista)=>{
        profissional.setProfissional(lista);
        $state.go('profissional');
    };

    $scope.deletar = (lista)=>{
        ipcRenderer.send('loading-toggle');
        var link = 'profissionais/'+lista.id;
        restful.generic({}, link, 'DELETE', tokenize).then(function(data) {
            lista_prof.setListaProfissional(data);
            $state.go('profissional');
            ipcRenderer.send('loading-toggle');
        });
    };

}])