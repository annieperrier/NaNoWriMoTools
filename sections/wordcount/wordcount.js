var wordcount = angular.module('wordcount', []);

wordcount.controller('WordCountCtrl', ['$scope', '$stateParams', 'CONFIG', 
	function ($scope, $stateParams, CONFIG) {

		$scope.textcontent = '';

		$scope.countresult = {
			words: 0,
			characters: 0,
			sentences: 0,
			paragraphs: 0
		};
}]);
wordcount.directive('wordCounter', ['$timeout',
	function ($timeout) {

	var directiveDefinitionObject = {
		restrict: 'A',
		scope: {
			data: '=',
			results: '=wordResults'
		},
		link: function (scope, element, attrs) {

			function callback (counter)
			{
				$timeout(function() {
					scope.results = counter;
				}, 0);
			}
			Countable.live(element[0], callback);
		}
	};

	return directiveDefinitionObject;
}]);