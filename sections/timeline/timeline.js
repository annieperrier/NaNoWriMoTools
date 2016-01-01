var timeline = angular.module('timeline', []);

timeline.controller('TimelineCtrl', ['$scope', '$stateParams', 'CONFIG', 
	function ($scope, $stateParams, CONFIG) {

		$scope.textcontent = '';

		$scope.countresult = {
			words: 0,
			characters: 0,
			sentences: 0,
			paragraphs: 0
		};

		$scope.getWordCount = function()
		{
			var area = document.getElementById('textcontent');

			Countable.once(area, function (counter) {
				setCountResult(counter);
			});
		};
		var setCountResult = function(counter)
		{
			//console.log('Setting count result:', counter);
			$scope.countresult = counter;
		}

		main();
}]);