var setup = angular.module('setup', []);

setup.controller('SetupCtrl', ['$scope', '$stateParams', '$timeout', 'CONFIG', 'Years', 
	function ($scope, $stateParams, $timeout, CONFIG, Years) {

		$scope.editmode = false;
		$scope.edityear = null;

		$scope.addmode = false;
		$scope.addyear = {};

		$scope.curorder = 'year';
		$scope.curreverse = true;

		$scope.msg = {
			type: null,
			text: null
		};

		$scope.clearMsg = function()
		{
			$scope.msg = {
				type: null,
				text: null
			};
		};

		$scope.showAdd = function()
		{
			//console.log('Show add');
			$scope.addmode = true;
			$timeout(function() {
				angular.element("#addyear").focus();
			}, 0);
		};

		$scope.cancelAdd = function()
		{
			//console.log('Cancel new year.');
			$scope.addmode = false;
			$scope.addyear = {};
		};

		$scope.showEdit = function(year)
		{
			//console.log('Editing: ',year);
			$scope.edityear = year;
			$scope.editmode = true;
			$timeout(function() {
				angular.element(".inputyear").focus();
			}, 0);
		};

		$scope.cancelEdit = function()
		{
			//console.log('Cancel edit year.');
			$scope.edityear = null;
			$scope.editmode = false;
		};

		$scope.delete = function(year)
		{
			//console.log('Deleting: ',year);
			Years.deleteYear(year).then(function() {
				$scope.msg.text = "Year deleted.";
				$scope.msg.type = 'success';
			});
		};

		$scope.save = function(year)
		{
			//console.log('Saving: ',year);
			Years.saveYear(year).then(function() {
				$scope.msg.text = "Changes to year saved.";
				$scope.msg.type = 'success';
				$scope.edityear = false;
				$scope.editmode = false;
			});
		};

		$scope.add = function(year)
		{
			//console.log('Adding: ',year);
			Years.addYear(year).then(function() {
				$scope.msg.text = "New year added.";
				$scope.msg.type = 'success';
				$scope.addmode = false;
				$scope.addyear = {};
			});
		};
}]);
