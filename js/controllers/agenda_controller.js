angular.module('agenda_controller', [])

.controller('agendaCtrl', ['$scope', '$state', '$stateParams', '$fabricaEventos', '$timeout', '$filter', 'configuracao', 'lista_serv', 'profissional', '$rootScope', '$state', 'restful', '$token', 'preinicio',
    function ($scope, $state, $stateParams, $fabricaEventos, $timeout, $filter, configuracao, lista_serv, profissional, $rootScope, $state, restful, $token, preinicio) {
        const {ipcRenderer} = require('electron')

        var listaServicos = lista_serv.getListaServico().servico;
        var profissional = angular.copy(profissional.getProfissional());
        var configCopy = angular.copy(configuracao.getConfiguracao().configuracao);
        $scope.incluido = true;
        $scope.showhoras = false;

        var marcacao;
        socket.on('horario_agenda', function (data) {
            $timeout(function() {
                if(data.profissional == profissional.id){
                    cargaEventos(data.dados)
                }
                preinicio.setPre($rootScope.estabOrigem.id, $token.getToken());
            }, 1000);
        });

        // var marcacao = $fabricaEventos.getEvento().maior;
        var usuarioSelecionado = "";
        var servicoInclusao = {};
        var novaListaServico = new Array();

        angular.forEach(listaServicos, function(value, key){
            angular.forEach(profissional.servicos, function(valor, chave){
                if(value.id == valor){
                    novaListaServico.push(value);
                }
            });
        });

        ipcRenderer.once('incluir-agenda', function(event, arg) {
            usuarioSelecionado = arg.nome;
            angular.forEach(listaServicos, function(value, key){
                if(value.id == arg.servico){
                    servicoInclusao = value;
                    $timeout(function () {
                        $scope.incluido = arg.habilitarBotao;
                    }, 10);
                }
            })
        });

        ipcRenderer.on('excluir-agenda', function(event, arg) {
            var link = 'agenda/'+arg;
            var tokenize = $token.getToken();
            deleteAgenda(link, tokenize);
        });

        var count = 0;
        deleteAgenda = (link, tokenize)=>{
            count++;
            if(count == 1){
                ipcRenderer.send('loading-toggle');
                restful.generic({}, link, 'DELETE', tokenize).then(function(data) {
                    if(typeof data.dados != 'undefined'){
                        var linked = 'pessoas/'+data.dados+'/agenda';
                        restful.generic({}, linked, 'GET', tokenize).then(function(data) {});
                    }
                    ipcRenderer.send('loading-toggle');
                });
            }
        }

        $scope.viewTitle = $filter('date')(new Date(), 'MMMM yyyy');

        cargaEventos = (dados)=>{
            marcacao = dados;
            angular.forEach(dados, function(value, key){
                value.startTime = new Date(value.startTime);
                value.endTime = new Date(value.endTime);
            })

            if(typeof dados !== 'undefined'){
                $timeout(function(){
                    $scope.calendar.eventSource = dados; //teste para carga de eventos
                });
            }
        }


        $scope.calendar = {};
        $scope.changeMode = function (mode) {
            $scope.calendar.mode = mode;
        };

        $scope.onViewTitleChanged = function (title) {
            $scope.viewTitle = title;
        };

        $scope.today = function () {
            $scope.calendar.currentDate = new Date();
        };

        $scope.isToday = function () {
            var today = new Date();
            currentCalendarDate = new Date($scope.calendar.currentDate);

            today.setHours(0, 0, 0, 0);
            currentCalendarDate.setHours(0, 0, 0, 0);
            return today.getTime() === currentCalendarDate.getTime();
        };

        $scope.onEventSelected = async function(event) {
            count = 0;

            var nomeEvento = '';
            var id = event.id;

            if($scope.calendar.mode == 'month'){
                ipcRenderer.send('loading-toggle');

                var dadosPessoa = {};
                var tokenize = $token.getToken();
                var link = 'pessoas/'+event.id_pessoa;
                await restful.generic({}, link, 'GET', tokenize).then(function(data) {
                    dadosPessoa = data.pessoa[0];
                });

                angular.forEach(listaServicos, function(value, key){
                    if(value.id == event.id_servico){
                        nomeEvento = value.nome;
                    }
                });

                if(event.observacao){
                    var texto = '<div><img class="img-circle media-object pull-left" src="../img/user.png" data-err-src="img/user.png" width="52" height="52" ui-sref="estabelecimento"></div>'+
                                '<div>Informações: '+event.observacao+'<br>Serviço: '+nomeEvento+'</div>';
                    var dados = {texto: texto, id: id};
                    ipcRenderer.send('excluir-toggle', dados);
                }else{
                    if(dadosPessoa !== null){
                        var texto;
                        if(typeof dadosPessoa.img == 'undefined' || dadosPessoa.img == ''){
                            texto = '<div style="background-color:#f1f1f1;"><img class="img-circle media-object pull-left" src="../img/user.png" data-err-src="img/user.png" width="52" height="52" ui-sref="estabelecimento"></div>'+
                            '<div>Informações: '+dadosPessoa.nome+' - '+dadosPessoa.telefone+'<br>Serviço: '+nomeEvento+'<br>Agendado por smartphone</div>';
                        }else{
                            texto = '<div style="background-color:#f1f1f1;"><img class="img-circle media-object pull-left" src="'+dadosPessoa.img+'" data-err-src="img/user.png" width="52" height="52" ui-sref="estabelecimento"></div>'+
                            '<div>Informações: '+dadosPessoa.nome+' - '+dadosPessoa.telefone+'<br>Serviço: '+nomeEvento+'<br>Agendado por smartphone</div>';
                        }
                        var dados = {texto: texto, id: id};
                        ipcRenderer.send('excluir-toggle', dados);
                    }
                }
                ipcRenderer.send('loading-toggle');
            }

        };

        $scope.incluirAgenda = ()=>{
            ipcRenderer.send('incluir-toggle', novaListaServico);
        };


        var array_opcoes = [];
        var array_times = [];
        var diaSelected = "";

        $scope.onTimeSelected = function (selectedTime, events, disabled) {
            moment.locale('pt-BR');

            var diaAtual = new Date();

            diaSelected = selectedTime;

            array_opcoes.length = 0;
            array_times.length = 0;

            angular.forEach(marcacao, function(value, key){
                var start = new Date(value.startTime);
                var end = new Date(value.endTime);
                if(moment(start).isSame(selectedTime, 'day')){
                    array_times.push({inicio: start, fim: end});
                }
            })

            horarios_disponiveis = ()=>{
                if($scope.incluido == false){
                    array_times.sort(function(a,b){
                        return new Date(a.inicio) - new Date(b.inicio);
                    });

                    var init = moment(selectedTime).isSameOrAfter(new_inicio);
                    var init_int = moment(selectedTime).isSameOrBefore(new_intervalo_inicio);
                    var end_int = moment(selectedTime).isSameOrAfter(new_intervalo_fim);
                    var fim = moment(selectedTime).isSameOrBefore(new_fim);
                    var possivel = [];

                    if((init == true && init_int == true) || (end_int == true && fim == true)){
                        angular.forEach(array_times, function(value, key){

                            var calc = moment(selectedTime).add(servicoInclusao.duracao, 'm');

                            if(key > 0){
                                var inicial = moment(calc._i).isSameOrAfter(array_times[key-1].fim);
                                var final = moment(calc._d).isSameOrBefore(value.inicio);
                            }

                            if((inicial == true && final == true)){
                                possivel = {inicio: calc._i, fim: calc._d};
                                array_opcoes.push(possivel);
                                array_times.push(possivel);
                                horarios_disponiveis();
                            }else{
                                selectedTime = value.fim;
                            }
                        });
                    }
                }
            }

            // --------------PARAMETROS INICIAIS------------

            var tipo = {titulo: servicoInclusao.nome, horaFim: servicoInclusao.duracao};

            var data_limite = moment(configCopy.data_limite, "DD-MM-YYYY");
            var data_atual = moment(new Date(), "DD-MM-YYYY");
            var dia_semana = moment(selectedTime).format("dddd");
            var dia_selecionado = moment(selectedTime);

            var new_inicio;
            var new_inicio_fim;
            var new_intervalo_inicio;
            var new_intervalo_fim;
            var new_fim;

            var padrao = true;
            var data_possivel = true;
            var alerta_data = "Não é possível cadastrar neste período";

            function setIntervalos(h_inicio, int_inicio, int_fim, h_fim){
                h_inicio = h_inicio.split(":");
                int_inicio = int_inicio.split(":");
                int_fim = int_fim.split(":");
                h_fim = h_fim.split(":");

                new_inicio = moment(selectedTime).set({'hour':h_inicio[0], 'minute':h_inicio[1] - 1})._d;
                new_inicio_fim = moment(selectedTime).set({'hour':h_inicio[0], 'minute':h_inicio[1]})._d;
                new_intervalo_inicio = moment(selectedTime).set({'hour':int_inicio[0], 'minute':int_inicio[1]})._d;
                new_intervalo_fim = moment(selectedTime).set({'hour':int_fim[0], 'minute':int_fim[1]})._d;
                new_fim = moment(selectedTime).set({'hour':h_fim[0], 'minute':h_fim[1]})._d;

                array_times.push({inicio: new_inicio, fim: new_inicio_fim});
                array_times.push({inicio: new_intervalo_inicio, fim: new_intervalo_fim});
                array_times.push({inicio: new_fim, fim: new_fim});

                selectedTime = new_inicio;
                if(moment(selectedTime).isSame(new Date(), 'day')){
                    if(moment(new Date()).isSameOrBefore(new_intervalo_fim)){
                        array_times.push({inicio: new_inicio_fim, fim: new_intervalo_inicio});
                        horarios_disponiveis();
                    }
                }else{
                    horarios_disponiveis();
                }
            }

            if(moment(dia_selecionado._d).isSameOrBefore(data_limite, 'day') && moment(dia_selecionado._d).isSameOrAfter(data_atual._d, 'day')){
                angular.forEach(configCopy.feriados, function(value, key){
                    var dia_feriado = moment(value.dia, "DD-MM-YYYY").format('L');
                    var dia_sel = moment(dia_selecionado, "DD-MM-YYYY").format('L');
                    if(dia_feriado == dia_sel){
                        $scope.calendar.mode = 'month';
                        alert('Não é possível agendar, Feriado de '+value.nome);
                        padrao = false;
                    }
                });
                angular.forEach(configCopy.data_especial, function(value, key){
                    var data_esp = moment(value.data, "DD-MM-YYYY").format('L');
                    var dia_sel = moment(dia_selecionado, "DD-MM-YYYY").format('L');
                    if(data_esp == dia_sel){
                        setIntervalos(value.hora_inicio, value.intervalo_inicio, value.intervalo_fim, value.hora_fim);
                        padrao = false;
                        alerta_data = "Horário não permitido, exclusivamente para este dia.";
                    }
                });

                if(dia_semana == 'Sábado'){
                    setIntervalos(configCopy.hora_sabado.hora_inicio, configCopy.hora_sabado.intervalo_inicio, configCopy.hora_sabado.intervalo_fim, configCopy.hora_sabado.hora_fim);
                    padrao = false;
                    alerta_data = "Horário não permitido para os Sábados.";
                }

                if(dia_semana == 'Domingo'){
                    setIntervalos(configCopy.hora_domingo.hora_inicio, configCopy.hora_domingo.intervalo_inicio, configCopy.hora_domingo.intervalo_fim, configCopy.hora_domingo.hora_fim);
                    padrao = false;
                    alerta_data = "Horário não permitido para os Domingos.";
                }

                if(padrao){
                    setIntervalos(configCopy.hora_padrao.hora_inicio, configCopy.hora_padrao.intervalo_inicio, configCopy.hora_padrao.intervalo_fim, configCopy.hora_padrao.hora_fim);
                }

            }else{
                data_possivel = false;
                alerta_data = "A data deve ser maior que a data atual e menor que a data limite "+configCopy.data_limite;
            }

            // --------------ADICIONAR HORÁRIO SELECIONADO------------

            $scope.horarioSelecionado = (hora)=>{
                var tempoInicial = moment(hora).format("HH:mm");
                var final = moment(hora).add(servicoInclusao.duracao, "minutes")._d;
                var inicio = hora;
                if(data_possivel){
                    var res = confirm('Você deseja reservar o serviço '+servicoInclusao.nome+'? para este horário '+tempoInicial);

                    if(res) {
                        var evento = {
                            estabelecimento: $rootScope.estabOrigem.id,
                            especialista: profissional.id,
                            servico: servicoInclusao.id,
                            preco: servicoInclusao.preco,
                            pessoa: 0,
                            titulo: tipo.titulo,
                            dia: selectedTime,
                            minutoInicio: inicio,
                            minutoFim: final,
                            observacao: usuarioSelecionado
                        };

                        $fabricaEventos.setEvento(evento);
                        $scope.selecionarPeriodos();
                        $scope.onTimeSelected(hora);
                        $state.go('lista_profissional_agenda');
                    }
                }else{
                    alert(alerta_data);
                }
            }
        }
        montador = ()=>{
            $scope.horariosDisponiveis = array_opcoes;
            angular.extend($scope.horariosDisponiveis, array_opcoes);
        }

        $scope.selecionarPeriodos = ()=>{
            $scope.showhoras = true;
            if(array_opcoes.length == 0){
                if(diaSelected == ""){
                    $scope.onTimeSelected(new Date());
                }else{
                    $scope.onTimeSelected(diaSelected);
                }
                montador();
            }else{
                montador();
            }
            //$scope.horariosDisponiveis = array_opcoes;
            //angular.extend($scope.horariosDisponiveis, array_opcoes);
        }
}])
