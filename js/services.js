angular.module('app.services', [])

//quase um interceptor
.factory('restful', ['$http', 'init', 'notificacao', 'mensagem',
    function($http, init, notificacao, mensagem){

    const {ipcRenderer} = require('electron')

    var restful = {
        generic: function(data, link, metodo, token) {
            var head = {'Content-Type': 'application/json'};
            if(token != 0){
                head = {'x-access-token': token};
            }
            // $http retorna a promessa, que tem uma função, que também retorna uma promessa
            var promise = $http({
                method: metodo,
                url: init.getlink()+link,
                data: data,
                headers: head
            }).then(function successCallback(response) {
                if(response.data.mensagem){
                    if(response.data.mensagem.errmsg){
                        mensagem.setMsg('Mensagem', response.data.mensagem.errmsg);
                    }else{
                        mensagem.setMsg('Mensagem', response.data.mensagem);
                    }
                }
                if(response.data.erro){
                    return false;
                }else{
                    return response.data;
                }
            }, function errorCallback(response) {
                if(response.status == -1){
                    notificacao.msgCompleta('Requisição HTTPS:', 'Verifique sua conexão com a Internet');
                }else{
                    notificacao.msgCompleta('Erro na requisição:', response.data.mensagem);
                }
                ipcRenderer.send('loading-toggle');
            });
            // Retorna a promessa para o controller
            return promise;
        }
    };
    return restful;
}])

.service('init', function(){
    var link = 'http://104.207.144.60:8080/api/';
    return {
        getlink: ()=>{
            return link;
        }
    }
})

.service('mascara', [function(){
    var d;

    this.telefone = function(v){
        v=v.replace(/\D/g,"");                 //Remove tudo o que não é dígito
        v=v.replace(/^(\d\d)(\d)/g,"($1) $2"); //Coloca parênteses em volta dos dois primeiros dígitos
        v=v.replace(/(\d{4})(\d)/,"$1-$2");    //Coloca hífen entre o quarto e o quinto dígitos
        return v;
    };

    this.cep = function(v){
        v=v.toString();
        v=v.replace(/\D/g,"");                //Remove tudo o que não é dígito
        v=v.replace(/(\d{5})(\d)/,"$1-$2");   //Coloca hífen entre o quarto e o quinto dígitos
        return v;
    };

    this.documento = function(v){
        if(v.length <= 18){
            d = v;
        }else{
            v = d;
        }

        v=v.replace(/[^0-9]/g,'');
        v=v.replace(/^(\d{2})(\d)/,"$1.$2");
        //Coloca ponto entre o quinto e o sexto dígitos
        v=v.replace(/^(\d{2})\.(\d{3})(\d)/,"$1.$2.$3");
        v=v.replace(/\.(\d{3})(\d)/,".$1/$2");
        v=v.replace(/(\d{4})(\d)/,"$1-$2");

        return v;
    };

    this.moedaReal = function(v){
        v=v.replace(/\D/g,""); // permite digitar apenas numero
        v=v.replace(/(\d{1})(\d{14})$/,"$1.$2"); // coloca ponto antes dos ultimos digitos
        v=v.replace(/(\d{1})(\d{11})$/,"$1.$2"); // coloca ponto antes dos ultimos 13 digitos
        v=v.replace(/(\d{1})(\d{8})$/,"$1.$2"); // coloca ponto antes dos ultimos 10 digitos
        v=v.replace(/(\d{1})(\d{5})$/,"$1.$2"); // coloca ponto antes dos ultimos 7 digitos
        v=v.replace(/(\d{1})(\d{1,2})$/,"$1,$2"); // coloca virgula antes dos ultimos 4 digitos
        return v;
    };
}])

.service('valida_cpf_cnpj', [function(){
    var response = false;
    return {
        getValida: function () {
            return response;
        },
        setValida: function(str) {
            str = str.replace(/[^0-9]/g,'');
            if(str.length == 11){
                var Soma;
                var Resto;
                Soma = 0;
                if (str == "00000000000") return response = false;

                for (i=1; i<=9; i++) Soma = Soma + parseInt(str.substring(i-1, i)) * (11 - i);
                Resto = (Soma * 10) % 11;

                if ((Resto == 10) || (Resto == 11))  Resto = 0;
                if (Resto != parseInt(str.substring(9, 10)) ) return response = false;

                Soma = 0;
                for (i = 1; i <= 10; i++) Soma = Soma + parseInt(str.substring(i-1, i)) * (12 - i);
                Resto = (Soma * 10) % 11;

                if ((Resto == 10) || (Resto == 11))  Resto = 0;
                if (Resto != parseInt(str.substring(10, 11) ) ) return response = false;
                return response = true;
            }
            else if(str.length == 14){
                var b = [6,5,4,3,2,9,8,7,6,5,4,3,2];

                if(/0{14}/.test(str))
                    return response = false;

                for (var i = 0, n = 0; i < 12; n += str[i] * b[++i]);
                if(str[12] != (((n %= 11) < 2) ? 0 : 11 - n))
                    return response = false;

                for (var i = 0, n = 0; i <= 12; n += str[i] * b[i++]);
                if(str[13] != (((n %= 11) < 2) ? 0 : 11 - n))
                    return response = false;

                return response = true;
            }else{
                return response = false;
            }
        }
    };
}])

.service('preinicio', ['$rootScope', 'restful', 'lista_serv', 'pagamento',
    function($rootScope, restful, lista_serv, pagamento){
    return {
        setPre: (id_est, tkn)=>{
            var link = 'estabelecimento/'+id_est+'/agenda';
            restful.generic({}, link, 'GET', tkn).then(function(data) {

                var agenda = data.Agenda.maior;
                pagamento.setPagamento(data.Agenda.menor);
                var servicos = lista_serv.getListaServico().servico;
                var serv = agenda.map(function (item, index) {
                    return item.id_servico;
                });
                var qtd = serv.reduce(function(acc,e){acc[e] = (e in acc ? acc[e]+1 : 1); return acc}, {}); // [] retorna array {} objeto

                var count = 0;
                var padronizado = [];
                angular.forEach(qtd, function(value, index){
                    count++;
                    var servico;
                    angular.forEach(servicos, function(val, idx){
                        if(index == val.id)
                            servico = val.nome;
                    });
                    if(count <= 4)
                        padronizado.push({indice: servico, valor: value});
                });

                padronizado.sort(function(x,y){return y.valor - x.valor});

                $rootScope.atendimentos = padronizado;
                $rootScope.totalAtendimentos = serv.length;
            });
        }
    }
}])

.service('$fabricaEventos', ['restful', '$token', function(restful, $token){
    var tokenize = $token.getToken();
    const {ipcRenderer} = require('electron')
    return {
        setEvento: function(evento){
            ipcRenderer.send('loading-toggle');
            var link = 'agenda';
            var horaInicio;
            var horaFim;

            horaInicio = new Date(evento.dia.getFullYear(), evento.dia.getMonth(), evento.dia.getDate(), 0, evento.minutoInicio);
            horaFim = new Date(evento.dia.getFullYear(), evento.dia.getMonth(), evento.dia.getDate(), 0, evento.minutoInicio + evento.minutoFim);

            dados = {
                id_estabelecimento: evento.estabelecimento,
                id_profissional: evento.especialista,
                id_servico: evento.servico,
                preco: evento.preco,
                id_pessoa: evento.pessoa,
                title: evento.titulo,
                startTime: evento.minutoInicio,
                endTime: evento.minutoFim,
                observacao: evento.observacao,
                allDay: false
            };

            dados = angular.toJson(dados);
            restful.generic(dados, link, 'POST', tokenize).then(function(data) {
                ipcRenderer.send('loading-toggle');
                return data.data
            });
        }
    };
}])

.service('notificacao', function(){
    this.msgCompleta = (titulo, mensagem)=>{
        const notifier = require('node-notifier');
        const path = require('path');

        notifier.notify({
          title: titulo,
          message: mensagem,
          icon: path.join(__dirname, 'img/user.png'), // caminho absoluto
          sound: true, // Openas as central de notificação do windows toaster
          closeLabel: 'Fechar',
          timeout: 3,
          wait: true // espera pelo callback, até o usuário pegar a notificação
        }, function (err, response) {

        });

        notifier.on('click', function (notifierObject, options) {

        });

        notifier.on('timeout', function (notifierObject, options) {

        });
    };
})

.service('$token', function(){
    var tk = '';
    return {
        setToken: (tok)=>{
            tk = tok;
        },
        getToken: ()=>{
            return tk;
        }
    }
})

.service('pagamento', function(){
    var pagamento = {};
    return {
        setPagamento: (pag)=>{
            pagamento = pag;
        },
        getPagamento: ()=>{
            return pagamento;
        }
    }
})

.service('estabelecimento', function(){
    var estab = {};
    var par = '';
    return {
        getEstabelecimento: function () {
            return estab;
        },
        setEstabelecimento: function(value) {
          estab = value;
        },
        getLocal: function () {
            return par;
        },
        setLocal: function(value) {
          par = value.endereco;
        }
    };
})

.service('configuracao', function(){
    var conf = {};
    return {
        getConfiguracao: function () {
            return conf;
        },
        setConfiguracao: function(value) {
          conf = value;
        }
    };
})

.service('profissional', function(){
    var prof = {};
    return {
        getProfissional: function () {
            return prof;
        },
        setProfissional: function(value) {
          prof = value;
        }
    };
})

.service('lista_serv', function(){
    var serv = {};
    return {
        getListaServico: function () {
            return serv;
        },
        setListaServico: function(value) {
          serv = value;
        }
    };
})

.service('lista_prof', function(){
    var prof = {};
    return {
        getListaProfissional: function () {
            return prof;
        },
        setListaProfissional: function(value) {
          prof = value;
        }
    };
})

.service('mensagem', function(){
    const {ipcRenderer} = require('electron');
    return {
        setMsg: function(titulo, mensagem) {
            ipcRenderer.send('alerta', {msg:mensagem, titulo:titulo});
        }
    };
})

.service('coordenadas', function(){
    var gps = {};
    return {
        getCoordenadas: function () {
            return gps;
        },
        setCoordenadas: function(value) {
          gps = value;
        }
    };
});
