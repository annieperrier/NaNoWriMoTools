var characters = angular.module('characters', []);

characters.controller('CharactersCtrl', ['$scope', '$stateParams', 'CONFIG', 'Characters', 
	function ($scope, $stateParams, CONFIG, Characters) {

		$scope.characterList = [];

		$scope.loaded = false;

		$scope.addmode = false;

		$scope.$watch('curyear', function() {
			loadCharacters();
		});

		// Hash of field keys with display name
		// Use this to map your keynames below to a human-readable name to appear
		// in the display.
		// If a map does not exist, the keyname will be used.
		$scope.fieldList =
		[
			{name: "Age",						displayname: "Age"},
			{name: "Profession",				displayname: "Profession"},
			{name: "ShortSummary",				displayname: "One Sentence Summary"},
			{name: "LongSummary",				displayname: "One Paragraph Summary"},
			{name: "Company",					displayname: "Company"},
			{name: "Region",					displayname: "Region"},
			{name: "Address",					displayname: "Address"},
			{name: "AbstractMotivation",		displayname: "Abstract Motivation"},
			{name: "ConcreteGoal",				displayname: "Concrete Goal"},
			{name: "GoalPreventingConflict",	displayname: "Goal-Preventing Conflict"},
			{name: "Epiphany",					displayname: "Epiphany"}
		];

		$scope.sliderSettingsCharacters = {
			pagerCustom: '#sliderPager',
			adaptiveHeight: true,
		};

		$scope.sliderSettingsPager = {
			pager: true,
			nextSelector: '#doesnotexist',
			prevSelector: '#doesnotexist',
			minSlides: 5,
			maxSlides: 5,
			moveSlides: 4,
			slideWidth: 80,
			slideMargin: 5,
			infiniteLoop: false
		};

		$scope.showAddCharacter = function()
		{
			$scope.addmode = true;
		};

		var loadCharacters = function()
		{
			if (!$scope.curyear)
			{
				$scope.characterList = [];
				$scope.loaded = true;
				return;
			}
			$scope.loaded = false;
			Characters.getCharacters($scope.curyear.year).then(function(data) {
				//console.log(data);
				$scope.characterList = data;
				$scope.loaded = true;
			}, function(data) {
				//console.log(data);
				$scope.characterList = [];
				$scope.loaded = true;
			});
		}

		var init = function()
		{
			loadCharacters();
		}

		init();
}]);

characters.factory('Characters', ['CONFIG', '$q', '$http', 
	function(CONFIG, $q, $http){
		var dataFactory = {};

		dataFactory.getCharacters = function(year)
		{
			//console.log('getCharacters');
			var deferred = $q.defer();

			$http.get('data/characters/characters-'+year+'.json').success(function(response) {
				//console.log(response);
				deferred.resolve(response || []);
			}).error(function(response) {
				//console.log(response);
				deferred.resolve([]);
			});

			return deferred.promise;
		}

		return dataFactory;
}]);

characters.filter("characterId", [
	function() {
		return function(charactername) {
			//console.log(charactername);
			if (!charactername)
				return '';
			return charactername.split(' ').join('');
		}
}]);

characters.directive('startSlider', [
	function() {
	return {
		restrict: 'A',
		replace: false,
		link: function(scope, elm, attrs) {
			var slider = null;
			//console.log('start slider');
			//console.log(scope);
			scope.$on('repeatFinished-'+attrs.sliderType, function () {
				//console.log('Finish received');
				//console.log(attrs.sliderType);
				elm.ready(function() {
					if (slider)
					{
						//console.log('Reloading slider: '+$(elm[0]).attr('id'));
						slider.reloadSlider(scope['sliderSettings'+attrs.sliderType]);
					}
					else
						slider = $("#" + $(elm[0]).attr('id')).bxSlider(scope['sliderSettings'+attrs.sliderType]);
				});
			});
		}
	};
}]);

characters.directive('notifyWhenRepeatFinished', ['$timeout', function ($timeout) {
	return {
		restrict: 'A',
		link: function (scope, elm, attr) {
			if (scope.$last === true) {
				$timeout(function () {
					//console.log('Notifying of: '+attr.notifyWhenRepeatFinished);
					scope.$emit('repeatFinished-'+attr.notifyWhenRepeatFinished);
				});
			}
		}
	}
}]);