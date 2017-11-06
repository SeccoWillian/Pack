angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {
  
  $urlRouterProvider.otherwise('/');
  
  $stateProvider
    .state('login', {
      url: '/',
      templateUrl: 'templates/login.html',
      controller: 'loginCtrl'
    })
    .state('agenda', {
      url: '/agenda',
      templateUrl: 'templates/agenda.html',
      controller: 'agendaCtrl'
    })
    .state('inicial', {
      url: '/inicial',
      templateUrl: 'templates/inicial.html',
      controller: 'inicialCtrl'
    })
    .state('profissional', {
      url: '/profissional',
      templateUrl: 'templates/profissional.html',
      controller: 'profissionalCtrl'
    })
    .state('promocao', {
      url: '/promocao',
      templateUrl: 'templates/promocao.html',
      controller: 'promocaoCtrl'
    })
    .state('lista_profissional', {
      url: '/lista_profissional',
      templateUrl: 'templates/lista_profissional.html',
      controller: 'listaProfissionalCtrl'
    })
    .state('lista_profissional_agenda', {
      url: '/lista_profissional_agenda',
      templateUrl: 'templates/lista_profissional_agenda.html',
      controller: 'listaProfissionalAgendaCtrl'
    })
    .state('servico', {
      url: '/servico',
      templateUrl: 'templates/servico.html',
      controller: 'servicoCtrl'
    })
    .state('localizacao', {
      url: '/localizacao',
      templateUrl: 'templates/localizacao.html',
      controller: 'localizacaoCtrl'
    })
    .state('pagamentos', {
      url: '/pagamentos',
      templateUrl: 'templates/pagamentos.html',
      controller: 'pagamentosCtrl'
    })
    .state('configuracao', {
      url: '/configuracao',
      templateUrl: 'templates/configuracao.html',
      controller: 'configuracaoCtrl'
    })
    .state('estabelecimento', {
      url: '/estabelecimento',
      templateUrl: 'templates/estabelecimento.html',
      controller: 'estabelecimentoCtrl'
    });
});