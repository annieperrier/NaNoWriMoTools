var app = angular.module('app', [
	'ui.router',
	'firebase',
	'LocalStorageModule',
	'config',
	'setup',
	'progress',
	'characters',
	'wordcount',
	'timeline'
]);

app.config(['$stateProvider', '$urlRouterProvider', 'localStorageServiceProvider', 
	function($stateProvider, $urlRouterProvider, localStorageServiceProvider) {

		localStorageServiceProvider
			.setPrefix('NaNoWriMo')
		;

		// Now set up the states
		$stateProvider

			// MAIN //////////////////////////////////////////////////////

			.state('welcome', {
				url: "/",
				templateUrl: 'sections/welcome/welcome.html'
			})

			.state('setup', {
				url: "/setup",
				templateUrl: 'sections/setup/setup.html',
				controller: 'SetupCtrl'
			})

			.state('characters', {
				url: "/characters",
				templateUrl: 'sections/characters/characters.html',
				controller: 'CharactersCtrl'
			})

			.state('progress', {
				url: "/progress",
				templateUrl: 'sections/progress/progress.html',
				controller: 'ProgressCtrl'
			})

			.state('timeline', {
				url: "/timeline",
				templateUrl: 'sections/timeline/timeline.html',
				controller: 'TimelineCtrl'
			})

			.state('wordcount', {
				url: "/wordcount",
				templateUrl: 'sections/wordcount/wordcount.html',
				controller: 'WordCountCtrl'
			})
			;

		// route to root if no valid route found
		$urlRouterProvider
			.otherwise('/');

}]);

app.run(function($rootScope, $state) {
	// have the ui.router state available for setting active tabs for parents
	// ng-class="{active:$state.includes('path.here')}"
	$rootScope.$state = $state;
});


app.controller('AppCtrl', ['$scope', '$stateParams', 'CONFIG', 'Years', 
	function ($scope, $stateParams, CONFIG, Years) {

		$scope.loaded = {
			years: false
		}

		// the current nano year - rolls over on August
		$scope.curyear = null;
		// list of years tracked
		$scope.years = null;


		$scope.$watch('years', function(newval, oldval) {
			//console.log('Watched years');
			// if we don't have a selected current year, choose a default
			// occurs when a first year is added or current year deleted
			if ($scope.years && $scope.years.length > 0)
			{
				//console.log('Watched years stuff');
				if (!$scope.curyear)
				{
					//console.log('Watched years in cur');
					setCurYear();
					return;
				}
				// check if cur year is no longer in the list
				var found = false;
				angular.forEach($scope.years, function(val, key) {
					if (val.year == $scope.curyear.year)
					{
						found = true;
						return;
					}
				});
				//console.log('Watched years found: ', found);
				if (!found)
					setCurYear();
			}
			else
				$scope.curyear = null;
		}, true);

		$scope.changeYear = function(year)
		{
			console.log('Change year to: '+year.year);
			$scope.curyear = year;
		};

		///////////////////////////////////////////////////////////////////////

		function setTodaysDate() 
		{
			// set today's date in parts
			var d = new Date();
			$scope.today = {};
			$scope.today.year = d.getFullYear();
			$scope.today.month = d.getMonth() + 1;
			if ($scope.today.month.toString().length < 2)
				$scope.today.month = "0"+$scope.today.month;
			$scope.today.day = d.getDate();
			if ($scope.today.day.toString().length < 2)
				$scope.today.day = "0"+$scope.today.day;
		}

		function loadYears()
		{
			Years.loadYears().then(function(data) {
				$scope.years = data;
				//console.log('years: ', $scope.years);

				setCurYear();

				$scope.loaded.years = true;
			});
		}

		// find and set a default current year
		function setCurYear()
		{
			var last = null;
			var foundyear = null;
			for (var i = 0; i < $scope.years.length; i++)
			{
				if ($scope.today.month >= 8 && $scope.years[i].year == $scope.today.year)
				{
					foundyear = $scope.years[i];
				}
				else if ($scope.years[i].year == $scope.today.year - 1 && foundyear)
				{
					foundyear = $scope.years[i];
				}
				last = $scope.years[i];
			}
			if (foundyear)
				$scope.changeYear(foundyear);
			else if (last)
				$scope.changeYear(last);
		}

		function init()
		{
			setTodaysDate();
			loadYears();
		}
		init();
}]);

app.factory('Years', ['CONFIG', '$firebase', '$q',
	function(CONFIG, $firebase, $q){
		var dataFactory = {};

		var years = null;

		dataFactory.loadYears = function()
		{
			//console.log('Loading Years data');
			var dRef = new Firebase(CONFIG.BASE_URL+"/years/");
			var sync = $firebase(dRef);

			years = sync.$asArray();
			return years.$loaded().then(function() {
				return years;
			});
		};

		dataFactory.addYear = function(yeardata)
		{
			return years.$add(yeardata);
		};

		dataFactory.saveYear = function(yeardata)
		{
			return years.$save(yeardata);
		};

		dataFactory.deleteYear = function(yeardata)
		{
			return years.$remove(yeardata);
		};

		return dataFactory;
}]);
