angular.module('pagamento_controller', [])

.controller('pagamentosCtrl', ['$scope', 'preinicio', '$token', 'estabelecimento', 'pagamento', 'restful', 'mensagem', '$timeout',
	function($scope, preinicio, $token, estabelecimento, pagamento, restful, mensagem, $timeout) {

	const {ipcRenderer} = require('electron')

	var id_est = estabelecimento.getEstabelecimento().id;
    var tokenize = $token.getToken();
    var parcelas = 0;
    var agendaParcela = {};

    preinicio.setPre(id_est, tokenize);
    	
    inicializacao = (pagamento)=>{

    	ipcRenderer.send('loading-toggle');
    	var pagamento = pagamento.getPagamento();

		var pess = pagamento.map(function (item, index) {
			if(item.id_pessoa != 0 || typeof item.id_pessoa != 'undefined')
	    		return item.id_pessoa;
	    });     

	    pess = pess.filter(function(item, pos) {
	    	return pess.indexOf(item) == pos;
		}) 

    	var link = 'pessoas/'+pess;
	    restful.generic({}, link, 'GET', tokenize).then(function(data) {
	        return data.pessoa;
	    }).then(function(dados){
	    	$scope.pessoas = dados;
	    	$scope.abertos = pagamento;
	    	ipcRenderer.send('loading-toggle');
	    });
    }

	$timeout(function() {
		inicializacao(pagamento);
	}, 3000);

	ipcRenderer.on('parcela-agenda', function(event, parcela) {
		parcelas = parcela;
		parcelar(agendaParcela);
    });

    $scope.pagar = (agenda)=>{
    	$scope.parcelaAtiva = false;
    	ipcRenderer.send('loading-toggle');
    	var linkAgenda = 'agenda';
    	var metodoAgenda = 'PUT';
    	agenda.pago = true;
    	var dadosAgenda = angular.toJson(agenda);
        restful.generic(dadosAgenda, linkAgenda, metodoAgenda, tokenize).then(function(data) {
            ipcRenderer.send('loading-toggle');
        });
    }

    $scope.parcelado = (agenda)=>{
    	$scope.parcelaAtiva = false;
    	agendaParcela = agenda;
    	ipcRenderer.send('parcelado-toggle');
    }

    parcelar = (agenda)=>{
    	if(parcelas > 0){
    		ipcRenderer.send('loading-toggle');
	    	var link = 'agenda';
	    	var metodo = 'PUT';
	    	agenda.parcelado = true;
	    	var dados = angular.toJson(agenda);
	        restful.generic(dados, link, metodo, tokenize).then(function(data) {
	        	var linkP = 'parcelamento';
		    	var metodoP = 'POST';
		    	var dadosP = {id_agenda: agenda.id, parcelas: parcelas, pagas: 0};
	            restful.generic(dadosP, linkP, metodoP, tokenize).then(function(dataParcela) {
		            ipcRenderer.send('loading-toggle');
		        });
	        });
    	}
    }

    $scope.verParcela = (id_agenda, id_servico)=>{
    	$scope.parcelaAtiva = false;
    	ipcRenderer.send('loading-toggle');
    	var link = 'parcelamento/'+id_agenda;
    	var metodo = 'GET';
        restful.generic({}, link, metodo, tokenize).then(function(data) {
        	var linkS = 'servico/'+id_servico;
	        restful.generic({}, linkS, metodo, tokenize).then(function(dataS) {
	        	$scope.parcelaAtiva = true;
	        	$scope.pagamentoParcela = data.parcelamento; 
	        	$scope.servico = dataS.servico;
	        	ipcRenderer.send('loading-toggle');
	        });
        });
    }

    $scope.pagarParcela = (id, serv, parcela, paga)=>{
    	var pagas = paga + 1;
    	if(parcela == pagas){
    		ipcRenderer.send('loading-toggle');
	    	var link = 'agenda';
	    	var metodo = 'PUT';
	    	var dados = {};
	    	dados.id = id;
	    	dados.pago = true;
	    	dados.parcelado = false;
	        restful.generic(dados, link, metodo, tokenize).then(function(data) {
	        	var linkP = 'parcelamento';
		    	var metodoP = 'PUT';
		    	var dadosP = {id_agenda: id, parcelas: parcela, pagas: pagas};
	            restful.generic(dadosP, linkP, metodoP, tokenize).then(function(dataParcela) {
		            ipcRenderer.send('loading-toggle');
		            $scope.parcelaAtiva = false;
		            $scope.verParcela(id, serv.id);
		        });
	        });
    	}else{
    		ipcRenderer.send('loading-toggle');
        	var linkP = 'parcelamento';
	    	var metodoP = 'PUT';
	    	var dadosP = {id_agenda: id, parcelas: parcela, pagas: pagas};
            restful.generic(dadosP, linkP, metodoP, tokenize).then(function(dataParcela) {
	            ipcRenderer.send('loading-toggle');
	            $scope.verParcela(id, serv.id);
	        });
    	}
    }
}])